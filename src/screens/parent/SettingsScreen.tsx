import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth.service';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentStackParamList } from '../../types/navigation';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ParentStackParamList>>();
  const parent = useAuthStore((s) => s.parent);
  const logout = useAuthStore((s) => s.logout);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile */}
          <View style={styles.profileCard}>
            <Text style={styles.profileEmoji}>👤</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{parent?.name}</Text>
              <Text style={styles.profileEmail}>{parent?.email}</Text>
            </View>
          </View>

          {/* Settings list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.settingEmoji}>✏️</Text>
              <Text style={styles.settingLabel}>Editar perfil</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.settingEmoji}>🔒</Text>
              <Text style={styles.settingLabel}>Alterar senha</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('About')}>
              <Text style={styles.settingEmoji}>ℹ️</Text>
              <Text style={styles.settingLabel}>Sobre o app</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.settingEmoji}>📋</Text>
              <Text style={styles.settingLabel}>Termos de uso</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Strategies', {})}>
              <Text style={styles.settingEmoji}>💡</Text>
              <Text style={styles.settingLabel}>Estratégias para autismo</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair da conta</Text>
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
  profileEmoji: { fontSize: 52 },
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
  settingEmoji: { fontSize: 22, marginRight: 12 },
  settingLabel: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, flex: 1 },
  settingArrow: { ...Typography.titleLarge, color: BlueyColors.textPlaceholder },
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.errorRed,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: { ...Typography.labelMedium, color: BlueyColors.errorRed },
  version: {
    ...Typography.bodySmall,
    color: BlueyColors.textPlaceholder,
    textAlign: 'center',
  },
});
