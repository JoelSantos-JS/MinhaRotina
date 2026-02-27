import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { PinInput } from '../../components/ui/PinInput';
import { AccessCodesModal } from '../../components/modals/AccessCodesModal';
import { childService } from '../../services/child.service';
import { useAuthStore } from '../../stores/authStore';
import { useChildStore } from '../../stores/childStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { CHILD_ICONS, CHILD_COLORS } from '../../config/constants';
import type { VisualSupportType, SensoryProfile } from '../../types/models';
import type { ParentScreenProps } from '../../types/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'info' | 'visual' | 'sensory' | 'pin';
type SensoryLevel = 'hyper-reactive' | 'typical' | 'hypo-reactive';

const STEPS: Step[] = ['info', 'visual', 'sensory', 'pin'];

const STEP_TITLES: Record<Step, string> = {
  info: 'Nova Criança',
  visual: 'Suporte Visual',
  sensory: 'Perfil Sensorial',
  pin: 'Definir PIN',
};

// ─── Visual Support Options ───────────────────────────────────────────────────

const VISUAL_OPTIONS: { value: VisualSupportType; label: string; desc: string; emoji: string }[] = [
  { value: 'images_text', label: 'Imagens + Texto', desc: 'Guia completo passo a passo.', emoji: '🖼️' },
  { value: 'reduced_text', label: 'Texto Reduzido', desc: 'Foco no essencial.', emoji: '📝' },
  { value: 'images_only', label: 'Apenas Imagens', desc: 'Experiência puramente visual.', emoji: '👁️' },
];

// ─── Sensory Questions ────────────────────────────────────────────────────────

interface SensoryQuestion {
  key: keyof SensoryProfile;
  category: string;
  question: string;
  options: { level: SensoryLevel; label: string }[];
}

