import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette, spacing } from '@/constants/theme';
import { useQuickBite } from '@/context/quickbite-context';

export default function AccountScreen() {
  const {
    accounts,
    activeAccountId,
    activeAccount,
    createAccount,
    switchAccount,
    shoppingItems,
    savedRecipes,
    removeSavedRecipe,
  } =
    useQuickBite();

  const [displayName, setDisplayName] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Guest mode is active by default for the MVP.</Text>

        <View style={styles.activeCard}>
          <Text style={styles.cardLabel}>Current account</Text>
          <Text style={styles.activeName}>{activeAccount.displayName}</Text>
          <Text style={styles.activeMeta}>Saved list items: {shoppingItems.length}</Text>
          <Text style={styles.activeMeta}>Saved recipes: {savedRecipes.length}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Create account</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={palette.cocoaFaded}
          />
          <Pressable
            style={styles.createButton}
            onPress={() => {
              if (!displayName.trim()) {
                return;
              }
              createAccount(displayName);
              setDisplayName('');
            }}>
            <Text style={styles.createText}>Create & Switch</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Switch account</Text>
          <View style={styles.accountList}>
            {accounts.map((account) => {
              const active = account.id === activeAccountId;
              return (
                <Pressable
                  key={account.id}
                  style={[styles.accountPill, active && styles.accountPillActive]}
                  onPress={() => switchAccount(account.id)}>
                  <Text style={[styles.accountPillText, active && styles.accountPillTextActive]}>
                    {account.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Saved recipes</Text>
          {savedRecipes.length === 0 ? (
            <Text style={styles.emptyText}>No saved recipes yet. Save one from search results.</Text>
          ) : (
            <View style={styles.savedList}>
              {savedRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.savedCard}>
                  <Image source={{ uri: recipe.image }} style={styles.savedImage} />
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.savedMeta}>
                      {recipe.readyInMinutes} min | {recipe.difficulty}
                    </Text>
                    <View style={styles.savedActions}>
                      <Pressable
                        style={styles.savedActionButton}
                        onPress={() => router.push(`/recipe/${recipe.id}`)}>
                        <Text style={styles.savedActionText}>Open</Text>
                      </Pressable>
                      <Pressable
                        style={styles.savedActionButton}
                        onPress={() => removeSavedRecipe(recipe.id)}>
                        <Text style={styles.savedActionText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8EF',
  },
  content: {
    padding: spacing.md,
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
  activeCard: {
    borderWidth: 1,
    borderColor: '#F2D3C4',
    borderRadius: 16,
    backgroundColor: '#FFFDF8',
    padding: spacing.md,
    gap: 4,
  },
  activeName: {
    color: palette.cocoa,
    fontSize: 20,
    fontWeight: '900',
  },
  activeMeta: {
    color: palette.cocoaFaded,
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderColor: '#F2D3C4',
    borderRadius: 16,
    backgroundColor: '#FFFDF8',
    padding: spacing.md,
    gap: 10,
  },
  cardLabel: {
    color: palette.cocoa,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F3BEA8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.cocoa,
    backgroundColor: '#FFF',
  },
  createButton: {
    backgroundColor: palette.tomato,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  createText: {
    color: '#fff',
    fontWeight: '800',
  },
  accountList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountPill: {
    borderWidth: 1,
    borderColor: '#EBC8B5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF7F1',
  },
  accountPillActive: {
    borderColor: palette.tomato,
    backgroundColor: '#FFE4D8',
  },
  accountPillText: {
    color: palette.cocoa,
    fontSize: 13,
    fontWeight: '700',
  },
  accountPillTextActive: {
    color: palette.tomato,
  },
  emptyText: {
    color: palette.cocoaFaded,
    fontSize: 13,
  },
  savedList: {
    gap: 10,
  },
  savedCard: {
    borderWidth: 1,
    borderColor: '#F1D2C2',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#FFF7F1',
    flexDirection: 'row',
    gap: 10,
  },
  savedImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F6E5D9',
  },
  savedInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  savedTitle: {
    color: palette.cocoa,
    fontWeight: '800',
    fontSize: 13,
  },
  savedMeta: {
    color: palette.cocoaFaded,
    fontSize: 12,
    fontWeight: '700',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  savedActionButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E7BBA4',
    backgroundColor: '#FFE8DD',
  },
  savedActionText: {
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '800',
  },
});