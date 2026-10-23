import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { usePalette } from '@/theme/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

/** Decorative icon. Screen readers skip it; the label next to it carries the meaning. */
export function Icon({ name, size = 22, color }: Props) {
  const palette = usePalette();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? palette.text}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
