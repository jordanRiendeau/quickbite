import AsyncStorage from '@react-native-async-storage/async-storage';

import { RECIPES, Recipe } from '@/data/recipes';

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';
const SPOONACULAR_RECIPE_ID_PREFIX = 'spoon-';
const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY?.trim() ?? '';

const SEARCH_CACHE_PREFIX = 'quickbite.recipe-search.';
const NAME_SEARCH_CACHE_PREFIX = 'quickbite.recipe-name-search.';
const RECIPE_CACHE_PREFIX = 'quickbite.recipe.';

const searchCache = new Map<string, Recipe[]>();
const nameSearchCache = new Map<string, Recipe[]>();
const recipeCache = new Map<string, Recipe>();

let hasWarnedMissingKey = false;

type SpoonacularComplexSearchResponse = {
  results?: SpoonacularRecipeSummary[];
};

type SpoonacularRandomResponse = {
  recipes?: SpoonacularRecipeSummary[];
};

type SpoonacularRecipeSummary = {
  id: number;
  title: string;
  image?: string;
  sourceUrl?: string;
  summary?: string;
  cuisines?: string[];
  dishTypes?: string[];
  extendedIngredients?: Array<{ original?: string; name?: string }>;
  analyzedInstructions?: Array<{
    steps?: Array<{
      step?: string;
    }>;
  }>;
  instructions?: string;
};

const hasSpoonacularKey = () => Boolean(SPOONACULAR_API_KEY);

const normalize = (value: string) => value.trim().toLowerCase();

const unique = (values: string[]) => Array.from(new Set(values));

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const createSearchCacheKey = (ingredients: string[]) =>
  ingredients.map(normalize).filter(Boolean).sort().join('|');

const createRecipeCacheKey = (id: string) => `${RECIPE_CACHE_PREFIX}${id}`;

const createSpoonacularRecipeId = (id: number) => `${SPOONACULAR_RECIPE_ID_PREFIX}${id}`;

