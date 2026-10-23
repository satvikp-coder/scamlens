import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { LANGUAGES } from '@/i18n';
import { useHistory } from '@/state/history';
import { useSettings } from '@/state/settings';
import { MIN_TOUCH, spacing, usePalette } from '@/theme/theme';

function SwitchRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const p = usePalette();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <AppText variant="subheading">{label}</AppText>
        <AppText variant="small" tone="textMuted">
          {description}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: p.border, true: p.primary }}
        thumbColor={p.surface}
      />
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: 'shield-checkmark-outline' | 'information-circle-outline'; label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.linkRow}>
      <Icon name={icon} size={22} color={p.primary} />
      <AppText variant="subheading" style={styles.flex}>
        {label}
      </AppText>
      <Icon name="chevron-forward" size={20} color={p.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, settings, update, storageProblem } = useSettings();
  const { clear, entries } = useHistory();
  const p = usePalette();
  const version = Constants.expoConfig?.version ?? '0.0.0';

  function confirmClear() {
    Alert.alert(t('history.clear.title'), t('history.clear.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void clear().then((ok) => {
            if (ok) Alert.alert(t('history.cleared'));
          });
        },
      },
    ]);
  }

  return (
    <Screen>
      {storageProblem ? (
        <Card style={{ borderColor: p.danger }}>
          <AppText tone="danger">{t('history.error.save')}</AppText>
        </Card>
      ) : null}

      <AppText variant="heading" accessibilityRole="header">
        {t('settings.language')}
      </AppText>
      <Card>
        {LANGUAGES.map((l) => {
          const selected = settings.language === l.code;
          return (
            <Pressable
              key={l.code}
              onPress={() => update({ language: l.code })}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={`${l.native} (${l.english})`}
              style={styles.langRow}
            >
              <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? p.primary : p.textMuted} />
              <AppText variant="subheading">{l.native}</AppText>
            </Pressable>
          );
        })}
      </Card>

      <AppText variant="heading" accessibilityRole="header">
        {t('settings.history.title')}
      </AppText>
      <Card>
        <SwitchRow
          label={t('settings.history.enabled')}
          description={t('settings.history.enabled.desc')}
          value={settings.historyEnabled}
          onChange={(v) => update({ historyEnabled: v, saveText: v ? settings.saveText : false })}
        />
        <SwitchRow
          label={t('settings.history.saveText')}
          description={t('settings.history.saveText.desc')}
          value={settings.saveText}
          disabled={!settings.historyEnabled}
          onChange={(v) => update({ saveText: v })}
        />
        <AppText variant="small" tone="textMuted">
          {t('settings.history.explain')}
        </AppText>
        <Button
          label={t('settings.history.clear')}
          icon="trash-outline"
          variant="danger"
          disabled={entries.length === 0}
          onPress={confirmClear}
        />
      </Card>

      <AppText variant="heading" accessibilityRole="header">
        {t('settings.about.title')}
      </AppText>
      <Card>
        <LinkRow icon="shield-checkmark-outline" label={t('settings.privacy')} onPress={() => router.push('/privacy')} />
        <LinkRow icon="information-circle-outline" label={t('settings.about')} onPress={() => router.push('/about')} />
        <AppText variant="small" tone="textMuted">
          {t('settings.version', { version })}
        </AppText>
        <AppText variant="small" tone="textMuted">
          {t('settings.disclaimer')}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH },
});
