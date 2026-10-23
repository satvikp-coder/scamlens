import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ResultView } from '@/components/result-view';
import { Screen } from '@/components/screen';
import { analyzeMessage, analyzeUrl, type AnalysisResult } from '@/engine';
import { useCurrentCheck } from '@/state/current-check';
import { useHistory } from '@/state/history';
import { useSettings } from '@/state/settings';

export default function ResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useSettings();
  const { entries } = useHistory();
  const { current, setCurrent } = useCurrentCheck();

  const entry = id ? entries.find((e) => e.id === id) : undefined;

  const view = useMemo<{ result: AnalysisResult; compact: boolean; saved: boolean } | null>(() => {
    if (id) {
      if (!entry) return null;
      // If the user chose to save the original text, check it again so the
      // exact quotes can be shown. Otherwise show the compact saved summary.
      if (entry.text) {
        const result = entry.kind === 'url' ? analyzeUrl(entry.text) : analyzeMessage(entry.text);
        return { result, compact: false, saved: false };
      }
      return { result: entry.result, compact: true, saved: false };
    }
    if (current) return { result: current.result, compact: false, saved: current.saved };
    return null;
  }, [id, entry, current]);

  if (!view) {
    return (
      <Screen>
        <EmptyState
          icon="help-circle-outline"
          title={t('history.empty')}
          actionLabel={t('result.another')}
          onAction={() => router.replace('/analyze')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ResultView
        result={view.result}
        compact={view.compact}
        banner={view.saved ? t('result.saved') : undefined}
        onCheckAnother={() => {
          const kind = view.result.kind;
          if (!id) setCurrent(null);
          if (router.canGoBack() && !id) router.back();
          else router.replace({ pathname: '/analyze', params: { mode: kind } });
        }}
      />
    </Screen>
  );
}
