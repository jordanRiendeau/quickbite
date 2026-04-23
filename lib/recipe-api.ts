import { errorLogger } from '@/lib/error-logger';
import { computeDifficulty, pickCorrectedQuery } from '@/lib/ranking';
import { retryWithBackoff } from '@/lib/retry';
import {
  validateMealDBResponse,
  validateSpoonacularResponse
} from '@/lib/validation';
import type { NutritionFacts, Recipe, RecipeSearchPage } from '@/types/recipe';

const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes';
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const PAGE_SIZE = 10;

function paginate(recipes: Recipe[], page: number): RecipeSearchPage {
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return {
    recipes: recipes.slice(start, end),
    hasMore: end < recipes.length,
  };
}

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY?.trim();
}

function parseIngredients(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function estimateReadyInMinutes(ingredientCount: number, stepCount: number): number {
  const safeIngredients = Math.max(ingredientCount, 1);
  const safeSteps = Math.max(stepCount, 1);
  const estimate = 8 + safeIngredients * 2 + safeSteps * 6;

  return Math.min(Math.max(estimate, 15), 90);
}

function estimateNutrition(ingredientCount: number, stepCount: number): NutritionFacts {
  const safeIngredients = Math.max(ingredientCount, 1);
  const safeSteps = Math.max(stepCount, 1);

  const calories = Math.round(220 + safeIngredients * 45 + safeSteps * 12);
  const proteinGrams = Math.round(10 + safeIngredients * 1.8);
  const fatGrams = Math.round(8 + safeIngredients * 1.2);
  const carbsGrams = Math.round(18 + safeIngredients * 3.2);

  return {
    calories,
    proteinGrams,
    fatGrams,
    carbsGrams,
    isEstimated: true,
  };
}

function getNutrientValue(nutrients: any[], targetName: string): number | null {
  const nutrient = nutrients.find(
    (item) => typeof item?.name === 'string' && item.name.toLowerCase() === targetName.toLowerCase(),
  );

  if (!nutrient || typeof nutrient.amount !== 'number') {
    return null;
  }

  return Math.round(nutrient.amount);
}

function mapSpoonacularNutrition(payload: any): NutritionFacts | undefined {
  const nutrients = Array.isArray(payload?.nutrition?.nutrients) ? payload.nutrition.nutrients : [];

  if (nutrients.length === 0) {
    return undefined;
  }

  const calories = getNutrientValue(nutrients, 'Calories');
  const proteinGrams = getNutrientValue(nutrients, 'Protein');
  const fatGrams = getNutrientValue(nutrients, 'Fat');
  const carbsGrams = getNutrientValue(nutrients, 'Carbohydrates');

  if (calories === null || proteinGrams === null || fatGrams === null || carbsGrams === null) {
    return undefined;
  }

  return {
    calories,
    proteinGrams,
    fatGrams,
    carbsGrams,
  };
}

/**
 * Map Spoonacular API response to Recipe format
 */
function mapSpoonacularRecipe(payload: any): Recipe {
  const ingredients = Array.isArray(payload.extendedIngredients)
    ? payload.extendedIngredients.map((item: any) => item.original || item.name).filter(Boolean)
    : [];

  const steps =
    payload.analyzedInstructions?.[0]?.steps?.map((item: any) => item.step).filter(Boolean) ?? [];

  const usedCount = payload.usedIngredientCount ?? ingredients.length;
  const missedCount = payload.missedIngredientCount ?? 0;
  const denominator = Math.max(usedCount + missedCount, 1);

  return {
    id: payload.id,
    title: payload.title,
    image: payload.image,
    readyInMinutes: payload.readyInMinutes ?? 0,
    difficulty: computeDifficulty(payload.readyInMinutes ?? 0),
    cuisine: Array.isArray(payload.cuisines) && payload.cuisines.length > 0 ? payload.cuisines[0] : undefined,
    nutrition: mapSpoonacularNutrition(payload),
    ingredients,
    steps,
    sourceUrl: payload.sourceUrl,
    ingredientMatchScore: usedCount / denominator,
    usedIngredientCount: usedCount,
    missedIngredientCount: missedCount,
  };
}

/**
 * Map TheMealDB meal to Recipe format
 * TheMealDB uses idMeal as ID, strMeal as title, strMealThumb as image
 */
function mapMealToRecipe(meal: any): Recipe {
  // Extract ingredients and measurements from meal object
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
    }
  }

  // Extract steps from instructions (split by periods)
  const steps = meal.strInstructions
    ? meal.strInstructions
        .split('.')
        .map((step: string) => step.trim())
        .filter(Boolean)
    : [];

  const readyInMinutes = estimateReadyInMinutes(ingredients.length, steps.length);

  return {
    id: parseInt(meal.idMeal, 10),
    title: meal.strMeal,
    image: meal.strMealThumb,
    readyInMinutes,
    difficulty: computeDifficulty(readyInMinutes),
    cuisine: typeof meal.strArea === 'string' && meal.strArea.trim() ? meal.strArea.trim() : undefined,
    nutrition: estimateNutrition(ingredients.length, steps.length),
    ingredients,
    steps,
    sourceUrl: meal.strSource || undefined,
    ingredientMatchScore: 1,
    usedIngredientCount: ingredients.length,
    missedIngredientCount: 0,
  };
}

