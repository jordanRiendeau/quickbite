import type { Difficulty, Recipe, SortOption } from '@/types/recipe';

export function computeDifficulty(minutes: number): Difficulty {
  if (minutes <= 20) {
    return 'Easy';
  }

  if (minutes <= 45) {
    return 'Medium';
  }

  return 'Hard';
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let col = 1; col <= a.length; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      const cost = a[col - 1] === b[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

export function pickCorrectedQuery(original: string, suggestions: string[]): string | undefined {
  const cleanOriginal = original.trim().toLowerCase();

  if (!cleanOriginal || suggestions.length === 0) {
    return undefined;
  }

  let bestMatch: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const suggestion of suggestions) {
    const distance = levenshteinDistance(cleanOriginal, suggestion.toLowerCase());

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = suggestion;
    }
  }

  // Moderate correction keeps close intent without over-correcting.
  if (bestDistance > 0 && bestDistance <= 3) {
    return bestMatch;
  }

  return undefined;
}

export function sortRecipes(recipes: Recipe[], sortBy: SortOption): Recipe[] {
  const next = [...recipes];

  if (sortBy === 'ingredient') {
    return next.sort((a, b) => b.ingredientMatchScore - a.ingredientMatchScore);
  }

  if (sortBy === 'time') {
    return next.sort((a, b) => a.readyInMinutes - b.readyInMinutes);
  }

  if (sortBy === 'difficulty') {
    const rank: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };
    return next.sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  }

  return next.sort((a, b) => b.ingredientMatchScore - a.ingredientMatchScore);
}