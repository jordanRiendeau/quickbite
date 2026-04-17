import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppTheme } from '@/constants/theme';
import { QuickBiteProvider } from '@/context/quickbite-context';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loaded = true;
  const error = null;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ErrorBoundary>
      <ThemeProvider value={AppTheme}>
        <QuickBiteProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </QuickBiteProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
