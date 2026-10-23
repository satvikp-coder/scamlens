import React from 'react';
import { Text, type TextProps } from 'react-native';

import { typography, usePalette, type Palette } from '@/theme/theme';

type Variant = keyof typeof typography;
type Tone = 'text' | 'textMuted' | 'primary' | 'danger' | 'onPrimary';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'text', center, style, ...rest }: Props) {
  const palette: Palette = usePalette();
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: palette[tone] }, center && { textAlign: 'center' }, style]}
    />
  );
}
