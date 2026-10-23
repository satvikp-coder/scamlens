import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import type { MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { spacing, usePalette } from '@/theme/theme';

const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export default function PrivacyScreen() {
  const { t } = useSettings();
  const p = usePalette();
  return (
    <Screen>
      {SECTIONS.map((s) => (
        <Card key={s}>
          <View style={styles.row}>
            <Icon name="shield-checkmark-outline" size={20} color={p.primary} />
            <AppText variant="subheading" accessibilityRole="header" style={styles.flex}>
              {t(`privacy.${s}.title` as MessageKey)}
            </AppText>
          </View>
          <AppText>{t(`privacy.${s}.body` as MessageKey)}</AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
