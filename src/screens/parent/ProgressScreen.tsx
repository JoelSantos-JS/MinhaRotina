import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { progressService } from '../../services/routine.service';
import { useChildStore } from '../../stores/childStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { TaskProgress } from '../../types/models';
import type { ParentScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(records: TaskProgress[]): Record<string, TaskProgress[]> {
  const groups: Record<string, TaskProgress[]> = {};
  for (const r of records) {
    const date = r.completed_at.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(r);
  }
  return groups;
}

function buildDateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function calcStreak(grouped: Record<string, TaskProgress[]>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (grouped[key]?.length) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

interface BarItem { label: string; value: number; maxVal: number; }

const BarChart: React.FC<{ data: BarItem[] }> = ({ data }) => {
  const count = data.length;
  const barWidth = Math.max(Math.floor((CHART_WIDTH - (count - 1) * 4) / count), 6);
  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.bars}>
        {data.map((item, i) => {
          const ratio = item.maxVal > 0 ? item.value / item.maxVal : 0;
          const barH = Math.max(ratio * 76, item.value > 0 ? 6 : 2);
          const color =
            ratio >= 0.7 ? BlueyColors.successGreen
            : ratio >= 0.3 ? BlueyColors.blueyMain
            : BlueyColors.borderLight;
          return (
            <View key={i} style={[chartStyles.col, { width: barWidth }]}>
              {item.value > 0 && <Text style={chartStyles.val}>{item.value}</Text>}
              <View style={chartStyles.track}>
                <View style={[chartStyles.fill, { height: barH, backgroundColor: color }]} />
              </View>
              <Text style={chartStyles.lbl} numberOfLines={1}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: { width: '100%' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110 },
  col: { alignItems: 'center', justifyContent: 'flex-end' },
  val: { fontSize: 9, color: BlueyColors.textSecondary, marginBottom: 1, fontFamily: 'Nunito_600SemiBold' },
  track: { width: '100%', height: 76, justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: 3 },
  lbl: { fontSize: 8, color: BlueyColors.textSecondary, marginTop: 3, fontFamily: 'Nunito_600SemiBold' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ProgressScreen: React.FC<ParentScreenProps<'Progress'>> = ({ navigation, route }) => {
  const { childId } = route.params;
  const { children } = useChildStore();
  const child = children.find((c) => c.id === childId);

  const [progress, setProgress] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(7);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [childId, selectedDays]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await progressService.getChildProgress(childId, selectedDays);
      setProgress(data);
    } catch {
      setProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupByDate(progress);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const dateRange = buildDateRange(selectedDays);

  const totalCompleted = progress.length;
  const activeDays = dates.length;
  const streak = calcStreak(grouped);
  const avgPerDay = activeDays > 0 ? (totalCompleted / activeDays).toFixed(1) : '0';
  const completionRate = Math.min(Math.round((activeDays / selectedDays) * 100), 100);

  const maxDayCount = Math.max(...dateRange.map((d) => grouped[d]?.length ?? 0), 1);

  // For long periods, sample every N-th day to fit the chart
  const step = selectedDays <= 7 ? 1 : selectedDays <= 30 ? 1 : Math.ceil(selectedDays / 30);
  const chartData: BarItem[] = dateRange
    .filter((_, i) => i % step === 0)
    .map((d) => ({
      label: formatDateShort(d),
      value: grouped[d]?.length ?? 0,
      maxVal: maxDayCount,
    }));

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.childEmoji}>{child?.icon_emoji}</Text>
            <Text style={styles.headerTitle}>Progresso</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period filter */}
          <View style={styles.filterRow}>
            {([7, 30, 90] as const).map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => setSelectedDays(days)}
                style={[styles.filterBtn, selectedDays === days && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, selectedDays === days && styles.filterTextActive]}>
                  {days === 7 ? '1 semana' : days === 30 ? '1 mês' : '3 meses'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <LoadingSpinner message="Carregando estatísticas..." />
          ) : progress.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTitle}>Nenhuma atividade</Text>
              <Text style={styles.emptyText}>
                Quando {child?.name} completar tarefas, o progresso aparecerá aqui.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary 2×2 grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: BlueyColors.backgroundBlue }]}>
                  <Text style={styles.statEmoji}>✅</Text>
                  <Text style={styles.statNumber}>{totalCompleted}</Text>
                  <Text style={styles.statLabel}>Tarefas{'\n'}concluídas</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: BlueyColors.backgroundGreen }]}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={styles.statNumber}>{streak}</Text>
                  <Text style={styles.statLabel}>Dias{'\n'}seguidos</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: BlueyColors.backgroundYellow }]}>
                  <Text style={styles.statEmoji}>📅</Text>
                  <Text style={styles.statNumber}>{activeDays}</Text>
                  <Text style={styles.statLabel}>Dias{'\n'}ativos</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <Text style={styles.statNumber}>{avgPerDay}</Text>
                  <Text style={styles.statLabel}>Média{'\n'}por dia</Text>
                </View>
              </View>

              {/* Completion rate */}
              <View style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Text style={styles.rateTitle}>🎯 Dias com atividade</Text>
                  <Text style={styles.ratePercent}>{completionRate}%</Text>
                </View>
                <View style={styles.rateTrack}>
                  <View
                    style={[
                      styles.rateFill,
                      {
                        width: `${completionRate}%` as any,
                        backgroundColor:
                          completionRate >= 70
                            ? BlueyColors.successGreen
                            : completionRate >= 40
                            ? BlueyColors.blueyMain
                            : BlueyColors.alertOrange,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.rateHint}>
                  {completionRate >= 70
                    ? `Incrível! ${child?.name} foi muito consistente! 🌟`
                    : completionRate >= 40
                    ? `Bom progresso! Continue motivando ${child?.name} 💪`
                    : `Vamos criar mais rotinas para aumentar a consistência 📋`}
                </Text>
              </View>

              {/* Bar chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>📈 Tarefas por Dia</Text>
                <BarChart data={chartData} />
              </View>

              {/* History toggle */}
              <TouchableOpacity
                style={styles.historyToggle}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Text style={styles.historyToggleText}>
                  {showHistory ? '▲ Ocultar histórico' : '▼ Ver histórico completo'}
                </Text>
              </TouchableOpacity>

              {showHistory && dates.map((date) => (
                <View key={date} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{formatDateLong(date)}</Text>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{grouped[date].length}</Text>
                    </View>
                  </View>
                  {grouped[date].map((record) => (
                    <View key={record.id} style={styles.recordRow}>
                      <View style={styles.recordDot} />
                      <Text style={styles.recordTime}>{formatTime(record.completed_at)}</Text>
                      <Text style={styles.recordCheck}>✅</Text>
                    </View>
                  ))}
                </View>
              ))}
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
  childEmoji: { fontSize: 24 },
  headerTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterBtnActive: { borderColor: BlueyColors.blueyMain, backgroundColor: BlueyColors.backgroundBlue },
  filterText: { ...Typography.labelSmall, color: BlueyColors.textSecondary },
  filterTextActive: { color: BlueyColors.blueyDark },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    width: '47%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statNumber: { ...Typography.headlineLarge, color: BlueyColors.textPrimary },
  statLabel: { ...Typography.bodySmall, color: BlueyColors.textSecondary, textAlign: 'center', marginTop: 2 },
  rateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 14,
  },
  rateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rateTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  ratePercent: { ...Typography.headlineMedium, color: BlueyColors.blueyDark },
  rateTrack: { height: 14, backgroundColor: BlueyColors.borderLight, borderRadius: 7, overflow: 'hidden', marginBottom: 10 },
  rateFill: { height: '100%', borderRadius: 7 },
  rateHint: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 14,
  },
  chartTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 12 },
  historyToggle: { alignItems: 'center', paddingVertical: 12, marginBottom: 4 },
  historyToggleText: { ...Typography.labelSmall, color: BlueyColors.blueyDark },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 8 },
  emptyText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  daySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 14,
    marginBottom: 10,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dayTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  dayBadge: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dayBadgeText: { ...Typography.labelSmall, color: BlueyColors.blueyDark },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: BlueyColors.borderLight, gap: 10 },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BlueyColors.blueyMain },
  recordTime: { ...Typography.bodySmall, color: BlueyColors.textSecondary, flex: 1 },
  recordCheck: { fontSize: 16 },
});
