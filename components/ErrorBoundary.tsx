import { router } from 'expo-router';
import React, { ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly error screen
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log error to console for development
    console.error('[ErrorBoundary] Caught error:', error);
    // In production, you'd send this to Sentry, Bugsnag, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    router.push('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, we're here to help!
            </Text>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorLabel}>Error details (dev only):</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}

            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Go Home</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7EE',
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    color: palette.cocoa,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: palette.cocoa,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#FFE8DC',
    borderRadius: 12,
    padding: spacing.md,
    gap: 8,
    marginVertical: spacing.md,
  },
  errorLabel: {
    color: palette.cocoa,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  errorText: {
    color: palette.cocoa,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: palette.tomato,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
