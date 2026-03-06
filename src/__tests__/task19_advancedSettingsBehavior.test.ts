/**
 * TASK 19 — Bateria abrangente: 4 toggles de Configurações Avançadas
 *
 * Cobre TODAS as combinações lógicas de cada toggle e sua integração com o store.
 *
 * Feature 1 — educationalAlertsEnabled (Alertas Educativos)
 * [T19-01] enabled=true  + alertVisible=true  + category presente → alerta EXIBIDO
 * [T19-02] enabled=false + alertVisible=true  + category presente → alerta OCULTO
 * [T19-03] enabled=true  + alertVisible=false + category presente → alerta OCULTO
 * [T19-04] enabled=true  + alertVisible=true  + category=null     → alerta OCULTO
 * [T19-05] todas as 3 condições falsas → alerta OCULTO
 * [T19-06] enabled=false + alertVisible=false + category=null     → alerta OCULTO
 * [T19-07] toggle via store: false→true persistido corretamente
 *
 * Feature 2 — autoSensoryDetectionEnabled (Detecção Sensorial Automática)
 * [T19-08] disabled → guard bloqueia, retorna null mesmo com nome sensorial
 * [T19-09] enabled + 'escovar dentes' → categoria 'teeth'
 * [T19-10] enabled + 'tomar banho'    → categoria 'bath'
 * [T19-11] enabled + 'usar banheiro'  → categoria 'bathroom'
 * [T19-12] enabled + 'colocar roupa'  → categoria 'clothes'
 * [T19-13] enabled + 'pentear cabelo' → categoria 'hair'
 * [T19-14] enabled + 'hora do almoco' → categoria 'food'
 * [T19-15] enabled + nome sem keyword → null
 * [T19-16] enabled + nome < 3 chars   → null (guard interno do detectSensoryCategory)
 * [T19-17] enabled + acento: 'escovação dentária' → 'teeth' (normalização UTF-8)
 * [T19-18] enabled + case-insensitive: 'BANHO GELADO' → 'bath'
 * [T19-19] enabled + prioridade: keyword teeth (p=1) vence food (p=3)
 * [T19-20] enabled + nome vazio → null
 *
 * Feature 3 — miniCelebrationsEnabled (Mini-celebrações)
 * [T19-21] enabled=true  + isVisualSensitive=false → partículas PERMITIDAS
 * [T19-22] enabled=false + isVisualSensitive=false → guard 1 bloqueia (return early)
 * [T19-23] enabled=true  + isVisualSensitive=true  → guard 2 bloqueia (return early)
 * [T19-24] enabled=false + isVisualSensitive=true  → ambos bloqueiam
 * [T19-25] toggle via store: false→true persistido corretamente
 *
 * Feature 4 — helpButtonEnabled (Botão "Não consigo")
 * [T19-26] enabled=true  → botão presente (condição renderiza)
 * [T19-27] enabled=false → botão ausente (condição não renderiza)
 * [T19-28] toggle via store: false→true persistido corretamente
 *
 * Integração — store + todos os 4 juntos
 * [T19-29] loadSettings com todos false → guards disparam para cada feature
 * [T19-30] updateSettings patch único não afeta os outros 3
 * [T19-31] disable all → enable all → estado final correto
 * [T19-32] reset() após loadSettings → DEFAULT_PARENT_SETTINGS restaurado
 * [T19-33] autoSensory disabled + educationalAlert enabled → nenhum alerta gerado
 * [T19-34] autoSensory enabled + educationalAlert disabled → detecção roda mas alerta não aparece
 */

// ── Mock do service ────────────────────────────────────────────────────────────
jest.mock('../services/parentSettingsService', () => {
  const actual = jest.requireActual('../services/parentSettingsService');
  return {
    ...actual,
    parentSettingsService: {
      getSettings: jest.fn(),
      saveSettings: jest.fn().mockResolvedValue(undefined),
    },
  };
});

