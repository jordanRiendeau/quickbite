import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { RecipeCard } from '@/components/RecipeCard';
import { palette, spacing } from '@/constants/theme';
import { useQuickBite } from '@/context/quickbite-context';
import { sortRecipes } from '@/lib/ranking';
import { searchByIngredients, searchByRecipeQuery } from '@/lib/recipe-api';
import type { Difficulty, Recipe, SearchMode, SortOption } from '@/types/recipe';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ q?: string; mode?: SearchMode }>();
  const {
    addItemsToShoppingList,
    hasRecipeIngredients,
    isRecipeSaved,
    removeRecipeIngredients,
    toggleSavedRecipe,
  } = useQuickBite();

  const query = (params.q ?? '').trim();
  const mode: SearchMode = params.mode === 'recipe' ? 'recipe' : 'ingredients';

  const [items, setItems] = useState<Recipe[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>();
  const requestInFlightRef = useRef(false);

  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | 'Any'>('Any');
  const [sortBy, setSortBy] = useState<SortOption>('ingredient');

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!query || requestInFlightRef.current) {
        return;
      }

      requestInFlightRef.current = true;

      try {
        setLoading(true);
        setError(null);

        const response =
          mode === 'ingredients'
            ? await searchByIngredients(query, nextPage)
            : await searchByRecipeQuery(query, nextPage);

        setCorrectedQuery(response.correctedQuery);

        setItems((current) => {
          const merged = append ? [...current, ...response.recipes] : response.recipes;
          const deduped = new Map<number, Recipe>();

          merged.forEach((item) => {
            deduped.set(item.id, item);
          });

          return Array.from(deduped.values());
        });
        setHasMore(response.hasMore);
        setPage(nextPage);
      } catch {
        setError(
          'We could not load recipes. Add EXPO_PUBLIC_SPOONACULAR_API_KEY for live data or try again.',
        );
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [mode, query],
  );

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
    setSortBy(mode === 'ingredients' ? 'ingredient' : 'relevance');
    setDifficulty('Any');
    setMaxTime(null);
    setCorrectedQuery(undefined);

    if (query) {
      loadPage(0, false);
    } else {
      setInitialLoading(false);
    }
  }, [loadPage, mode, query]);

  const filtered = useMemo(() => {
    let next = [...items];

    if (mode === 'ingredients') {
      if (maxTime !== null) {
        next = next.filter((item) => item.readyInMinutes <= maxTime);
      }

      if (difficulty !== 'Any') {
        next = next.filter((item) => item.difficulty === difficulty);
      }

      next = sortRecipes(next, sortBy);
    }

    return next;
  }, [difficulty, items, maxTime, mode, sortBy]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPage(page + 1, true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Results</Text>
      </View>

      <View style={styles.queryCard}>
        <Text style={styles.queryLabel}>{mode === 'ingredients' ? 'Ingredients:' : 'Recipe search:'}</Text>
        <Text style={styles.queryText}>{query}</Text>
        {correctedQuery ? (
          <Text style={styles.correctedText}>Showing results for: {correctedQuery}</Text>
        ) : null}
      </View>

      {mode === 'ingredients' ? (
        <View style={styles.filtersWrap}>
          <Text style={styles.filtersTitle}>Filters & Relevance</Text>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRowContent}
            >
              <SmallPill
                label="Any time"
                active={maxTime === null}
                onPress={() => setMaxTime(null)}
              />
              <SmallPill label="Up to 20 min" active={maxTime === 20} onPress={() => setMaxTime(20)} />
              <SmallPill label="Up to 40 min" active={maxTime === 40} onPress={() => setMaxTime(40)} />
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Difficulty</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRowContent}
            >
              <SmallPill
                label="Any difficulty"
                active={difficulty === 'Any'}
                onPress={() => setDifficulty('Any')}
              />
              <SmallPill
                label="Easy"
                active={difficulty === 'Easy'}
                onPress={() => setDifficulty('Easy')}
              />
              <SmallPill
                label="Medium"
                active={difficulty === 'Medium'}
                onPress={() => setDifficulty('Medium')}
              />
              <SmallPill
                label="Hard"
                active={difficulty === 'Hard'}
                onPress={() => setDifficulty('Hard')}
              />
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Sort by</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRowContent}
            >
              <SmallPill
                label="Best match"
                active={sortBy === 'ingredient'}
                onPress={() => setSortBy('ingredient')}
              />
              <SmallPill
                label="Fastest"
                active={sortBy === 'time'}
                onPress={() => setSortBy('time')}
              />
              <SmallPill
                label="Easiest"
                active={sortBy === 'difficulty'}
                onPress={() => setSortBy('difficulty')}
              />
            </ScrollView>
          </View>
        </View>
      ) : null}

      {initialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.tomato} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            // Derive button state from shared shopping-list state so cards stay in sync.
            const ingredientsAdded = hasRecipeIngredients(item.id, item.ingredients);

            return (
              <RecipeCard
                recipe={item}
                onOpen={() => router.push(`/recipe/${item.id}`)}
                onToggleIngredients={() => {
                  if (ingredientsAdded) {
                    removeRecipeIngredients(item.id, item.ingredients);
                    return;
                  }

                  // Recipe-level action: add every ingredient for this recipe in one tap.
                  addItemsToShoppingList(item.ingredients, item.id, item.title, item.image);
                  Alert.alert('Shopping list updated', 'All ingredients added to list.');
                }}
                ingredientsAdded={ingredientsAdded}
                onToggleSave={() => toggleSavedRecipe(item)}
                isSaved={isRecipeSaved(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No recipes found. Try different ingredients or a broader recipe name.
            </Text>
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={palette.tomato} />
              </View>
            ) : hasMore ? (
              <View style={styles.footerLoadMoreWrap}>
                <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </SafeAreaView>
  );
}

function SmallPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF6EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: palette.cocoa,
    fontSize: 26,
    fontWeight: '900',
  },
  backButton: {
    backgroundColor: '#FFE8DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: {
    color: palette.cocoa,
    fontWeight: '700',
  },
  queryCard: {
    marginHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: '#F2D5C7',
    padding: spacing.md,
    gap: 4,
  },
  queryLabel: {
    color: palette.cocoaFaded,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  queryText: {
    color: palette.cocoa,
    fontSize: 18,
    fontWeight: '900',
  },
  correctedText: {
    color: palette.tomato,
    fontSize: 13,
    fontWeight: '700',
  },
  filtersWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: 10,
  },
  filtersTitle: {
    color: palette.cocoa,
    fontSize: 15,
    fontWeight: '900',
  },
  filterGroup: {
    gap: 6,
  },
  filterGroupTitle: {
    color: palette.cocoaFaded,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterRowContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: spacing.md,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4C7B8',
    backgroundColor: '#FFF4EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: palette.tomato,
    borderColor: palette.tomato,
  },
  pillText: {
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    color: palette.cocoaFaded,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 14,
    lineHeight: 20,
  },
  footerLoading: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerLoadMoreWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: palette.tomato,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#B03A3A',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
