import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createDebounce } from '@/lib/debounce';
import { errorLogger } from '@/lib/error-logger';
import type { Recipe, SavedRecipe, ShoppingItem, UserAccount } from '@/types/recipe';

type ShoppingMap = Record<string, ShoppingItem[]>;
type SavedRecipeMap = Record<string, SavedRecipe[]>;

type QuickBiteContextValue = {
  accounts: UserAccount[];
  activeAccountId: string;
  activeAccount: UserAccount;
  shoppingItems: ShoppingItem[];
  savedRecipes: SavedRecipe[];
  loading: boolean;
  createAccount: (displayName: string) => void;
  switchAccount: (accountId: string) => void;
  addItemsToShoppingList: (items: string[], recipeId?: number, recipeName?: string, recipeImage?: string) => void;
  toggleShoppingItem: (itemId: string) => void;
  removeShoppingItem: (itemId: string) => void;
  clearCheckedItems: () => void;
  clearAllShoppingItems: () => void;
  hasRecipeIngredients: (recipeId: number, ingredients: string[]) => boolean;
  removeRecipeIngredients: (recipeId: number, ingredients: string[]) => void;
  saveRecipe: (recipe: Recipe) => void;
  removeSavedRecipe: (recipeId: number) => void;
  toggleSavedRecipe: (recipe: Recipe) => void;
  isRecipeSaved: (recipeId: number) => boolean;
};

const STORAGE_KEY = 'quickbite_state_v1';
const GUEST_ACCOUNT_ID = 'guest';

const guestAccount: UserAccount = {
  id: GUEST_ACCOUNT_ID,
  displayName: 'Guest',
  createdAt: Date.now(),
};

const QuickBiteContext = createContext<QuickBiteContextValue | null>(null);

function normalizeIngredientName(ingredient: string) {
  return ingredient.trim().toLowerCase();
}

