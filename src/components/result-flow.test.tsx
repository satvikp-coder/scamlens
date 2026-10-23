import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import { analyzeMessage, analyzeUrl } from '@/engine';
import { SettingsProvider, useSettings } from '@/state/settings';

import { ResultView } from './result-view';

let settings: ReturnType<typeof useSettings>;
function Probe() {
  const s = useSettings();
  useEffect(() => {
    settings = s;
  });
  return null;
}

async function show(text: string, kind: 'message' | 'url' = 'message') {
  const result = kind === 'message' ? analyzeMessage(text) : analyzeUrl(text);
  const onAnother = jest.fn();
  await render(
    <SettingsProvider>
      <Probe />
      <ResultView result={result} onCheckAnother={onAnother} />
    </SettingsProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return { result, onAnother };
}

describe('input -> engine -> localized result screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear(); // language changes are saved; start each test fresh
  });

  it('shows level, plain summary, evidence quote, explanation, action and limits', async () => {
    await show('Dear customer, your SBI account will be blocked today. Share the OTP 482913 you received to verify your KYC.');
    expect(screen.getAllByText('High risk').length).toBeGreaterThan(0);
    expect(screen.getByText(/strong warning signs/i)).toBeTruthy();
    expect(screen.getByText('Asks you to share an OTP')).toBeTruthy();
    // the exact fragment from the user's text is quoted
    expect(screen.getByText(/^Share the OTP$/)).toBeTruthy();
    expect(screen.getAllByText(/never ask|No genuine bank/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Do not share any OTP/)).toBeTruthy();
    expect(screen.getByText(/fixed rules/)).toBeTruthy();
    expect(screen.getByText(/not a guarantee/i)).toBeTruthy();
  });

  it('does not call a result with no findings safe', async () => {
    await show('Hi, are you free tomorrow evening?');
    expect(screen.getAllByText('Low apparent risk').length).toBeGreaterThan(0);
    expect(screen.getByText('No warning signs were found.')).toBeTruthy();
    expect(screen.getByText(/does not mean something is safe/)).toBeTruthy();
    expect(screen.queryByText(/\bsafe\b.*verified/i)).toBeNull();
  });

  it('says it cannot assess a vague message', async () => {
    await show('Click here');
    expect(screen.getAllByText('Unable to assess reliably').length).toBeGreaterThan(0);
    expect(screen.getByText(/too short or too general/)).toBeTruthy();
  });

  it('explains a deceptive domain in the selected language and updates at once when language changes', async () => {
    await show('https://sbi.co.in.secure-verify.xyz/account', 'url');
    expect(screen.getByText(/Shows sbi\.co\.in but really goes to secure-verify\.xyz/)).toBeTruthy();
    await act(async () => {
      settings.update({ language: 'hi' });
    });
    expect(screen.getAllByText(/जोखिम/).length).toBeGreaterThan(0);
    expect(screen.queryByText('High risk')).toBeNull();
    await act(async () => {
      settings.update({ language: 'gu' });
    });
    expect(screen.queryByText(/जोखिम/)).toBeNull();
    expect(screen.getAllByText(/[઀-૿]/).length).toBeGreaterThan(5);
  });

  it('calls back when the user wants to check another', async () => {
    const { onAnother } = await show('Share your OTP now');
    await fireEvent.press(screen.getByLabelText('Check another'));
    expect(onAnother).toHaveBeenCalledTimes(1);
  });
});
