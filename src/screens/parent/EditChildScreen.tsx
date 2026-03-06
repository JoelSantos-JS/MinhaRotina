import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { PinInput } from '../../components/ui/PinInput';
import { childService } from '../../services/child.service';
import { feedbackService, DEFAULT_SETTINGS, VibrationIntensity, CelebrationStyle, SoundType } from '../../services/feedbackService';
import { soundService } from '../../services/soundService';
import { getTaskCompleteSound, type FavoriteInstrument } from '../../config/sounds';
import { useChildStore } from '../../stores/childStore';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { CHILD_ICONS, CHILD_COLORS } from '../../config/constants';
import type { VisualSupportType, SensoryProfile } from '../../types/models';
import type { ParentScreenProps } from '../../types/navigation';

type SensoryLevel = 'hyper-reactive' | 'typical' | 'hypo-reactive';

const VISUAL_OPTIONS: { value: VisualSupportType; label: string; desc: string; emoji: string }[] = [
  { value: 'images_text', label: 'Imagens + Texto', desc: 'Guia completo passo a passo.', emoji: '🖼️' },
  { value: 'reduced_text', label: 'Texto Reduzido', desc: 'Foco no essencial.', emoji: '📝' },
  { value: 'images_only', label: 'Apenas Imagens', desc: 'Experiência puramente visual.', emoji: '👁️' },
];

