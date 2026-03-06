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
import { BlueyButton } from '../../components/ui/BlueyButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useChildStore } from '../../stores/childStore';
import { useRoutineStore } from '../../stores/routineStore';
import { routineService } from '../../services/routine.service';
import { routineCalendarService, DAY_LABELS } from '../../services/routineCalendarService';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { ROUTINE_TYPES } from '../../config/constants';
import type { Routine } from '../../types/models';
import type { ParentScreenProps } from '../../types/navigation';

export const ManageRoutinesScreen: React.FC<ParentScreenProps<'ManageRoutines'>> = ({
  navigation,
  route,
}) => {
  const { childId } = route.params;
  const { children } = useChildStore();
  const { routines, isLoading, fetchRoutines, addRoutine } = useRoutineStore();

  const child = children.find((c) => c.id === childId);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedType, setSelectedType] = useState<Routine['type']>('morning');
  const [creating, setCreating] = useState(false);
  const [daysMap, setDaysMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    fetchRoutines(childId);
  }, [childId]);

  useEffect(() => {
    const ids = routines.filter((r) => r.child_id === childId).map((r) => r.id);
    if (!ids.length) return;
    routineCalendarService.getDaysForRoutines(ids).then(setDaysMap);
  }, [routines, childId]);

  const handleCreateRoutine = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const routine = await routineService.createRoutine(childId, newName.trim(), selectedType);
      addRoutine(routine);
      setShowCreate(false);
      setNewName('');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRoutine = async (routine: Routine) => {
    try {
      await routineService.toggleRoutine(routine.id, !routine.is_active);
      fetchRoutines(childId);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      'Deletar rotina',
      `Tem certeza que deseja deletar "${routine.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            await routineService.deleteRoutine(routine.id);
            fetchRoutines(childId);
          },
        },
      ]
    );
  };

  const toggleDay = async (routineId: string, day: number) => {
    const current = daysMap[routineId] ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    await routineCalendarService.setDays(routineId, next);
    setDaysMap((prev) => ({ ...prev, [routineId]: next }));
  };

  const getTypeInfo = (type: string) =>
    ROUTINE_TYPES.find((r) => r.value === type) ?? ROUTINE_TYPES[0];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.childEmoji}>{child?.icon_emoji}</Text>
            <Text style={styles.headerTitle}>Rotinas de {child?.name}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <LoadingSpinner message="Carregando rotinas..." />
          ) : (
            <>
              {routines.filter((r) => r.child_id === childId).length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyText}>Nenhuma rotina criada ainda.</Text>
                </View>
              )}

              {routines
                .filter((r) => r.child_id === childId)
                .map((routine) => {
                  const typeInfo = getTypeInfo(routine.type);
                  const activeDays = daysMap[routine.id] ?? [];
                  return (
                    <View key={routine.id} style={styles.routineWrapper}>
                      <View style={styles.routineCard}>
                        <Text style={styles.routineEmoji}>{typeInfo.emoji}</Text>
                        <View style={styles.routineInfo}>
                          <Text style={styles.routineName} numberOfLines={1}>{routine.name}</Text>
                          <Text style={styles.routineType}>{typeInfo.label}</Text>
                        </View>
                        <View style={styles.routineActions}>
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('AddTask', {
                                routineId: routine.id,
                                childId,
                              })
                            }
                            style={styles.actionBtn}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.actionBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleToggleRoutine(routine)}
                            style={[
                              styles.actionBtn,
                              routine.is_active ? styles.toggleActive : styles.toggleInactive,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.actionBtnText}>
                              {routine.is_active ? '✅' : '⏸️'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteRoutine(routine)}
                            style={[styles.actionBtn, styles.deleteBtn]}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.actionBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.daySelectorRow}>
                        {DAY_LABELS.map((label, index) => {
                          const active = activeDays.includes(index);
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[styles.dayPill, active && styles.dayPillActive]}
                              onPress={() => toggleDay(routine.id, index)}
                            >
                              <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {activeDays.length === 0 && (
                        <Text style={styles.daySelectorHint}>Disponível todos os dias</Text>
                      )}
                    </View>
                  );
                })}

              {/* Templates shortcut */}
              {!showCreate && (
                <TouchableOpacity
                  style={styles.templatesBtn}
                  onPress={() => navigation.navigate('RoutineTemplates', { childId })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.templatesBtnText}>📋 Usar um template pronto</Text>
                </TouchableOpacity>
              )}

              {/* Create routine form */}
              {showCreate ? (
                <View style={styles.createForm}>
                  <Text style={styles.createTitle}>Nova Rotina</Text>

                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Nome da rotina (ex: Manhã da semana)"
                    placeholderTextColor={BlueyColors.textPlaceholder}
                    style={styles.createInput}
                    autoFocus
                  />

                  <View style={styles.typeGrid}>
                    {ROUTINE_TYPES.map((rt) => (
                      <TouchableOpacity
                        key={rt.value}
                        onPress={() => setSelectedType(rt.value as Routine['type'])}
                        style={[
                          styles.typeOption,
                          selectedType === rt.value && styles.typeOptionSelected,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.typeOptionEmoji}>{rt.emoji}</Text>
                        <Text style={styles.typeOptionLabel} numberOfLines={1} adjustsFontSizeToFit>
                          {rt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.createActions}>
                    <BlueyButton
                      title="Cancelar"
                      onPress={() => setShowCreate(false)}
                      type="outline"
                      style={styles.halfBtn}
                    />
                    <BlueyButton
                      title="Criar"
                      onPress={handleCreateRoutine}
                      loading={creating}
                      disabled={!newName.trim()}
                      style={styles.halfBtn}
                    />
                  </View>
                </View>
              ) : (
                <BlueyButton
                  title="+ Nova Rotina"
                  onPress={() => setShowCreate(true)}
                  type="secondary"
                  style={styles.addBtn}
                />
              )}
            </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { ...Typography.titleMedium, color: BlueyColors.blueyDark },
  headerCenter: { alignItems: 'center' },
  childEmoji: { fontSize: 28 },
  headerTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary },
  routineWrapper: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    overflow: 'hidden',
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  daySelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 2,
  },
  dayPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  dayPillActive: {
    backgroundColor: BlueyColors.blueyMain,
    borderColor: BlueyColors.blueyMain,
  },
  dayPillText: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    fontSize: 11,
  },
  dayPillTextActive: { color: '#fff' },
  daySelectorHint: {
    ...Typography.bodySmall,
    color: BlueyColors.textPlaceholder,
    paddingHorizontal: 14,
    paddingBottom: 8,
    fontSize: 11,
  },
  routineEmoji: { fontSize: 30, width: 38, textAlign: 'center' },
  routineInfo: { flex: 1, minWidth: 0 },
  routineName: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  routineType: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginTop: 2 },
  routineActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BlueyColors.backgroundBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BlueyColors.borderLight,
  },
  actionBtnText: { fontSize: 18 },
  toggleActive: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  toggleInactive: { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' },
  deleteBtn: { backgroundColor: '#FFF5F5', borderColor: '#FFCDD2' },
  addBtn: { marginTop: 8 },
  templatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
    paddingVertical: 13,
    marginBottom: 10,
  },
  templatesBtnText: { ...Typography.titleMedium, color: BlueyColors.blueyDark },
  createForm: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.blueyMain,
    padding: 20,
    marginTop: 8,
  },
  createTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 14 },
  createInput: {
    height: 52,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  typeOptionSelected: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.blueyLight,
  },
  typeOptionEmoji: { fontSize: 26, marginBottom: 6 },
  typeOptionLabel: {
    ...Typography.labelSmall,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    minHeight: 18,
  },
  createActions: { flexDirection: 'row', gap: 12 },
  halfBtn: { flex: 1 },
});
