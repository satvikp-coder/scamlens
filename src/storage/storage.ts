/**
 * Tiny wrapper around AsyncStorage so that every read and write reports
 * failure to the caller instead of being silently ignored.
 *
 * Note: AsyncStorage is not encrypted. That is acceptable here because we
 * store only small preferences and short summaries (never raw text unless
 * the user explicitly turns that on). See docs/PRIVACY.md.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    throw new StorageError('read failed');
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt data: treat as missing so the app keeps working.
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new StorageError('write failed');
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    throw new StorageError('remove failed');
  }
}
