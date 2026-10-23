import { LESSONS, PRACTICE } from '@/content/lessons';
import { analyzeMessage, analyzeUrl, MESSAGE_FINDING_IDS, URL_FINDING_IDS } from '@/engine';
import { describeFinding, shareSummary, summaryText } from '@/presentation/describe';

import { DICTIONARIES, interpolate, toLines, translate, type Language, type MessageKey } from './index';
import { en } from './en';

const LANGS: Language[] = ['hi', 'gu'];
const keys = Object.keys(en) as MessageKey[];

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('translations', () => {
  it.each(LANGS)('%s has every key and no empty strings', (lang) => {
    const dict = DICTIONARIES[lang];
    expect(Object.keys(dict).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(dict[k].trim().length).toBeGreaterThan(0);
  });

  it.each(LANGS)('%s keeps the same {placeholders} as English', (lang) => {
    const bad = keys.filter((k) => placeholders(DICTIONARIES[lang][k]).join() !== placeholders(en[k]).join());
    expect(bad).toEqual([]);
  });

  it.each(LANGS)('%s keeps the same number of bullet lines as English', (lang) => {
    const bad = keys.filter((k) => toLines(DICTIONARIES[lang][k]).length !== toLines(en[k]).length);
    expect(bad).toEqual([]);
  });

  it('actually uses Devanagari for Hindi and Gujarati script for Gujarati', () => {
    const devanagari = /[ऀ-ॿ]/;
    const gujarati = /[઀-૿]/;
    const translatable = keys.filter((k) => /[A-Za-z]{4,}/.test(en[k]) && k !== 'app.name');
    // Allow a few strings that are mostly brand names / URLs to stay Latin.
    const notHindi = translatable.filter((k) => !devanagari.test(DICTIONARIES.hi[k]));
    const notGujarati = translatable.filter((k) => !gujarati.test(DICTIONARIES.gu[k]));
    expect(notHindi.length).toBeLessThan(5);
    expect(notGujarati.length).toBeLessThan(5);
  });

  it('does not leave hedged phrases out of the risk labels', () => {
    for (const lang of ['en', ...LANGS] as Language[]) {
      const levels = (['low', 'caution', 'high', 'unable'] as const).map((l) => translate(lang, `result.level.${l}` as MessageKey));
      expect(new Set(levels).size).toBe(4);
    }
  });

  it('has a title and explanation for every finding id the engine can produce', () => {
    for (const id of [...MESSAGE_FINDING_IDS, ...URL_FINDING_IDS]) {
      for (const suffix of ['title', 'why']) {
        expect(keys).toContain(`finding.${id}.${suffix}`);
      }
    }
  });

  it('has text for every lesson and practice scenario', () => {
    for (const l of LESSONS) {
      for (const s of ['title', 'how', 'signs', 'do', 'never', 'verify', 'example']) {
        expect(keys).toContain(`lesson.${l.id}.${s}`);
      }
    }
    for (const p of PRACTICE) {
      expect(keys).toContain(`practice.${p.id}.text`);
      expect(keys).toContain(`practice.${p.id}.why`);
    }
  });
});

describe('interpolate', () => {
  it('replaces known placeholders and leaves unknown ones visible', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});

describe('result presentation (input -> engine -> localized text)', () => {
  const sample = 'Dear customer, your SBI account will be blocked today. Share the OTP 482913 you received to verify your KYC.';

  it.each(['en', 'hi', 'gu'] as Language[])('renders a high-risk message in %s without leftover placeholders', (lang) => {
    const t = (k: MessageKey, p?: Record<string, string | number>) => translate(lang, k, p);
    const r = analyzeMessage(sample);
    expect(r.level).toBe('high');
    const text = shareSummary(t, r);
    expect(text).not.toMatch(/\{\w+\}/);
    expect(text).toContain(translate(lang, 'result.level.high'));
    // the private message text is never in the share summary
    expect(text).not.toContain('482913');
    for (const f of r.findings) {
      const d = describeFinding(t, f);
      expect(d.title).not.toMatch(/\{\w+\}/);
      expect(d.why).not.toMatch(/\{\w+\}/);
    }
  });

  it('fills in link details such as the brand and domain', () => {
    const r = analyzeUrl('https://hdfcbank-secure-login.com/kyc');
    const f = r.findings.find((x) => x.id === 'url.lookalike_brand')!;
    const d = describeFinding((k, p) => translate('en', k, p), f);
    expect(d.title).toContain('HDFC Bank');
    expect(d.why).toContain('hdfcbank-secure-login.com');
  });

  it('explains why a malformed link could not be examined', () => {
    const r = analyzeUrl('http://exa mple.com');
    expect(r.level).toBe('unable');
    expect(summaryText((k, p) => translate('en', k, p), r)).toMatch(/spaces/i);
  });
});
