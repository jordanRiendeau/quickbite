import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { palette, spacing } from '@/constants/theme';
import { useQuickBite } from '@/context/quickbite-context';
import { fetchRecipeById } from '@/lib/recipe-api';
import type { Recipe } from '@/types/recipe';

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    addItemsToShoppingList,
    isRecipeSaved,
    removeShoppingItem,
    shoppingItems,
    toggleSavedRecipe,
  } = useQuickBite();
  const id = Number(params.id);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRecipe() {
      const response = await fetchRecipeById(id);
      if (mounted) {
        setRecipe(response);
        setLoading(false);
      }
    }

    loadRecipe();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.tomato} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Recipe not found.</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const saved = isRecipeSaved(recipe.id);

  const getIngredientShoppingItem = (ingredient: string) => {
    const normalizedIngredient = ingredient.trim().toLowerCase();

    return shoppingItems.find(
      (item) =>
        item.recipeId === recipe.id && item.name.trim().toLowerCase() === normalizedIngredient,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.inlineBackButton} onPress={() => router.back()}>
          <Text style={styles.inlineBackText}>Back to results</Text>
        </Pressable>

        <Image source={{ uri: recipe.image }} style={styles.image} />

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          {recipe.readyInMinutes} min | {recipe.difficulty}
        </Text>

        <Pressable
          style={styles.addButton}
          onPress={() => addItemsToShoppingList(recipe.ingredients, recipe.id, recipe.title, recipe.image)}>
          <Text style={styles.addButtonText}>Add Ingredients To Shopping List</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={() => toggleSavedRecipe(recipe)}>
          <Text style={styles.saveButtonText}>{saved ? 'Unsave Recipe' : 'Save Recipe'}</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient) => (
            <View style={styles.ingredientRow} key={ingredient}>
              <Text style={styles.sectionText}>- {ingredient}</Text>
              {(() => {
                const shoppingItem = getIngredientShoppingItem(ingredient);
                const isAdded = Boolean(shoppingItem);

                return (
                  <Pressable
                    style={[
                      styles.ingredientButton,
                      isAdded ? styles.ingredientRemoveButton : styles.ingredientAddButton,
                    ]}
                    onPress={() => {
                      if (shoppingItem) {
                        removeShoppingItem(shoppingItem.id);
                        return;
                      }

                      addItemsToShoppingList([ingredient], recipe.id, recipe.title, recipe.image);
                    }}>
                    <Text
                      style={[
                        styles.ingredientButtonText,
                        isAdded ? styles.ingredientRemoveText : styles.ingredientAddText,
                      ]}>
                      {isAdded ? 'Remove Ingredient' : 'Add Ingredient'}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step-by-step</Text>
          {recipe.steps.length === 0 ? (
            <Text style={styles.sectionText}>No steps available for this recipe.</Text>
          ) : (
            recipe.steps.map((step, index) => (
              <Text style={styles.sectionText} key={`${index + 1}-${step.slice(0, 20)}`}>
                {index + 1}. {step}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF6EC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  inlineBackButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8DC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inlineBackText: {
    color: palette.cocoa,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 18,
    backgroundColor: '#F6E5D9',
  },
  title: {
    color: palette.cocoa,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  meta: {
    color: palette.cocoaFaded,
    fontSize: 14,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: palette.tomato,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: '#FFEADF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3BDA3',
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: palette.cocoa,
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2D5C7',
    padding: spacing.md,
    gap: 8,
  },
  sectionTitle: {
    color: palette.cocoa,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionText: {
    color: palette.cocoa,
    fontSize: 14,
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ingredientButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ingredientAddButton: {
    backgroundColor: '#DDF3E2',
    borderColor: '#67A86A',
  },
  ingredientRemoveButton: {
    backgroundColor: '#FFE0E0',
    borderColor: '#D96B6B',
  },
  ingredientButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ingredientAddText: {
    color: '#2E7D32',
  },
  ingredientRemoveText: {
    color: '#B03A3A',
  },
  backButton: {
    backgroundColor: '#FFE8DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: palette.cocoa,
    fontWeight: '700',
  },
});