import type { Recipe } from '@/data/recipes';

export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';
export type RecipeSortBy = 'relevance' | 'difficulty' | 'time';

export type RecipeMetadata = {
  difficulty: RecipeDifficulty;
  estimatedCookMinutes: number;
  ingredientCount: number;
  stepCount: number;
};

const difficultyRank: Record<RecipeDifficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

export function getRecipeMetadata(recipe: Recipe): RecipeMetadata {
  const ingredientCount = recipe.ingredients.length;
  const stepCount = recipe.steps.length;

  let difficulty: RecipeDifficulty = 'Easy';

  if (ingredientCount > 8 || stepCount > 6) {
    difficulty = 'Hard';
  } else if (ingredientCount > 5 || stepCount > 4) {
    difficulty = 'Medium';
  }

  const estimatedCookMinutes = Math.max(10, stepCount * 7 + Math.ceil(ingredientCount * 1.5));

  return {
    difficulty,
    estimatedCookMinutes,
    ingredientCount,
    stepCount,
  };
}

export function sortRecipes(recipes: Recipe[], sortBy: RecipeSortBy) {
  if (sortBy === 'relevance') {
    return recipes;
  }

  return [...recipes].sort((left, right) => {
    const leftMetadata = getRecipeMetadata(left);
    const rightMetadata = getRecipeMetadata(right);

    if (sortBy === 'difficulty') {
      const rankDifference = difficultyRank[leftMetadata.difficulty] - difficultyRank[rightMetadata.difficulty];

      if (rankDifference !== 0) {
        return rankDifference;
      }
    } else if (sortBy === 'time') {
      const timeDifference = leftMetadata.estimatedCookMinutes - rightMetadata.estimatedCookMinutes;

      if (timeDifference !== 0) {
        return timeDifference;
      }
    }

    return left.name.localeCompare(right.name);
  });
}
