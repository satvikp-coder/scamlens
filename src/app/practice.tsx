import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { PRACTICE } from '@/content/lessons';
import type { MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

export default function PracticeScreen() {
  const router = useRouter();
  const { t, settings, update } = useSettings();
  const p = usePalette();

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null); // user's guess: true = "scam"
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = PRACTICE.length;
  const item = PRACTICE[index];
  const k = (suffix: string) => `practice.${item.id}.${suffix}` as MessageKey;

  function choose(guessScam: boolean) {
    if (answer !== null) return;
    setAnswer(guessScam);
    if (guessScam === item.isScam) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= total) {
      const best = settings.practiceBest;
      if (!best || score / total > best.score / best.total) {
        update({ practiceBest: { score, total } });
      }
      setFinished(true);
    } else {
      setIndex(index + 1);
      setAnswer(null);
    }
  }

  function restart() {
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const best = settings.practiceBest;
    return (
      <Screen>
        <Card>
          <Icon name="ribbon-outline" size={36} color={p.primary} />
          <AppText variant="heading" accessibilityRole="header">
            {t('practice.score', { score, total })}
          </AppText>
          {best ? (
            <AppText tone="textMuted">{t('practice.best', { score: best.score, total: best.total })}</AppText>
          ) : null}
        </Card>
        <Button label={t('practice.again')} icon="refresh" onPress={restart} />
        <Button label={t('learn.title')} variant="secondary" onPress={() => router.back()} />
        <Button
          label={t('practice.reset')}
          variant="ghost"
          onPress={() => update({ practiceBest: null })}
          disabled={!best}
        />
        <AppText variant="small" tone="textMuted">
          {t('practice.note')}
        </AppText>
      </Screen>
    );
  }

  const correct = answer !== null && answer === item.isScam;

  return (
    <Screen>
      <AppText tone="textMuted" accessibilityLiveRegion="polite">
        {t('practice.progress', { current: index + 1, total })}
      </AppText>
      <AppText variant="small" tone="textMuted">
        {t('practice.intro')}
      </AppText>

      <Card style={{ backgroundColor: p.surfaceAlt, borderRadius: radius.md }}>
        <AppText selectable variant="subheading">
          {t(k('text'))}
        </AppText>
      </Card>

      {answer === null ? (
        <View style={styles.choices}>
          <Button label={t('practice.scam')} icon="warning-outline" variant="secondary" onPress={() => choose(true)} />
          <Button label={t('practice.ok')} icon="checkmark-circle-outline" variant="secondary" onPress={() => choose(false)} />
        </View>
      ) : (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <Card style={{ borderColor: correct ? p.level.low.border : p.level.caution.border }}>
            <View style={styles.row}>
              <Icon name={correct ? 'checkmark-circle' : 'close-circle'} size={24} color={correct ? p.level.low.fg : p.level.high.fg} />
              <AppText variant="subheading">{correct ? t('practice.correct') : t('practice.incorrect')}</AppText>
            </View>
            <AppText variant="label">{item.isScam ? t('practice.verdict.scam') : t('practice.verdict.ok')}</AppText>
            <AppText>{t(k('why'))}</AppText>
          </Card>
          <Button label={index + 1 >= total ? t('practice.finish') : t('practice.next')} onPress={next} />
        </View>
      )}
      <AppText variant="small" tone="textMuted">
        {t('learn.fictional')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choices: { gap: spacing.md },
  feedback: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