const getRawSpoonacularRecipeId = (id: string) => {
  if (id.startsWith(SPOONACULAR_RECIPE_ID_PREFIX)) {
    const prefixedNumeric = Number(id.replace(SPOONACULAR_RECIPE_ID_PREFIX, ''));
    return Number.isFinite(prefixedNumeric) && prefixedNumeric > 0 ? prefixedNumeric : null;
  }

  const numeric = Number(id);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

function warnMissingKey() {
  if (hasSpoonacularKey() || hasWarnedMissingKey) {
    return;
  }

  hasWarnedMissingKey = true;
  console.warn(
    'Missing EXPO_PUBLIC_SPOONACULAR_API_KEY. Configure it to use Spoonacular recipe data.'
  );
}

async function readCachedRecipe(id: string) {
  const cachedRecipe = recipeCache.get(id);

  if (cachedRecipe) {
    return cachedRecipe;
  }

  try {
    const storedValue = await AsyncStorage.getItem(createRecipeCacheKey(id));

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as Recipe;

    if (!parsed?.id || !parsed?.name) {
      return null;
    }

    recipeCache.set(id, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function storeCachedRecipe(recipe: Recipe) {
  recipeCache.set(recipe.id, recipe);

  try {
    await AsyncStorage.setItem(createRecipeCacheKey(recipe.id), JSON.stringify(recipe));
  } catch {
    // Ignore cache write failures.
  }
}

async function readCachedSearch(ingredients: string[]) {
  const cacheKey = createSearchCacheKey(ingredients);
  const cachedResults = searchCache.get(cacheKey);

  if (cachedResults) {
    return cachedResults;
  }

  try {
    const storedValue = await AsyncStorage.getItem(`${SEARCH_CACHE_PREFIX}${cacheKey}`);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as Recipe[];

    if (!Array.isArray(parsed)) {
      return null;
    }

    const sanitized = parsed.filter(
      (recipe): recipe is Recipe => Boolean(recipe?.id && recipe?.name && recipe?.ingredients && recipe?.steps)
    );

    searchCache.set(cacheKey, sanitized);
    return sanitized;
  } catch {
    return null;
  }
}

async function storeCachedSearch(ingredients: string[], recipes: Recipe[]) {
  const cacheKey = createSearchCacheKey(ingredients);
  searchCache.set(cacheKey, recipes);

  try {
    await AsyncStorage.setItem(`${SEARCH_CACHE_PREFIX}${cacheKey}`, JSON.stringify(recipes));
  } catch {
    // Ignore cache write failures.
  }
}

async function readCachedNameSearch(query: string) {
  const normalized = normalize(query);

  if (!normalized) {
    return null;
  }

  const cachedResults = nameSearchCache.get(normalized);

  if (cachedResults) {
    return cachedResults;
  }

  try {
    const storedValue = await AsyncStorage.getItem(`${NAME_SEARCH_CACHE_PREFIX}${normalized}`);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as Recipe[];

    if (!Array.isArray(parsed)) {
      return null;
    }

    const sanitized = parsed.filter(
      (recipe): recipe is Recipe => Boolean(recipe?.id && recipe?.name && recipe?.ingredients && recipe?.steps)
    );

    nameSearchCache.set(normalized, sanitized);
    return sanitized;
  } catch {
    return null;
  }
}

async function storeCachedNameSearch(query: string, recipes: Recipe[]) {
  const normalized = normalize(query);

  if (!normalized) {
    return;
  }

  nameSearchCache.set(normalized, recipes);

  try {
    await AsyncStorage.setItem(`${NAME_SEARCH_CACHE_PREFIX}${normalized}`, JSON.stringify(recipes));
  } catch {
    // Ignore cache write failures.
  }
}

function splitInstructions(instructions: string | null | undefined) {
  if (!instructions) {
    return [];
  }

  return instructions
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((step) => step.trim())
    .filter(Boolean);
}

function spoonacularRecipeToRecipe(recipe: SpoonacularRecipeSummary): Recipe {
  const analyzedSteps =
    recipe.analyzedInstructions
      ?.flatMap((instructionBlock) => instructionBlock.steps ?? [])
      .map((step) => step.step?.trim() ?? '')
      .filter(Boolean) ?? [];

  const fallbackSteps = splitInstructions(recipe.instructions ?? recipe.summary);
  const steps = analyzedSteps.length > 0 ? analyzedSteps : fallbackSteps;

  const ingredients =
    recipe.extendedIngredients
      ?.map((ingredient) => ingredient.original?.trim() || ingredient.name?.trim() || '')
      .filter(Boolean) ?? [];

  const descriptionParts: string[] = [];

  if (Array.isArray(recipe.cuisines) && recipe.cuisines.length > 0) {
    descriptionParts.push(recipe.cuisines.join(', '));
  }

  if (Array.isArray(recipe.dishTypes) && recipe.dishTypes.length > 0) {
    descriptionParts.push(recipe.dishTypes.join(', '));
  }

  if (typeof recipe.summary === 'string' && recipe.summary.trim()) {
    descriptionParts.push(stripHtml(recipe.summary).slice(0, 220));
  }

  return {
    id: createSpoonacularRecipeId(recipe.id),
    name: recipe.title,
    image: recipe.image,
    description: descriptionParts.length > 0 ? descriptionParts.join(' • ') : undefined,
    sourceUrl: recipe.sourceUrl,
    ingredients,
    steps,
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function createSpoonacularUrl(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  searchParams.set('apiKey', SPOONACULAR_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  return `${SPOONACULAR_BASE_URL}${path}?${searchParams.toString()}`;
}

async function fetchSpoonacularComplexSearch(params: Record<string, string | number | undefined>) {
  if (!hasSpoonacularKey()) {
    warnMissingKey();
    return [];
  }

  const response = await fetchJson<SpoonacularComplexSearchResponse>(
    createSpoonacularUrl('/recipes/complexSearch', {
      addRecipeInformation: 'true',
      fillIngredients: 'true',
      instructionsRequired: 'true',
      number: 30,
      ...params,
    })
  );

  return response?.results ?? [];
}

async function fetchSpoonacularRecipeById(id: number) {
  if (!hasSpoonacularKey()) {
    warnMissingKey();
    return null;
  }

  return fetchJson<SpoonacularRecipeSummary>(
    createSpoonacularUrl(`/recipes/${id}/information`, {
      includeNutrition: 'false',
    })
  );
}

async function fetchSpoonacularRandomRecipes(limit: number) {
  if (!hasSpoonacularKey()) {
    warnMissingKey();
    return [];
  }

  const response = await fetchJson<SpoonacularRandomResponse>(
    createSpoonacularUrl('/recipes/random', {
      number: limit,
    })
  );

  return response?.recipes ?? [];
}

function mapValidRecipes(items: SpoonacularRecipeSummary[]) {
  return items
    .map(spoonacularRecipeToRecipe)
    .filter((recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0);
}

export async function searchRecipesByIngredients(ingredients: string[]) {
  const normalizedIngredients = unique(ingredients.map(normalize).filter(Boolean));

  if (normalizedIngredients.length === 0) {
    return RECIPES;
  }

  const cachedSearch = await readCachedSearch(normalizedIngredients);

  if (cachedSearch) {
    return cachedSearch;
  }

  const spoonacularResults = await fetchSpoonacularComplexSearch({
    includeIngredients: normalizedIngredients.join(','),
    sort: 'max-used-ingredients',
  });

  const recipes = mapValidRecipes(spoonacularResults);

  if (recipes.length === 0) {
    const localFallback = RECIPES;
    await storeCachedSearch(normalizedIngredients, localFallback);
    return localFallback;
  }

  await Promise.all(recipes.map((recipe) => storeCachedRecipe(recipe)));
  await storeCachedSearch(normalizedIngredients, recipes);

  return recipes;
}

export async function searchRecipesByName(query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const cached = await readCachedNameSearch(normalizedQuery);

  if (cached) {
    return cached;
  }

  const spoonacularResults = await fetchSpoonacularComplexSearch({
    query: normalizedQuery,
    sort: 'relevance',
  });

  const recipes = mapValidRecipes(spoonacularResults);

  if (recipes.length === 0) {
    const localFallback = RECIPES.filter((recipe) => {
      const name = recipe.name.toLowerCase();
      const description = (recipe.description ?? '').toLowerCase();
      return name.includes(normalizedQuery) || description.includes(normalizedQuery);
    });

    await storeCachedNameSearch(normalizedQuery, localFallback);
    return localFallback;
  }

  await Promise.all(recipes.map((recipe) => storeCachedRecipe(recipe)));
  await storeCachedNameSearch(normalizedQuery, recipes);

  return recipes;
}

export async function getFeaturedRecipes() {
  const featuredQueries = [['chicken'], ['pasta'], ['egg']];
  const featuredRecipes: Recipe[] = [];

  for (const query of featuredQueries) {
    const recipes = await searchRecipesByIngredients(query);
    const firstRecipe = recipes.find((recipe) => Boolean(recipe.image)) ?? recipes[0];

    if (!firstRecipe) {
      continue;
    }

    if (featuredRecipes.some((recipe) => recipe.id === firstRecipe.id)) {
      continue;
    }

    featuredRecipes.push(firstRecipe);
  }

  return featuredRecipes.length > 0 ? featuredRecipes : RECIPES.slice(0, 3);
}

export async function getRandomRecipeSuggestions(limit = 3) {
  const targetCount = Math.max(1, Math.min(limit, 8));
  const spoonacularRecipes = mapValidRecipes(await fetchSpoonacularRandomRecipes(targetCount + 2)).slice(
    0,
    targetCount
  );

  if (spoonacularRecipes.length > 0) {
    await Promise.all(spoonacularRecipes.map((recipe) => storeCachedRecipe(recipe)));
    return spoonacularRecipes;
  }

  return [...RECIPES].sort(() => Math.random() - 0.5).slice(0, targetCount);
}

export async function getRecipeById(id: string) {
  const cachedRecipe = await readCachedRecipe(id);

  if (cachedRecipe) {
    return cachedRecipe;
  }

  const localRecipe = RECIPES.find((recipe) => recipe.id === id);

  if (localRecipe) {
    await storeCachedRecipe(localRecipe);
    return localRecipe;
  }

  const spoonacularRecipeId = getRawSpoonacularRecipeId(id);

  if (!spoonacularRecipeId) {
    return null;
  }

  const spoonacularRecipe = await fetchSpoonacularRecipeById(spoonacularRecipeId);

  if (!spoonacularRecipe) {
    return null;
  }

  const mapped = spoonacularRecipeToRecipe(spoonacularRecipe);

  if (!mapped.ingredients.length || !mapped.steps.length) {
    return null;
  }

  await storeCachedRecipe(mapped);
  return mapped;
}
