import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { LANGUAGES, type MessageKey } from '@/i18n';
import { useSettings } from '@/state/settings';
import { MIN_TOUCH, radius, spacing, usePalette } from '@/theme/theme';

const STEPS: { icon: IconName; title: MessageKey; body: MessageKey }[] = [
  { icon: 'search-circle-outline', title: 'onb.1.title', body: 'onb.1.body' },
  { icon: 'list-circle-outline', title: 'onb.2.title', body: 'onb.2.body' },
  { icon: 'hand-left-outline', title: 'onb.3.title', body: 'onb.3.body' },
  { icon: 'lock-closed-outline', title: 'onb.4.title', body: 'onb.4.body' },
];

export default function OnboardingScreen() {
  const { t, settings, update } = useSettings();
  const p = usePalette();
  const insets = useSafeAreaInsets();
  // step 0 = language, steps 1..4 = intro slides
  const [step, setStep] = useState(0);
  const last = step === STEPS.length;

  function finish() {
    update({ onboarded: true });
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background, paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <AppText variant="label" tone="primary">
          {t('app.name')}
        </AppText>
        {!last ? <Button label={t('common.skip')} variant="ghost" onPress={finish} /> : <View />}
      </View>

      <Screen>
        {step === 0 ? (
          <>
            <Icon name="language-outline" size={56} color={p.primary} />
            <AppText variant="title" accessibilityRole="header">
              {t('onb.language.title')}
            </AppText>
            <AppText tone="textMuted">{t('onb.language.body')}</AppText>
            <View style={styles.langs}>
              {LANGUAGES.map((l) => {
                const selected = settings.language === l.code;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => update({ language: l.code })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    accessibilityLabel={`${l.native} (${l.english})`}
                    style={[
                      styles.lang,
                      { borderColor: selected ? p.primary : p.border, backgroundColor: selected ? p.primarySoft : p.surface },
                    ]}
                  >
                    <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? p.primary : p.textMuted} />
                    <AppText variant="heading">{l.native}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Icon name={STEPS[step - 1].icon} size={64} color={p.primary} />
            <AppText variant="title" accessibilityRole="header">
              {t(STEPS[step - 1].title)}
            </AppText>
            <AppText variant="subheading" tone="textMuted">
              {t(STEPS[step - 1].body)}
            </AppText>
          </>
        )}
      </Screen>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[0, ...STEPS.map((_, i) => i + 1)].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === step ? p.primary : p.border }]}
            />
          ))}
        </View>
        {last ? (
          <Button label={t('onb.start')} onPress={finish} />
        ) : (
          <Button label={t('common.next')} onPress={() => setStep(step + 1)} />
        )}
        {step > 0 ? <Button label={t('common.back')} variant="ghost" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH,
  },
  langs: { gap: spacing.md, marginTop: spacing.md },
  lang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
