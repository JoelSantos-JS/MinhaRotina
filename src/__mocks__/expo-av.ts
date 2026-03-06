/**
 * Mock de expo-av para Jest.
 *
 * Expõe makeMockSound() para que cada teste possa criar um sound isolado
 * e configurar o callback de status (didJustFinish) de forma controlada.
 */

export type MockPlaybackStatusCallback = (status: Record<string, unknown>) => void;

export interface MockSound {
  playAsync: jest.Mock;
  stopAsync: jest.Mock;
  unloadAsync: jest.Mock;
  setVolumeAsync: jest.Mock;
  setOnPlaybackStatusUpdate: jest.Mock;
  /** Chama o último callback registrado via setOnPlaybackStatusUpdate */
  _finish: () => void;
  _error: (msg: string) => void;
}

export function makeMockSound(): MockSound {
  let _cb: MockPlaybackStatusCallback | null = null;

  const sound: MockSound = {
    playAsync:   jest.fn().mockResolvedValue({}),
    stopAsync:   jest.fn().mockResolvedValue({}),
    unloadAsync: jest.fn().mockResolvedValue({}),
    setVolumeAsync: jest.fn().mockResolvedValue({}),
    setOnPlaybackStatusUpdate: jest.fn((cb: MockPlaybackStatusCallback) => { _cb = cb; }),
    _finish: () => { _cb?.({ didJustFinish: true, isLoaded: true }); },
    _error:  (msg) => { _cb?.({ error: msg, isLoaded: false }); },
  };
  return sound;
}

// Sound padrão reutilizável para testes simples
const defaultSound = makeMockSound();

export const Audio = {
  Sound: {
    createAsync: jest.fn().mockResolvedValue({ sound: defaultSound, status: {} }),
  },
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  InterruptionModeIOS:     { DoNotMix: 0, DuckOthers: 1, MixWithOthers: 2 },
  InterruptionModeAndroid: { DoNotMix: 1, DuckOthers: 2 },
};

/** Expõe o sound padrão para testes que não precisam de controle fino */
export { defaultSound as mockSound };
