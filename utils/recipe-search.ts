import type { Recipe } from '@/data/recipes';

type RelevanceOptions = {
  query?: string;
  ingredients?: string[];
};

type RankedRecipe = {
  recipe: Recipe;
  score: number;
};

const TOKEN_ALIASES: Record<string, string[]> = {
  parm: ['parmesan', 'parmigiana'],
  parms: ['parmesan', 'parmigiana'],
  pasta: ['spaghetti', 'penne', 'linguine', 'macaroni'],
  chicken: ['chicken'],
  beef: ['beef', 'steak'],
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) => normalizeText(value).split(' ').filter(Boolean);

const unique = (values: string[]) => Array.from(new Set(values));

const hasTokenMatch = (needle: string, haystackTokens: string[]) =>
  haystackTokens.some(
    (token) =>
      token === needle || token.startsWith(needle) || needle.startsWith(token) || token.includes(needle)
  );

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, (_, row) => [row]);

  for (let column = 1; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
};

const similarity = (left: string, right: string) => {
  const longest = Math.max(left.length, right.length);

  if (!longest) {
    return 1;
  }

  return 1 - levenshteinDistance(left, right) / longest;
};

const expandQueryTokens = (queryTokens: string[]) => {
  const expanded: string[] = [...queryTokens];

  queryTokens.forEach((token) => {
    const aliases = TOKEN_ALIASES[token];

    if (!aliases) {
      return;
    }

    expanded.push(...aliases);
  });

  return unique(expanded);
};

export function getRecipeRelevanceScore(recipe: Recipe, options: RelevanceOptions) {
  const query = normalizeText(options.query ?? '');
  const ingredientTokens = unique((options.ingredients ?? []).flatMap((value) => tokenize(value)));

  const name = normalizeText(recipe.name);
  const description = normalizeText(recipe.description ?? '');
  const recipeIngredientTokens = unique(recipe.ingredients.flatMap((ingredient) => tokenize(ingredient)));
  const nameTokens = unique(tokenize(name));

  let score = 0;

  if (query) {
    const rawQueryTokens = unique(tokenize(query));
    const queryTokens = expandQueryTokens(rawQueryTokens);

    if (name === query) {
      score += 120;
    } else if (name.startsWith(query)) {
      score += 90;
    } else if (name.includes(query)) {
      score += 70;
    }

    if (description.includes(query)) {
      score += 22;
    }

    queryTokens.forEach((token) => {
      if (hasTokenMatch(token, nameTokens)) {
        score += 18;
      }

      if (description.includes(token)) {
        score += 6;
      }

      if (hasTokenMatch(token, recipeIngredientTokens)) {
        score += 9;
      }

      const bestTokenSimilarity = nameTokens.reduce((best, recipeToken) => {
        const value = similarity(token, recipeToken);
        return value > best ? value : best;
      }, 0);

      if (bestTokenSimilarity >= 0.78) {
        score += Math.round(bestTokenSimilarity * 10);
      }
    });

    const nameSimilarity = similarity(query, name);

    if (nameSimilarity >= 0.72) {
      score += Math.round(nameSimilarity * 24);
    }
  }

  if (ingredientTokens.length > 0) {
    ingredientTokens.forEach((token) => {
      if (hasTokenMatch(token, recipeIngredientTokens)) {
        score += 14;
      }
    });
  }

  return Math.max(0, score);
}

export function rankRecipesByRelevance(recipes: Recipe[], options: RelevanceOptions): RankedRecipe[] {
  return recipes
    .map((recipe) => ({
      recipe,
      score: getRecipeRelevanceScore(recipe, options),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.recipe.name.localeCompare(right.recipe.name);
    });
}
