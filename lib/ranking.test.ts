import { levenshteinDistance, pickCorrectedQuery, sortRecipes } from '@/lib/ranking';
import type { Recipe } from '@/types/recipe';

describe('Levenshtein Distance', () => {
  test('exact match', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  test('one character difference', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
  });

  test('insertion', () => {
    expect(levenshteinDistance('cat', 'cart')).toBe(1);
  });

  test('deletion', () => {
    expect(levenshteinDistance('cart', 'cat')).toBe(1);
  });

  test('transposition', () => {
    expect(levenshteinDistance('ab', 'ba')).toBe(2); // swap = delete + insert
  });

  test('completely different', () => {
    expect(levenshteinDistance('abc', 'def')).toBe(3);
  });

  test('empty string', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'hello')).toBe(5);
  });
});

describe('Pick Corrected Query', () => {
  test('exact match in suggestions', () => {
    const result = pickCorrectedQuery('chicken', ['chicken', 'beef', 'fish']);
    expect(result).toBeUndefined(); // No correction needed
  });

  test('close match within threshold', () => {
    const result = pickCorrectedQuery('chiken', ['chicken', 'beef']);
    expect(result).toBe('chicken');
  });

  test('close match but exceeds threshold', () => {
    const result = pickCorrectedQuery('xyz', ['chicken', 'beef']);
    expect(result).toBeUndefined();
  });

  test('empty query', () => {
    const result = pickCorrectedQuery('', ['chicken', 'beef']);
    expect(result).toBeUndefined();
  });

  test('whitespace trimmed', () => {
    const result = pickCorrectedQuery('  chiken  ', ['chicken', 'beef']);
    expect(result).toBe('chicken');
  });

  test('case insensitive', () => {
    const result = pickCorrectedQuery('CHIKEN', ['chicken']);
    expect(result).toBe('chicken');
  });
});

describe('Sort Recipes', () => {
  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Fast Pasta',
      image: '',
      readyInMinutes: 10,
      difficulty: 'Easy',
      ingredients: [],
      steps: [],
      ingredientMatchScore: 0.5,
      usedIngredientCount: 0,
      missedIngredientCount: 0,
    },
    {
      id: 2,
      title: 'Complex Sauce',
      image: '',
      readyInMinutes: 60,
      difficulty: 'Hard',
      ingredients: [],
      steps: [],
      ingredientMatchScore: 0.8,
      usedIngredientCount: 0,
      missedIngredientCount: 0,
    },
    {
      id: 3,
      title: 'Medium Dish',
      image: '',
      readyInMinutes: 30,
      difficulty: 'Medium',
      ingredients: [],
      steps: [],
      ingredientMatchScore: 0.7,
      usedIngredientCount: 0,
      missedIngredientCount: 0,
    },
  ];

  test('sort by ingredient match score', () => {
    const result = sortRecipes(mockRecipes, 'ingredient');
    expect(result[0].ingredientMatchScore).toBe(0.8); // Highest score first
    expect(result[1].ingredientMatchScore).toBe(0.7);
    expect(result[2].ingredientMatchScore).toBe(0.5);
  });

  test('sort by time', () => {
    const result = sortRecipes(mockRecipes, 'time');
    expect(result[0].readyInMinutes).toBe(10); // Fastest first
    expect(result[1].readyInMinutes).toBe(30);
    expect(result[2].readyInMinutes).toBe(60);
  });

  test('sort by difficulty', () => {
    const result = sortRecipes(mockRecipes, 'difficulty');
    expect(result[0].difficulty).toBe('Easy');
    expect(result[1].difficulty).toBe('Medium');
    expect(result[2].difficulty).toBe('Hard');
  });

  test('does not mutate original array', () => {
    const original = [...mockRecipes];
    sortRecipes(mockRecipes, 'time');
    expect(mockRecipes).toEqual(original);
  });
});
