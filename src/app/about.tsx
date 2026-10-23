import Constants from 'expo-constants';
import React from 'react';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/config';
import { useSettings } from '@/state/settings';

export default function AboutScreen() {
  const { t } = useSettings();
  const version = Constants.expoConfig?.version ?? '0.0.0';
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t('app.name')}
      </AppText>
      <AppText tone="textMuted">{t('settings.version', { version })}</AppText>
      <AppText>{t('about.body')}</AppText>

      <Card>
        <AppText variant="subheading" accessibilityRole="header">
          {t('about.limits.title')}
        </AppText>
        <AppText>{t('about.limits.body')}</AppText>
      </Card>

      <Card>
        <AppText variant="subheading" accessibilityRole="header">
          {t('about.contact.title')}
        </AppText>
        {SUPPORT_EMAIL || PRIVACY_POLICY_URL ? (
          <>
            {SUPPORT_EMAIL ? <AppText selectable>{SUPPORT_EMAIL}</AppText> : null}
            {PRIVACY_POLICY_URL ? <AppText selectable>{PRIVACY_POLICY_URL}</AppText> : null}
          </>
        ) : (
          <AppText tone="textMuted">{t('about.contact.none')}</AppText>
        )}
      </Card>

      <Card>
        <AppText variant="subheading" accessibilityRole="header">
          {t('about.licenses')}
        </AppText>
        <AppText tone="textMuted">{t('about.licenses.body')}</AppText>
      </Card>

      <AppText variant="small" tone="textMuted">
        {t('settings.disclaimer')}
      </AppText>
    </Screen>
  );
}
