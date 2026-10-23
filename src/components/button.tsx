import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MIN_TOUCH, radius, spacing, usePalette } from '@/theme/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, accessibilityHint, style }: Props) {
  const p = usePalette();
  const inactive = disabled || loading;

  const colors = {
    primary: { bg: p.primary, fg: p.onPrimary, border: p.primary },
    secondary: { bg: p.surface, fg: p.primary, border: p.border },
    danger: { bg: p.surface, fg: p.danger, border: p.danger },
    ghost: { bg: 'transparent', fg: p.primary, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      android_ripple={{ color: p.primarySoft }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colors.bg, borderColor: colors.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={colors.fg} /> : icon ? <Icon name={icon} color={colors.fg} /> : null}
        <AppText variant="label" style={{ color: colors.fg, flexShrink: 1, textAlign: 'center' }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
