import { darkPalette, lightPalette, type Palette } from './theme';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [keyof Palette, keyof Palette][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceAlt'],
  ['text', 'primarySoft'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceAlt'],
  ['primary', 'background'],
  ['primary', 'surface'],
  ['primary', 'primarySoft'],
  ['onPrimary', 'primary'],
  ['danger', 'surface'],
  ['danger', 'background'],
];

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('%s palette meets WCAG AA (4.5:1) for text', (_name, palette) => {
  it.each(PAIRS)('%s on %s', (fg, bg) => {
    expect(contrast(palette[fg] as string, palette[bg] as string)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['low', 'caution', 'high', 'unable'] as const)('risk level "%s" text on its badge', (level) => {
    const c = palette.level[level];
    expect(contrast(c.fg, c.bg)).toBeGreaterThanOrEqual(4.5);
  });
});
