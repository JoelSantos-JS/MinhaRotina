import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authSessionStorage } from '../config/authSessionStorage';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('authSessionStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await mockAsyncStorage.clear();
    await mockSecureStore.deleteItemAsync('k1');
  });

  it('lê do SecureStore quando já existe valor', async () => {
    await mockSecureStore.setItemAsync('k1', 'secure-value');

    const value = await authSessionStorage.getItem('k1');
    expect(value).toBe('secure-value');
    expect(mockAsyncStorage.getItem).not.toHaveBeenCalledWith('k1');
  });

  it('migra do AsyncStorage para SecureStore quando não existe no secure', async () => {
    await mockAsyncStorage.setItem('k1', 'legacy-value');

    const value = await authSessionStorage.getItem('k1');
    expect(value).toBe('legacy-value');

    const secureValue = await mockSecureStore.getItemAsync('k1');
    expect(secureValue).toBe('legacy-value');
  });

  it('setItem grava no SecureStore e remove cópia legada', async () => {
    await mockAsyncStorage.setItem('k1', 'old');

    await authSessionStorage.setItem('k1', 'new');

    const secureValue = await mockSecureStore.getItemAsync('k1');
    const asyncValue = await mockAsyncStorage.getItem('k1');
    expect(secureValue).toBe('new');
    expect(asyncValue).toBeNull();
  });

  it('removeItem limpa SecureStore e AsyncStorage', async () => {
    await mockSecureStore.setItemAsync('k1', 'value');
    await mockAsyncStorage.setItem('k1', 'value');

    await authSessionStorage.removeItem('k1');

    const secureValue = await mockSecureStore.getItemAsync('k1');
    const asyncValue = await mockAsyncStorage.getItem('k1');
    expect(secureValue).toBeNull();
    expect(asyncValue).toBeNull();
  });
});

