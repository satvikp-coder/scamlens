import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import { analyzeMessage, analyzeUrl } from '@/engine';

import { HistoryProvider, useHistory } from './history';
import { SettingsProvider, useSettings } from './settings';

const HISTORY_KEY = 'scamlens.history.v1';
const SETTINGS_KEY = 'scamlens.settings.v1';

type H = ReturnType<typeof useHistory>;
type S = ReturnType<typeof useSettings>;

let history: H;
let settings: S;

function Probe() {
  const h = useHistory();
  const s = useSettings();
  useEffect(() => {
    history = h;
    settings = s;
  });
  return null;
}

async function mount() {
  const view = await render(
    <SettingsProvider>
      <HistoryProvider>
        <Probe />
      </HistoryProvider>
    </SettingsProvider>,
  );
  // let the providers read saved data
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return view;
}

const MESSAGE = 'Dear customer, share the OTP 482913 now to avoid blocking of your account.';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('history storage', () => {
  it('saves a compact summary without the user text by default', async () => {
    await mount();
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    expect(history.entries).toHaveLength(1);
    const raw = (await AsyncStorage.getItem(HISTORY_KEY)) as string;
    expect(raw).not.toContain('482913');
    expect(raw).not.toContain('share the OTP');
    const saved = JSON.parse(raw);
    expect(saved[0].text).toBeUndefined();
    expect(saved[0].level).toBe('high');
    expect(saved[0].result.findings.every((f: { evidence: unknown[] }) => f.evidence.length === 0)).toBe(true);
    expect(saved[0].result.hosts).toEqual([]);
  });

  it('never stores a link\'s user:password part', async () => {
    await mount();
    const url = 'https://www.sbi.co.in:s3cretpass@secure-pay.xyz/login';
    await act(async () => {
      await history.add(analyzeUrl(url), url);
    });
    const raw = (await AsyncStorage.getItem(HISTORY_KEY)) as string;
    expect(raw).not.toContain('s3cretpass');
  });

  it('stores the original text only when the user turned that on', async () => {
    await mount();
    await act(async () => {
      settings.update({ saveText: true });
    });
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    const saved = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) as string);
    expect(saved[0].text).toBe(MESSAGE);
  });

  it('saves nothing when history is turned off', async () => {
    await mount();
    await act(async () => {
      settings.update({ historyEnabled: false });
    });
    let entry: unknown = 'unset';
    await act(async () => {
      entry = await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    expect(entry).toBeNull();
    expect(await AsyncStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('deletes a single entry', async () => {
    await mount();
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
      await history.add(analyzeMessage('Pay Rs 49 redelivery fee within 24 hours'), 'x');
    });
    const [first, second] = history.entries;
    await act(async () => {
      await history.remove(first.id);
    });
    expect(history.entries.map((e) => e.id)).toEqual([second.id]);
    const saved = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) as string);
    expect(saved).toHaveLength(1);
  });

  it('clearing really removes the stored records', async () => {
    await mount();
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    expect(await AsyncStorage.getItem(HISTORY_KEY)).not.toBeNull();
    await act(async () => {
      expect(await history.clear()).toBe(true);
    });
    expect(history.entries).toHaveLength(0);
    expect(await AsyncStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('keeps history and settings after the app restarts', async () => {
    const first = await mount();
    await act(async () => {
      settings.update({ language: 'gu', onboarded: true });
    });
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    await first.unmount();

    await mount();
    expect(history.entries).toHaveLength(1);
    expect(settings.settings.language).toBe('gu');
    expect(settings.settings.onboarded).toBe(true);
  });

  it('reports a failed save instead of hiding it', async () => {
    await mount();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      expect(await history.add(analyzeMessage(MESSAGE), MESSAGE)).toBeNull();
    });
    expect(history.error).toBe('save');
    expect(history.entries).toHaveLength(0);
  });

  it('reports a failed delete and keeps the entry', async () => {
    await mount();
    await act(async () => {
      await history.add(analyzeMessage(MESSAGE), MESSAGE);
    });
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      expect(await history.clear()).toBe(false);
    });
    expect(history.error).toBe('delete');
    expect(history.entries).toHaveLength(1);
  });

  it('ignores corrupt saved data instead of crashing', async () => {
    await AsyncStorage.setItem(HISTORY_KEY, '{not json');
    await AsyncStorage.setItem(SETTINGS_KEY, '[1,2,3]');
    await mount();
    expect(history.entries).toEqual([]);
    expect(settings.settings.historyEnabled).toBe(true);
  });

  it('caps the number of saved entries', async () => {
    await mount();
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await history.add(analyzeMessage(MESSAGE + i), MESSAGE);
      });
    }
    expect(history.entries.length).toBeLessThanOrEqual(100);
  });
});
