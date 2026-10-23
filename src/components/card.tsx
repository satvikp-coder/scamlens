import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MIN_TOUCH, radius, spacing, usePalette } from '@/theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Bordered surface. Becomes a button when `onPress` is given. */
export function Card({ children, style, onPress, accessibilityLabel, accessibilityHint }: CardProps) {
  const p = usePalette();
  const base = [styles.card, { backgroundColor: p.surface, borderColor: p.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: p.primarySoft }}
      style={({ pressed }) => [base, { minHeight: MIN_TOUCH, opacity: pressed ? 0.9 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
});
