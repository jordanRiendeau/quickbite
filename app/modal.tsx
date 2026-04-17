import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';

import { palette } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>QuickBite MVP</Text>
      <Text style={styles.body}>
        Find dinner ideas from your ingredients, filter by time and difficulty, and save shopping items
        by account.
      </Text>

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Close</Text>
      </Pressable>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EE',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: palette.cocoa,
    fontSize: 28,
    fontWeight: '900',
  },
  body: {
    color: palette.cocoa,
    marginTop: 12,
    lineHeight: 22,
    fontSize: 15,
    opacity: 0.85,
  },
  button: {
    marginTop: 20,
    backgroundColor: palette.tomato,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
