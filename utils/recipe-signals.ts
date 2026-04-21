import type { Recipe } from '@/data/recipes';

const hasAny = (values: string[], options: string[]) =>
  options.some((option) => values.some((value) => value.includes(option)));

export function getRecipeSignals(recipe: Recipe) {
  const ingredients = recipe.ingredients.map((ingredient) => ingredient.toLowerCase());
  const signals: string[] = [];

  if (recipe.ingredients.length <= 5) {
    signals.push('Simple');
  }

  if (hasAny(ingredients, ['pasta', 'rice', 'tortilla', 'bread'])) {
    signals.push('Quick');
  }

  if (hasAny(ingredients, ['tomato', 'spinach', 'onion', 'garlic'])) {
    signals.push('Fresh');
  }

  if (hasAny(ingredients, ['chicken', 'beans', 'egg', 'cheese'])) {
    signals.push('Comfort');
  }

  return signals.slice(0, 3);
}
