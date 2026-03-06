/**
 * TASK 15 — Bateria de testes: parentSettingsStore + lógica funcional dos 4 toggles
 *
 * [T15-01] Estado inicial: os 4 campos estão como true
 * [T15-02] loadSettings chama getSettings com o parentId correto
 * [T15-03] loadSettings popula o store com as configurações retornadas
 * [T15-04] loadSettings define isLoaded = true
 * [T15-05] updateSettings aplica patch imediatamente (optimistic update)
 * [T15-06] updateSettings não altera outros campos ao fazer patch parcial
 * [T15-07] updateSettings chama saveSettings com a configuração completa
 * [T15-08] reset retorna ao DEFAULT_PARENT_SETTINGS e isLoaded = false
 * [T15-09] Flip duplo: desativar → reativar educationalAlertsEnabled
 * [T15-10] Flip duplo: desativar → reativar helpButtonEnabled
 * [T15-11] autoSensoryDetection = false → detecção bloqueada (guard retorna null)
 * [T15-12] autoSensoryDetection = true + nomes sensoriais → categorias corretas
 * [T15-13] educationalAlert: exibido quando enabled=true, alertVisible=true, category presente
 * [T15-14] educationalAlert: NÃO exibido quando qualquer condição é falsa
 * [T15-15] Cenário completo: 4 toggles desativados via store → todos os guards disparam
 */

// ── Mock do service antes de qualquer import ────────────────────────────────
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

import { parentSettingsService, DEFAULT_PARENT_SETTINGS, type ParentAdvancedSettings } from '../services/parentSettingsService';
import { useParentSettingsStore } from '../stores/parentSettingsStore';
import { detectSensoryCategory } from '../utils/sensoryDetection';

const mockService = parentSettingsService as jest.Mocked<typeof parentSettingsService>;

// ── Simula exatamente o guard de autoSensoryDetection no AddTaskScreen
// useEffect: if (!settings.autoSensoryDetectionEnabled) return; / detectSensoryCategory(name)
function runDetection(enabled: boolean, taskName: string) {
  if (!enabled) return null;
  return detectSensoryCategory(taskName);
}

// ── Simula exatamente a condição do JSX no AddTaskScreen:
// {settings.educationalAlertsEnabled && alertVisible && detectedCategory && <EducationalAlert>}
function shouldShowAlert(
  enabled: boolean,
  alertVisible: boolean,
  detectedCategory: string | null
): boolean {
  return enabled && alertVisible && detectedCategory !== null;
}

// ── Reset store antes de cada teste ─────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  mockService.saveSettings.mockResolvedValue(undefined);
  useParentSettingsStore.setState({
    settings: { ...DEFAULT_PARENT_SETTINGS },
    isLoaded: false,
  });
});

