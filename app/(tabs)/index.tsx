import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { palette, spacing } from '@/constants/theme';

type SearchMode = 'ingredients' | 'recipe';

export default function HomeScreen() {
  const [mode, setMode] = useState<SearchMode>('ingredients');
  const [query, setQuery] = useState('');

  const helpText = useMemo(
    () =>
      mode === 'ingredients'
        ? 'Type ingredients separated by commas. Example: chicken, rice, garlic'
        : 'Type a dish name. We use moderate typo correction to help find close matches.',
    [mode],
  );

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length > 200) {
      return;
    }

    router.push({
      pathname: '/results',
      params: {
        mode,
        q: trimmed,
      },
    });
  };

  return (
    <LinearGradient colors={[palette.apricot, palette.cream, '#FFFDF6']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.brand}>QuickBite</Text>
            <Text style={styles.title}>Dinner solved in minutes.</Text>
            <Text style={styles.subtitle}>
              Search by ingredients you already have, or by recipe name. Results are relevance-first.
            </Text>

            <View style={styles.modeWrap}>
              <ModeButton
                label="Ingredient Search"
                active={mode === 'ingredients'}
                onPress={() => setMode('ingredients')}
              />
              <ModeButton
                label="Recipe Search"
                active={mode === 'recipe'}
                onPress={() => setMode('recipe')}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>
                {mode === 'ingredients' ? 'Ingredients' : 'Recipe Query'}
              </Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  mode === 'ingredients'
                    ? 'chicken, rice, garlic'
                    : 'chiken parm or pasta alfredo'
                }
                placeholderTextColor={palette.cocoaFaded}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.help}>{helpText}</Text>

              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Find Recipes</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress}>
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingTop: 28,
    gap: spacing.md,
  },
  brand: {
    color: palette.tomato,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    color: palette.cocoa,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: palette.cocoa,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.82,
    marginBottom: spacing.sm,
  },
  modeWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.peach,
    backgroundColor: '#FFF5EE',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: palette.tomato,
    backgroundColor: '#FFE7DB',
  },
  modeLabel: {
    color: palette.cocoa,
    fontSize: 13,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: palette.tomato,
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F6D6C9',
    padding: spacing.md,
    shadowColor: '#B56C56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  inputLabel: {
    color: palette.cocoa,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F2BBA8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FFFDF9',
    color: palette.cocoa,
    fontSize: 15,
  },
  help: {
    color: palette.cocoa,
    opacity: 0.72,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 18,
  },
  searchButton: {
    backgroundColor: palette.tomato,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