import {
  parentSettingsService,
  DEFAULT_PARENT_SETTINGS,
  type ParentAdvancedSettings,
} from '../services/parentSettingsService';
import { useParentSettingsStore } from '../stores/parentSettingsStore';
import { detectSensoryCategory, normalizeText } from '../utils/sensoryDetection';

const mockService = parentSettingsService as jest.Mocked<typeof parentSettingsService>;

// ─── Helpers que replicam exatamente a lógica dos componentes ─────────────────

/**
 * Replica a condição JSX do AddTaskScreen:
 *   {settings.educationalAlertsEnabled && alertVisible && detectedCategory && <EducationalAlert />}
 */
function shouldShowAlert(
  enabled: boolean,
  alertVisible: boolean,
  detectedCategory: string | null,
): boolean {
  return enabled && alertVisible && detectedCategory !== null;
}

/**
 * Replica o guard de autoSensoryDetection no useEffect do AddTaskScreen:
 *   if (!settings.autoSensoryDetectionEnabled) return;
 *   const found = detectSensoryCategory(taskName);
 */
function runAutoDetection(enabled: boolean, taskName: string) {
  if (!enabled) return null;
  return detectSensoryCategory(taskName);
}

/**
 * Replica os dois guards de triggerMiniCelebration no CurrentTaskScreen:
 *   if (!settings.miniCelebrationsEnabled) return;
 *   if (isVisualSensitive) return;
 */
function shouldTriggerMiniCelebration(enabled: boolean, isVisualSensitive: boolean): boolean {
  if (!enabled) return false;
  if (isVisualSensitive) return false;
  return true;
}

/**
 * Replica a condição JSX do CurrentTaskScreen:
 *   {settings.helpButtonEnabled && <SkipBtn />}
 */
function shouldRenderHelpButton(enabled: boolean): boolean {
  return enabled;
}

