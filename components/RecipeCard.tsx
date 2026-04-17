import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/constants/theme';
import type { Recipe, SearchMode } from '@/types/recipe';

export function RecipeCard({
  recipe,
  mode,
  onOpen,
  onAddIngredients,
  onToggleSave,
  isSaved = false,
}: {
  recipe: Recipe;
  mode: SearchMode;
  onOpen: () => void;
  onAddIngredients: () => void;
  onToggleSave: () => void;
  isSaved?: boolean;
}) {
  const previewIngredients = recipe.ingredients.slice(0, 5).join(', ');
  const firstStep = recipe.steps[0] ?? 'Open recipe for full step-by-step instructions.';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.meta}>
            {recipe.readyInMinutes} min | {recipe.difficulty}
          </Text>
          <Text style={styles.metaMuted}>
            Match {(recipe.ingredientMatchScore * 100).toFixed(0)}% ({recipe.usedIngredientCount} used)
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Ingredients</Text>
      <Text style={styles.bodyText} numberOfLines={2}>
        {previewIngredients || 'Ingredients not available'}
      </Text>

      <Text style={styles.sectionLabel}>First Step</Text>
      <Text style={styles.bodyText} numberOfLines={2}>
        {firstStep}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={onOpen}>
          <Text style={styles.primaryText}>View Recipe</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={onAddIngredients}>
          <Text style={styles.secondaryText}>
            {mode === 'ingredients' ? 'Add Missing' : 'Add Ingredients'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.saveButton} onPress={onToggleSave}>
        <Text style={styles.saveButtonText}>{isSaved ? 'Saved Recipe' : 'Save Recipe'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3D8CB',
    padding: spacing.md,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F7E5D9',
  },
  headerTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: palette.cocoa,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  meta: {
    color: palette.cocoa,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '700',
  },
  metaMuted: {
    color: palette.cocoaFaded,
    fontSize: 12,
    marginTop: 3,
  },
  sectionLabel: {
    marginTop: 4,
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyText: {
    color: palette.cocoa,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: palette.tomato,
  },
  secondaryButton: {
    backgroundColor: '#FFE8DC',
    borderWidth: 1,
    borderColor: '#F5B79E',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryText: {
    color: palette.cocoa,
    fontWeight: '800',
    fontSize: 13,
  },
  saveButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0B79D',
    backgroundColor: '#FFF1E8',
  },
  saveButtonText: {
    color: palette.cocoa,
    fontWeight: '800',
    fontSize: 12,
  },
});