import { useColorScheme } from 'react-native';

import type { RiskLevel } from '@/engine';

/**
 * Design tokens. Colours are never the only signal: every risk level also has
 * its own icon and word. Contrast ratios were chosen to meet WCAG AA (4.5:1)
 * for body text on the surface colours.
 */
export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  danger: string;
  focus: string;
  level: Record<RiskLevel, { bg: string; fg: string; border: string }>;
}

export const lightPalette: Palette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF0F6',
  border: '#C9D3DF',
  text: '#14202E',
  textMuted: '#4A5A6C',
  primary: '#0B5CAD',
  onPrimary: '#FFFFFF',
  primarySoft: '#DCEAF8',
  danger: '#B3261E',
  focus: '#0B5CAD',
  level: {
    low: { bg: '#E3F4E8', fg: '#13522B', border: '#7BBF92' },
    caution: { bg: '#FFF1D6', fg: '#6B4300', border: '#E0B04F' },
    high: { bg: '#FCE3E0', fg: '#8A1A12', border: '#E08A83' },
    unable: { bg: '#E7EBF0', fg: '#2E3C4D', border: '#A9B5C3' },
  },
};

export const darkPalette: Palette = {
  background: '#0E141B',
  surface: '#17202A',
  surfaceAlt: '#1F2B38',
  border: '#33414F',
  text: '#EDF2F7',
  textMuted: '#A9B8C8',
  primary: '#7DB8F5',
  onPrimary: '#06223F',
  primarySoft: '#16314D',
  danger: '#FFB4AB',
  focus: '#7DB8F5',
  level: {
    low: { bg: '#143323', fg: '#A8E3BC', border: '#2F6B49' },
    caution: { bg: '#3A2B0B', fg: '#FFD98A', border: '#8A6A1F' },
    high: { bg: '#431A17', fg: '#FFB4AB', border: '#8F3A33' },
    unable: { bg: '#232E3A', fg: '#C8D3DF', border: '#44525F' },
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const typography = {
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700' as const },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  subheading: { fontSize: 17, lineHeight: 25, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
};

export const MIN_TOUCH = 48;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}
