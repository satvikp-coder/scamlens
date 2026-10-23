import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { LevelBadge } from '@/components/level-badge';
import { Screen } from '@/components/screen';
import { HOME_LESSONS, LESSONS } from '@/content/lessons';
import type { MessageKey } from '@/i18n';
import { useHistory } from '@/state/history';
import { useSettings } from '@/state/settings';
import { radius, spacing, usePalette } from '@/theme/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t, settings } = useSettings();
  const { entries } = useHistory();
  const p = usePalette();
  const recent = entries.slice(0, 3);

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title" accessibilityRole="header">
          {t('home.tagline')}
        </AppText>
        <View style={styles.privacyRow}>
          <Icon name="lock-closed-outline" size={18} color={p.primary} />
          <AppText variant="small" tone="textMuted" style={styles.flex}>
            {t('home.privacy')}
          </AppText>
        </View>
      </View>

      <Card
        onPress={() => router.push({ pathname: '/analyze', params: { mode: 'message' } })}
        accessibilityLabel={`${t('home.cta.message')}. ${t('home.cta.message.sub')}`}
        style={{ borderColor: p.primary, backgroundColor: p.primarySoft }}
      >
        <View style={styles.cta}>
          <Icon name="chatbubble-ellipses-outline" size={32} color={p.primary} />
          <View style={styles.flex}>
            <AppText variant="heading">{t('home.cta.message')}</AppText>
            <AppText tone="textMuted">{t('home.cta.message.sub')}</AppText>
          </View>
          <Icon name="chevron-forward" size={22} color={p.primary} />
        </View>
      </Card>

      <Card
        onPress={() => router.push({ pathname: '/analyze', params: { mode: 'url' } })}
        accessibilityLabel={`${t('home.cta.url')}. ${t('home.cta.url.sub')}`}
      >
        <View style={styles.cta}>
          <Icon name="link-outline" size={32} color={p.primary} />
          <View style={styles.flex}>
            <AppText variant="heading">{t('home.cta.url')}</AppText>
            <AppText tone="textMuted">{t('home.cta.url.sub')}</AppText>
          </View>
          <Icon name="chevron-forward" size={22} color={p.textMuted} />
        </View>
      </Card>

      <View style={styles.sectionHead}>
        <AppText variant="heading" accessibilityRole="header">
          {t('home.examples.title')}
        </AppText>
      </View>
      {HOME_LESSONS.map((id) => {
        const lesson = LESSONS.find((l) => l.id === id)!;
        return (
          <Card key={id} onPress={() => router.push(`/lesson/${id}`)}>
            <View style={styles.cta}>
              <Icon name={lesson.icon} size={26} color={p.primary} />
              <AppText variant="subheading" style={styles.flex}>
                {t(`lesson.${id}.title` as MessageKey)}
              </AppText>
              <Icon name="chevron-forward" size={20} color={p.textMuted} />
            </View>
          </Card>
        );
      })}
      <Button label={t('home.examples.all')} variant="ghost" onPress={() => router.push('/learn')} />

      <View style={styles.sectionHead}>
        <AppText variant="heading" accessibilityRole="header">
          {t('home.recent.title')}
        </AppText>
        {entries.length > 0 ? (
          <Button label={t('home.recent.see')} variant="ghost" onPress={() => router.push('/history')} />
        ) : null}
      </View>
      {recent.length > 0 ? (
        recent.map((e) => (
          <Card key={e.id} onPress={() => router.push({ pathname: '/result', params: { id: e.id } })}>
            <View style={styles.cta}>
              <View style={styles.flex}>
                <LevelBadge level={e.level} />
                <AppText variant="small" tone="textMuted" style={{ marginTop: spacing.xs }}>
                  {t(e.kind === 'url' ? 'history.kind.url' : 'history.kind.message')} ·{' '}
                  {new Date(e.createdAt).toLocaleDateString()}
                </AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={p.textMuted} />
            </View>
          </Card>
        ))
      ) : (
        <View style={[styles.empty, { borderColor: p.border }]}>
          <EmptyState
            icon={settings.historyEnabled ? 'time-outline' : 'eye-off-outline'}
            title={settings.historyEnabled ? t('home.recent.empty') : t('home.recent.off')}
            body={settings.historyEnabled ? t('home.recent.empty.sub') : undefined}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { gap: spacing.sm },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg },
});