export function QuickBiteProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<UserAccount[]>([guestAccount]);
  const [activeAccountId, setActiveAccountId] = useState<string>(GUEST_ACCOUNT_ID);
  const [shoppingByAccount, setShoppingByAccount] = useState<ShoppingMap>({ [GUEST_ACCOUNT_ID]: [] });
  const [savedByAccount, setSavedByAccount] = useState<SavedRecipeMap>({ [GUEST_ACCOUNT_ID]: [] });
  const [loading, setLoading] = useState(true);

  // Debounce AsyncStorage writes to batch rapid state changes
  const lastStateRef = useRef<{
    accounts: UserAccount[];
    activeAccountId: string;
    shoppingByAccount: ShoppingMap;
    savedByAccount: SavedRecipeMap;
  } | null>(null);

  const debouncedSave = useMemo(
    () =>
      createDebounce(async (state: typeof lastStateRef.current) => {
        if (!state) return;

        try {
          const payload = JSON.stringify(state);
          await AsyncStorage.setItem(STORAGE_KEY, payload);
        } catch (err) {
          errorLogger.captureStorageError('write', err as Error);
        }
      }, 1000), // Batch writes within 1 second
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !mounted) {
          return;
        }

        const parsed = JSON.parse(raw);
        const nextAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : [guestAccount];
        const nextActive =
          typeof parsed.activeAccountId === 'string' ? parsed.activeAccountId : GUEST_ACCOUNT_ID;
        const nextShopping = parsed.shoppingByAccount && typeof parsed.shoppingByAccount === 'object'
          ? parsed.shoppingByAccount
          : { [GUEST_ACCOUNT_ID]: [] };
        const nextSaved = parsed.savedByAccount && typeof parsed.savedByAccount === 'object'
          ? parsed.savedByAccount
          : { [GUEST_ACCOUNT_ID]: [] };

        if (!nextAccounts.find((account: UserAccount) => account.id === GUEST_ACCOUNT_ID)) {
          nextAccounts.unshift(guestAccount);
        }

        setAccounts(nextAccounts);
        setActiveAccountId(nextActive);
        setShoppingByAccount(nextShopping);
        setSavedByAccount(nextSaved);
      } catch (err) {
        errorLogger.captureStorageError('read', err as Error);
        // Ignore broken persisted state and keep defaults.
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  // Debounced persist effect - fires when state changes but batches rapid updates
  useEffect(() => {
    if (loading) {
      return;
    }

    lastStateRef.current = {
      accounts,
      activeAccountId,
      shoppingByAccount,
      savedByAccount,
    };

    debouncedSave(lastStateRef.current);
  }, [accounts, activeAccountId, loading, savedByAccount, shoppingByAccount, debouncedSave]);

  const activeAccount = useMemo(() => {
    return accounts.find((account) => account.id === activeAccountId) ?? guestAccount;
  }, [accounts, activeAccountId]);

  const shoppingItems = shoppingByAccount[activeAccount.id] ?? [];
  const savedRecipes = savedByAccount[activeAccount.id] ?? [];

  const value = useMemo<QuickBiteContextValue>(
    () => ({
      accounts,
      activeAccountId,
      activeAccount,
      shoppingItems,
      savedRecipes,
      loading,
      createAccount: (displayName: string) => {
        const trimmed = displayName.trim();

        if (!trimmed) {
          return;
        }

        const accountId = trimmed.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const nextAccount: UserAccount = {
          id: accountId,
          displayName: trimmed,
          createdAt: Date.now(),
        };

        setAccounts((current) => [...current, nextAccount]);
        setActiveAccountId(accountId);
        setShoppingByAccount((current) => ({ ...current, [accountId]: [] }));
        setSavedByAccount((current) => ({ ...current, [accountId]: [] }));
      },
      switchAccount: (accountId: string) => {
        if (!accounts.some((account) => account.id === accountId)) {
          return;
        }

        setActiveAccountId(accountId);
      },
      addItemsToShoppingList: (items: string[], recipeId?: number, recipeName?: string, recipeImage?: string) => {
        const normalized = items.map((item) => item.trim()).filter(Boolean);

        if (normalized.length === 0) {
          return;
        }

        setShoppingByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          const existingSet = new Set(existing.map((item) => item.name.toLowerCase()));

          const additions = normalized
            .filter((item) => !existingSet.has(item.toLowerCase()))
            .map((item) => ({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${item}`,
              name: item,
              checked: false,
              createdAt: Date.now(),
              recipeId,
              recipeName,
              recipeImage,
            }));

          return {
            ...current,
            [activeAccount.id]: [...existing, ...additions],
          };
        });
      },
      toggleShoppingItem: (itemId: string) => {
        setShoppingByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          return {
            ...current,
            [activeAccount.id]: existing.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item,
            ),
          };
        });
      },
      removeShoppingItem: (itemId: string) => {
        setShoppingByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          return {
            ...current,
            [activeAccount.id]: existing.filter((item) => item.id !== itemId),
          };
        });
      },
      clearCheckedItems: () => {
        setShoppingByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          return {
            ...current,
            [activeAccount.id]: existing.filter((item) => !item.checked),
          };
        });
      },
      clearAllShoppingItems: () => {
        setShoppingByAccount((current) => ({
          ...current,
          [activeAccount.id]: [],
        }));
      },
      hasRecipeIngredients: (recipeId: number, ingredients: string[]) => {
        const requiredIngredients = ingredients.map(normalizeIngredientName).filter(Boolean);

        if (requiredIngredients.length === 0) {
          return false;
        }

        const activeItems = shoppingItems.filter((item) => item.recipeId === recipeId);
        const activeIngredientNames = new Set(
          activeItems.map((item) => normalizeIngredientName(item.name)),
        );

        return requiredIngredients.every((ingredient) => activeIngredientNames.has(ingredient));
      },
      /**
       * Remove every shopping-list item that belongs to a recipe and matches its ingredient list.
       * This keeps recipe-level add/remove buttons in sync with the current account.
       */
      removeRecipeIngredients: (recipeId: number, ingredients: string[]) => {
        const targetIngredients = new Set(
          ingredients.map(normalizeIngredientName).filter(Boolean),
        );

        setShoppingByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];

          return {
            ...current,
            [activeAccount.id]: existing.filter(
              (item) =>
                !(item.recipeId === recipeId && targetIngredients.has(normalizeIngredientName(item.name))),
            ),
          };
        });
      },
      saveRecipe: (recipe: Recipe) => {
        setSavedByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          if (existing.some((item) => item.id === recipe.id)) {
            return current;
          }

          const nextSaved: SavedRecipe = {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
          };

          return {
            ...current,
            [activeAccount.id]: [nextSaved, ...existing],
          };
        });
      },
      removeSavedRecipe: (recipeId: number) => {
        setSavedByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          return {
            ...current,
            [activeAccount.id]: existing.filter((item) => item.id !== recipeId),
          };
        });
      },
      toggleSavedRecipe: (recipe: Recipe) => {
        setSavedByAccount((current) => {
          const existing = current[activeAccount.id] ?? [];
          const exists = existing.some((item) => item.id === recipe.id);

          if (exists) {
            return {
              ...current,
              [activeAccount.id]: existing.filter((item) => item.id !== recipe.id),
            };
          }

          const nextSaved: SavedRecipe = {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
          };

          return {
            ...current,
            [activeAccount.id]: [nextSaved, ...existing],
          };
        });
      },
      isRecipeSaved: (recipeId: number) => savedRecipes.some((item) => item.id === recipeId),
    }),
    [accounts, activeAccount, activeAccountId, loading, savedRecipes, shoppingItems],
  );

  return <QuickBiteContext.Provider value={value}>{children}</QuickBiteContext.Provider>;
}

export function useQuickBite() {
  const context = useContext(QuickBiteContext);
  if (!context) {
    throw new Error('useQuickBite must be used inside QuickBiteProvider');
  }
  return context;
}