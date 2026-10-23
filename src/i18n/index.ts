import { en, type MessageKey } from './en';
import { gu } from './gu';
import { hi } from './hi';

export type { MessageKey };
export type Language = 'en' | 'hi' | 'gu';

export const LANGUAGES: { code: Language; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
];

export const DICTIONARIES: Record<Language, Record<MessageKey, string>> = { en, hi, gu };

export type Params = Record<string, string | number>;

/** Replace {name} placeholders. Unknown placeholders are left visible. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

export function translate(language: Language, key: MessageKey, params?: Params): string {
  const text = DICTIONARIES[language][key] ?? en[key] ?? key;
  return interpolate(text, params);
}

/** Split a multi-line string (bullet list) into its lines. */
export function toLines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** Pick a starting language from the phone's locale, defaulting to English. */
export function guessLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('hi')) return 'hi';
    if (locale.startsWith('gu')) return 'gu';
  } catch {
    // Intl may be unavailable; English is a safe default.
  }
  return 'en';
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'hi' || value === 'gu';
}
