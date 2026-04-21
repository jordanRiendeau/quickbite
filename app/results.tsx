import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useQuickBite } from '@/context/quickbite-context';
import { RECIPES, Recipe } from '@/data/recipes';
import { searchRecipesByIngredients, searchRecipesByName } from '@/services/recipe-api';
import { getRecipeMetadata, sortRecipes, type RecipeSortBy } from '@/utils/recipe-metadata';
import { rankRecipesByRelevance } from '@/utils/recipe-search';
import { getRecipeSignals } from '@/utils/recipe-signals';

const parseIngredients = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeIngredient = (value: string) => value.trim().toLowerCase();

const findLocalRecipes = (ingredients: string[]) => {
  const normalizedIngredients = ingredients.map(normalizeIngredient).filter(Boolean);

  if (normalizedIngredients.length === 0) {
    return RECIPES;
  }

  return RECIPES.filter((recipe) => {
    const recipeIngredients = recipe.ingredients.map(normalizeIngredient);

    return normalizedIngredients.some((ingredient) => recipeIngredients.includes(ingredient));
  });
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ingredients?: string; query?: string }>();
  const ingredientsParam = params.ingredients ?? '';
  const queryParam = params.query?.trim() ?? '';
  const { isRecipeSaved, toggleSavedRecipe } = useQuickBite();
  const inputIngredients = useMemo(() => parseIngredients(ingredientsParam), [ingredientsParam]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<RecipeSortBy>('relevance');

  const openRecipe = (recipeId: string) => {
    router.push({ pathname: '/recipe/[id]', params: { id: recipeId } } as never);
  };

  useEffect(() => {
    let isActive = true;

    const loadRecipes = async () => {
      setIsLoading(true);

      let baseResults: Recipe[];

      if (inputIngredients.length > 0 && queryParam) {
        const [ingredientResults, nameResults] = await Promise.all([
          searchRecipesByIngredients(inputIngredients),
          searchRecipesByName(queryParam),
        ]);

        const merged = new Map<string, Recipe>();
        [...ingredientResults, ...nameResults, ...findLocalRecipes(inputIngredients), ...RECIPES].forEach((recipe) => {
          merged.set(recipe.id, recipe);
        });

        baseResults = Array.from(merged.values());
      } else if (inputIngredients.length > 0) {
        const apiResults = await searchRecipesByIngredients(inputIngredients);
        baseResults = apiResults.length > 0 ? apiResults : findLocalRecipes(inputIngredients);
      } else if (queryParam) {
        const nameResults = await searchRecipesByName(queryParam);

        if (nameResults.length > 0) {
          const merged = new Map<string, Recipe>();
          [...nameResults, ...RECIPES].forEach((recipe) => {
            merged.set(recipe.id, recipe);
          });

          baseResults = Array.from(merged.values());
        } else {
          baseResults = RECIPES;
        }
      } else {
        baseResults = RECIPES;
      }

      if (isActive) {
        setResults(baseResults);
        setIsLoading(false);
      }
    };

    loadRecipes();

    return () => {
      isActive = false;
    };
  }, [inputIngredients, queryParam]);

  const rankedByRelevance = useMemo(
    () =>
      rankRecipesByRelevance(results, {
        query: queryParam,
        ingredients: inputIngredients,
      }),
    [results, queryParam, inputIngredients]
  );

  const sortedResults = useMemo(() => {
    const relevantRanked = queryParam
      ? rankedByRelevance.filter((item) => item.score >= 12)
      : rankedByRelevance;
    const relevanceOrderedRecipes = relevantRanked.map((item) => item.recipe);

    if (sortBy === 'relevance') {
      return relevanceOrderedRecipes;
    }

    return sortRecipes(relevanceOrderedRecipes, sortBy);
  }, [rankedByRelevance, sortBy, queryParam]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.headerCard}>
        <ThemedText type="defaultSemiBold" lightColor="#FF3D7F" darkColor="#FFA7C8" style={styles.headerEyebrow}>
          {queryParam ? 'Recipe search' : 'From your pantry'}
        </ThemedText>
        <ThemedText type="title" lightColor="#12263A" darkColor="#F7F1E8" style={styles.title}>
          Recipe Results
        </ThemedText>
        <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.subtitle}>
          {queryParam && inputIngredients.length > 0
            ? `Matches for "${queryParam}" with: ${inputIngredients.join(', ')}`
            : queryParam
              ? `Matches for: "${queryParam}"`
              : `Matches for: ${inputIngredients.length ? inputIngredients.join(', ') : 'all recipes'}`}
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.sortCard}>
        <ThemedText type="defaultSemiBold" lightColor="#12263A" darkColor="#F7F1E8">
          Sort by
        </ThemedText>
        <ThemedView style={styles.sortRow}>
          {[
            { label: 'Relevance', value: 'relevance' as const },
            { label: 'Difficulty', value: 'difficulty' as const },
            { label: 'Time', value: 'time' as const },
          ].map((option) => {
            const isActive = sortBy === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSortBy(option.value)}
                style={[styles.sortPill, isActive && styles.sortPillActive]}>
                <ThemedText
                  type="defaultSemiBold"
                  lightColor={isActive ? '#FFFFFF' : '#FF3D7F'}
                  darkColor={isActive ? '#1F2A3A' : '#FFA7C8'}
                  style={styles.sortPillText}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.loadingStack}>
          <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.emptyCard}>
            <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.skeletonLineLarge} />
            <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.skeletonLineMedium} />
          </ThemedView>

          {Array.from({ length: 3 }).map((_, index) => (
            <ThemedView
              key={`results-skeleton-${index}`}
              lightColor="#FFFFFF"
              darkColor="#1F2A3A"
              style={styles.card}>
              <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.cardVisual}>
                <ThemedView lightColor="#EAD7C3" darkColor="#2A211B" style={styles.cardVisualOrb} />
                <ThemedView
                  lightColor="#FFFFFF"
                  darkColor="#142033"
                  style={styles.cardVisualSheet}
                />
              </ThemedView>
              <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.skeletonLineTitle} />
              <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.skeletonLineBody} />
              <ThemedView style={styles.signalRow}>
                <ThemedView lightColor="#F0E5D7" darkColor="#312720" style={styles.skeletonPill} />
                <ThemedView lightColor="#F5ECE1" darkColor="#281F19" style={styles.skeletonPill} />
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      ) : sortedResults.length === 0 ? (
        <ThemedView lightColor="#FFFFFF" darkColor="#1F2A3A" style={styles.emptyCard}>
          <ThemedText type="defaultSemiBold" lightColor="#12263A" darkColor="#F7F1E8">
            No recipes matched.
          </ThemedText>
          <ThemedText lightColor="#4A6178" darkColor="#6B7F92" style={styles.emptyText}>
            {queryParam
              ? 'Try a different recipe name or fewer search words.'
              : 'Try broader ingredients like onion, rice, or egg.'}
          </ThemedText>
        </ThemedView>
      ) : (
        sortedResults.map((recipe, index) => {
          const metadata = getRecipeMetadata(recipe);
          const isAltRow = index % 2 === 1;
          const isSaved = isRecipeSaved(recipe.id);

          return (
            <ThemedView key={recipe.id} style={styles.cardStack}>
              <Pressable onPress={() => openRecipe(recipe.id)}>
              <ThemedView
                lightColor="#FFFFFF"
                darkColor="#1F2A3A"
                style={[styles.cardRow, isAltRow ? styles.cardRowAlt : styles.cardRowBase]}>
                <ThemedView style={styles.cardStripe} />
                <ThemedView style={styles.cardVisual}>
                  {recipe.image ? (
                    <Image
                      source={{ uri: recipe.image }}
                      style={styles.cardImage}
                      contentFit="contain"
                      transition={120}
                    />
                  ) : (
                    <>
                      <ThemedView style={styles.cardVisualOrb} />
                      <ThemedView style={styles.cardVisualSheet} />
                    </>
                  )}
                </ThemedView>

                <ThemedView style={styles.cardBody}>
                  <ThemedView style={styles.cardTopRow}>
                    <ThemedText
                      type="defaultSemiBold"
                      lightColor="#12263A"
                      darkColor="#F7F1E8"
                      style={styles.cardTitle}
                      numberOfLines={1}>
                      {recipe.name}
                    </ThemedText>
                    <ThemedView style={styles.matchChip}>
                      <ThemedText
                        type="defaultSemiBold"
                        lightColor="#00B894"
                        darkColor="#7BE3CD"
                        style={styles.matchChipText}>
                        Good fit
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedText
                    lightColor="#4A6178"
                    darkColor="#6B7F92"
                    style={styles.cardCopy}
                    numberOfLines={2}>
                    Ingredients: {recipe.ingredients.join(', ')}
                  </ThemedText>
                  <ThemedView style={styles.metaLine}>
                    <ThemedText
                      type="defaultSemiBold"
                      lightColor="#FF3D7F"
                      darkColor="#FFA7C8"
                      style={styles.metaLineText}>
                      {metadata.difficulty}
                    </ThemedText>
                    <ThemedText lightColor="#6B7F92" darkColor="#6B7F92">•</ThemedText>
                    <ThemedText
                      type="defaultSemiBold"
                      lightColor="#FF3D7F"
                      darkColor="#FFA7C8"
                      style={styles.metaLineText}>
                      {metadata.estimatedCookMinutes} min
                    </ThemedText>
                  </ThemedView>
                  {recipe.description ? (
                    <ThemedText
                      lightColor="#4A6178"
                      darkColor="#6B7F92"
                      style={styles.cardDescription}
                      numberOfLines={2}>
                      {recipe.description}
                    </ThemedText>
                  ) : null}
                  <ThemedView style={styles.cardDivider} />
                  <ThemedView style={styles.signalRow}>
                    {getRecipeSignals(recipe).map((signal) => (
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
                </ThemedView>
              </ThemedView>
              </Pressable>
              <Pressable
                onPress={() => toggleSavedRecipe(recipe)}
                style={[styles.saveQuickButton, isSaved && styles.saveQuickButtonActive]}>
                <IconSymbol
                  size={16}
                  name="bookmark.fill"
                  color={isSaved ? '#00B894' : '#FF3D7F'}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.saveQuickButtonText, isSaved && styles.saveQuickButtonTextActive]}>
                  {isSaved ? 'Saved' : 'Save'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerCard: {
    gap: 8,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    shadowColor: '#6A5240',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  headerEyebrow: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  subtitle: {
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    gap: 6,
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  emptyText: {
    lineHeight: 22,
  },
  sortCard: {
    gap: 10,
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
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.28)',
    backgroundColor: 'rgba(255, 61, 127, 0.10)',
  },
  sortPillActive: {
    backgroundColor: '#FF3D7F',
    borderColor: '#FF3D7F',
  },
  sortPillText: {
    fontSize: 13,
  },
  loadingStack: {
    gap: 10,
  },
  cardStack: {
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.18)',
    borderRadius: 24,
    padding: 14,
    gap: 10,
    marginBottom: 10,
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  cardRow: {
    borderWidth: 0,
    borderRadius: 24,
    padding: 12,
    gap: 12,
    marginBottom: 10,
    shadowColor: '#6A5240',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  cardRowBase: {
    backgroundColor: 'rgba(255, 248, 238, 0.98)',
  },
  cardRowAlt: {
    backgroundColor: 'rgba(244, 239, 231, 0.96)',
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255, 61, 127, 0.52)',
  },
  cardVisual: {
    width: 112,
    height: 112,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 61, 127, 0.12)',
    padding: 6,
    flexShrink: 0,
    marginLeft: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardVisualOrb: {
    position: 'absolute',
    top: -18,
    right: -6,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 61, 127, 0.24)',
  },
  cardVisualSheet: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    width: 108,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  cardBody: {
    flex: 1,
    gap: 7,
    paddingRight: 2,
  },
  skeletonLineLarge: {
    height: 18,
    borderRadius: 999,
    width: '62%',
  },
  skeletonLineMedium: {
    height: 14,
    borderRadius: 999,
    width: '82%',
    marginTop: 10,
  },
  skeletonLineTitle: {
    height: 18,
    borderRadius: 999,
    width: '74%',
  },
  skeletonLineBody: {
    height: 14,
    borderRadius: 999,
    width: '92%',
  },
  skeletonPill: {
    height: 28,
    borderRadius: 999,
    width: 72,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
  },
  cardCopy: {
    color: '#4A6178',
    lineHeight: 20,
    fontSize: 14,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLineText: {
    fontSize: 13,
  },
  cardDescription: {
    lineHeight: 19,
    fontSize: 13,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 184, 148, 0.24)',
    marginTop: 2,
  },
  matchChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 184, 148, 0.16)',
  },
  matchChipText: {
    fontSize: 13,
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  saveQuickButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 127, 0.28)',
    backgroundColor: 'rgba(255, 61, 127, 0.10)',
  },
  saveQuickButtonActive: {
    borderColor: 'rgba(0, 184, 148, 0.50)',
    backgroundColor: 'rgba(0, 184, 148, 0.16)',
  },
  saveQuickButtonText: {
    color: '#FF3D7F',
    fontSize: 13,
  },
  saveQuickButtonTextActive: {
    color: '#00B894',
  },
});
