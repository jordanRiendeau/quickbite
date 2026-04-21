export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  description?: string;
  image?: string;
  sourceUrl?: string;
};

export const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Garlic Tomato Pasta',
    ingredients: ['pasta', 'tomato', 'garlic', 'olive oil', 'salt'],
    description: 'A simple pasta dinner built from pantry staples.',
    steps: [
      'Boil pasta according to package directions.',
      'Saute garlic in olive oil until fragrant.',
      'Add chopped tomato and cook until softened.',
      'Toss in cooked pasta and season with salt.',
    ],
  },
  {
    id: '2',
    name: 'Chicken Rice Bowl',
    ingredients: ['chicken', 'rice', 'onion', 'soy sauce', 'oil'],
    description: 'A fast bowl meal that uses a few filling ingredients.',
    steps: [
      'Cook rice and set aside.',
      'Pan-cook diced chicken in oil until done.',
      'Add sliced onion and cook until tender.',
      'Stir in soy sauce and serve over rice.',
    ],
  },
  {
    id: '3',
    name: 'Veggie Omelette',
    ingredients: ['egg', 'spinach', 'onion', 'salt', 'pepper'],
    description: 'A light breakfast or dinner option with greens and eggs.',
    steps: [
      'Whisk eggs with salt and pepper.',
      'Cook onion and spinach in a pan for 2 minutes.',
      'Pour in eggs and cook until set.',
      'Fold and serve warm.',
    ],
  },
  {
    id: '4',
    name: 'Bean Quesadilla',
    ingredients: ['tortilla', 'beans', 'cheese', 'onion'],
    description: 'A crisp, cheesy quick meal that comes together fast.',
    steps: [
      'Spread beans on half of a tortilla.',
      'Top with cheese and chopped onion.',
      'Fold and toast in a pan until golden.',
      'Slice and serve.',
    ],
  },
];
