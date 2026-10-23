import React, { createContext, useContext, useMemo, useState } from 'react';

import type { AnalysisResult } from '@/engine';

/**
 * Holds the check the user has just run so the result screen can show it.
 * It lives only in memory: when the app closes, the text is gone unless the
 * user chose to save it in history.
 */
export interface CurrentCheck {
  result: AnalysisResult;
  /** The text that was checked (needed to quote evidence). */
  text: string;
  /** True when a summary of this check was saved to history. */
  saved: boolean;
}

interface Value {
  current: CurrentCheck | null;
  setCurrent: (c: CurrentCheck | null) => void;
}

const Ctx = createContext<Value | null>(null);

export function CurrentCheckProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<CurrentCheck | null>(null);
  const value = useMemo(() => ({ current, setCurrent }), [current]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentCheck(): Value {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrentCheck must be used inside CurrentCheckProvider');
  return ctx;
}
