import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';

import { useSettings } from '@/state/settings';
import { usePalette } from '@/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: IconName, idle: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color, size, focused: isFocused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={isFocused ? focused : idle} size={size} color={color as string} />
  );
}

export default function TabsLayout() {
  const { t } = useSettings();
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.surface },
        headerTintColor: p.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: p.primary,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: p.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('app.name'), tabBarLabel: t('tab.home'), tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: t('learn.title'), tabBarLabel: t('tab.learn'), tabBarIcon: tabIcon('school', 'school-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('history.title'), tabBarLabel: t('tab.history'), tabBarIcon: tabIcon('time', 'time-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('settings.title'), tabBarLabel: t('tab.settings'), tabBarIcon: tabIcon('settings', 'settings-outline') }}
      />
    </Tabs>
  );
}