const SENSORY_QUESTIONS: SensoryQuestion[] = [
  {
    key: 'auditory',
    category: 'AUDITIVO',
    question: 'Como a criança reage a barulhos altos (ex: secador)?',
    options: [
      { level: 'hyper-reactive', label: 'Tapa os ouvidos / Chora' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Não parece notar / Busca o som' },
    ],
  },
  {
    key: 'visual',
    category: 'VISUAL',
    question: 'Como reage a luzes fortes ou ambientes coloridos?',
    options: [
      { level: 'hyper-reactive', label: 'Evita a luz / Fecha os olhos' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Olha fixamente / Busca luzes' },
    ],
  },
  {
    key: 'tactile',
    category: 'TÁTIL',
    question: 'Sobre etiquetas de roupas ou texturas de comida:',
    options: [
      { level: 'hyper-reactive', label: 'Incomoda-se muito / Recusa' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Parece não sentir / Busca texturas' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateChildScreen: React.FC<ParentScreenProps<'CreateChild'>> = ({ navigation }) => {
  // Step control
  const [step, setStep] = useState<Step>('info');

  // Step 1 — Info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(CHILD_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(CHILD_COLORS[0]);

  // Step 2 — Visual support
  const [visualSupport, setVisualSupport] = useState<VisualSupportType>('images_text');

  // Step 3 — Sensory profile
  const [sensory, setSensory] = useState<SensoryProfile>({
    auditory: 'typical',
    visual: 'typical',
    tactile: 'typical',
  });

  // Step 4 — PIN
  const [pin, setPin] = useState('');

  // Misc
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdChild, setCreatedChild] = useState<import('../../types/models').ChildAccount | null>(null);

  const parent = useAuthStore((s) => s.parent);
  const addChild = useChildStore((s) => s.addChild);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const stepIndex = STEPS.indexOf(step);

  const handleBack = () => {
    if (stepIndex === 0) {
      navigation.goBack();
    } else {
      setStep(STEPS[stepIndex - 1]);
      setError('');
    }
  };

  const handleNext = () => {
    if (step === 'info') {
      if (!name.trim()) { setError('Digite o nome da criança.'); return; }
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
        setError('Digite uma idade válida (1-18).'); return;
      }
    }
    setError('');
    setStep(STEPS[stepIndex + 1]);
  };

  // ── Create child ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (pin.length !== 4) { setError('Digite um PIN de 4 dígitos.'); return; }
    if (!parent?.id) return;

    setLoading(true);
    try {
      const child = await childService.createChild(parent.id, {
        name: name.trim(),
        age: parseInt(age, 10),
        pin,
        color_theme: selectedColor,
        icon_emoji: selectedIcon,
        visual_support_type: visualSupport,
        sensory_profile: sensory,
      });
      addChild(child);
      setCreatedChild(child);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar criança');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.greenVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.dot,
                i < stepIndex && styles.dotDone,
                i === stepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── STEP 1: Info ─────────────────────────────────────────────── */}
            {step === 'info' && (
              <>
                <View style={[styles.preview, { backgroundColor: selectedColor + '33' }]}>
                  <Text style={styles.previewEmoji}>{selectedIcon}</Text>
                  <Text style={styles.previewName}>{name || 'Nome da criança'}</Text>
                </View>

                <BlueyInput
                  label="Nome da criança"
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: João, Maria..."
                  autoCapitalize="words"
                />
                <BlueyInput
                  label="Idade"
                  value={age}
                  onChangeText={setAge}
                  placeholder="Ex: 5"
                  keyboardType="number-pad"
                  maxLength={2}
                />

                <Text style={styles.sectionLabel}>Ícone</Text>
                <View style={styles.iconGrid}>
                  {CHILD_ICONS.map((icon, index) => (
                    <TouchableOpacity
                      key={`icon-${index}`}
                      onPress={() => setSelectedIcon(icon)}
                      style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                    >
                      <Text style={styles.iconOptionText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Cor tema</Text>
                <View style={styles.colorRow}>
                  {CHILD_COLORS.map((color, index) => (
                    <TouchableOpacity
                      key={`color-${index}`}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                    />
                  ))}
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <BlueyButton title="Próximo →" onPress={handleNext} style={styles.btn} />
              </>
            )}

            {/* ── STEP 2: Visual Support ───────────────────────────────────── */}
            {step === 'visual' && (
              <>
                <Text style={styles.stepSubtitle}>Como as tarefas serão exibidas?</Text>
                {VISUAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.selectCard, visualSupport === opt.value && styles.selectCardActive]}
                    onPress={() => setVisualSupport(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectCardEmoji}>{opt.emoji}</Text>
                    <View style={styles.selectCardText}>
                      <Text style={[
                        styles.selectCardLabel,
                        visualSupport === opt.value && styles.selectCardLabelActive,
                      ]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.selectCardDesc}>{opt.desc}</Text>
                    </View>
                    <View style={[styles.radioOuter, visualSupport === opt.value && styles.radioOuterActive]}>
                      {visualSupport === opt.value && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={styles.navRow}>
                  <BlueyButton title="← Voltar" onPress={handleBack} type="secondary" style={styles.navBtn} />
                  <BlueyButton title="Próximo →" onPress={handleNext} style={styles.navBtn} />
                </View>
              </>
            )}

            {/* ── STEP 3: Sensory Profile ──────────────────────────────────── */}
            {step === 'sensory' && (
              <>
                <Text style={styles.stepSubtitle}>Ajude-nos a adaptar a experiência.</Text>

                {SENSORY_QUESTIONS.map((q) => (
                  <View key={q.key} style={styles.sensoryBlock}>
                    <Text style={styles.sensoryCategory}>{q.category}</Text>
                    <Text style={styles.sensoryQuestion}>{q.question}</Text>
                    {q.options.map((opt) => {
                      const isSelected = sensory[q.key] === opt.level;
                      return (
                        <TouchableOpacity
                          key={opt.level}
                          style={[styles.sensoryOption, isSelected && styles.sensoryOptionActive]}
                          onPress={() => setSensory((prev) => ({ ...prev, [q.key]: opt.level }))}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.sensoryOptionText,
                            isSelected && styles.sensoryOptionTextActive,
                          ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                <View style={styles.navRow}>
                  <BlueyButton title="← Voltar" onPress={handleBack} type="secondary" style={styles.navBtn} />
                  <BlueyButton title="Próximo →" onPress={handleNext} style={styles.navBtn} />
                </View>
              </>
            )}

            {/* ── STEP 4: PIN ──────────────────────────────────────────────── */}
            {step === 'pin' && (
              <>
                <View style={styles.pinContainer}>
                  <Text style={styles.pinEmoji}>{selectedIcon}</Text>
                  <Text style={styles.pinTitle}>PIN de {name}</Text>
                  <Text style={styles.pinSubtitle}>Crie um PIN de 4 dígitos fácil de lembrar</Text>
                  <PinInput onComplete={handlePinComplete} onPinChange={setPin} />
                  <View style={styles.pinHint}>
                    <Text style={styles.pinHintText}>
                      {'💡 Use datas especiais ou números favoritos da criança'}
                    </Text>
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.navRow}>
                  <BlueyButton title="← Voltar" onPress={handleBack} type="secondary" style={styles.navBtn} />
                  <BlueyButton
                    title={'✅ Criar'}
                    onPress={handleCreate}
                    loading={loading}
                    disabled={pin.length !== 4}
                    style={styles.navBtn}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <AccessCodesModal
        visible={createdChild !== null}
        child={createdChild}
        onClose={() => {
          setCreatedChild(null);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );

  function handlePinComplete(completedPin: string) {
    setPin(completedPin);
  }
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { ...Typography.titleMedium, color: BlueyColors.blueyDark },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },

  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BlueyColors.borderMedium,
  },
  dotDone: {
    backgroundColor: BlueyColors.blueyGreen,
  },
  dotActive: {
    width: 24,
    backgroundColor: BlueyColors.blueyMain,
  },

  content: { paddingHorizontal: 24, paddingBottom: 40 },

  stepSubtitle: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
    marginBottom: 20,
  },

  // Info step
  preview: {
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  previewEmoji: { fontSize: 64, marginBottom: 8 },
  previewName: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  sectionLabel: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  iconOption: {
    width: 52, height: 52, borderRadius: 14,
    borderWidth: 2, borderColor: BlueyColors.borderLight,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconOptionSelected: {
    borderColor: BlueyColors.blueyMain, borderWidth: 3,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  iconOptionText: { fontSize: 28 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: BlueyColors.textPrimary, borderWidth: 3 },

  // Select card (visual support)
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 18,
    marginBottom: 12,
    gap: 14,
  },
  selectCardActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  selectCardEmoji: { fontSize: 28 },
  selectCardText: { flex: 1 },
  selectCardLabel: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 2,
  },
  selectCardLabelActive: { color: BlueyColors.blueyDark },
  selectCardDesc: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BlueyColors.borderMedium,
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: BlueyColors.blueyMain },
  radioInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: BlueyColors.blueyMain,
  },

  // Sensory profile
  sensoryBlock: { marginBottom: 24 },
  sensoryCategory: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  sensoryQuestion: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 12,
  },
  sensoryOption: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sensoryOptionActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  sensoryOptionText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
  },
  sensoryOptionTextActive: {
    color: BlueyColors.blueyDark,
    fontFamily: 'Nunito_700Bold',
  },

  // PIN step
  pinContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  pinEmoji: { fontSize: 72, marginBottom: 12 },
  pinTitle: { ...Typography.headlineMedium, color: BlueyColors.textPrimary, marginBottom: 8 },
  pinSubtitle: {
    ...Typography.bodyMedium, color: BlueyColors.textSecondary,
    textAlign: 'center', marginBottom: 32,
  },
  pinHint: {
    marginTop: 24,
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 12,
    padding: 14,
  },
  pinHintText: { ...Typography.bodySmall, color: BlueyColors.textSecondary, textAlign: 'center' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtn: { flex: 1 },

  error: {
    ...Typography.bodySmall, color: BlueyColors.errorRed,
    textAlign: 'center', marginBottom: 12,
    backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10,
  },
  btn: { marginTop: 8 },
});