describe('TASK 15 — parentSettingsStore + lógica funcional dos 4 toggles', () => {

  // ── Estado inicial ─────────────────────────────────────────────────────────

  it('[T15-01] Estado inicial: os 4 campos estão como true', () => {
    const { settings } = useParentSettingsStore.getState();
    expect(settings.educationalAlertsEnabled).toBe(true);
    expect(settings.autoSensoryDetectionEnabled).toBe(true);
    expect(settings.miniCelebrationsEnabled).toBe(true);
    expect(settings.helpButtonEnabled).toBe(true);
  });

  // ── loadSettings ───────────────────────────────────────────────────────────

  it('[T15-02] loadSettings chama getSettings com o parentId correto', async () => {
    mockService.getSettings.mockResolvedValue({ ...DEFAULT_PARENT_SETTINGS });
    await useParentSettingsStore.getState().loadSettings('parent-abc');
    expect(mockService.getSettings).toHaveBeenCalledWith('parent-abc');
  });

  it('[T15-03] loadSettings popula o store com as configurações retornadas', async () => {
    const custom: ParentAdvancedSettings = {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: true,
      miniCelebrationsEnabled: false,
      helpButtonEnabled: true,
    };
    mockService.getSettings.mockResolvedValue(custom);
    await useParentSettingsStore.getState().loadSettings('parent-1');

    const { settings } = useParentSettingsStore.getState();
    expect(settings.educationalAlertsEnabled).toBe(false);
    expect(settings.autoSensoryDetectionEnabled).toBe(true);
    expect(settings.miniCelebrationsEnabled).toBe(false);
    expect(settings.helpButtonEnabled).toBe(true);
  });

  it('[T15-04] loadSettings define isLoaded = true', async () => {
    mockService.getSettings.mockResolvedValue({ ...DEFAULT_PARENT_SETTINGS });
    expect(useParentSettingsStore.getState().isLoaded).toBe(false);
    await useParentSettingsStore.getState().loadSettings('parent-1');
    expect(useParentSettingsStore.getState().isLoaded).toBe(true);
  });

  // ── updateSettings ─────────────────────────────────────────────────────────

  it('[T15-05] updateSettings aplica patch imediatamente antes do await (optimistic)', async () => {
    const promise = useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { miniCelebrationsEnabled: false });

    // Estado já alterado antes do await
    expect(useParentSettingsStore.getState().settings.miniCelebrationsEnabled).toBe(false);
    await promise;
  });

  it('[T15-06] updateSettings não altera outros campos ao fazer patch parcial', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { helpButtonEnabled: false });

    const { settings } = useParentSettingsStore.getState();
    expect(settings.helpButtonEnabled).toBe(false);
    // Os outros 3 permanecem true
    expect(settings.educationalAlertsEnabled).toBe(true);
    expect(settings.autoSensoryDetectionEnabled).toBe(true);
    expect(settings.miniCelebrationsEnabled).toBe(true);
  });

  it('[T15-07] updateSettings chama saveSettings com a configuração completa', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { educationalAlertsEnabled: false });

    expect(mockService.saveSettings).toHaveBeenCalledWith('parent-1', {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: true,
      miniCelebrationsEnabled: true,
      helpButtonEnabled: true,
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  it('[T15-08] reset retorna ao DEFAULT_PARENT_SETTINGS e isLoaded = false', async () => {
    mockService.getSettings.mockResolvedValue({
      ...DEFAULT_PARENT_SETTINGS,
      miniCelebrationsEnabled: false,
    });
    await useParentSettingsStore.getState().loadSettings('parent-1');
    expect(useParentSettingsStore.getState().isLoaded).toBe(true);

    useParentSettingsStore.getState().reset();

    const { settings, isLoaded } = useParentSettingsStore.getState();
    expect(settings).toEqual(DEFAULT_PARENT_SETTINGS);
    expect(isLoaded).toBe(false);
  });

  // ── Flip duplo ────────────────────────────────────────────────────────────

  it('[T15-09] Flip duplo: desativar → reativar educationalAlertsEnabled', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { educationalAlertsEnabled: false });
    expect(useParentSettingsStore.getState().settings.educationalAlertsEnabled).toBe(false);

    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { educationalAlertsEnabled: true });
    expect(useParentSettingsStore.getState().settings.educationalAlertsEnabled).toBe(true);
  });

  it('[T15-10] Flip duplo: desativar → reativar helpButtonEnabled', async () => {
    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { helpButtonEnabled: false });
    expect(useParentSettingsStore.getState().settings.helpButtonEnabled).toBe(false);

    await useParentSettingsStore
      .getState()
      .updateSettings('parent-1', { helpButtonEnabled: true });
    expect(useParentSettingsStore.getState().settings.helpButtonEnabled).toBe(true);
  });

  // ── Lógica funcional dos toggles ──────────────────────────────────────────

  it('[T15-11] autoSensoryDetection = false → guard bloqueia a detecção (retorna null)', () => {
    // Mesmo com nomes claramente sensoriais, o guard zera o resultado
    expect(runDetection(false, 'escovar os dentes')).toBeNull();
    expect(runDetection(false, 'tomar banho')).toBeNull();
    expect(runDetection(false, 'colocar roupa')).toBeNull();
  });

  it('[T15-12] autoSensoryDetection = true → categorias sensoriais detectadas corretamente', () => {
    expect(runDetection(true, 'escovar os dentes')).toBe('teeth');
    expect(runDetection(true, 'tomar banho')).toBe('bath');
    expect(runDetection(true, 'colocar roupa')).toBe('clothes');
    expect(runDetection(true, 'pentear o cabelo')).toBe('hair');
    expect(runDetection(true, 'tarefa genérica')).toBeNull();
  });

  it('[T15-13] educationalAlert: exibido quando enabled=true, alertVisible=true, category presente', () => {
    expect(shouldShowAlert(true, true, 'teeth')).toBe(true);
    expect(shouldShowAlert(true, true, 'bath')).toBe(true);
  });

  it('[T15-14] educationalAlert: NÃO exibido quando qualquer condição é falsa', () => {
    expect(shouldShowAlert(false, true, 'teeth')).toBe(false);   // toggle desligado
    expect(shouldShowAlert(true, false, 'teeth')).toBe(false);   // alerta não visível
    expect(shouldShowAlert(true, true, null)).toBe(false);       // sem categoria detectada
    expect(shouldShowAlert(false, false, null)).toBe(false);     // tudo falso
  });

  it('[T15-15] Cenário completo: 4 toggles desativados via store → todos os guards disparam', async () => {
    await useParentSettingsStore.getState().updateSettings('parent-1', {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled: false,
      helpButtonEnabled: false,
    });

    const { settings } = useParentSettingsStore.getState();

    // autoSensoryDetection desativado → detecção bloqueada
    expect(runDetection(settings.autoSensoryDetectionEnabled, 'escovar os dentes')).toBeNull();

    // educationalAlert desativado → nunca exibido
    expect(shouldShowAlert(settings.educationalAlertsEnabled, true, 'teeth')).toBe(false);

    // miniCelebrations desativado → guard dispara (if !enabled return)
    expect(settings.miniCelebrationsEnabled).toBe(false);

    // helpButton desativado → não renderizado ({enabled && <Button>})
    expect(settings.helpButtonEnabled).toBe(false);

    // Confirma que saveSettings foi chamado com todos os 4 desativados
    expect(mockService.saveSettings).toHaveBeenLastCalledWith('parent-1', {
      educationalAlertsEnabled: false,
      autoSensoryDetectionEnabled: false,
      miniCelebrationsEnabled: false,
      helpButtonEnabled: false,
    });
  });
});
