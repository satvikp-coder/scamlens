import React from 'react';
import { StyleSheet, View } from 'react-native';

import { translate, type Language } from '@/i18n';
import { lightPalette, spacing } from '@/theme/theme';

import { AppText } from './app-text';
import { Button } from './button';

interface Props {
  children: React.ReactNode;
  language?: Language;
}

interface State {
  failed: boolean;
}

/**
 * Last line of defence: if a screen throws while rendering we show a calm
 * message instead of a blank crash. We deliberately do NOT log the error
 * details, because they could contain text the user pasted.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const lang = this.props.language ?? 'en';
    return (
      <View style={styles.wrap}>
        <AppText variant="heading" center accessibilityRole="header">
          {translate(lang, 'error.boundary.title')}
        </AppText>
        <AppText center tone="textMuted">
          {translate(lang, 'error.boundary.body')}
        </AppText>
        <Button label={translate(lang, 'common.retry')} onPress={() => this.setState({ failed: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: lightPalette.background,
  },
});
