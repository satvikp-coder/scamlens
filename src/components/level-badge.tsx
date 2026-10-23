import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { RiskLevel } from '@/engine';
import type { MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

/**
 * Each level has its own icon shape AND its own words, so the meaning never
 * depends on colour alone. The "low" icon is a plain outline shield on
 * purpose: it must not look like a stamp of approval.
 */
export const LEVEL_ICON: Record<RiskLevel, IconName> = {
  low: 'shield-outline',
  caution: 'alert-circle',
  high: 'warning',
  unable: 'help-circle',
};

export const LEVEL_LABEL: Record<RiskLevel, MessageKey> = {
  low: 'result.level.low',
  caution: 'result.level.caution',
  high: 'result.level.high',
  unable: 'result.level.unable',
};

export function LevelBadge({ level, large }: { level: RiskLevel; large?: boolean }) {
  const p = usePalette();
  const { t } = useSettings();
  const c = p.level[level];
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t(LEVEL_LABEL[level])}
      style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, large && styles.large]}
    >
      <Icon name={LEVEL_ICON[level]} size={large ? 30 : 20} color={c.fg} />
      <AppText variant={large ? 'heading' : 'label'} style={{ color: c.fg, flexShrink: 1 }}>
        {t(LEVEL_LABEL[level])}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  large: { borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignSelf: 'stretch' },
});
