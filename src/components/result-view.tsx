import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import type { AnalysisResult } from '@/engine';
import {
  describeAction,
  describeLimitation,
  describeNote,
  shareSummary,
  summaryText,
} from '@/presentation/describe';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Card } from './card';
import { FindingCard } from './finding-card';
import { Icon } from './icon';
import { LevelBadge } from './level-badge';

interface Props {
  result: AnalysisResult;
  /** Shown above everything, e.g. "Saved to your history". */
  banner?: string;
  /** True when this is a saved entry without its original text. */
  compact?: boolean;
  onCheckAnother: () => void;
}

export function ResultView({ result, banner, compact, onCheckAnother }: Props) {
  const { t } = useSettings();
  const p = usePalette();
  const [copied, setCopied] = useState(false);

  const summary = summaryText(t, result);

  async function copy() {
    try {
      await Clipboard.setStringAsync(shareSummary(t, result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail on some devices; the Share button still works.
    }
  }

  async function share() {
    try {
      await Share.share({ message: shareSummary(t, result) });
    } catch {
      // The user cancelled or no share target is available.
    }
  }

  return (
    <View style={styles.wrap}>
      {banner ? (
        <View style={[styles.banner, { backgroundColor: p.primarySoft }]}>
          <Icon name="information-circle-outline" size={18} color={p.primary} />
          <AppText variant="small" style={styles.flex}>
            {banner}
          </AppText>
        </View>
      ) : null}

      <LevelBadge level={result.level} large />
      <AppText variant="subheading" accessibilityLiveRegion="polite">
        {summary}
      </AppText>

      {result.hosts.length > 0 ? (
        <Card>
          <AppText variant="small" tone="textMuted">
            {t('result.hosts')}
          </AppText>
          {result.hosts.map((h) => (
            <AppText key={h} selectable style={styles.mono}>
              {h}
            </AppText>
          ))}
        </Card>
      ) : null}

      <AppText variant="heading" accessibilityRole="header">
        {t('result.found')}
      </AppText>
      {result.findings.length === 0 ? (
        <AppText tone="textMuted">{t('result.found.none')}</AppText>
      ) : (
        result.findings.map((f) => <FindingCard key={f.id} finding={f} />)
      )}
      {compact && result.findings.length > 0 ? (
        <AppText variant="small" tone="textMuted">
          {t('history.compact')}
        </AppText>
      ) : null}

      {result.notes.length > 0 ? (
        <>
          <AppText variant="heading" accessibilityRole="header">
            {t('result.notes')}
          </AppText>
          {result.notes.map((n) => {
            const d = describeNote(t, n);
            return (
              <Card key={n.id + JSON.stringify(n.params)}>
                <AppText variant="subheading">{d.title}</AppText>
                <AppText tone="textMuted">{d.why}</AppText>
              </Card>
            );
          })}
        </>
      ) : null}

      <AppText variant="heading" accessibilityRole="header">
        {t('result.actions')}
      </AppText>
      <Card>
        {result.actions.map((a) => (
          <View key={a} style={styles.actionRow}>
            <Icon name="chevron-forward-circle-outline" size={20} color={p.primary} />
            <AppText style={styles.flex}>{describeAction(t, a)}</AppText>
          </View>
        ))}
      </Card>

      <AppText variant="heading" accessibilityRole="header">
        {t('result.limits')}
      </AppText>
      <Card>
        {result.limitations.map((l) => (
          <AppText key={l} variant="small" tone="textMuted">
            {describeLimitation(t, l)}
          </AppText>
        ))}
        <AppText variant="small" tone="textMuted" style={styles.disclaimer}>
          {t('result.disclaimer')}
        </AppText>
      </Card>

      <View style={styles.buttons}>
        <Button
          label={copied ? t('common.copied') : t('result.copy')}
          icon={copied ? 'checkmark' : 'copy-outline'}
          variant="secondary"
          onPress={copy}
        />
        <Button label={t('result.share')} icon="share-outline" variant="secondary" onPress={share} />
        <Button label={t('result.another')} icon="refresh" onPress={onCheckAnother} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  flex: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  mono: { fontSize: 15, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  disclaimer: { marginTop: spacing.sm },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