// ─── Reset store antes de cada teste ──────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockService.saveSettings.mockResolvedValue(undefined);
  useParentSettingsStore.setState({
    settings: { ...DEFAULT_PARENT_SETTINGS },
    isLoaded: false,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Feature 1 — educationalAlertsEnabled
// ══════════════════════════════════════════════════════════════════════════════

describe('Feature 1 — Alertas Educativos (educationalAlertsEnabled)', () => {

  it('[T19-01] enabled=true + alertVisible=true + category presente → alerta EXIBIDO', () => {
    expect(shouldShowAlert(true, true, 'teeth')).toBe(true);
    expect(shouldShowAlert(true, true, 'bath')).toBe(true);
    expect(shouldShowAlert(true, true, 'food')).toBe(true);
  });

  it('[T19-02] enabled=false + alertVisible=true + category presente → alerta OCULTO', () => {
    expect(shouldShowAlert(false, true, 'teeth')).toBe(false);
    expect(shouldShowAlert(false, true, 'bath')).toBe(false);
  });

  it('[T19-03] enabled=true + alertVisible=false + category presente → alerta OCULTO', () => {
    expect(shouldShowAlert(true, false, 'teeth')).toBe(false);
  });

  it('[T19-04] enabled=true + alertVisible=true + category=null → alerta OCULTO', () => {
    expect(shouldShowAlert(true, true, null)).toBe(false);
  });

  it('[T19-05] enabled=true + alertVisible=false + category=null → alerta OCULTO', () => {
    expect(shouldShowAlert(true, false, null)).toBe(false);
  });

  it('[T19-06] todas as condições falsas → alerta OCULTO', () => {
    expect(shouldShowAlert(false, false, null)).toBe(false);
  });

  it('[T19-07] toggle via store false→true → persistido e correto', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { educationalAlertsEnabled: false });
    expect(useParentSettingsStore.getState().settings.educationalAlertsEnabled).toBe(false);

    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { educationalAlertsEnabled: true });
    expect(useParentSettingsStore.getState().settings.educationalAlertsEnabled).toBe(true);

    // Verifica que o saveSettings foi chamado com o valor correto
    const lastCall = mockService.saveSettings.mock.calls.at(-1)![1];
    expect(lastCall.educationalAlertsEnabled).toBe(true);
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// Feature 2 — autoSensoryDetectionEnabled
// ══════════════════════════════════════════════════════════════════════════════

describe('Feature 2 — Detecção Sensorial Automática (autoSensoryDetectionEnabled)', () => {

  it('[T19-08] disabled → guard bloqueia, retorna null mesmo com nome claramente sensorial', () => {
    expect(runAutoDetection(false, 'escovar os dentes')).toBeNull();
    expect(runAutoDetection(false, 'tomar banho')).toBeNull();
    expect(runAutoDetection(false, 'colocar roupa')).toBeNull();
    expect(runAutoDetection(false, 'hora do almoco')).toBeNull();
  });

  it('[T19-09] enabled + "escovar dentes" → categoria teeth', () => {
    expect(runAutoDetection(true, 'escovar os dentes')).toBe('teeth');
    expect(runAutoDetection(true, 'usar a escova dental')).toBe('teeth');
    expect(runAutoDetection(true, 'colocar pasta dental')).toBe('teeth');
  });

  it('[T19-10] enabled + "tomar banho" → categoria bath', () => {
    expect(runAutoDetection(true, 'tomar banho')).toBe('bath');
    expect(runAutoDetection(true, 'entrar no chuveiro')).toBe('bath');
    expect(runAutoDetection(true, 'usar shampoo')).toBe('bath');
  });

  it('[T19-11] enabled + "usar banheiro" → categoria bathroom', () => {
    expect(runAutoDetection(true, 'ir ao banheiro')).toBe('bathroom');
    expect(runAutoDetection(true, 'dar a descarga')).toBe('bathroom');
    expect(runAutoDetection(true, 'fazer xixi')).toBe('bathroom');
  });

  it('[T19-12] enabled + "colocar roupa" → categoria clothes', () => {
    expect(runAutoDetection(true, 'colocar roupa')).toBe('clothes');
    expect(runAutoDetection(true, 'vestir a camisa')).toBe('clothes');
    expect(runAutoDetection(true, 'calcar o sapato')).toBe('clothes');
  });

  it('[T19-13] enabled + "pentear cabelo" → categoria hair', () => {
    expect(runAutoDetection(true, 'pentear o cabelo')).toBe('hair');
    expect(runAutoDetection(true, 'cortar o cabelo')).toBe('hair');
    expect(runAutoDetection(true, 'usar tesoura no cabelo')).toBe('hair');
  });

  it('[T19-14] enabled + "hora do almoco" → categoria food', () => {
    expect(runAutoDetection(true, 'hora do almoco')).toBe('food');
    expect(runAutoDetection(true, 'comer fruta')).toBe('food');
    expect(runAutoDetection(true, 'hora do jantar')).toBe('food');
    expect(runAutoDetection(true, 'fazer o lanche')).toBe('food');
  });

  it('[T19-15] enabled + nome sem keyword sensorial → null', () => {
    expect(runAutoDetection(true, 'fazer dever de casa')).toBeNull();
    expect(runAutoDetection(true, 'jogar bola')).toBeNull();
    expect(runAutoDetection(true, 'ler livro')).toBeNull();
    expect(runAutoDetection(true, 'assistir TV')).toBeNull();
  });

  it('[T19-16] enabled + nome < 3 caracteres → null (guard interno)', () => {
    expect(runAutoDetection(true, 'ab')).toBeNull();
    expect(runAutoDetection(true, 'a')).toBeNull();
    expect(runAutoDetection(true, '')).toBeNull();
  });

  it('[T19-17] enabled + texto com acentos: "escovação dentária" → teeth (normalização)', () => {
    // normalizeText deve remover diacríticos: 'escovação' → 'escovacao', contém 'escov'
    expect(runAutoDetection(true, 'escovação dentária')).toBe('teeth');
    expect(runAutoDetection(true, 'higiene do dente')).toBe('teeth');
  });

  it('[T19-18] enabled + MAIÚSCULAS: "BANHO GELADO" → bath (case-insensitive)', () => {
    expect(runAutoDetection(true, 'BANHO GELADO')).toBe('bath');
    expect(runAutoDetection(true, 'ESCOVAR O DENTE')).toBe('teeth');
  });

  it('[T19-19] enabled + prioridade: "escova o dente e banheiro" → teeth (p=1 vence bathroom p=1, primeiro encontrado)', () => {
    // teeth e bathroom têm ambos prioridade 1; como bestMatch só atualiza quando priority < bestMatch.priority,
    // o primeiro match (teeth) é mantido
    const result = runAutoDetection(true, 'escova o dente no banheiro');
    expect(result).toBe('teeth');
  });

  it('[T19-20] enabled + nome vazio (apenas espaços) → null', () => {
    expect(runAutoDetection(true, '   ')).toBeNull();
  });

  it('[EXTRA] normalizeText remove acentos corretamente', () => {
    expect(normalizeText('Escovação')).toBe('escovacao');
    expect(normalizeText('Câmera')).toBe('camera');
    expect(normalizeText('Feijão')).toBe('feijao');
    expect(normalizeText('Ônibus')).toBe('onibus');
    expect(normalizeText('BANHO')).toBe('banho');
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// Feature 3 — miniCelebrationsEnabled
// ══════════════════════════════════════════════════════════════════════════════

describe('Feature 3 — Mini-celebrações (miniCelebrationsEnabled)', () => {

  it('[T19-21] enabled=true + isVisualSensitive=false → partículas PERMITIDAS', () => {
    expect(shouldTriggerMiniCelebration(true, false)).toBe(true);
  });

  it('[T19-22] enabled=false + isVisualSensitive=false → guard 1 bloqueia', () => {
    expect(shouldTriggerMiniCelebration(false, false)).toBe(false);
  });

  it('[T19-23] enabled=true + isVisualSensitive=true → guard visual bloqueia', () => {
    expect(shouldTriggerMiniCelebration(true, true)).toBe(false);
  });

  it('[T19-24] enabled=false + isVisualSensitive=true → ambos os guards bloqueiam', () => {
    expect(shouldTriggerMiniCelebration(false, true)).toBe(false);
  });

  it('[T19-25] toggle via store false→true → persistido e correto', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { miniCelebrationsEnabled: false });
    expect(useParentSettingsStore.getState().settings.miniCelebrationsEnabled).toBe(false);

    // Verifica que o guard bloquearia
    const { settings: s1 } = useParentSettingsStore.getState();
    expect(shouldTriggerMiniCelebration(s1.miniCelebrationsEnabled, false)).toBe(false);

    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { miniCelebrationsEnabled: true });
    expect(useParentSettingsStore.getState().settings.miniCelebrationsEnabled).toBe(true);

    // Verifica que o guard liberaria
    const { settings: s2 } = useParentSettingsStore.getState();
    expect(shouldTriggerMiniCelebration(s2.miniCelebrationsEnabled, false)).toBe(true);

    const lastCall = mockService.saveSettings.mock.calls.at(-1)![1];
    expect(lastCall.miniCelebrationsEnabled).toBe(true);
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// Feature 4 — helpButtonEnabled
// ══════════════════════════════════════════════════════════════════════════════

describe('Feature 4 — Botão "Não consigo" (helpButtonEnabled)', () => {

  it('[T19-26] enabled=true → botão RENDERIZADO', () => {
    expect(shouldRenderHelpButton(true)).toBe(true);
  });

  it('[T19-27] enabled=false → botão OCULTO', () => {
    expect(shouldRenderHelpButton(false)).toBe(false);
  });

  it('[T19-28] toggle via store false→true → persistido e correto', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { helpButtonEnabled: false });
    expect(useParentSettingsStore.getState().settings.helpButtonEnabled).toBe(false);
    expect(shouldRenderHelpButton(useParentSettingsStore.getState().settings.helpButtonEnabled)).toBe(false);

    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { helpButtonEnabled: true });
    expect(useParentSettingsStore.getState().settings.helpButtonEnabled).toBe(true);
    expect(shouldRenderHelpButton(useParentSettingsStore.getState().settings.helpButtonEnabled)).toBe(true);

    const lastCall = mockService.saveSettings.mock.calls.at(-1)![1];
    expect(lastCall.helpButtonEnabled).toBe(true);
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// Integração — todos os 4 juntos
// ══════════════════════════════════════════════════════════════════════════════

describe('Integração — 4 toggles via store', () => {

  it('[T19-29] loadSettings com todos false → todos os guards disparam', async () => {
    const allFalse: ParentAdvancedSettings = {
      educationalAlertsEnabled:    false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled:     false,
      helpButtonEnabled:           false,
    };
    mockService.getSettings.mockResolvedValue(allFalse);
    await useParentSettingsStore.getState().loadSettings('parent-1');

    const { settings } = useParentSettingsStore.getState();

    expect(shouldShowAlert(settings.educationalAlertsEnabled, true, 'teeth')).toBe(false);
    expect(runAutoDetection(settings.autoSensoryDetectionEnabled, 'escovar os dentes')).toBeNull();
    expect(shouldTriggerMiniCelebration(settings.miniCelebrationsEnabled, false)).toBe(false);
    expect(shouldRenderHelpButton(settings.helpButtonEnabled)).toBe(false);
  });

  it('[T19-30] updateSettings patch único não afeta os outros 3', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { miniCelebrationsEnabled: false });

    const { settings } = useParentSettingsStore.getState();
    expect(settings.miniCelebrationsEnabled).toBe(false);
    // Os outros 3 permanecem true
    expect(settings.educationalAlertsEnabled).toBe(true);
    expect(settings.autoSensoryDetectionEnabled).toBe(true);
    expect(settings.helpButtonEnabled).toBe(true);
  });

  it('[T19-31] disable all → enable all → estado final correto', async () => {
    // Desativa todos
    await useParentSettingsStore.getState().updateSettings('parent-1', {
      educationalAlertsEnabled:    false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled:     false,
      helpButtonEnabled:           false,
    });
    const allFalse = useParentSettingsStore.getState().settings;
    expect(Object.values(allFalse).every((v) => v === false)).toBe(true);

    // Reativa todos
    await useParentSettingsStore.getState().updateSettings('parent-1', {
      educationalAlertsEnabled:    true,
      autoSensoryDetectionEnabled: true,
      miniCelebrationsEnabled:     true,
      helpButtonEnabled:           true,
    });
    const allTrue = useParentSettingsStore.getState().settings;
    expect(Object.values(allTrue).every((v) => v === true)).toBe(true);
  });

  it('[T19-32] reset() após loadSettings → DEFAULT_PARENT_SETTINGS restaurado', async () => {
    mockService.getSettings.mockResolvedValue({
      educationalAlertsEnabled:    false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled:     false,
      helpButtonEnabled:           false,
    });
    await useParentSettingsStore.getState().loadSettings('parent-1');
    expect(useParentSettingsStore.getState().isLoaded).toBe(true);

    useParentSettingsStore.getState().reset();

    expect(useParentSettingsStore.getState().settings).toEqual(DEFAULT_PARENT_SETTINGS);
    expect(useParentSettingsStore.getState().isLoaded).toBe(false);
  });

  it('[T19-33] autoSensory=false + educationalAlert=true → detecção bloqueada, alerta nunca gerado', () => {
    const detected = runAutoDetection(false, 'escovar os dentes'); // null
    const showAlert = shouldShowAlert(true, true, detected);       // true && true && null → false
    expect(detected).toBeNull();
    expect(showAlert).toBe(false);
  });

  it('[T19-34] autoSensory=true + educationalAlert=false → detecção roda mas alerta não aparece', () => {
    const detected = runAutoDetection(true, 'escovar os dentes'); // 'teeth'
    const showAlert = shouldShowAlert(false, true, detected);     // false → false
    expect(detected).toBe('teeth');
    expect(showAlert).toBe(false);
  });

});
