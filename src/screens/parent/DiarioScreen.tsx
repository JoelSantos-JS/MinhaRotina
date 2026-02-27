import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { progressService } from '../../services/routine.service';
import { useAuthStore } from '../../stores/authStore';
import { useChildStore } from '../../stores/childStore';
import { useRoutineStore } from '../../stores/routineStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { TaskProgress } from '../../types/models';

type SkipRecord = {
  id: string;
  child_id: string;
  routine_id: string;
  task_id: string;
  reason: 'skip_now' | 'try_later';
  skipped_at: string;
  tasks: { name: string; icon_emoji: string } | null;
  routines: { name: string } | null;
};

function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const DiarioScreen: React.FC = () => {
  const parent = useAuthStore((s) => s.parent);
  const { children, fetchChildren } = useChildStore();
  const { routines } = useRoutineStore();

  const [selectedChildId, setSelectedChildId] = useState<string | 'all'>('all');
  const [allProgress, setAllProgress] = useState<(TaskProgress & { childName: string; childEmoji: string })[]>([]);
  const [allSkips, setAllSkips] = useState<(SkipRecord & { childName: string; childEmoji: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(7);
  const [skipsExpanded, setSkipsExpanded] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (parent?.id) {
        fetchChildren(parent.id);
      }
    }, [parent?.id])
  );

  useEffect(() => {
    loadAllProgress();
  }, [children, selectedDays]);

  const loadAllProgress = async () => {
    if (children.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const allRecords: (TaskProgress & { childName: string; childEmoji: string })[] = [];
      const allSkipRecords: (SkipRecord & { childName: string; childEmoji: string })[] = [];

      for (const child of children) {
        const [records, skips] = await Promise.all([
          progressService.getChildProgress(child.id, selectedDays),
          progressService.getChildSkips(child.id, selectedDays),
        ]);
        for (const r of records) {
          allRecords.push({ ...r, childName: child.name, childEmoji: child.icon_emoji });
        }
        for (const s of skips) {
          allSkipRecords.push({ ...s, childName: child.name, childEmoji: child.icon_emoji });
        }
      }

      allRecords.sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
      allSkipRecords.sort(
        (a, b) => new Date(b.skipped_at).getTime() - new Date(a.skipped_at).getTime()
      );

      setAllProgress(allRecords);
      setAllSkips(allSkipRecords);
    } catch {
      setAllProgress([]);
      setAllSkips([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoutineName = (routineId: string) =>
    routines.find((r) => r.id === routineId)?.name ?? 'Rotina';

  const filtered =
    selectedChildId === 'all'
      ? allProgress
      : allProgress.filter((r) => r.child_id === selectedChildId);

  const filteredSkips =
    selectedChildId === 'all'
      ? allSkips
      : allSkips.filter((s) => s.child_id === selectedChildId);

  // Group completions by date
  const groups: Record<string, typeof filtered> = {};
  for (const r of filtered) {
    const date = r.completed_at.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(r);
  }
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const totalToday = filtered.filter(
    (r) => r.completed_at.split('T')[0] === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Diário</Text>
          <Text style={styles.headerSub}>Histórico de atividades</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Today summary */}
          <View style={styles.todayCard}>
            <Text style={styles.todayEmoji}>📅</Text>
            <View style={styles.todayInfo}>
              <Text style={styles.todayNumber}>{totalToday}</Text>
              <Text style={styles.todayLabel}>tarefa{totalToday !== 1 ? 's' : ''} hoje</Text>
            </View>
            <View style={styles.todayInfo}>
              <Text style={styles.todayNumber}>{filtered.length}</Text>
              <Text style={styles.todayLabel}>em {selectedDays} dias</Text>
            </View>
            <View style={styles.todayInfo}>
              <Text style={[styles.todayNumber, { color: '#E57373' }]}>{filteredSkips.length}</Text>
              <Text style={styles.todayLabel}>puladas</Text>
            </View>
          </View>

          {/* Period filter */}
          <View style={styles.filterRow}>
            {([7, 14, 30] as const).map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedDays(days)}
                style={[styles.filterBtn, selectedDays === days && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, selectedDays === days && styles.filterTextActive]}>
                  {days} dias
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Child filter */}
          {children.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.childFilter}
              contentContainerStyle={styles.childFilterContent}
            >
              <TouchableOpacity
                onPress={() => setSelectedChildId('all')}
                style={[styles.childChip, selectedChildId === 'all' && styles.childChipActive]}
              >
                <Text style={[styles.childChipText, selectedChildId === 'all' && styles.childChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => setSelectedChildId(child.id)}
                  style={[
                    styles.childChip,
                    selectedChildId === child.id && styles.childChipActive,
                    selectedChildId === child.id && { borderColor: child.color_theme },
                  ]}
                >
                  <Text style={styles.childChipEmoji}>{child.icon_emoji}</Text>
                  <Text
                    style={[
                      styles.childChipText,
                      selectedChildId === child.id && styles.childChipTextActive,
                    ]}
                  >
                    {child.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {loading ? (
            <LoadingSpinner message="Carregando diário..." />
          ) : children.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>Nenhuma criança cadastrada</Text>
              <Text style={styles.emptyText}>
                Cadastre uma criança e crie rotinas para acompanhar o progresso aqui.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Completions history ── */}
              {filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>✨</Text>
                  <Text style={styles.emptyTitle}>Nenhuma atividade</Text>
                  <Text style={styles.emptyText}>
                    Quando as crianças completarem tarefas, o histórico aparecerá aqui.
                  </Text>
                </View>
              ) : (
                dates.map((date) => (
                  <View key={date} style={styles.daySection}>
                    <Text style={styles.dayTitle}>{formatDateLabel(date)}</Text>
                    {groups[date].map((record) => (
                      <View key={record.id} style={styles.recordRow}>
                        <Text style={styles.recordEmoji}>{record.childEmoji}</Text>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordChild}>{record.childName}</Text>
                          <Text style={styles.recordRoutine}>{getRoutineName(record.routine_id)}</Text>
                        </View>
                        <View style={styles.recordRight}>
                          <Text style={styles.recordCheck}>✅</Text>
                          <Text style={styles.recordTime}>{formatTime(record.completed_at)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}

              {/* ── Skipped tasks section ── */}
              {filteredSkips.length > 0 && (
                <View style={styles.skipsSection}>
                  <TouchableOpacity
                    style={styles.skipsHeader}
                    onPress={() => setSkipsExpanded((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipsTitle}>⚠️ Tarefas com Dificuldade</Text>
                    <View style={styles.skipsBadge}>
                      <Text style={styles.skipsBadgeText}>{filteredSkips.length}</Text>
                    </View>
                    <Text style={styles.skipsChevron}>{skipsExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {skipsExpanded && (
                    <>
                      <Text style={styles.skipsHint}>
                        Tarefas que a criança não conseguiu fazer — úteis para conversar com especialistas.
                      </Text>
                      {filteredSkips.map((skip) => (
                        <View key={skip.id} style={styles.skipRow}>
                          <Text style={styles.skipEmoji}>
                            {skip.tasks?.icon_emoji ?? '❓'}
                          </Text>
                          <View style={styles.skipInfo}>
                            <Text style={styles.skipTaskName}>
                              {skip.tasks?.name ?? 'Tarefa removida'}
                            </Text>
                            <Text style={styles.skipRoutine}>
                              {skip.childName} · {skip.routines?.name ?? getRoutineName(skip.routine_id)}
                            </Text>
                          </View>
                          <View style={styles.skipRight}>
                            <View style={[
                              styles.skipReasonBadge,
                              skip.reason === 'skip_now' ? styles.skipReasonRed : styles.skipReasonOrange,
                            ]}>
                              <Text style={styles.skipReasonText}>
                                {skip.reason === 'skip_now' ? '⏭️ Pulou' : '🔄 Tentou depois'}
                              </Text>
                            </View>
                            <Text style={styles.skipTime}>{formatTime(skip.skipped_at)}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  todayEmoji: { fontSize: 36 },
  todayInfo: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: BlueyColors.borderLight,
    paddingLeft: 12,
  },
  todayNumber: {
    ...Typography.headlineLarge,
    color: BlueyColors.blueyDark,
  },
  todayLabel: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterBtnActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  filterText: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  filterTextActive: { color: BlueyColors.blueyDark },
  childFilter: { marginBottom: 16 },
  childFilterContent: { gap: 8, paddingRight: 4 },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: '#fff',
    gap: 4,
  },
  childChipActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  childChipEmoji: { fontSize: 16 },
  childChipText: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  childChipTextActive: { color: BlueyColors.blueyDark },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 8 },
  emptyText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },
  daySection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 16,
    marginBottom: 12,
  },
  dayTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.blueyDark,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    gap: 10,
  },
  recordEmoji: { fontSize: 28 },
  recordInfo: { flex: 1 },
  recordChild: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  recordRoutine: { ...Typography.bodyMedium, color: BlueyColors.textPrimary },
  recordRight: { alignItems: 'flex-end', gap: 2 },
  recordCheck: { fontSize: 18 },
  recordTime: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  // ── Skips section ──
  skipsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFCDD2',
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  skipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipsTitle: {
    ...Typography.titleMedium,
    color: '#C62828',
    flex: 1,
  },
  skipsBadge: {
    backgroundColor: '#FFCDD2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skipsBadgeText: {
    ...Typography.labelSmall,
    color: '#C62828',
    fontFamily: 'Nunito_800ExtraBold',
  },
  skipsChevron: {
    ...Typography.bodySmall,
    color: '#C62828',
  },
  skipsHint: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
    gap: 10,
  },
  skipEmoji: { fontSize: 26 },
  skipInfo: { flex: 1 },
  skipTaskName: { ...Typography.bodyMedium, color: BlueyColors.textPrimary },
  skipRoutine: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  skipRight: { alignItems: 'flex-end', gap: 4 },
  skipReasonBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  skipReasonRed: { backgroundColor: '#FFCDD2' },
  skipReasonOrange: { backgroundColor: '#FFE0B2' },
  skipReasonText: {
    ...Typography.labelSmall,
    color: BlueyColors.textPrimary,
    fontSize: 10,
  },
  skipTime: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
});
