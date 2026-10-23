import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { LESSONS } from '@/content/lessons';
import type { MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { spacing, usePalette } from '@/theme/theme';

export default function LearnScreen() {
  const router = useRouter();
  const { t } = useSettings();
  const p = usePalette();
  return (
    <Screen>
      <AppText tone="textMuted">{t('learn.intro')}</AppText>

      <Card
        onPress={() => router.push('/practice')}
        style={{ borderColor: p.primary, backgroundColor: p.primarySoft }}
        accessibilityLabel={`${t('learn.practice.cta')}. ${t('learn.practice.sub')}`}
      >
        <View style={styles.row}>
          <Icon name="help-buoy-outline" size={30} color={p.primary} />
          <View style={styles.flex}>
            <AppText variant="subheading">{t('learn.practice.cta')}</AppText>
            <AppText variant="small" tone="textMuted">
              {t('learn.practice.sub')}
            </AppText>
          </View>
          <Icon name="chevron-forward" size={20} color={p.primary} />
        </View>
      </Card>

      {LESSONS.map((l) => (
        <Card key={l.id} onPress={() => router.push(`/lesson/${l.id}`)}>
          <View style={styles.row}>
            <Icon name={l.icon} size={26} color={p.primary} />
            <AppText variant="subheading" style={styles.flex}>
              {t(`lesson.${l.id}.title` as MessageKey)}
            </AppText>
            <Icon name="chevron-forward" size={20} color={p.textMuted} />
          </View>
        </Card>
      ))}

      <AppText variant="small" tone="textMuted">
        {t('learn.fictional')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
