import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { formatDateLabel, formatTime } from '../../utils/dateUtils';
import type { TaskProgress } from '../../types/models';

type SkipRecord = {
  id: string;
  child_id: string;
  routine_id: string;
  task_id: string;
  reason: 'skip_now' | 'try_later';
  skipped_at: string;
  note?: string | null;
  tasks: { name: string; icon_emoji: string } | null;
  routines: { name: string } | null;
};

type NoteTarget =
  | { kind: 'progress'; id: string; current: string | null | undefined }
  | { kind: 'skip'; id: string; current: string | null | undefined };

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

  // Note modal state
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
          allSkipRecords.push({ ...s as SkipRecord, childName: child.name, childEmoji: child.icon_emoji });
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

  const openNote = (target: NoteTarget) => {
    setNoteTarget(target);
    setNoteText(target.current ?? '');
  };

  const closeNote = () => {
    setNoteTarget(null);
    setNoteText('');
  };

  const handleSaveNote = async () => {
    if (!noteTarget) return;
    setSavingNote(true);
    try {
      if (noteTarget.kind === 'progress') {
        await progressService.saveProgressNote(noteTarget.id, noteText);
        setAllProgress((prev) =>
          prev.map((r) => (r.id === noteTarget.id ? { ...r, note: noteText.trim() || null } : r))
        );
      } else {
        await progressService.saveSkipNote(noteTarget.id, noteText);
        setAllSkips((prev) =>
          prev.map((s) => (s.id === noteTarget.id ? { ...s, note: noteText.trim() || null } : s))
        );
      }
      closeNote();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar a nota.');
    } finally {
      setSavingNote(false);
    }
  };

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
                      <View key={record.id} style={styles.recordBlock}>
                        <View style={styles.recordRow}>
                          <Text style={styles.recordEmoji}>{record.childEmoji}</Text>
                          <View style={styles.recordInfo}>
                            <Text style={styles.recordChild}>{record.childName}</Text>
                            <Text style={styles.recordRoutine}>{getRoutineName(record.routine_id)}</Text>
                          </View>
                          <View style={styles.recordRight}>
                            <Text style={styles.recordCheck}>✅</Text>
                            <Text style={styles.recordTime}>{formatTime(record.completed_at)}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => openNote({ kind: 'progress', id: record.id, current: record.note })}
                            style={[styles.noteBtn, record.note ? styles.noteBtnFilled : null]}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.noteBtnText}>💬</Text>
                          </TouchableOpacity>
                        </View>
                        {record.note ? (
                          <Text style={styles.notePreview} numberOfLines={2}>
                            {record.note}
                          </Text>
                        ) : null}
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
                        <View key={skip.id} style={styles.skipBlock}>
                          <View style={styles.skipRow}>
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
                            <TouchableOpacity
                              onPress={() => openNote({ kind: 'skip', id: skip.id, current: skip.note })}
                              style={[styles.noteBtn, skip.note ? styles.noteBtnFilled : null]}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.noteBtnText}>💬</Text>
                            </TouchableOpacity>
                          </View>
                          {skip.note ? (
                            <Text style={styles.notePreview} numberOfLines={2}>
                              {skip.note}
                            </Text>
                          ) : null}
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

      {/* ── Note modal ── */}
      <Modal
        visible={noteTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={closeNote}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeNote} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>💬 Anotação do pai/mãe</Text>
            <Text style={styles.modalHint}>
              Registre contexto extra sobre essa atividade — útil para compartilhar com especialistas.
            </Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Ex: Estava agitado hoje, demorou 15 min..."
              placeholderTextColor={BlueyColors.textPlaceholder}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeNote} style={styles.modalCancelBtn} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                style={[styles.modalSaveBtn, savingNote && { opacity: 0.6 }]}
                activeOpacity={0.7}
                disabled={savingNote}
              >
                <Text style={styles.modalSaveText}>{savingNote ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  recordBlock: {
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  recordEmoji: { fontSize: 28 },
  recordInfo: { flex: 1 },
  recordChild: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  recordRoutine: { ...Typography.bodyMedium, color: BlueyColors.textPrimary },
  recordRight: { alignItems: 'flex-end', gap: 2 },
  recordCheck: { fontSize: 18 },
  recordTime: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  noteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BlueyColors.backgroundBlue,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBtnFilled: {
    backgroundColor: '#FFF9C4',
    borderColor: '#F9A825',
  },
  noteBtnText: { fontSize: 16 },
  notePreview: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 38,
    marginRight: 44,
    backgroundColor: '#FFFDE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F9A825',
  },
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
  skipBlock: {
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
  // ── Note modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BlueyColors.borderMedium,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 6,
  },
  modalHint: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.titleMedium,
    color: BlueyColors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BlueyColors.blueyMain,
    alignItems: 'center',
  },
  modalSaveText: {
    ...Typography.titleMedium,
    color: '#fff',
  },
});
