import { __testables } from '@/lib/recipe-api';

describe('Recipe API Mappers', () => {
  test('maps Spoonacular payload with cuisine and nutrition', () => {
    const payload = {
      id: 42,
      title: 'Chicken Stir Fry',
      image: 'https://img.test/chicken.jpg',
      readyInMinutes: 25,
      cuisines: ['Asian'],
      extendedIngredients: [
        { original: '1 cup rice' },
        { name: 'chicken breast' },
      ],
      analyzedInstructions: [
        {
          steps: [{ step: 'Cook rice.' }, { step: 'Stir fry chicken.' }],
        },
      ],
      nutrition: {
        nutrients: [
          { name: 'Calories', amount: 510.2 },
          { name: 'Protein', amount: 32.7 },
          { name: 'Fat', amount: 18.4 },
          { name: 'Carbohydrates', amount: 50.9 },
        ],
      },
      usedIngredientCount: 2,
      missedIngredientCount: 1,
      sourceUrl: 'https://example.com/recipe/42',
    };

    const recipe = __testables.mapSpoonacularRecipe(payload);

    expect(recipe.id).toBe(42);
    expect(recipe.title).toBe('Chicken Stir Fry');
    expect(recipe.cuisine).toBe('Asian');
    expect(recipe.nutrition).toEqual({
      calories: 510,
      proteinGrams: 33,
      fatGrams: 18,
      carbsGrams: 51,
    });
    expect(recipe.ingredients).toEqual(['1 cup rice', 'chicken breast']);
    expect(recipe.steps).toEqual(['Cook rice.', 'Stir fry chicken.']);
    expect(recipe.ingredientMatchScore).toBeCloseTo(2 / 3);
  });

  test('returns undefined nutrition when required nutrients are missing', () => {
    const payload = {
      id: 7,
      title: 'Simple Soup',
      image: 'https://img.test/soup.jpg',
      readyInMinutes: 20,
      extendedIngredients: [{ name: 'water' }],
      nutrition: {
        nutrients: [{ name: 'Calories', amount: 120 }],
      },
    };

    const recipe = __testables.mapSpoonacularRecipe(payload);

    expect(recipe.nutrition).toBeUndefined();
  });

  test('maps TheMealDB payload with estimated nutrition and cuisine', () => {
    const meal = {
      idMeal: '52977',
      strMeal: 'Corba',
      strMealThumb: 'https://img.test/corba.jpg',
      strArea: 'Turkish',
      strInstructions: 'Boil broth. Add lentils. Simmer until tender.',
      strIngredient1: 'Lentils',
      strMeasure1: '1 cup',
      strIngredient2: 'Onion',
      strMeasure2: '1',
      strIngredient3: 'Carrot',
      strMeasure3: '1',
      strIngredient4: '',
      strMeasure4: '',
      strSource: 'https://example.com/corba',
    };

    const recipe = __testables.mapMealToRecipe(meal);

    expect(recipe.id).toBe(52977);
    expect(recipe.title).toBe('Corba');
    expect(recipe.cuisine).toBe('Turkish');
    expect(recipe.nutrition?.isEstimated).toBe(true);
    expect(recipe.ingredients).toEqual(['1 cup Lentils', '1 Onion', '1 Carrot']);
    expect(recipe.steps).toEqual(['Boil broth', 'Add lentils', 'Simmer until tender']);
    expect(recipe.sourceUrl).toBe('https://example.com/corba');
  });
});
