import { Audio } from 'expo-av';

// Configura o modo de áudio uma única vez ao importar o módulo.
// playsInSilentModeIOS: toca mesmo com o iPhone no modo silencioso.
Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Fonte de áudio aceita pelo expo-av (resultado de require('./file.mp3')) */
export type AudioSource = Parameters<typeof Audio.Sound.createAsync>[0];

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Cria, reproduz e descarrega automaticamente um som.
 * Não lança erro — falhas de áudio não devem quebrar o fluxo da criança.
 */
async function _play(source: AudioSource, volume: number): Promise<void> {
  let sound: Audio.Sound | null = null;
  try {
    const { sound: s } = await Audio.Sound.createAsync(source, { shouldPlay: false });
    sound = s;
    await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    await sound.playAsync();

    await new Promise<void>((resolve) => {
      let settled = false;
      const settle = () => {
        if (!settled) { settled = true; resolve(); }
      };
      // Fallback: resolve depois de 5s caso o callback não dispare
      const fallback = setTimeout(settle, 5000);
      sound!.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) { clearTimeout(fallback); settle(); }
        if ('error' in status && status.error) { clearTimeout(fallback); settle(); }
      });
    });
  } catch {
    // Silencia erros de áudio — app não pode travar por causa de som
  } finally {
    try { await sound?.unloadAsync(); } catch { /* ignore */ }
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

export const soundService = {

  /**
   * Reproduz uma única nota e descarrega o som ao terminar.
   * @param source  Resultado de require('./assets/sounds/piano/c5.mp3')
   * @param volume  0.0 – 1.0 (padrão 0.65)
   */
  async playNote(source: AudioSource, volume = 0.65): Promise<void> {
    await _play(source, volume);
  },

  /**
   * Reproduz uma sequência de notas com delays entre elas.
   * Cada nota inicia depois do delay especificado (em ms) desde o início da sequência.
   *
   * @param sources  Array de fontes de áudio
   * @param delays   Array de delays em ms (mesmo comprimento que sources)
   * @param volume   0.0 – 1.0
   *
   * @example
   * // Tríade C-E-G com 420ms entre notas
   * await soundService.playSequence([c5, e5, g5], [0, 420, 840], 0.7);
   */
  async playSequence(
    sources: AudioSource[],
    delays: readonly number[],
    volume = 0.65
  ): Promise<void> {
    if (sources.length === 0) return;

    const start = Date.now();

    const notePromises = sources.map((source, i) => {
      const delay = delays[i] ?? 0;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, delay - elapsed);

      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          await _play(source, volume);
          resolve();
        }, wait);
      });
    });

    await Promise.all(notePromises);
  },
};
