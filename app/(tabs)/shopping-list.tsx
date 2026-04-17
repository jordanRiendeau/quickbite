import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { palette, spacing } from '@/constants/theme';
import { useQuickBite } from '@/context/quickbite-context';

export default function ShoppingListScreen() {
  const router = useRouter();
  const {
    activeAccount,
    shoppingItems,
    addItemsToShoppingList,
    clearAllShoppingItems,
    clearCheckedItems,
    removeShoppingItem,
    toggleShoppingItem,
  } = useQuickBite();

  const [manualItem, setManualItem] = useState('');

  const checkedCount = shoppingItems.filter((item) => item.checked).length;

  // Group items by recipe
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof shoppingItems } = {};
    const manualItems: typeof shoppingItems = [];

    shoppingItems.forEach((item) => {
      if (item.recipeId) {
        const key = String(item.recipeId);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      } else {
        manualItems.push(item);
      }
    });

    return { groups, manualItems };
  }, [shoppingItems]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Shopping List</Text>
        <Text style={styles.subtitle}>Saved for account: {activeAccount.displayName}</Text>

        <View style={styles.addCard}>
          <Text style={styles.inputLabel}>Add item manually</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={manualItem}
              onChangeText={setManualItem}
              placeholder="milk"
              placeholderTextColor={palette.cocoaFaded}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.addButton}
              onPress={() => {
                if (!manualItem.trim()) {
                  return;
                }
                addItemsToShoppingList([manualItem.trim()]);
                setManualItem('');
              }}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Items ({shoppingItems.length})</Text>
          <View style={styles.listActions}>
            <Pressable style={styles.clearButton} onPress={clearCheckedItems}>
              <Text style={styles.clearText}>Clear checked ({checkedCount})</Text>
            </Pressable>
            <Pressable style={styles.clearAllButton} onPress={clearAllShoppingItems}>
              <Text style={styles.clearAllText}>Clear all ({shoppingItems.length})</Text>
            </Pressable>
          </View>
        </View>

        {shoppingItems.length === 0 ? (
          <Text style={styles.emptyText}>
            Your list is empty. Add ingredients from a recipe result to auto-fill this list.
          </Text>
        ) : (
          <>
            {/* Recipe-grouped items */}
            {Object.entries(groupedItems.groups).map(([recipeId, items]) => {
              const firstItem = items[0];
              return (
                <View key={recipeId} style={styles.recipeGroup}>
                  {/* Recipe header with image */}
                  {firstItem.recipeImage && (
                    <Pressable
                      style={styles.recipeHeader}
                      onPress={() => router.push(`/recipe/${recipeId}`)}
                    >
                      <Image
                        source={{ uri: firstItem.recipeImage }}
                        style={styles.recipeImage}
                      />
                      <View style={styles.recipeInfo}>
                        <Text style={styles.recipeName}>{firstItem.recipeName}</Text>
                        <Text style={styles.recipeItemCount}>{items.length} ingredients</Text>
                      </View>
                      <Text style={styles.viewRecipeArrow}>→</Text>
                    </Pressable>
                  )}

                  {/* Ingredients for this recipe */}
                  <View style={styles.ingredientsList}>
                    {items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemMainContent}>
                          <Pressable
                            style={styles.checkWrap}
                            onPress={() => toggleShoppingItem(item.id)}
                          >
                            <View
                              style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                            >
                              {item.checked ? (
                                <Text style={styles.checkmark}>x</Text>
                              ) : null}
                            </View>
                            <View style={styles.itemTextWrap}>
                              <Text
                                style={[styles.itemText, item.checked && styles.itemTextChecked]}
                              >
                                {item.name}
                              </Text>
                              {item.recipeName ? (
                                <Text style={styles.recipeTag}>From {item.recipeName}</Text>
                              ) : null}
                            </View>
                          </Pressable>
                        </View>

                        <Pressable
                          style={styles.removeButton}
                          onPress={() => removeShoppingItem(item.id)}
                        >
                          <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Manual items section */}
            {groupedItems.manualItems.length > 0 && (
              <View style={styles.recipeGroup}>
                <Text style={styles.manualItemsTitle}>Manual Items</Text>
                <View style={styles.ingredientsList}>
                  {groupedItems.manualItems.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Pressable
                        style={styles.checkWrap}
                        onPress={() => toggleShoppingItem(item.id)}
                      >
                        <View
                          style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                        >
                          {item.checked ? (
                            <Text style={styles.checkmark}>x</Text>
                          ) : null}
                        </View>
                        <Text
                          style={[styles.itemText, item.checked && styles.itemTextChecked]}
                        >
                          {item.name}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() => removeShoppingItem(item.id)}
                      >
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7EE',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: palette.cocoa,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.cocoaFaded,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  addCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#F3D4C5',
    borderRadius: 16,
    padding: spacing.md,
    gap: 8,
  },
  inputLabel: {
    color: palette.cocoa,
    fontSize: 13,
    fontWeight: '700',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F2BCA4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    color: palette.cocoa,
  },
  addButton: {
    backgroundColor: palette.tomato,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  listHeader: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    color: palette.cocoa,
    fontSize: 18,
    fontWeight: '900',
  },
  clearButton: {
    backgroundColor: '#FFE9DE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearText: {
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllButton: {
    backgroundColor: '#FFD8D8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearAllText: {
    color: '#8F1F1F',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    color: palette.cocoaFaded,
    fontSize: 14,
    marginTop: 20,
  },
  recipeGroup: {
    marginTop: spacing.md,
  },
  recipeHeader: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: '#F3D6C8',
    borderRadius: 14,
    marginBottom: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipeImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeName: {
    color: palette.cocoa,
    fontSize: 14,
    fontWeight: '800',
  },
  recipeItemCount: {
    color: palette.cocoaFaded,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  viewRecipeArrow: {
    color: palette.tomato,
    fontSize: 18,
    fontWeight: '700',
  },
  ingredientsList: {
    gap: 8,
  },
  manualItemsTitle: {
    color: palette.cocoa,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  itemRow: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: '#F3D6C8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMainContent: {
    flex: 1,
  },
  checkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemTextWrap: {
    flex: 1,
    gap: 3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D7A893',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: palette.tomato,
    backgroundColor: '#FFE4D8',
  },
  checkmark: {
    color: palette.tomato,
    fontWeight: '900',
    fontSize: 11,
  },
  itemText: {
    color: palette.cocoa,
    fontSize: 14,
    fontWeight: '600',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: palette.cocoaFaded,
  },
  recipeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8DC',
    color: palette.cocoa,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeText: {
    color: '#AD3D2D',
    fontWeight: '700',
    fontSize: 12,
  },
});