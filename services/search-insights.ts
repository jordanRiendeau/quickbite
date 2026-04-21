import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_INSIGHTS_KEY = 'quickbite.search-insights.v1';

type SearchInsight = {
  term: string;
  count: number;
  type: 'name' | 'ingredient';
  lastSearchedAt: number;
};

type SearchInsightMap = Record<string, SearchInsight>;

const normalizeTerm = (term: string) => term.trim().toLowerCase().replace(/\s+/g, ' ');

async function readInsights() {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_INSIGHTS_KEY);

    if (!raw) {
      return {} as SearchInsightMap;
    }

    const parsed = JSON.parse(raw) as SearchInsightMap;

    if (!parsed || typeof parsed !== 'object') {
      return {} as SearchInsightMap;
    }

    return parsed;
  } catch {
    return {} as SearchInsightMap;
  }
}

async function writeInsights(insights: SearchInsightMap) {
  try {
    await AsyncStorage.setItem(SEARCH_INSIGHTS_KEY, JSON.stringify(insights));
  } catch {
    // Ignore analytics storage failures.
  }
}

export async function recordSearchTerm(term: string, type: 'name' | 'ingredient') {
  const normalizedTerm = normalizeTerm(term);

  if (!normalizedTerm) {
    return;
  }

  const insights = await readInsights();
  const existing = insights[normalizedTerm];

  insights[normalizedTerm] = {
    term: normalizedTerm,
    count: (existing?.count ?? 0) + 1,
    type,
    lastSearchedAt: Date.now(),
  };

  await writeInsights(insights);
}

export async function getTopSearchTerms(limit = 6) {
  const insights = await readInsights();

  return Object.values(insights)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.lastSearchedAt - left.lastSearchedAt;
    })
    .slice(0, Math.max(1, limit));
}
