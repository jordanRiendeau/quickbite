import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useQuickBite } from '@/context/quickbite-context';
import { Recipe } from '@/data/recipes';
import { getRecipeById } from '@/services/recipe-api';
import { getRecipeMetadata } from '@/utils/recipe-metadata';
import { getRecipeSignals } from '@/utils/recipe-signals';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAllAddedMessage, setShowAllAddedMessage] = useState(false);
  const {
    recipes: fallbackRecipes,
    shoppingList,
    addIngredientToShoppingList,
    addManyIngredientsToShoppingList,
    toggleSavedRecipe,
    isRecipeSaved,
  } = useQuickBite();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const recipeSignals = recipe ? getRecipeSignals(recipe) : [];
  const recipeMetadata = recipe ? getRecipeMetadata(recipe) : null;

  useEffect(() => {
    let isActive = true;

    const loadRecipe = async () => {
      setIsLoading(true);

      const localRecipe = fallbackRecipes.find((item) => item.id === id);

      if (localRecipe) {
        if (isActive) {
          setRecipe(localRecipe);
          setIsLoading(false);
        }

        return;
      }

      const apiRecipe = await getRecipeById(id);

      if (isActive) {
        setRecipe(apiRecipe);
        setIsLoading(false);
      }
    };

    loadRecipe();

    return () => {
      isActive = false;
    };
  }, [fallbackRecipes, id]);

  const normalizedShoppingList = useMemo(
    () => shoppingList.map((item) => item.trim().toLowerCase()),
    [shoppingList]
  );
  const isSaved = recipe ? isRecipeSaved(recipe.id) : false;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.loadingHero}>
          <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingHeroArt} />
          <ThemedView style={styles.signalRow}>
            <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingPill} />
            <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.loadingPill} />
          </ThemedView>
          <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingLineTitle} />
          <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.loadingLineBody} />
        </ThemedView>

        <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.loadingSection}>
          <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingSectionTitle} />
          {Array.from({ length: 5 }).map((_, index) => (
            <ThemedView key={`ingredient-skeleton-${index}`} style={styles.loadingRow}>
              <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.loadingDot} />
              <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingIngredientLine} />
            </ThemedView>
          ))}
        </ThemedView>

        <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.loadingSection}>
          <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingSectionTitle} />
          {Array.from({ length: 4 }).map((_, index) => (
            <ThemedView key={`step-skeleton-${index}`} style={styles.loadingStepRow}>
              <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.loadingStepNumber} />
              <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.loadingStepLine} />
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  }

  if (!recipe) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.loadingCard}>
          <ThemedText type="title" lightColor="#12263A" darkColor="#F7F1E8">
            Recipe not found
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.heroCard}>
        <ThemedView style={styles.heroArt}>
          {recipe.image ? (
            <>
              <Image source={{ uri: recipe.image }} style={styles.heroImage} contentFit="cover" transition={140} />
              <ThemedView lightColor="rgba(43, 36, 29, 0.10)" darkColor="rgba(21, 17, 14, 0.22)" style={styles.heroScrim} />
            </>
          ) : (
            <>
              <ThemedView style={styles.heroOrbLarge} />
              <ThemedView style={styles.heroOrbSmall} />
            </>
          )}
          <ThemedView lightColor="#FFF2E3" darkColor="#2A211B" style={styles.heroBadge}>
            <ThemedText
              type="defaultSemiBold"
              lightColor="#FF3D7F"
              darkColor="#FFA7C8"
              style={styles.heroBadgeText}>
              Recipe story
            </ThemedText>
          </ThemedView>
          <ThemedView lightColor="#F7FDFF" darkColor="#142033" style={styles.heroStatCard}>
            <ThemedText
              type="defaultSemiBold"
              lightColor="#12263A"
              darkColor="#F7F1E8"
              style={styles.heroStatTitle}>
              {recipeMetadata?.estimatedCookMinutes ?? recipe.steps.length * 7} min
            </ThemedText>
            <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.heroStatText}>
              {recipeMetadata?.difficulty ?? 'Easy'} level • {recipe.ingredients.length} ingredients
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedText type="title" lightColor="#12263A" darkColor="#F7F1E8" style={styles.title}>
          {recipe.name}
        </ThemedText>
        <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.heroCopy}>
          A quick, low-friction cook based on what you have.
        </ThemedText>
        {recipe.description ? (
          <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.recipeDescription}>
            {recipe.description}
          </ThemedText>
        ) : null}
        {recipeMetadata ? (
          <ThemedView style={styles.signalRow}>
            <ThemedView style={styles.signalChip}>
              <ThemedText
                type="defaultSemiBold"
                lightColor="#FF3D7F"
                darkColor="#FFA7C8"
                style={styles.signalChipText}>
                {recipeMetadata.difficulty}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.signalChip}>
              <ThemedText
                type="defaultSemiBold"
                lightColor="#FF3D7F"
                darkColor="#FFA7C8"
                style={styles.signalChipText}>
                {recipeMetadata.estimatedCookMinutes} min
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ) : null}
        <ThemedView style={styles.signalRow}>
          {recipeSignals.map((signal) => (
            <ThemedView key={signal} style={styles.signalChip}>
              <ThemedText
                type="defaultSemiBold"
                lightColor="#00B894"
                darkColor="#7BE3CD"
                style={styles.signalChipText}>
                {signal}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
        <Pressable
          onPress={() => recipe && toggleSavedRecipe(recipe)}
          style={[styles.saveButton, isSaved && styles.saveButtonActive]}>
          <ThemedText type="defaultSemiBold" style={[styles.saveButtonText, isSaved && styles.saveButtonTextActive]}>
            {isSaved ? 'Saved' : 'Save for later'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.section}>
        <ThemedText type="subtitle" lightColor="#12263A" darkColor="#F7F1E8">
          Ingredients
        </ThemedText>
        {recipe.ingredients.map((ingredient) => {
          const isAdded = normalizedShoppingList.includes(ingredient.trim().toLowerCase());

          return (
            <ThemedView key={ingredient} style={styles.row}>
              <ThemedText lightColor="#4A6178" darkColor="#6B7F92">{ingredient}</ThemedText>
              <Pressable
                onPress={() => addIngredientToShoppingList(ingredient)}
                style={[styles.smallButton, isAdded && styles.smallButtonAdded]}
                disabled={isAdded}>
                <ThemedText type="defaultSemiBold" style={styles.smallButtonText}>
                  {isAdded ? '✓' : 'Add to shopping list'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })}
        <Pressable
          onPress={() => {
            addManyIngredientsToShoppingList(recipe.ingredients);
            setShowAllAddedMessage(true);
          }}
          style={styles.primaryButton}>
          <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
            Add All to Shopping List
          </ThemedText>
        </Pressable>
        {showAllAddedMessage ? (
          <ThemedText
            type="defaultSemiBold"
            lightColor="#1E8A5A"
            darkColor="#8FE0B7"
            style={styles.allAddedText}>
            All items added
          </ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.section}>
        <ThemedText type="subtitle" lightColor="#12263A" darkColor="#F7F1E8">
          Steps
        </ThemedText>
        {recipe.steps.map((step, index) => (
          <ThemedView key={`${recipe.id}-${index}`} style={styles.stepItem}>
            <ThemedView style={styles.stepNumber}>
              <ThemedText
                type="defaultSemiBold"
                lightColor="#FF3D7F"
                darkColor="#FFA7C8"
                style={styles.stepNumberText}>
                {index + 1}
              </ThemedText>
            </ThemedView>
            <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.stepText}>
              {step}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    gap: 8,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#6A5240',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  heroArt: {
    minHeight: 186,
    aspectRatio: 1.55,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 61, 127, 0.14)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOrbLarge: {
    position: 'absolute',
    top: -28,
    right: -8,
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 61, 127, 0.28)',
  },
  heroOrbSmall: {
    position: 'absolute',
    left: -20,
    bottom: 30,
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 184, 148, 0.20)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 13,
  },
  heroStatCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#4C392D',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  heroStatTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  heroStatText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  heroCopy: {
    lineHeight: 22,
  },
  recipeDescription: {
    lineHeight: 22,
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  signalChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 184, 148, 0.16)',
  },
  signalChipText: {
    fontSize: 13,
  },
  saveButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.28)',
    backgroundColor: 'rgba(255, 61, 127, 0.10)',
  },
  saveButtonActive: {
    borderColor: 'rgba(0, 184, 148, 0.50)',
    backgroundColor: 'rgba(0, 184, 148, 0.16)',
  },
  saveButtonText: {
    color: '#FF3D7F',
    fontSize: 13,
  },
  saveButtonTextActive: {
    color: '#00B894',
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    padding: 14,
    gap: 10,
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  loadingCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  loadingHero: {
    gap: 10,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#6A5240',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  loadingHeroArt: {
    height: 180,
    borderRadius: 20,
  },
  loadingLineTitle: {
    height: 22,
    width: '72%',
    borderRadius: 999,
  },
  loadingLineBody: {
    height: 15,
    width: '88%',
    borderRadius: 999,
  },
  loadingPill: {
    height: 28,
    width: 74,
    borderRadius: 999,
  },
  loadingSection: {
    gap: 10,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  loadingSectionTitle: {
    height: 18,
    width: '40%',
    borderRadius: 999,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  loadingIngredientLine: {
    flex: 1,
    height: 14,
    borderRadius: 999,
  },
  loadingStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  loadingStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
  },
  loadingStepLine: {
    flex: 1,
    height: 14,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  smallButton: {
    backgroundColor: '#FF3D7F',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 132,
    alignItems: 'center',
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  smallButtonAdded: {
    backgroundColor: '#00B894',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#FF3D7F',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 11,
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  allAddedText: {
    marginTop: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 61, 127, 0.14)',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    lineHeight: 22,
  },
});
