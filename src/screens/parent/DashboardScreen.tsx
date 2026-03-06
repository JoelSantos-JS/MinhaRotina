import React, { useCallback } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useChildStore } from '../../stores/childStore';
import { authService } from '../../services/auth.service';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ParentStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const parent = useAuthStore((s) => s.parent);
  const logout = useAuthStore((s) => s.logout);
  const { children, isLoading, fetchChildren } = useChildStore();

  useFocusEffect(
    useCallback(() => {
      if (parent?.id) {
        fetchChildren(parent.id);
      }
    }, [parent?.id])
  );

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.parentName}>{parent?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: BlueyColors.backgroundBlue }]}>
              <Text style={styles.summaryEmoji}>👧</Text>
              <Text style={styles.summaryNumber}>{children.length}</Text>
              <Text style={styles.summaryLabel}>Criança{children.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: BlueyColors.backgroundGreen }]}>
              <Text style={styles.summaryEmoji}>🗓️</Text>
              <Text style={styles.summaryNumber}>{new Date().getDate()}</Text>
              <Text style={styles.summaryLabel}>
                {new Date().toLocaleDateString('pt-BR', { month: 'short' })}
              </Text>
            </View>
          </View>

          {/* Welcome banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeEmoji}>🌟</Text>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                Bem-vindo, {parent?.name?.split(' ')[0]}!
              </Text>
              <Text style={styles.welcomeText}>
                Use as abas abaixo para gerenciar rotinas, ver o diário e muito mais.
              </Text>
            </View>
          </View>

          {/* Children quick access */}
          {isLoading ? (
            <LoadingSpinner message="Carregando..." />
          ) : children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👶</Text>
              <Text style={styles.emptyTitle}>Nenhuma criança cadastrada</Text>
              <Text style={styles.emptyText}>
                Vá até a aba{' '}
                <Text style={styles.emptyHighlight}>FILHOS</Text>
                {' '}para adicionar sua primeira criança!
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Acesso rápido</Text>
              {children.map((child) => (
                <View
                  key={child.id}
                  style={[
                    styles.childRow,
                    { borderLeftColor: child.color_theme ?? BlueyColors.blueyMain },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.childRowMain}
                    onPress={() =>
                      navigation.navigate('ManageRoutines', { childId: child.id })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.childEmoji}>{child.icon_emoji}</Text>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>{child.age} anos · Gerenciar rotinas</Text>
                    </View>
                    <Text style={styles.childArrow}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.progressBtn}
                    onPress={() =>
                      navigation.navigate('Progress', { childId: child.id })
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={styles.progressBtnEmoji}>📊</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Quick tip */}
          <View style={styles.tipBanner}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              Acesse a aba{' '}
              <Text style={styles.tipHighlight}>BIBLIOTECA</Text>
              {' '}para estratégias sensoriais baseadas em evidências.
            </Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
  },
  parentName: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
  },
  logoutBtn: {
    backgroundColor: BlueyColors.borderMedium,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    alignItems: 'center',
  },
  summaryEmoji: { fontSize: 28, marginBottom: 4 },
  summaryNumber: {
    ...Typography.headlineLarge,
    color: BlueyColors.textPrimary,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  welcomeEmoji: { fontSize: 36 },
  welcomeContent: { flex: 1 },
  welcomeTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 4,
  },
  welcomeText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },
  emptyHighlight: {
    color: BlueyColors.blueyDark,
    fontWeight: '800',
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 12,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    borderLeftWidth: 5,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    marginBottom: 10,
  },
  childRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  progressBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BlueyColors.backgroundBlue,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  progressBtnEmoji: { fontSize: 18 },
  childEmoji: { fontSize: 32 },
  childInfo: { flex: 1 },
  childName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
  },
  childAge: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  childArrow: {
    ...Typography.titleLarge,
    color: BlueyColors.textPlaceholder,
    fontSize: 24,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: BlueyColors.bingoMain,
  },
  tipEmoji: { fontSize: 20 },
  tipText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  tipHighlight: {
    color: BlueyColors.blueyDark,
    fontWeight: '800',
  },
});
