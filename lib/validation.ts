import { z } from 'zod';

/**
 * Zod schemas for API response validation.
 * Catches malformed or unexpected responses before they crash the app.
 */

// Spoonacular recipe payload
export const SpoonacularRecipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  image: z.string().optional(),
  readyInMinutes: z.number().optional(),
  cuisines: z.array(z.string()).optional(),
  extendedIngredients: z.array(z.object({
    original: z.string().optional(),
    name: z.string().optional(),
  })).optional(),
  analyzedInstructions: z.array(z.object({
    steps: z.array(z.object({
      step: z.string(),
    })),
  })).optional(),
  nutrition: z.object({
    nutrients: z.array(z.object({
      name: z.string(),
      amount: z.number(),
    })),
  }).optional(),
  usedIngredientCount: z.number().optional(),
  missedIngredientCount: z.number().optional(),
  sourceUrl: z.string().optional(),
}).passthrough(); // Allow extra fields without error

// Spoonacular search response
export const SpoonacularSearchResponseSchema = z.object({
  results: z.array(SpoonacularRecipeSchema),
  number: z.number().optional(),
  offset: z.number().optional(),
  totalResults: z.number().optional(),
}).passthrough();

// TheMealDB meal payload
export const MealDBMealSchema = z.object({
  idMeal: z.string(),
  strMeal: z.string(),
  strMealThumb: z.string().optional(),
  strArea: z.string().optional(),
  strInstructions: z.string().optional(),
  strSource: z.string().optional(),
}).passthrough(); // Allow strIngredient1, strMeasure1, etc.

// TheMealDB search response
export const MealDBSearchResponseSchema = z.object({
  meals: z.array(MealDBMealSchema).nullable(),
}).passthrough();

// Runtime validation utilities
export function validateSpoonacularResponse(data: unknown) {
  try {
    return SpoonacularSearchResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid Spoonacular response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateMealDBResponse(data: unknown) {
  try {
    return MealDBSearchResponseSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid MealDB response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateSpoonacularRecipe(data: unknown) {
  try {
    return SpoonacularRecipeSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid Spoonacular recipe: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateMealDBMeal(data: unknown) {
  try {
    return MealDBMealSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid MealDB meal: ${error instanceof Error ? error.message : String(error)}`);
  }
}
