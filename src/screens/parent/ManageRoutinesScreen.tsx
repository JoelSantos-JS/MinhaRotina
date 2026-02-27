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

  useEffect(() => {
    fetchRoutines(childId);
  }, [childId]);

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
                  return (
                    <View key={routine.id} style={styles.routineCard}>
                      <View style={styles.routineLeft}>
                        <Text style={styles.routineEmoji}>{typeInfo.emoji}</Text>
                        <View>
                          <Text style={styles.routineName}>{routine.name}</Text>
                          <Text style={styles.routineType}>{typeInfo.label}</Text>
                        </View>
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
                        >
                          <Text style={styles.actionBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleToggleRoutine(routine)}
                          style={[
                            styles.toggleBtn,
                            routine.is_active ? styles.toggleActive : styles.toggleInactive,
                          ]}
                        >
                          <Text style={styles.toggleText}>
                            {routine.is_active ? '✅' : '⏸️'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteRoutine(routine)}
                          style={styles.actionBtn}
                        >
                          <Text style={styles.actionBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

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

                  <View style={styles.typeRow}>
                    {ROUTINE_TYPES.map((rt) => (
                      <TouchableOpacity
                        key={rt.value}
                        onPress={() => setSelectedType(rt.value as Routine['type'])}
                        style={[
                          styles.typeOption,
                          selectedType === rt.value && styles.typeOptionSelected,
                        ]}
                      >
                        <Text style={styles.typeOptionEmoji}>{rt.emoji}</Text>
                        <Text style={styles.typeOptionLabel}>{rt.label}</Text>
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
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 12,
  },
  routineLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  routineEmoji: { fontSize: 32 },
  routineName: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  routineType: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  routineActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  actionBtnText: { fontSize: 20 },
  toggleBtn: { borderRadius: 10, padding: 6 },
  toggleActive: { backgroundColor: '#E8F5E9' },
  toggleInactive: { backgroundColor: '#FFF3E0' },
  toggleText: { fontSize: 18 },
  addBtn: { marginTop: 8 },
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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  typeOptionSelected: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.blueyLight,
  },
  typeOptionEmoji: { fontSize: 22, marginBottom: 4 },
  typeOptionLabel: { ...Typography.labelSmall, color: BlueyColors.textPrimary },
  createActions: { flexDirection: 'row', gap: 12 },
  halfBtn: { flex: 1 },
});
