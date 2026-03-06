import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

async function getItem(key: string): Promise<string | null> {
  try {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue != null) return secureValue;
  } catch {
    // Fallback below
  }

  // Legacy fallback: migrate session from AsyncStorage when available.
  try {
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue != null) {
      await SecureStore.setItemAsync(key, legacyValue);
      await AsyncStorage.removeItem(key);
      return legacyValue;
    }
  } catch {
    // Ignore fallback errors and return null.
  }

  return null;
}

async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
  // Best-effort cleanup of legacy key to avoid duplicate token copies.
  await AsyncStorage.removeItem(key).catch(() => undefined);
}

async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
  await AsyncStorage.removeItem(key).catch(() => undefined);
}

export const authSessionStorage = {
  getItem,
  setItem,
  removeItem,
};

