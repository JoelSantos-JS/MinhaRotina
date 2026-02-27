import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useChildStore } from '../../stores/childStore';
import { useThemeStore } from '../../stores/themeStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { THEME_LIST, type ThemeId } from '../../theme/themes';
import type { ParentScreenProps } from '../../types/navigation';

export const ThemePickerScreen: React.FC<ParentScreenProps<'ThemePicker'>> = ({
  navigation,
  route,
}) => {
  const { childId } = route.params;
  const { children } = useChildStore();
  const { saveThemeForChild, loadThemeForChild, activeTheme } = useThemeStore();
  const child = children.find((c) => c.id === childId);

  const [selected, setSelected] = useState<ThemeId>('bluey');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadThemeForChild(childId).then(() => {
      setSelected(activeTheme.id);
    });
  }, [childId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveThemeForChild(childId, selected);
      Alert.alert('✅ Tema salvo!', `Tema "${THEME_LIST.find((t) => t.id === selected)?.name}" aplicado para ${child?.name}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o tema.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tema Visual</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introEmoji}>{child?.icon_emoji ?? '🌸'}</Text>
            <View style={styles.introText}>
              <Text style={styles.introTitle}>Personalizar para {child?.name}</Text>
              <Text style={styles.introSub}>Escolha a paleta que mais combina com ela</Text>
            </View>
          </View>

          {/* Theme cards */}
          {THEME_LIST.map((theme) => {
            const isActive = selected === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setSelected(theme.id)}
                activeOpacity={0.85}
                style={[
                  styles.themeCard,
                  isActive && { borderColor: theme.successColor, borderWidth: 3 },
                ]}
              >
                {/* Preview strip */}
                <View style={[styles.previewStrip, { backgroundColor: theme.primaryColor }]}>
                  <View style={[styles.previewCard, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={styles.previewEmoji}>⭐</Text>
                    <Text style={[styles.previewTask, { color: theme.textPrimary }]}>Tarefa exemplo</Text>
                    <View style={[styles.previewBtn, { backgroundColor: theme.successColor }]}>
                      <Text style={[styles.previewBtnText, { color: theme.buttonText }]}>FEITO!</Text>
                    </View>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.themeInfo}>
                  <View style={styles.themeHeader}>
                    <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    {isActive && <Text style={styles.activeBadge}>✓ Ativo</Text>}
                  </View>
                  <Text style={styles.themeDesc}>{theme.description}</Text>

                  {/* Intensity dots */}
                  <View style={styles.intensityRow}>
                    <Text style={styles.intensityLabel}>Intensidade: </Text>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: i < theme.intensity ? theme.primaryColor : BlueyColors.borderLight },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={BlueyGradients.greenHorizontal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : '✅ Salvar Tema'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  introEmoji: { fontSize: 40 },
  introText: { flex: 1 },
  introTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  introSub: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  themeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    marginBottom: 14,
    overflow: 'hidden',
  },
  previewStrip: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  previewCard: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: '70%',
    gap: 6,
  },
  previewEmoji: { fontSize: 24 },
  previewTask: { ...Typography.bodySmall, fontFamily: 'Nunito_700Bold' },
  previewBtn: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  previewBtnText: { ...Typography.labelSmall, fontSize: 11 },
  themeInfo: { padding: 14 },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  themeEmoji: { fontSize: 22 },
  themeName: { ...Typography.titleMedium, color: BlueyColors.textPrimary, flex: 1 },
  activeBadge: {
    ...Typography.labelSmall,
    color: BlueyColors.successGreen,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  themeDesc: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginBottom: 10 },
  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  intensityLabel: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  saveBtn: { borderRadius: 26, overflow: 'hidden', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { ...Typography.labelMedium, color: '#fff' },
});
