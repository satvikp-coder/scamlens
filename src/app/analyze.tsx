
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { analyzeMessage, analyzeUrl, extractUrls, MAX_MESSAGE_CHARS, MAX_URL_CHARS } from '@/engine';
import { useCurrentCheck } from '@/state/current-check';
import { useHistory } from '@/state/history';
import { useSettings } from '@/state/settings';
import { MIN_TOUCH, radius, spacing, usePalette } from '@/theme/theme';

type Mode = 'message' | 'url';

export default function AnalyzeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { t } = useSettings();
  const p = usePalette();
  const { add } = useHistory();
  const { current, setCurrent } = useCurrentCheck();

  const [mode, setMode] = useState<Mode>(params.mode === 'url' ? 'url' : 'message');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const max = mode === 'message' ? MAX_MESSAGE_CHARS : MAX_URL_CHARS;

  const noCurrentCheck = current === null;

  // After "Check another" the result screen clears the current check; when we
  // come back to this screen we start with an empty box. Coming back with the
  // system Back button keeps the text so it can be edited.
  useFocusEffect(
    useCallback(() => {
      if (noCurrentCheck) {
        setText('');
        setError(null);
      }
    }, [noCurrentCheck]),
  );

  async function paste() {
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip) {
        setText(clip.slice(0, max));
        setError(null);
      }
    } catch {
      setError(t('analyze.err.clipboard'));
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
    if (text.length > (next === 'message' ? MAX_MESSAGE_CHARS : MAX_URL_CHARS)) setText('');
  }

  async function run() {
    const value = text;
    if (value.trim().length === 0) {
      setError(t('analyze.err.empty'));
      return;
    }
    if (value.length > max) {
      setError(t('analyze.err.tooLong', { max }));
      return;
    }
    if (mode === 'url' && /\s/.test(value.trim()) && extractUrls(value).length > 0) {
      setError(t('analyze.err.urlLooksLikeMessage'));
      return;
    }
    setError(null);
    setBusy(true);
    // Let the "Checking…" state paint before the (fast) synchronous analysis.
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const result = mode === 'message' ? analyzeMessage(value) : analyzeUrl(value);
      const entry = await add(result, value);
      setCurrent({ result, text: value, saved: entry !== null });
      router.push('/result');
    } catch {
      setError(t('analyze.err.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Segmented<Mode>
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'message', label: t('analyze.tab.message') },
          { value: 'url', label: t('analyze.tab.url') },
        ]}
      />

      <View style={styles.field}>
        <AppText variant="label" nativeID="inputLabel">
          {mode === 'message' ? t('analyze.message.label') : t('analyze.url.label')}
        </AppText>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v.slice(0, max));
            if (error) setError(null);
          }}
          multiline={mode === 'message'}
          textAlignVertical={mode === 'message' ? 'top' : 'center'}
          placeholder={mode === 'message' ? t('analyze.message.placeholder') : t('analyze.url.placeholder')}
          placeholderTextColor={p.textMuted}
          accessibilityLabel={mode === 'message' ? t('analyze.message.label') : t('analyze.url.label')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          importantForAutofill="no"
          spellCheck={false}
          keyboardType={mode === 'url' ? 'url' : 'default'}
          maxLength={max}
          style={[
            styles.input,
            {
              color: p.text,
              backgroundColor: p.surface,
              borderColor: error ? p.danger : p.border,
              minHeight: mode === 'message' ? 180 : MIN_TOUCH + 8,
            },
          ]}
        />
        <View style={styles.counterRow}>
          <AppText variant="small" tone="textMuted" style={styles.flex}>
            {mode === 'url' ? t('analyze.hint.url') : t('analyze.hint.local')}
          </AppText>
          <AppText variant="small" tone="textMuted" accessibilityLabel={t('analyze.counter', { count: text.length, max })}>
            {t('analyze.counter', { count: text.length, max })}
          </AppText>
        </View>
        {error ? (
          <View style={styles.errorRow} accessibilityLiveRegion="polite">
            <Icon name="alert-circle" size={18} color={p.danger} />
            <AppText variant="small" tone="danger" style={styles.flex}>
              {error}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.buttons}>
        <View style={styles.flex}>
          <Button label={t('analyze.paste')} icon="clipboard-outline" variant="secondary" onPress={paste} />
        </View>
        <View style={styles.flex}>
          <Button
            label={t('analyze.clear')}
            icon="close-circle-outline"
            variant="secondary"
            disabled={text.length === 0}
            onPress={() => {
              setText('');
              setError(null);
            }}
          />
        </View>
      </View>
      <Button
        label={busy ? t('analyze.working') : t('analyze.button')}
        icon="search"
        loading={busy}
        onPress={run}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 17,
    lineHeight: 25,
  },
  counterRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  errorRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  buttons: { flexDirection: 'row', gap: spacing.md },
});
