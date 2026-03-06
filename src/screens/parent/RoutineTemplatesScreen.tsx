import React, { useState } from 'react';
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
import { useChildStore } from '../../stores/childStore';
import { useRoutineStore } from '../../stores/routineStore';
import { routineService } from '../../services/routine.service';
import {
  ROUTINE_TEMPLATES,
  getTemplatesByType,
  type RoutineTemplate,
} from '../../utils/routineTemplates';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

type FilterType = 'all' | 'morning' | 'afternoon' | 'night';

const TYPE_LABELS: Record<string, string> = {
  all: 'Todas',
  morning: '🌅 Manhã',
  afternoon: '☀️ Tarde',
  night: '🌙 Noite',
};

export const RoutineTemplatesScreen: React.FC<ParentScreenProps<'RoutineTemplates'>> = ({
  navigation,
  route,
}) => {
  const { childId } = route.params;
  const { children } = useChildStore();
  const { addRoutine } = useRoutineStore();
  const child = children.find((c) => c.id === childId);

  const [filter, setFilter] = useState<FilterType>('all');
  const [applying, setApplying] = useState<string | null>(null);

  const filtered =
    filter === 'all' ? ROUTINE_TEMPLATES : getTemplatesByType(filter as 'morning' | 'afternoon' | 'night');

  const handleApply = (template: RoutineTemplate) => {
    Alert.alert(
      `Usar "${template.name}"?`,
      `Isso vai criar a rotina "${template.name}" com ${template.tasks.length} tarefas para ${child?.name ?? 'a criança'}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Criar rotina',
          onPress: async () => {
            setApplying(template.id);
            try {
              const routine = await routineService.applyTemplate(childId, template);
              addRoutine(routine);
              Alert.alert(
                '✅ Rotina criada!',
                `"${template.name}" foi adicionada com ${template.tasks.length} tarefas. Você pode personalizar as tarefas agora.`,
                [
                  {
                    text: 'Ver tarefas',
                    onPress: () =>
                      navigation.replace('AddTask', { routineId: routine.id, childId }),
                  },
                  { text: 'Ficar aqui', style: 'cancel' },
                ]
              );
            } catch (err: any) {
              Alert.alert('Erro', err.message ?? 'Não foi possível criar a rotina.');
            } finally {
              setApplying(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Templates</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>
          Escolha um modelo pronto e personalize depois
        </Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'morning', 'afternoon', 'night'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                {TYPE_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((template) => {
            const isApplying = applying === template.id;
            return (
              <View key={template.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{template.emoji}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{template.name}</Text>
                    <Text style={styles.cardMeta}>
                      {template.tasks.length} tarefas · {template.ageGroup === 'all' ? 'Todas as idades' : `${template.ageGroup} anos`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>{template.description}</Text>

                {/* Task preview */}
                <View style={styles.taskPreview}>
                  {template.tasks.slice(0, 4).map((task, idx) => (
                    <Text key={idx} style={styles.taskPreviewItem} numberOfLines={1}>
                      {task.icon_emoji} {task.name}
                    </Text>
                  ))}
                  {template.tasks.length > 4 && (
                    <Text style={styles.taskPreviewMore}>
                      +{template.tasks.length - 4} mais...
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.applyBtn, isApplying && styles.applyBtnDisabled]}
                  onPress={() => !isApplying && handleApply(template)}
                  activeOpacity={0.8}
                >
                  {isApplying ? (
                    <LoadingSpinner />
                  ) : (
                    <Text style={styles.applyBtnText}>Usar este template</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
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
  headerTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  subtitle: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
  },
  filterPillActive: {
    backgroundColor: BlueyColors.blueyMain,
    borderColor: BlueyColors.blueyMain,
  },
  filterPillText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardName: { ...Typography.titleMedium, color: BlueyColors.textPrimary },
  cardMeta: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginTop: 2 },
  cardDescription: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  taskPreview: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 4,
  },
  taskPreviewItem: { ...Typography.bodySmall, color: BlueyColors.textPrimary },
  taskPreviewMore: { ...Typography.bodySmall, color: BlueyColors.textSecondary, fontStyle: 'italic' },
  applyBtn: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { ...Typography.titleMedium, color: '#fff' },
});
