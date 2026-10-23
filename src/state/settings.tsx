import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { guessLanguage, isLanguage, translate, type Language, type MessageKey, type Params } from '@/i18n';
import { readJson, writeJson } from '@/storage/storage';

const SETTINGS_KEY = 'scamlens.settings.v1';

export interface PracticeBest {
  score: number;
  total: number;
}

export interface Settings {
  language: Language;
  onboarded: boolean;
  /** Save a compact summary of each check. */
  historyEnabled: boolean;
  /** Also save the original text (off unless the user turns it on). */
  saveText: boolean;
  practiceBest: PracticeBest | null;
}

function defaults(): Settings {
  return {
    language: guessLanguage(),
    onboarded: false,
    historyEnabled: true,
    saveText: false,
    practiceBest: null,
  };
}

interface SettingsContextValue {
  settings: Settings;
  /** False until saved settings have been read from the phone. */
  ready: boolean;
  /** True when saving or loading settings failed (shown to the user). */
  storageProblem: boolean;
  update: (patch: Partial<Settings>) => void;
  t: (key: MessageKey, params?: Params) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(raw: unknown): Partial<Settings> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Settings> = {};
  if (isLanguage(r.language)) out.language = r.language;
  if (typeof r.onboarded === 'boolean') out.onboarded = r.onboarded;
  if (typeof r.historyEnabled === 'boolean') out.historyEnabled = r.historyEnabled;
  if (typeof r.saveText === 'boolean') out.saveText = r.saveText;
  const best = r.practiceBest as Record<string, unknown> | null | undefined;
  if (best && typeof best.score === 'number' && typeof best.total === 'number') {
    out.practiceBest = { score: best.score, total: best.total };
  }
  return out;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [ready, setReady] = useState(false);
  const [storageProblem, setStorageProblem] = useState(false);
  const latest = useRef(settings);
  useEffect(() => {
    latest.current = settings;
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await readJson<unknown>(SETTINGS_KEY);
        if (!cancelled && saved) setSettings((s) => ({ ...s, ...sanitize(saved) }));
      } catch {
        if (!cancelled) setStorageProblem(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    writeJson(SETTINGS_KEY, next).then(
      () => setStorageProblem(false),
      () => setStorageProblem(true),
    );
  }, []);

  const language = settings.language;
  const t = useCallback((key: MessageKey, params?: Params) => translate(language, key, params), [language]);

  const value = useMemo(
    () => ({ settings, ready, storageProblem, update, t }),
    [settings, ready, storageProblem, update, t],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
