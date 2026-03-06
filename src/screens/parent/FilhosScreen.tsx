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
import { AccessCodesModal } from '../../components/modals/AccessCodesModal';
import { childService } from '../../services/child.service';
import { rewardsService } from '../../services/rewardsService';
import type { ChildAccount } from '../../types/models';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChildCard } from '../../components/cards/ChildCard';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useChildStore } from '../../stores/childStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ParentStackParamList>;

export const FilhosScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const parent = useAuthStore((s) => s.parent);
  const { children, isLoading, fetchChildren, updateChild } = useChildStore();
  const [codesChild, setCodesChild] = useState<ChildAccount | null>(null);
  const [starsMap, setStarsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (parent?.id) {
      fetchChildren(parent.id);
    }
  }, [parent?.id]);

  useEffect(() => {
    if (!children.length) return;
    Promise.all(
      children.map(async (c) => [c.id, await rewardsService.getStars(c.id)] as const)
    ).then((entries) => setStarsMap(Object.fromEntries(entries)));
  }, [children]);

  const handleRegeneratePin = async () => {
    if (!codesChild) return;
    try {
      const { child: updated, newPin } = await childService.regeneratePin(codesChild.id, parent?.id);
      updateChild(updated);
      setCodesChild(updated);
      Alert.alert('Novo PIN gerado!', `Novo PIN de ${updated.name}: ${newPin}\n\nAnote antes de fechar!`);
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Minhas Crianças</Text>
            <Text style={styles.headerSub}>
              {children.length} criança{children.length !== 1 ? 's' : ''} cadastrada{children.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateChild')}
          >
            <Text style={styles.addBtnText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <LoadingSpinner message="Carregando..." />
          ) : children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>:-)</Text>
              <Text style={styles.emptyTitle}>Nenhuma criança ainda</Text>
              <Text style={styles.emptyText}>
                Adicione uma criança para começar a criar rotinas personalizadas para ela!
              </Text>
              <BlueyButton
                title="+ Cadastrar criança"
                onPress={() => navigation.navigate('CreateChild')}
                type="primary"
                style={styles.emptyBtn}
              />
            </View>
          ) : (
            <>
              {children.map((child) => (
                <View key={child.id} style={styles.childBlock}>
                  <ChildCard
                    child={child}
                    onPress={() =>
                      navigation.navigate('ManageRoutines', { childId: child.id })
                    }
                    onSettings={() =>
                      navigation.navigate('EditChild', { childId: child.id })
                    }
                  />
                  <View style={styles.childActions}>
                    {/* Child mode entry */}
                    <TouchableOpacity
                      style={[
                        styles.childModeBtn,
                        { borderColor: child.color_theme ?? BlueyColors.blueyMain, flex: 1 },
                      ]}
                      onPress={() =>
                        navigation.navigate('ChildLogin', { childId: child.id })
                      }
                    >
                      <Text style={styles.childModeBtnText} numberOfLines={1}>
                        Entrar como {child.name.split(' ')[0]}
                      </Text>
                      <Text style={styles.childModeBtnArrow}>›</Text>
                    </TouchableOpacity>
                    {/* Stars / Rewards button */}
                    <TouchableOpacity
                      style={styles.codesBtn}
                      onPress={() =>
                        navigation.navigate('Rewards', { childId: child.id, childName: child.name })
                      }
                    >
                      <Text style={styles.codesBtnText}>⭐</Text>
                      <Text style={styles.starsBadgeText}>{starsMap[child.id] ?? 0}</Text>
                    </TouchableOpacity>
                    {/* Progress button */}
                    <TouchableOpacity
                      style={styles.codesBtn}
                      onPress={() =>
                        navigation.navigate('Progress', { childId: child.id })
                      }
                    >
                      <Text style={styles.codesBtnText}>📊</Text>
                    </TouchableOpacity>
                    {/* Access codes button */}
                    <TouchableOpacity
                      style={styles.codesBtn}
                      onPress={() => setCodesChild(child)}
                    >
                      <Text style={styles.codesBtnText}>PIN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.infoBox}>
                <Text style={styles.infoEmoji}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Toque no card para gerenciar rotinas. Use{' '}
                  <Text style={{ fontWeight: '700' }}>"Entrar como..."</Text>
                  {' '}para ativar o modo criança com PIN.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <AccessCodesModal
        visible={codesChild !== null}
        child={codesChild}
        onClose={() => setCodesChild(null)}
        onRegeneratePin={handleRegeneratePin}
      />
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
  headerTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
  },
  headerSub: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addBtnText: {
    ...Typography.labelSmall,
    color: '#fff',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyBtn: {
    width: '100%',
  },
  childBlock: {
    marginBottom: 4,
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -4,
    marginBottom: 12,
  },
  childModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  codesBtn: {
    width: 48,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codesBtnText: { fontSize: 22 },
  starsBadgeText: { ...Typography.labelSmall, color: BlueyColors.textPrimary, fontSize: 11 },
  childModeBtnText: {
    ...Typography.labelMedium,
    color: BlueyColors.blueyDark,
    flex: 1,
  },
  childModeBtnArrow: {
    color: BlueyColors.textPlaceholder,
    fontSize: 20,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
  },
  infoEmoji: { fontSize: 20 },
  infoText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    flex: 1,
  },
});

