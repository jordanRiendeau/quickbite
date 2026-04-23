export type SearchMode = 'ingredients' | 'recipe';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type SortOption = 'ingredient' | 'time' | 'difficulty' | 'relevance';

export type IngredientFilters = {
  maxTime: number | null;
  difficulty: Difficulty | 'Any';
  sortBy: SortOption;
};

export type Recipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  difficulty: Difficulty;
  cuisine?: string;
  nutrition?: NutritionFacts;
  ingredients: string[];
  steps: string[];
  sourceUrl?: string;
  ingredientMatchScore: number;
  usedIngredientCount: number;
  missedIngredientCount: number;
};

export type NutritionFacts = {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
  isEstimated?: boolean;
};

export type SavedRecipe = Pick<
  Recipe,
  'id' | 'title' | 'image' | 'readyInMinutes' | 'difficulty' | 'ingredients'
>;

export type RecipeSearchPage = {
  recipes: Recipe[];
  hasMore: boolean;
  correctedQuery?: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
  recipeId?: number;
  recipeName?: string;
  recipeImage?: string;
};

export type UserAccount = {
  id: string;
  displayName: string;
  createdAt: number;
};