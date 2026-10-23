import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { isLessonId, LESSONS } from '@/content/lessons';
import { toLines, type MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name={icon} size={20} color={p.primary} />
        <AppText variant="heading" accessibilityRole="header" style={styles.flex}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

function Bullets({ lines }: { lines: string[] }) {
  return (
    <View style={styles.bullets}>
      {lines.map((line, i) => (
        <View key={i} style={styles.bulletRow}>
          <AppText tone="primary" accessible={false} importantForAccessibility="no">
            •
          </AppText>
          <AppText style={styles.flex}>{line}</AppText>
        </View>
      ))}
    </View>
  );
}

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useSettings();
  const p = usePalette();

  if (!isLessonId(id)) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title={t('learn.title')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  const lesson = LESSONS.find((l) => l.id === id)!;
  const k = (suffix: string) => `lesson.${id}.${suffix}` as MessageKey;

  return (
    <Screen>
      <Stack.Screen options={{ title: t(k('title')) }} />
      <View style={styles.titleRow}>
        <Icon name={lesson.icon} size={32} color={p.primary} />
        <AppText variant="title" accessibilityRole="header" style={styles.flex}>
          {t(k('title'))}
        </AppText>
      </View>

      <Section icon="information-circle-outline" title={t('learn.section.how')}>
        <AppText>{t(k('how'))}</AppText>
      </Section>

      <Section icon="alert-circle-outline" title={t('learn.section.signs')}>
        <Bullets lines={toLines(t(k('signs')))} />
      </Section>

      <Section icon="checkmark-circle-outline" title={t('learn.section.do')}>
        <Bullets lines={toLines(t(k('do')))} />
      </Section>

      <Section icon="close-circle-outline" title={t('learn.section.never')}>
        <AppText>{t(k('never'))}</AppText>
      </Section>

      <Section icon="shield-outline" title={t('learn.section.verify')}>
        <AppText>{t(k('verify'))}</AppText>
      </Section>

      <Section icon="chatbubble-outline" title={t('learn.section.example')}>
        <Card style={{ backgroundColor: p.surfaceAlt, borderStyle: 'dashed', borderRadius: radius.md }}>
          <AppText selectable>{t(k('example'))}</AppText>
        </Card>
        <AppText variant="small" tone="textMuted">
          {t('learn.fictional')}
        </AppText>
      </Section>

      <Button label={t('learn.practice.cta')} icon="help-buoy-outline" onPress={() => router.push('/practice')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bullets: { gap: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
});