async function fetchSpoonacularJson(
  path: string,
  searchParams: Record<string, string | number | boolean>,
) {
  const key = getApiKey();

  if (!key) {
    throw new Error('MISSING_API_KEY');
  }

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    params.set(k, String(v));
  });
  params.set('apiKey', key);

  const response = await fetch(`${SPOONACULAR_BASE}${path}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`SPOONACULAR_${response.status}`);
  }

  const data = await response.json();

  // Validate response structure before returning
  try {
    return validateSpoonacularResponse(data);
  } catch (validationError) {
    errorLogger.captureValidationError('spoonacular', validationError as Error, data);
    // Return data anyway; mappers will handle invalid fields gracefully
    return data;
  }
}

async function fetchWithRetry(path: string, searchParams: Record<string, string | number | boolean>) {
  return retryWithBackoff(() => fetchSpoonacularJson(path, searchParams), {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    onRetry: (attempt: number, error: Error) => {
      console.warn(`[Spoonacular Retry] Attempt ${attempt} failed:`, error.message);
    },
  });
}

/**
 * Search TheMealDB by ingredient (free fallback)
 */
async function searchMealDBByIngredient(ingredient: string, page: number): Promise<RecipeSearchPage> {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    if (!response.ok) throw new Error(`MEALDB_${response.status}`);

    const data = await response.json();

    // Validate response structure
    try {
      validateMealDBResponse(data);
    } catch (validationError) {
      errorLogger.captureValidationError('mealdb', validationError as Error, data);
      // Continue anyway
    }

    const meals = Array.isArray(data.meals) ? data.meals : [];

    const recipes = await Promise.all(
      meals.map(async (meal: any) => {
        const details = await fetchMealDBById(parseInt(meal.idMeal, 10));

        if (details) {
          return {
            ...details,
            ingredientMatchScore: 1,
            usedIngredientCount: details.ingredients.length,
            missedIngredientCount: 0,
          };
        }

        return {
          id: parseInt(meal.idMeal, 10),
          title: meal.strMeal,
          image: meal.strMealThumb,
          readyInMinutes: 30,
          difficulty: 'Medium',
          cuisine: undefined,
          nutrition: estimateNutrition(1, 1),
          ingredients: [ingredient],
          steps: [],
          ingredientMatchScore: 1,
          usedIngredientCount: 1,
          missedIngredientCount: 0,
        };
      }),
    );

    return paginate(recipes, page);
  } catch (error) {
    errorLogger.captureAPIError('mealdb', error as Error, 1);
    return { recipes: [], hasMore: false };
  }
}

/**
 * Search TheMealDB by recipe name (free fallback)
 */
async function searchMealDBByName(query: string, page: number): Promise<RecipeSearchPage> {
  try {
    const response = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`MEALDB_${response.status}`);

    const data = await response.json();

    // Validate response structure
    try {
      validateMealDBResponse(data);
    } catch (validationError) {
      errorLogger.captureValidationError('mealdb', validationError as Error, data);
      // Continue anyway
    }

    const meals = Array.isArray(data.meals) ? data.meals : [];

    const recipes = meals.map(mapMealToRecipe);
    return paginate(recipes, page);
  } catch (error) {
    errorLogger.captureAPIError('mealdb', error as Error, 1);
    return { recipes: [], hasMore: false };
  }
}

/**
 * Fetch full meal details from TheMealDB
 */
async function fetchMealDBById(id: number): Promise<Recipe | null> {
  try {
    const response = await fetch(`${MEALDB_BASE}/lookup.php?i=${id}`);
    if (!response.ok) throw new Error(`MEALDB_${response.status}`);

    const data = await response.json();

    // Validate response structure
    try {
      validateMealDBResponse(data);
    } catch (validationError) {
      errorLogger.captureValidationError('mealdb', validationError as Error, data);
      // Continue anyway
    }

    const meals = Array.isArray(data.meals) ? data.meals : [];

    if (meals.length === 0) return null;
    return mapMealToRecipe(meals[0]);
  } catch (error) {
    errorLogger.captureAPIError('mealdb', error as Error, 1);
    return null;
  }
}

export async function searchByIngredients(
  rawIngredients: string,
  page: number,
): Promise<RecipeSearchPage> {
  const key = getApiKey();

  // No API key: use TheMealDB (100% free, no rate limits)
  if (!key) {
    const ingredients = parseIngredients(rawIngredients);
    if (ingredients.length === 0) {
      return { recipes: [], hasMore: false };
    }

    // Search by first ingredient for best results
    return searchMealDBByIngredient(ingredients[0], page);
  }

  const ingredients = parseIngredients(rawIngredients);

  if (ingredients.length === 0) {
    return { recipes: [], hasMore: false };
  }

  try {
    const searchResponse = await fetchWithRetry('/complexSearch', {
      includeIngredients: ingredients.join(','),
      number: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ignorePantry: true,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
      sort: 'max-used-ingredients',
      sortDirection: 'desc',
    });

    const rows = Array.isArray(searchResponse.results) ? searchResponse.results : [];
    const totalResults =
      typeof searchResponse.totalResults === 'number' ? searchResponse.totalResults : undefined;

    if (rows.length === 0) {
      return { recipes: [], hasMore: false };
    }

    const recipes = rows
      .map((item: any) => {
        if (!item) {
          return null;
        }

        return mapSpoonacularRecipe({
          ...item,
          usedIngredientCount: item.usedIngredientCount,
          missedIngredientCount: item.missedIngredientCount,
        });
      })
      .filter(Boolean) as Recipe[];

    // complexSearch already applies offset/number, so do not paginate again.
    return {
      recipes,
      hasMore:
        typeof totalResults === 'number'
          ? page * PAGE_SIZE + recipes.length < totalResults
          : rows.length === PAGE_SIZE,
    };
  } catch (error) {
    errorLogger.captureAPIError('spoonacular', error as Error, 3);
    console.warn('[Spoonacular] Ingredient search failed, falling back to TheMealDB:', error);
    // Fallback to TheMealDB
    const firstIngredient = ingredients[0];
    return searchMealDBByIngredient(firstIngredient, page);
  }
}

export async function searchByRecipeQuery(rawQuery: string, page: number): Promise<RecipeSearchPage> {
  const key = getApiKey();

  // No API key: use TheMealDB (100% free, no rate limits)
  if (!key) {
    const query = rawQuery.trim();
    if (!query) {
      return { recipes: [], hasMore: false };
    }

    return searchMealDBByName(query, page);
  }

  const query = rawQuery.trim();
  if (!query) {
    return { recipes: [], hasMore: false };
  }

  try {
    const suggestionsResponse = await fetchWithRetry('/autocomplete', {
      query,
      number: 5,
    });

    const suggestions = (Array.isArray(suggestionsResponse) ? suggestionsResponse : [])
      .map((row: any) => row.title)
      .filter(Boolean);

    const correctedQuery = pickCorrectedQuery(query, suggestions);
    const finalQuery = correctedQuery ?? query;

    const searchResponse = await fetchWithRetry('/complexSearch', {
      query: finalQuery,
      number: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
      sortDirection: 'desc',
    });

    const rows = Array.isArray(searchResponse.results) ? searchResponse.results : [];
    const totalResults =
      typeof searchResponse.totalResults === 'number' ? searchResponse.totalResults : undefined;
    const recipes = rows.map(mapSpoonacularRecipe);

    // complexSearch already applies offset/number, so do not paginate again.
    return {
      recipes,
      hasMore:
        typeof totalResults === 'number'
          ? page * PAGE_SIZE + recipes.length < totalResults
          : rows.length === PAGE_SIZE,
      correctedQuery,
    };
  } catch (error) {
    errorLogger.captureAPIError('spoonacular', error as Error, 3);
    console.warn('[Spoonacular] Recipe search failed, falling back to TheMealDB:', error);
    // Fallback to TheMealDB
    return searchMealDBByName(query, page);
  }
}

export async function fetchRecipeById(id: number): Promise<Recipe | null> {
  const key = getApiKey();

  // No API key: use TheMealDB
  if (!key) {
    return fetchMealDBById(id);
  }

  try {
    const payload = await fetchWithRetry(`/${id}/information`, {
      includeNutrition: true,
    });
    return mapSpoonacularRecipe(payload);
  } catch (error) {
    errorLogger.captureAPIError('spoonacular', error as Error, 3);
    console.warn('[Spoonacular] Recipe fetch failed, falling back to TheMealDB:', error);
    // Fallback to TheMealDB
    return fetchMealDBById(id);
  }
}

export const __testables = {
  mapSpoonacularRecipe,
  mapMealToRecipe,
};
