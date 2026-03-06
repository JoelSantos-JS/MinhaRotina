/**
 * secureStorage — wrapper sobre expo-secure-store com fallback de migração
 * do AsyncStorage legado.
 *
 * Padrão idêntico ao authSessionStorage.ts:
 *  1. Lê do SecureStore (encriptado no keychain/keystore do SO)
 *  2. Se não encontrar, tenta AsyncStorage e migra automaticamente
 *  3. Escrita sempre vai para SecureStore + limpa AsyncStorage legado
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value != null) return value;
    } catch {
      // SecureStore indisponível — tenta fallback abaixo
    }

    // Migração: move dados do AsyncStorage legado para SecureStore
    try {
      const legacy = await AsyncStorage.getItem(key);
      if (legacy != null) {
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
        return legacy;
      }
    } catch {
      // Ignora erros de migração
    }

    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
    // Limpa chave legada se ainda existir
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },
};
