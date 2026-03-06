import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useRewardsStore } from '../../stores/rewardsStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Reward } from '../../services/rewardsService';
import type { ParentStackParamList } from '../../types/navigation';

type RewardsRoute = RouteProp<ParentStackParamList, 'Rewards'>;

export const RewardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RewardsRoute>();
  const { childId, childName } = route.params;

  const { stars, rewards, loadForChild, resetStars, addReward, redeemReward, deleteReward } =
    useRewardsStore();

  const [newEmoji, setNewEmoji] = useState('🎁');
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadForChild(childId);
  }, [childId]);

  const handleAdd = async () => {
    const cost = parseInt(newCost, 10);
    if (!newTitle.trim() || isNaN(cost) || cost < 1) {
      Alert.alert('Dados inválidos', 'Preencha o título e o custo (mínimo 1 estrela).');
      return;
    }
    await addReward(childId, {
      title: newTitle.trim(),
      emoji: newEmoji || '🎁',
      starsRequired: cost,
    });
    setNewTitle('');
    setNewCost('');
    setNewEmoji('🎁');
    setShowForm(false);
  };

  const handleRedeem = (reward: Reward) => {
    Alert.alert(
      'Resgatar recompensa',
      `Confirmar resgate de "${reward.emoji} ${reward.title}"?\n\n${childName} precisa de ${reward.starsRequired} ⭐ e tem ${stars} ⭐.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resgatar',
          onPress: () => redeemReward(childId, reward.id),
        },
      ]
    );
  };

  const handleDelete = (reward: Reward) => {
    Alert.alert(
      'Excluir recompensa',
      `Excluir "${reward.emoji} ${reward.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteReward(childId, reward.id),
        },
      ]
    );
  };

  const handleResetStars = () => {
    Alert.alert(
      'Zerar estrelas',
      `Zerar todas as ${stars} estrelas de ${childName}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar',
          style: 'destructive',
          onPress: () => resetStars(childId),
        },
      ]
    );
  };

  const pending = rewards.filter((r) => !r.isRedeemed).sort((a, b) => a.starsRequired - b.starsRequired);
  const redeemed = rewards.filter((r) => r.isRedeemed);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Recompensas</Text>
            <Text style={styles.headerSub}>{childName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stars total */}
          <View style={styles.starsCard}>
            <Text style={styles.starsEmoji}>⭐</Text>
            <View style={styles.starsInfo}>
              <Text style={styles.starsTotal}>{stars} estrelas acumuladas</Text>
              <Text style={styles.starsHint}>Ganhas ao completar rotinas</Text>
            </View>
            {stars > 0 && (
              <TouchableOpacity onPress={handleResetStars} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Zerar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add new reward button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.addBtnText}>{showForm ? '✕ Cancelar' : '+ Nova recompensa'}</Text>
          </TouchableOpacity>

          {/* Add form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Nova recompensa</Text>
              <View style={styles.formRow}>
                <TextInput
                  style={styles.emojiInput}
                  value={newEmoji}
                  onChangeText={(t) => setNewEmoji(t.slice(-2))}
                  maxLength={2}
                  placeholder="🎁"
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Ex: Sorvete, Parque..."
                  maxLength={40}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.costLabel}>Estrelas necessárias:</Text>
                <TextInput
                  style={[styles.textInput, styles.costInput]}
                  value={newCost}
                  onChangeText={setNewCost}
                  placeholder="10"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Adicionar recompensa</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pending rewards */}
          {pending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>A conquistar</Text>
              {pending.map((r) => (
                <View key={r.id} style={styles.rewardCard}>
                  <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{r.title}</Text>
                    <Text style={styles.rewardCost}>
                      {stars}/{r.starsRequired} ⭐
                    </Text>
                  </View>
                  <View style={styles.rewardActions}>
                    {stars >= r.starsRequired && (
                      <TouchableOpacity
                        style={styles.redeemBtn}
                        onPress={() => handleRedeem(r)}
                      >
                        <Text style={styles.redeemBtnText}>Resgatar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(r)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Redeemed rewards */}
          {redeemed.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Já resgatadas</Text>
              {redeemed.map((r) => (
                <View key={r.id} style={[styles.rewardCard, styles.rewardCardRedeemed]}>
                  <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardTitle, styles.rewardTitleRedeemed]}>{r.title}</Text>
                    <Text style={styles.redeemedBadge}>RESGATADA ✓</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(r)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {rewards.length === 0 && !showForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>Nenhuma recompensa ainda</Text>
              <Text style={styles.emptyText}>
                Adicione uma recompensa para motivar {childName} a completar rotinas!
              </Text>
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  headerSub: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  starsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EDCC6F',
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  starsEmoji: { fontSize: 36 },
  starsInfo: { flex: 1 },
  starsTotal: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  starsHint: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  resetBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BlueyColors.errorRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetBtnText: { ...Typography.labelSmall, color: BlueyColors.errorRed },
  addBtn: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { ...Typography.labelMedium, color: '#fff' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  formTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emojiInput: {
    width: 52,
    height: 48,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  textInput: {
    height: 48,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  costLabel: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, flex: 1 },
  costInput: { width: 80 },
  saveBtn: {
    backgroundColor: BlueyColors.blueyGreen,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { ...Typography.labelMedium, color: '#fff' },
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
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    gap: 12,
  },
  rewardCardRedeemed: { opacity: 0.65 },
  rewardEmoji: { fontSize: 28 },
  rewardInfo: { flex: 1 },
  rewardTitle: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, fontFamily: 'Nunito_700Bold' },
  rewardTitleRedeemed: { textDecorationLine: 'line-through' },
  rewardCost: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginTop: 2 },
  redeemedBadge: { ...Typography.labelSmall, color: '#4CAF50', marginTop: 2 },
  rewardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  redeemBtn: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  redeemBtnText: { ...Typography.labelSmall, color: '#2E7D32' },
  deleteBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 18 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 8 },
  emptyText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, textAlign: 'center' },
});
