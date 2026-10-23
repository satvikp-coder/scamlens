import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Finding, Severity } from '@/engine';
import { describeFinding, severityLabel } from '@/presentation/describe';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

import { AppText } from './app-text';
import { Card } from './card';
import { Icon, type IconName } from './icon';

// Severity is shown as text plus a different number of marks, not by colour.
const SEVERITY_ICON: Record<Severity, IconName> = {
  weak: 'ellipse-outline',
  moderate: 'contrast-outline',
  strong: 'ellipse',
};

export function FindingCard({ finding }: { finding: Finding }) {
  const { t } = useSettings();
  const p = usePalette();
  const { title, why } = describeFinding(t, finding);
  const sev = severityLabel(t, finding.severity);

  return (
    <Card>
      <View style={styles.head}>
        <Icon name={SEVERITY_ICON[finding.severity]} size={18} color={p.textMuted} />
        <AppText variant="label" tone="textMuted">
          {sev}
        </AppText>
      </View>
      <AppText variant="subheading" accessibilityRole="header">
        {title}
      </AppText>

      {finding.evidence.length > 0 ? (
        <View style={styles.evidenceBlock}>
          <AppText variant="small" tone="textMuted">
            {t('result.inYourText')}
          </AppText>
          {finding.evidence.map((e, i) => (
            <View key={`${e.start}-${i}`} style={[styles.quote, { backgroundColor: p.surfaceAlt, borderColor: p.primary }]}>
              {/* selectable lets people copy; quotes are the user's own text */}
              <AppText selectable style={styles.mono}>
                {e.text}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppText variant="small" tone="textMuted">
        {t('result.why')}
      </AppText>
      <AppText>{why}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  evidenceBlock: { gap: spacing.xs },
  quote: { borderLeftWidth: 4, borderRadius: radius.sm, padding: spacing.sm },
  mono: { fontSize: 15, lineHeight: 22 },
});
