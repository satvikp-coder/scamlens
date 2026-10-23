import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { AnalysisResult, InputKind, RiskLevel } from '@/engine';
import { readJson, removeKey, writeJson } from '@/storage/storage';

import { useSettings } from './settings';

const HISTORY_KEY = 'scamlens.history.v1';
export const MAX_HISTORY = 100;

/**
 * A saved check. By default `result` is "compact": the evidence quotes and
 * website names are removed, so nothing the user typed is kept. `text` is
 * present only when the user explicitly chose to save original text.
 */
export interface HistoryEntry {
  id: string;
  createdAt: number;
  kind: InputKind;
  level: RiskLevel;
  result: AnalysisResult;
  text?: string;
}

export function compactResult(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    findings: result.findings.map((f) => {
      // Keep the small parameters needed to word the explanation (such as the
      // look-alike domain) but drop anything that could be a secret: a link's
      // "user:password@" part must never be stored.
      const params = f.params ? { ...f.params } : undefined;
      if (params) delete params.userinfo;
      return { ...f, evidence: [], params };
    }),
    hosts: [],
  };
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isEntry(x: unknown): x is HistoryEntry {
  if (!x || typeof x !== 'object') return false;
  const e = x as HistoryEntry;
  return (
    typeof e.id === 'string' &&
    typeof e.createdAt === 'number' &&
    (e.kind === 'message' || e.kind === 'url') &&
    typeof e.level === 'string' &&
    !!e.result &&
    Array.isArray(e.result.findings)
  );
}

interface HistoryContextValue {
  entries: HistoryEntry[];
  loaded: boolean;
  /** Last storage failure to show, or null. */
  error: 'load' | 'save' | 'delete' | null;
  add: (result: AnalysisResult, text: string) => Promise<HistoryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  dismissError: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { settings, ready } = useSettings();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  // Always the latest list, so two quick changes cannot overwrite each other.
  const latest = useRef<HistoryEntry[]>([]);
  const commit = useCallback((next: HistoryEntry[]) => {
    latest.current = next;
    setEntries(next);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<HistoryContextValue['error']>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await readJson<unknown[]>(HISTORY_KEY);
        if (!cancelled && Array.isArray(saved)) commit(saved.filter(isEntry));
      } catch {
        if (!cancelled) setError('load');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, commit]);

  const persist = useCallback(async (next: HistoryEntry[]) => {
    if (next.length === 0) await removeKey(HISTORY_KEY);
    else await writeJson(HISTORY_KEY, next);
  }, []);

  const add = useCallback(
    async (result: AnalysisResult, text: string) => {
      if (!settings.historyEnabled) return null;
      const entry: HistoryEntry = {
        id: newId(),
        createdAt: Date.now(),
        kind: result.kind,
        level: result.level,
        result: compactResult(result),
        text: settings.saveText ? text : undefined,
      };
      const next = [entry, ...latest.current].slice(0, MAX_HISTORY);
      try {
        await persist(next);
        commit(next);
        return entry;
      } catch {
        setError('save');
        return null;
      }
    },
    [commit, persist, settings.historyEnabled, settings.saveText],
  );

  const remove = useCallback(
    async (id: string) => {
      const next = latest.current.filter((e) => e.id !== id);
      try {
        await persist(next);
        commit(next);
        return true;
      } catch {
        setError('delete');
        return false;
      }
    },
    [commit, persist],
  );

  const clear = useCallback(async () => {
    try {
      await removeKey(HISTORY_KEY);
      commit([]);
      return true;
    } catch {
      setError('delete');
      return false;
    }
  }, [commit]);

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ entries, loaded, error, add, remove, clear, dismissError }),
    [entries, loaded, error, add, remove, clear, dismissError],
  );
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used inside HistoryProvider');
  return ctx;
}
