import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
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
  const { addItemsToShoppingList, isRecipeSaved, toggleSavedRecipe } = useQuickBite();

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
          <View style={styles.filterRow}>
            <SmallPill
              label="Any time"
              active={maxTime === null}
              onPress={() => setMaxTime(null)}
            />
            <SmallPill label="<= 20 min" active={maxTime === 20} onPress={() => setMaxTime(20)} />
            <SmallPill label="<= 40 min" active={maxTime === 40} onPress={() => setMaxTime(40)} />
          </View>
          <View style={styles.filterRow}>
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
          </View>
          <View style={styles.filterRow}>
            <SmallPill
              label="Rank: Ingredient match"
              active={sortBy === 'ingredient'}
              onPress={() => setSortBy('ingredient')}
            />
            <SmallPill
              label="Rank: Time"
              active={sortBy === 'time'}
              onPress={() => setSortBy('time')}
            />
            <SmallPill
              label="Rank: Difficulty"
              active={sortBy === 'difficulty'}
              onPress={() => setSortBy('difficulty')}
            />
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
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              mode={mode}
              onOpen={() => router.push(`/recipe/${item.id}`)}
              onAddIngredients={() => {
                const missingCount = Math.max(item.missedIngredientCount, 0);
                const nextItems =
                  mode === 'ingredients' && missingCount > 0
                    ? item.ingredients.slice(-missingCount)
                    : item.ingredients;

                addItemsToShoppingList(nextItems, item.id, item.title, item.image);
              }}
              onToggleSave={() => toggleSavedRecipe(item)}
              isSaved={isRecipeSaved(item.id)}
            />
          )}
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
    backgroundColor: '#FFF5EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    backgroundColor: '#FFE8DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: palette.cocoa,
    fontWeight: '700',
  },
  title: {
    color: palette.cocoa,
    fontSize: 20,
    fontWeight: '900',
  },
  queryCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3D8CA',
    padding: spacing.md,
  },
  queryLabel: {
    color: palette.cocoaFaded,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  queryText: {
    color: palette.cocoa,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  correctedText: {
    color: palette.tomato,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  filtersWrap: {
    marginHorizontal: spacing.md,
    backgroundColor: '#FFF4E8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5D3C2',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 8,
  },
  filtersTitle: {
    color: palette.cocoa,
    fontWeight: '800',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1BDA6',
    backgroundColor: '#FFF9F4',
  },
  pillActive: {
    backgroundColor: '#FFE5D7',
    borderColor: palette.tomato,
  },
  pillText: {
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: palette.tomato,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    color: palette.cocoaFaded,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerLoadMoreWrap: {
    paddingTop: 4,
    paddingBottom: 18,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FFE5D8',
    borderWidth: 1,
    borderColor: '#F1B79C',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  loadMoreText: {
    color: palette.cocoa,
    fontWeight: '800',
    fontSize: 14,
  },
  errorText: {
    color: '#B32222',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 10,
  },
});