const SENSORY_QUESTIONS: {
  key: keyof SensoryProfile;
  category: string;
  options: { level: SensoryLevel; label: string }[];
}[] = [
  {
    key: 'auditory',
    category: 'Auditivo',
    options: [
      { level: 'hyper-reactive', label: 'Tapa os ouvidos / Chora' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Não parece notar / Busca o som' },
    ],
  },
  {
    key: 'visual',
    category: 'Visual',
    options: [
      { level: 'hyper-reactive', label: 'Evita a luz / Fecha os olhos' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Olha fixamente / Busca luzes' },
    ],
  },
  {
    key: 'tactile',
    category: 'Tátil',
    options: [
      { level: 'hyper-reactive', label: 'Incomoda-se muito / Recusa' },
      { level: 'typical', label: 'Reação comum' },
      { level: 'hypo-reactive', label: 'Parece não sentir / Busca texturas' },
    ],
  },
];

export const EditChildScreen: React.FC<ParentScreenProps<'EditChild'>> = ({ navigation, route }) => {
  const { childId } = route.params;
  const { children, updateChild, removeChild } = useChildStore();
  const parent = useAuthStore((s) => s.parent);
  const child = children.find((c) => c.id === childId);

  const [name, setName] = useState(child?.name ?? '');
  const [age, setAge] = useState(String(child?.age ?? ''));
  const [selectedIcon, setSelectedIcon] = useState<string>(child?.icon_emoji ?? CHILD_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(child?.color_theme ?? CHILD_COLORS[0]);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vibration, setVibration] = useState<VibrationIntensity>('medium');
  const [celebration, setCelebration] = useState<CelebrationStyle>('special');
  const [soundType, setSoundType] = useState<SoundType>('music');
  const [musicVolume, setMusicVolume] = useState<number>(0.65);
  const [favoriteInstrument, setFavoriteInstrument] = useState<FavoriteInstrument>('piano');
  const [visualSupport, setVisualSupport] = useState<VisualSupportType>(
    child?.visual_support_type ?? 'images_text'
  );
  const [sensory, setSensory] = useState<SensoryProfile>(
    child?.sensory_profile ?? { auditory: 'typical', visual: 'typical', tactile: 'typical' }
  );

  useEffect(() => {
    feedbackService.getSettings(childId).then((s) => {
      setVibration(s.vibrationIntensity);
      setCelebration(s.celebrationStyle);
      setSoundType(s.soundType);
      setMusicVolume(s.musicVolume);
      setFavoriteInstrument(s.favoriteInstrument);
    });
  }, [childId]);

  if (!child) return null;

  const handleSave = async () => {
    if (!name.trim()) { setError('Digite o nome da criança.'); return; }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
      setError('Digite uma idade válida (1-18).');
      return;
    }
    if (changingPin && newPin.length !== 4) {
      setError('O novo PIN deve ter 4 dígitos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const updates: any = {
        name: name.trim(),
        age: ageNum,
        color_theme: selectedColor,
        icon_emoji: selectedIcon,
        visual_support_type: visualSupport,
        sensory_profile: sensory,
      };
      if (changingPin && newPin.length === 4) updates.pin = newPin;
      const updated = await childService.updateChild(childId, updates, parent?.id);
      updateChild(updated);
      await feedbackService.saveSettings(childId, {
        vibrationIntensity: vibration,
        celebrationStyle: celebration,
        soundType,
        musicVolume,
        favoriteInstrument,
      });
      Alert.alert('✅ Salvo!', `Perfil de ${updated.name} atualizado.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '🗑️ Deletar criança',
      `Tem certeza que deseja deletar ${child.name}? Todas as rotinas serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await childService.deleteChild(childId);
              removeChild(childId);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Erro', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.greenVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Criança</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Deletar</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: selectedColor + '33' }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
            <Text style={styles.previewName}>{name || child.name}</Text>
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

          {/* Theme picker link */}
          <TouchableOpacity
            style={styles.themeLink}
            onPress={() => navigation.navigate('ThemePicker', { childId })}
          >
            <Text style={styles.themeLinkEmoji}>🎨</Text>
            <Text style={styles.themeLinkText}>Personalizar Tema Visual</Text>
            <Text style={styles.themeLinkArrow}>›</Text>
          </TouchableOpacity>

          {/* PIN change */}
          <TouchableOpacity
            style={styles.pinToggle}
            onPress={() => { setChangingPin(!changingPin); setNewPin(''); }}
          >
            <Text style={styles.pinToggleText}>
              {changingPin ? '❌ Cancelar troca de PIN' : '🔑 Alterar PIN'}
            </Text>
          </TouchableOpacity>

          {changingPin && (
            <View style={styles.pinContainer}>
              <Text style={styles.pinTitle}>Novo PIN de {name || child.name}</Text>
              <Text style={styles.pinSubtitle}>Digite um PIN de 4 dígitos</Text>
              <PinInput onComplete={setNewPin} onPinChange={setNewPin} />
            </View>
          )}

          {/* Visual Support */}
          <Text style={styles.sectionLabel}>🖼️ Suporte Visual</Text>
          {VISUAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.selectCard, visualSupport === opt.value && styles.selectCardActive]}
              onPress={() => setVisualSupport(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectCardEmoji}>{opt.emoji}</Text>
              <View style={styles.selectCardText}>
                <Text style={[styles.selectCardLabel, visualSupport === opt.value && styles.selectCardLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.selectCardDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radioOuter, visualSupport === opt.value && styles.radioOuterActive]}>
                {visualSupport === opt.value && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Sensory Profile */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>🧠 Perfil Sensorial</Text>
          {SENSORY_QUESTIONS.map((q) => (
            <View key={q.key} style={styles.sensoryBlock}>
              <Text style={styles.sensoryCategory}>{q.category}</Text>
              <View style={styles.optionRow}>
                {q.options.map((opt) => {
                  const isSelected = sensory[q.key] === opt.level;
                  return (
                    <TouchableOpacity
                      key={opt.level}
                      style={[styles.optionBtn, isSelected && styles.optionBtnActive, { minWidth: 0 }]}
                      onPress={() => setSensory((prev) => ({ ...prev, [q.key]: opt.level }))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive, { fontSize: 10 }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Tipo de Feedback Sonoro */}
          <Text style={styles.sectionLabel}>🎵 Tipo de Feedback Sonoro</Text>
          <View style={styles.optionRow}>
            {([
              { value: 'music'     as SoundType, label: 'Música',    emoji: '🎵' },
              { value: 'vibration' as SoundType, label: 'Vibração',  emoji: '📳' },
              { value: 'silent'    as SoundType, label: 'Silencioso', emoji: '🔇' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, soundType === opt.value && styles.optionBtnActive]}
                onPress={() => setSoundType(opt.value)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, soundType === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {soundType === 'music' && (
            <>
              {/* Instrumento Favorito */}
              <Text style={styles.sectionLabel}>🎸 Instrumento Favorito</Text>
              <View style={styles.optionRow}>
                {([
                  { value: 'piano'   as FavoriteInstrument, label: 'Piano',   emoji: '🎹' },
                  { value: 'violin'  as FavoriteInstrument, label: 'Violino', emoji: '🎻' },
                  { value: 'kalimba' as FavoriteInstrument, label: 'Kalimba', emoji: '🪗' },
                  { value: 'mixed'   as FavoriteInstrument, label: 'Misto',   emoji: '🎶' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionBtn, favoriteInstrument === opt.value && styles.optionBtnActive]}
                    onPress={() => setFavoriteInstrument(opt.value)}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, favoriteInstrument === opt.value && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Volume da Música */}
              <Text style={styles.sectionLabel}>🔊 Volume da Música</Text>
              <View style={styles.optionRow}>
                {([
                  { value: 0.3,  label: '30%' },
                  { value: 0.5,  label: '50%' },
                  { value: 0.75, label: '75%' },
                  { value: 1.0,  label: '100%' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionBtn, Math.abs(musicVolume - opt.value) < 0.01 && styles.optionBtnActive]}
                    onPress={() => setMusicVolume(opt.value)}
                  >
                    <Text style={[
                      styles.optionLabel,
                      Math.abs(musicVolume - opt.value) < 0.01 && styles.optionLabelActive,
                      { fontSize: 14 },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview de áudio */}
              <TouchableOpacity
                style={styles.previewSoundBtn}
                onPress={() =>
                  soundService.playNote(getTaskCompleteSound(favoriteInstrument), musicVolume)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.previewSoundEmoji}>▶️</Text>
                <Text style={styles.previewSoundText}>Tocar preview do instrumento</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Feedback / Vibração */}
          <Text style={styles.sectionLabel}>📳 Vibração ao Completar Tarefa</Text>
          <View style={styles.optionRow}>
            {([
              { value: 'off' as VibrationIntensity, label: 'Desligada', emoji: '🔕' },
              { value: 'light' as VibrationIntensity, label: 'Suave', emoji: '〰️' },
              { value: 'medium' as VibrationIntensity, label: 'Média', emoji: '📳' },
              { value: 'strong' as VibrationIntensity, label: 'Forte', emoji: '💥' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, vibration === opt.value && styles.optionBtnActive]}
                onPress={() => {
                  setVibration(opt.value);
                  feedbackService.previewVibration(opt.value);
                }}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, vibration === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>🎉 Celebração ao Concluir Rotina</Text>
          <View style={styles.optionRow}>
            {([
              { value: 'silent' as CelebrationStyle, label: 'Só visual', emoji: '🎊' },
              { value: 'normal' as CelebrationStyle, label: 'Normal', emoji: '✅' },
              { value: 'special' as CelebrationStyle, label: 'Especial', emoji: '🥳' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, celebration === opt.value && styles.optionBtnActive]}
                onPress={() => setCelebration(opt.value)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, celebration === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <BlueyButton
            title="✅ Salvar Alterações"
            onPress={handleSave}
            loading={loading}
            style={styles.btn}
          />
        </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

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
  deleteText: { ...Typography.labelSmall, color: BlueyColors.errorRed },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
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
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconOptionSelected: {
    borderColor: BlueyColors.blueyMain,
    borderWidth: 3,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  iconOptionText: { fontSize: 28 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: BlueyColors.textPrimary, borderWidth: 3 },
  pinToggle: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  pinToggleText: { ...Typography.labelMedium, color: BlueyColors.blueyDark },
  pinContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  pinTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 6 },
  pinSubtitle: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, marginBottom: 24 },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
  },
  btn: { marginTop: 8 },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  optionBtn: {
    flex: 1,
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: '#fff',
  },
  optionBtnActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  optionEmoji: { fontSize: 20, marginBottom: 4 },
  optionLabel: { ...Typography.labelSmall, color: BlueyColors.textSecondary, textAlign: 'center' },
  optionLabelActive: { color: BlueyColors.blueyDark },
  selectCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 2,
    borderColor: BlueyColors.borderMedium, padding: 14, marginBottom: 8, gap: 12,
  },
  selectCardActive: { borderColor: BlueyColors.blueyMain, backgroundColor: BlueyColors.backgroundBlue },
  selectCardEmoji: { fontSize: 22 },
  selectCardText: { flex: 1 },
  selectCardLabel: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, marginBottom: 1 },
  selectCardLabelActive: { color: BlueyColors.blueyDark, fontFamily: 'Nunito_700Bold' },
  selectCardDesc: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BlueyColors.borderMedium,
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: BlueyColors.blueyMain },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BlueyColors.blueyMain },
  sensoryBlock: { marginBottom: 16 },
  sensoryCategory: { ...Typography.labelSmall, color: BlueyColors.textSecondary, marginBottom: 6 },
  previewSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  previewSoundEmoji: { fontSize: 20 },
  previewSoundText: { ...Typography.bodyMedium, color: BlueyColors.blueyDark },
  themeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  themeLinkEmoji: { fontSize: 22 },
  themeLinkText: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, flex: 1 },
  themeLinkArrow: { ...Typography.titleLarge, color: BlueyColors.textPlaceholder, fontSize: 22 },
});
