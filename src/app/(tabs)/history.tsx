import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { LevelBadge } from '@/components/level-badge';
import { Screen } from '@/components/screen';
import { useHistory, type HistoryEntry } from '@/state/history';
import { useSettings } from '@/state/settings';
import { MIN_TOUCH, spacing, usePalette } from '@/theme/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { t, settings } = useSettings();
  const { entries, error, remove, clear, dismissError } = useHistory();
  const p = usePalette();

  function confirmDelete(entry: HistoryEntry) {
    Alert.alert(t('history.delete.title'), t('history.delete.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove(entry.id) },
    ]);
  }

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

  function signsText(entry: HistoryEntry): string {
    const n = entry.result.findings.length;
    if (n === 0) return t('history.signs.none');
    if (n === 1) return t('history.signs.one');
    return t('history.signs', { count: n });
  }

  return (
    <Screen>
      {error ? (
        <Card style={{ borderColor: p.danger }}>
          <AppText tone="danger" accessibilityLiveRegion="polite">
            {t(error === 'load' ? 'history.error.load' : error === 'save' ? 'history.error.save' : 'history.error.delete')}
          </AppText>
          <Button label={t('common.ok')} variant="secondary" onPress={dismissError} />
        </Card>
      ) : null}

      {!settings.historyEnabled ? (
        <Card>
          <View style={styles.row}>
            <Icon name="eye-off-outline" size={22} color={p.primary} />
            <View style={styles.flex}>
              <AppText variant="subheading">{t('history.disabled')}</AppText>
              <AppText variant="small" tone="textMuted">
                {t('history.disabled.sub')}
              </AppText>
            </View>
          </View>
          <Button label={t('history.goSettings')} variant="secondary" onPress={() => router.push('/settings')} />
        </Card>
      ) : null}

      {entries.length === 0 ? (
        settings.historyEnabled ? (
          <EmptyState icon="time-outline" title={t('history.empty')} body={t('history.empty.sub')} />
        ) : null
      ) : (
        <>
          {entries.map((e) => (
            <Card key={e.id}>
              <Pressable
                onPress={() => router.push({ pathname: '/result', params: { id: e.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${t(e.kind === 'url' ? 'history.kind.url' : 'history.kind.message')}, ${t(
                  `result.level.${e.level}` as 'result.level.low',
                )}, ${new Date(e.createdAt).toLocaleString()}`}
                style={styles.pressArea}
              >
                <LevelBadge level={e.level} />
                <AppText variant="small" tone="textMuted">
                  {t(e.kind === 'url' ? 'history.kind.url' : 'history.kind.message')} · {signsText(e)}
                </AppText>
                <AppText variant="small" tone="textMuted">
                  {new Date(e.createdAt).toLocaleString()} · {e.text ? t('history.textSaved') : t('history.textNotSaved')}
                </AppText>
              </Pressable>
              <Button
                label={t('history.delete')}
                icon="trash-outline"
                variant="ghost"
                onPress={() => confirmDelete(e)}
              />
            </Card>
          ))}
          <Button label={t('history.clear')} icon="trash" variant="danger" onPress={confirmClear} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  pressArea: { minHeight: MIN_TOUCH, gap: spacing.xs },
});
