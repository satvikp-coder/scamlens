import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/error-boundary';
import { CurrentCheckProvider } from '@/state/current-check';
import { HistoryProvider } from '@/state/history';
import { SettingsProvider, useSettings } from '@/state/settings';
import { usePalette } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden; nothing to do.
});

function Navigator() {
  const { settings, ready, t } = useSettings();
  const p = usePalette();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <ErrorBoundary language={settings.language}>
      <HistoryProvider>
        <CurrentCheckProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: p.surface },
              headerTintColor: p.text,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: p.background },
            }}
          >
            <Stack.Protected guard={!settings.onboarded}>
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={settings.onboarded}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="analyze" options={{ title: t('analyze.title') }} />
              <Stack.Screen name="result" options={{ title: t('result.title') }} />
              <Stack.Screen name="lesson/[id]" options={{ title: t('learn.title') }} />
              <Stack.Screen name="practice" options={{ title: t('practice.title') }} />
              <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
              <Stack.Screen name="about" options={{ title: t('about.title') }} />
            </Stack.Protected>
          </Stack>
        </CurrentCheckProvider>
      </HistoryProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="auto" />
        <Navigator />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
