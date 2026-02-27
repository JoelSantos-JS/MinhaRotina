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
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { routineService } from '../../services/routine.service';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { ROUTINE_TYPES } from '../../config/constants';
import { getCurrentDayPeriod, isRoutineAvailableNow } from '../../utils/timeWindow';
import type { Routine } from '../../types/models';
import type { ChildScreenProps } from '../../types/navigation';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const ChildHomeScreen: React.FC<ChildScreenProps<'ChildHome'>> = ({
  navigation,
  route,
}) => {
  const { childId } = route.params;
  const child = useAuthStore((s) => s.child);
  const logout = useAuthStore((s) => s.logout);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    loadRoutines();
  }, [childId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const data = await routineService.getRoutinesByChild(childId);
      setRoutines(data.filter((r) => r.is_active));
    } catch {
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeInfo = (type: string) =>
    ROUTINE_TYPES.find((r) => r.value === type) ?? ROUTINE_TYPES[0];

  const handleStartRoutine = (routine: Routine) => {
    if (!isRoutineAvailableNow(routine.type, now)) {
      const periodLabel = getTypeInfo(routine.type).label.toLowerCase();
      Alert.alert(
        'Agora nao',
        `Essa rotina e da ${periodLabel}. Voce podera fazer quando chegar esse periodo.`
      );
      return;
    }

    navigation.navigate('CurrentTask', { childId, routineId: routine.id });
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Quer trocar de crianca ou sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const currentPeriod = getCurrentDayPeriod(now);
  const currentPeriodLabel = getTypeInfo(currentPeriod).label;

  if (loading) {
    return <LoadingSpinner fullScreen message="Carregando rotinas..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[child?.color_theme ?? BlueyColors.blueyMain, BlueyColors.backgroundBlue]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.childInfo}>
            <Text style={styles.childEmoji}>{child?.icon_emoji ?? '*'}</Text>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.childName}>{child?.name}!</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {routines.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>zzz</Text>
              <Text style={styles.emptyTitle}>Nenhuma rotina ativa</Text>
              <Text style={styles.emptyText}>
                Peca para seus pais criarem uma rotina para voce!
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Qual rotina vamos fazer?</Text>
              <Text style={styles.currentPeriodText}>
                Agora: periodo da {currentPeriodLabel.toLowerCase()}
              </Text>
              {routines.map((routine) => {
                const typeInfo = getTypeInfo(routine.type);
                const availableNow = isRoutineAvailableNow(routine.type, now);

                return (
                  <TouchableOpacity
                    key={routine.id}
                    style={[styles.routineCard, !availableNow && styles.routineCardBlocked]}
                    onPress={() => handleStartRoutine(routine)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.routineIconBg,
                        { backgroundColor: (child?.color_theme ?? '#88CAFC') + '33' },
                      ]}
                    >
                      <Text style={styles.routineTypeEmoji}>{typeInfo.emoji}</Text>
                    </View>
                    <View style={styles.routineInfo}>
                      <Text style={[styles.routineName, !availableNow && styles.routineNameBlocked]}>
                        {routine.name}
                      </Text>
                      <Text style={[styles.routineType, !availableNow && styles.routineTypeBlocked]}>
                        {typeInfo.label}
                      </Text>
                      {!availableNow && (
                        <Text style={styles.routineLockText}>
                          Disponivel no periodo da {typeInfo.label.toLowerCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.startArrow, !availableNow && styles.startArrowBlocked]}>
                      {availableNow ? '>' : 'LOCK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  childInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childEmoji: { fontSize: 44 },
  greeting: { ...Typography.bodyMedium, color: BlueyColors.textSecondary },
  childName: { ...Typography.headlineMedium, color: BlueyColors.textPrimary },
  logoutBtn: {
    backgroundColor: '#ffffff55',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: { ...Typography.labelSmall, color: BlueyColors.textPrimary },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { ...Typography.headlineMedium, color: BlueyColors.textPrimary, marginBottom: 12 },
  emptyText: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 6,
  },
  currentPeriodText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginBottom: 16,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  routineCardBlocked: {
    opacity: 0.62,
  },
  routineIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineTypeEmoji: { fontSize: 32 },
  routineInfo: { flex: 1 },
  routineName: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 4 },
  routineNameBlocked: { color: BlueyColors.textSecondary },
  routineType: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  routineTypeBlocked: { color: BlueyColors.textSecondary },
  routineLockText: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    marginTop: 4,
  },
  startArrow: {
    fontSize: 22,
    color: BlueyColors.blueyMain,
    fontWeight: 'bold',
  },
  startArrowBlocked: {
    color: BlueyColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
