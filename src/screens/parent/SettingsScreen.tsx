import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { useParentSettingsStore } from '../../stores/parentSettingsStore';
import { authService } from '../../services/auth.service';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentAdvancedSettings } from '../../services/parentSettingsService';
import type { ParentStackParamList } from '../../types/navigation';

interface ToggleRowProps {
  emoji: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ emoji, label, description, value, onToggle, isLast }) => (
  <View style={[styles.toggleRow, isLast && styles.toggleRowLast]}>
    <Text style={styles.toggleEmoji}>{emoji}</Text>
    <View style={styles.toggleText}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: BlueyColors.borderMedium, true: BlueyColors.blueyMain }}
      thumbColor="#fff"
    />
  </View>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParentStackParamList>>();
  const parent = useAuthStore((s) => s.parent);
  const logout = useAuthStore((s) => s.logout);
  const { settings, updateSettings } = useParentSettingsStore();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const toggle = (key: keyof ParentAdvancedSettings) => {
    if (!parent?.id) return;
    updateSettings(parent.id, { [key]: !settings[key] });
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (isDeletingAccount) return;

    Alert.alert('Excluir conta', 'Esta ação exclui conta e dados associados. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Confirmação final', 'Exclusão definitiva. Esta operação não pode ser desfeita.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir definitivamente',
              style: 'destructive',
              onPress: async () => {
                setIsDeletingAccount(true);
                try {
                  await authService.deleteMyAccount();
                  logout();
                  Alert.alert('Conta excluída', 'Sua conta e dados foram removidos.');
                } catch (error: any) {
                  Alert.alert('Erro ao excluir conta', error?.message || 'Tente novamente.');
                } finally {
                  setIsDeletingAccount(false);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarCircle}>
              {parent?.photo_url ? (
                <Image source={{ uri: parent.photo_url }} style={styles.profileAvatarPhoto} />
              ) : (
                <Text style={styles.profileAvatarEmoji}>{'\u{1F464}'}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{parent?.name}</Text>
              <Text style={styles.profileEmail}>{parent?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.settingEmoji}>{'\u270F\uFE0F'}</Text>
              <Text style={styles.settingLabel}>Editar perfil</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.settingEmoji}>{'\u{1F512}'}</Text>
              <Text style={styles.settingLabel}>Alterar senha</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Onboarding', { fromSettings: true })}
            >
              <Text style={styles.settingEmoji}>{'\u{1F4D8}'}</Text>
              <Text style={styles.settingLabel}>Ver tutorial novamente</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Suggestions')}>
              <Text style={styles.settingEmoji}>{'\u{1F4A1}'}</Text>
              <Text style={styles.settingLabel}>Enviar sugestões e melhorias</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('About')}>
              <Text style={styles.settingEmoji}>{'\u2139\uFE0F'}</Text>
              <Text style={styles.settingLabel}>Sobre o app</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.settingEmoji}>{'\u{1F4C4}'}</Text>
              <Text style={styles.settingLabel}>Termos de uso</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.settingEmoji}>{'\u{1F510}'}</Text>
              <Text style={styles.settingLabel}>Política de privacidade</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Strategies', {})}>
              <Text style={styles.settingEmoji}>{'\u{1F9E0}'}</Text>
              <Text style={styles.settingLabel}>Estratégias para autismo</Text>
              <Text style={styles.settingArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONFIGURAÇÕES AVANÇADAS</Text>
            <ToggleRow
              emoji={'\u{1F4A1}'}
              label="Alertas Educativos"
              description="Card informativo ao criar tarefas sensoriais"
              value={settings.educationalAlertsEnabled}
              onToggle={() => toggle('educationalAlertsEnabled')}
            />
            <ToggleRow
              emoji={'\u{1F50D}'}
              label="Detecção Sensorial Automática"
              description="Identificar tarefas sensoriais pelo nome automaticamente"
              value={settings.autoSensoryDetectionEnabled}
              onToggle={() => toggle('autoSensoryDetectionEnabled')}
            />
            <ToggleRow
              emoji={'\u{1F389}'}
              label="Mini-celebrações"
              description="Particulas ao completar cada passo da tarefa"
              value={settings.miniCelebrationsEnabled}
              onToggle={() => toggle('miniCelebrationsEnabled')}
            />
            <ToggleRow
              emoji={'\u{1F614}'}
              label={'Botão "Não consigo"'}
              description="Botão de saída/pulo na tela da criança"
              value={settings.helpButtonEnabled}
              onToggle={() => toggle('helpButtonEnabled')}
              isLast
            />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeletingAccount && styles.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <Text style={styles.deleteText}>
              {isDeletingAccount ? 'Excluindo conta...' : 'Excluir conta e dados'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.version}>Minha Rotina v1.0.0</Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { ...Typography.headlineMedium, color: BlueyColors.textPrimary },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  profileAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BlueyColors.backgroundBlue,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarPhoto: { width: 52, height: 52, borderRadius: 26 },
  profileAvatarEmoji: { fontSize: 26 },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  profileEmail: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
  },
  settingEmoji: { fontSize: 20, width: 28, textAlign: 'center', marginRight: 12 },
  settingLabel: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, flex: 1 },
  settingArrow: { fontSize: 22, color: BlueyColors.textPlaceholder },
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.errorRed,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutText: { ...Typography.labelMedium, color: BlueyColors.errorRed },
  deleteBtn: {
    backgroundColor: '#FFE6E6',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C62828',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteText: { ...Typography.labelMedium, color: '#B71C1C' },
  version: {
    ...Typography.bodySmall,
    color: BlueyColors.textPlaceholder,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
  },
  toggleRowLast: {
    borderBottomWidth: 0,
  },
  toggleEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  toggleText: { flex: 1 },
  toggleLabel: {
    ...Typography.bodyMedium,
    fontFamily: 'Nunito_700Bold',
    color: BlueyColors.textPrimary,
  },
  toggleDesc: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 2,
  },
});
