import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH, radius, spacing, usePalette } from '@/theme/theme';

import { AppText } from './app-text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const p = usePalette();
  return (
    <View style={[styles.row, { backgroundColor: p.surfaceAlt, borderColor: p.border }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[styles.item, selected && { backgroundColor: p.surface, borderColor: p.primary }]}
          >
            <AppText variant="label" tone={selected ? 'primary' : 'textMuted'} center>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, padding: 3, gap: 3 },
  item: {
    flex: 1,
    minHeight: MIN_TOUCH - 8,
    justifyContent: 'center',
    borderRadius: radius.md - 3,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },
});
