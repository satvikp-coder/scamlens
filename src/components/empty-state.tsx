import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Icon, type IconName } from './icon';

interface Props {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={40} />
      <AppText variant="subheading" center accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText tone="textMuted" center>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
});
