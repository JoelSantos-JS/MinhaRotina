import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { TaskCard } from '../../components/cards/TaskCard';
import { EducationalAlert, SensoryAlertCategory } from '../../components/modals/EducationalAlert';
import { TaskHelpModal } from '../../components/modals/TaskHelpModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { taskService } from '../../services/routine.service';
import { useRoutineStore } from '../../stores/routineStore';
import { useChildStore } from '../../stores/childStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { TASK_EMOJIS, SENSORY_CATEGORIES } from '../../config/constants';
import { detectSensoryCategory } from '../../utils/sensoryDetection';
import { validateTaskForm, formatTimePreset, TIME_PRESETS, TASK_FORM_ERROR_MESSAGES } from '../../utils/taskFormUtils';
import type { RoutinesConfig, Task } from '../../types/models';
import type { ParentScreenProps } from '../../types/navigation';

export const AddTaskScreen: React.FC<ParentScreenProps<'AddTask'>> = ({ navigation, route }) => {
  const { routineId, childId } = route.params;
  const { routines, tasks, isLoading, fetchTasks, addTask, updateTask, removeTask } = useRoutineStore();
  const { children } = useChildStore();
  const childName = children.find((c) => c.id === childId)?.name ?? '';
  const currentRoutineType = routines.find((r) => r.id === routineId)?.type;

  const defaultRoutines = (): RoutinesConfig => ({
    morning: currentRoutineType === 'morning',
    afternoon: currentRoutineType === 'afternoon',
    night: currentRoutineType === 'night',
  });

  const [showForm, setShowForm] = useState(false);
  const [iconTab, setIconTab] = useState<'emoji' | 'photo'>('emoji');
  const [isDirty, setIsDirty] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(TASK_EMOJIS[0]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(5);
  const [hasSensory, setHasSensory] = useState(false);
  const [sensoryCategory, setSensoryCategory] = useState<Task['sensory_category']>(null);
  const [detectedCategory, setDetectedCategory] = useState<SensoryAlertCategory | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [helpTask, setHelpTask] = useState<Task | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedRoutines, setSelectedRoutines] = useState<RoutinesConfig>({ morning: false, afternoon: false, night: false });
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchTasks(routineId);
  }, [routineId]);

  // Intercepta o botão Voltar quando há alterações não salvas
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || !showForm) return;
      e.preventDefault();
      Alert.alert(
        'Sair sem salvar?',
        'Voc\u00EA tem uma tarefa em edi\u00E7\u00E3o. Deseja descartar as altera\u00E7\u00F5es?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, showForm]);

  // Auto-detect sensory keywords as the user types
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    debounceTimer.current = setTimeout(() => {
      const found = detectSensoryCategory(taskName);
      if (found) {
        setDetectedCategory(found);
        setAlertVisible(true);
        // Auto-set hasSensory + category (food stays as null category for DB since it's not in model)
        setHasSensory(true);
        if (found !== 'food') {
          setSensoryCategory(found as Task['sensory_category']);
        }
      } else if (alertVisible) {
        // Delay hiding so user doesn't see flicker on backspace
        hideTimer.current = setTimeout(() => {
          setAlertVisible(false);
        }, 2000);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [taskName]);

  const handleSensoryToggle = (val: boolean) => {
    setHasSensory(val);
    setIsDirty(true);
    if (!val) {
      setSensoryCategory(null);
      setAlertVisible(false);
    }
  };

  const handleSensoryCategoryChange = (cat: Task['sensory_category']) => {
    setSensoryCategory(cat);
    if (cat && cat !== 'food') {
      setDetectedCategory(cat as SensoryAlertCategory);
      setAlertVisible(true);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setSelectedEmoji(task.icon_emoji);
    setEstimatedMinutes(task.estimated_minutes);
    setHasSensory(task.has_sensory_issues);
    setSensoryCategory(task.sensory_category ?? null);
    setPhotoUri(task.photo_url ?? null);
    setDescription(task.description ?? '');
    setVideoUrl(task.video_url ?? '');
    setIconTab(task.photo_url ? 'photo' : 'emoji');
    setSelectedRoutines(task.routines_config ?? defaultRoutines());
    setIsDirty(false);
    setShowForm(true);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiss\u00E3o necess\u00E1ria', 'Permita o acesso \u00E0 galeria nas configura\u00E7\u00F5es.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.65,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setIsDirty(true);
    }
  };

  const pickPhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiss\u00E3o necess\u00E1ria', 'Permita o acesso \u00E0 c\u00E2mera nas configura\u00E7\u00F5es.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.65,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setIsDirty(true);
    }
  };

  const handleAddTask = async () => {
    const formError = validateTaskForm({ taskName, estimatedMinutes });
    if (formError) { Alert.alert('Aten\u00E7\u00E3o', TASK_FORM_ERROR_MESSAGES[formError]); return; }

    if (!Object.values(selectedRoutines).some((v) => v)) {
      Alert.alert('Atenção', 'Selecione pelo menos uma rotina (Manhã, Tarde ou Noite).');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        const photoChanged = photoUri !== editingTask.photo_url;
        const updated = await taskService.updateTask(editingTask.id, {
          name: taskName.trim(),
          iconEmoji: selectedEmoji,
          estimatedMinutes,
          hasSensoryIssues: hasSensory,
          sensoryCategory: hasSensory ? sensoryCategory : null,
          photoLocalUri: photoChanged ? (photoUri ?? null) : undefined,
          description: description.trim() || null,
          videoLocalUri: undefined, // video_url is set directly below
          routinesConfig: selectedRoutines,
        });
        // Save video URL separately (it's a URL, not a file upload)
        if (videoUrl.trim() !== (editingTask.video_url ?? '')) {
          await taskService.updateTaskVideo(editingTask.id, videoUrl.trim() || null);
          updateTask({ ...updated, video_url: videoUrl.trim() || null });
        } else {
          updateTask(updated);
        }
      } else {
        const task = await taskService.createTask(
          routineId,
          taskName.trim(),
          selectedEmoji,
          tasks.length,
          {
            estimatedMinutes,
            hasSensoryIssues: hasSensory,
            sensoryCategory: hasSensory ? sensoryCategory : null,
            photoLocalUri: photoUri ?? undefined,
            description: description.trim() || undefined,
            routinesConfig: selectedRoutines,
          }
        );
        // Save video URL if provided
        if (videoUrl.trim()) {
          await taskService.updateTaskVideo(task.id, videoUrl.trim());
          addTask({ ...task, video_url: videoUrl.trim() });
        } else {
          addTask(task);
        }
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      const msg: string = err?.message ?? 'Erro desconhecido';
      const isStorageError = msg.includes('storage') || msg.includes('bucket') || msg.includes('upload') || msg.includes('row-level') || msg.includes('policy');
      Alert.alert(
        isStorageError ? 'Erro ao enviar foto' : 'Erro',
        isStorageError
          ? `A tarefa foi criada, mas a foto não pôde ser salva.\n\nVerifique se o bucket "task-photos" existe e é público no Supabase.\n\nDetalhe: ${msg}`
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTaskName('');
    setSelectedEmoji(TASK_EMOJIS[0]);
    setEstimatedMinutes(5);
    setHasSensory(false);
    setSensoryCategory(null);
    setDetectedCategory(null);
    setAlertVisible(false);
    setPhotoUri(null);
    setDescription('');
    setVideoUrl('');
    setEditingTask(null);
    setSelectedRoutines({ morning: false, afternoon: false, night: false });
    setIconTab('emoji');
    setIsDirty(false);
  };

  const handleDeleteTask = (taskId: string, name: string) => {
    Alert.alert('Remover tarefa', `Remover "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await taskService.deleteTask(taskId);
          removeTask(taskId);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'← Voltar'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Tarefas da Rotina</Text>
            {childName ? (
              <Text style={styles.headerSubtitle}>{'Para ' + childName}</Text>
            ) : null}
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <LoadingSpinner message="Carregando tarefas..." />
          ) : (
            <>
              {/* Task list */}
              {tasks.length === 0 && !showForm && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>✅</Text>
                  <Text style={styles.emptyText}>Nenhuma tarefa ainda. Adicione a primeira!</Text>
                </View>
              )}

              {tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={styles.taskCardWrap}>
                    <TaskCard
                      task={task}
                      compact
                      onDelete={() => handleDeleteTask(task.id, task.name)}
                      onInfo={task.has_sensory_issues ? () => setHelpTask(task) : undefined}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEditTask(task)}
                    style={styles.editTaskBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editTaskBtnText}>✏️</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add task form */}
              {showForm ? (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>

                  {/* Icon selector — tab toggle */}
                  <Text style={styles.fieldLabel}>{'\uD83C\uDFA8 \u00CDcone da Tarefa'}</Text>
                  <View style={styles.iconTabRow}>
                    <TouchableOpacity
                      style={[styles.iconTab, iconTab === 'emoji' && styles.iconTabActive]}
                      onPress={() => setIconTab('emoji')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.iconTabText, iconTab === 'emoji' && styles.iconTabTextActive]}>
                        {'😊 Emoji'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconTab, iconTab === 'photo' && styles.iconTabActive]}
                      onPress={() => setIconTab('photo')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.iconTabText, iconTab === 'photo' && styles.iconTabTextActive]}>
                        {'📷 Foto'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {iconTab === 'emoji' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                      {TASK_EMOJIS.map((emoji, index) => (
                        <TouchableOpacity
                          key={`emoji-${index}`}
                          onPress={() => { setSelectedEmoji(emoji); setIsDirty(true); }}
                          style={[
                            styles.emojiOption,
                            selectedEmoji === emoji && styles.emojiOptionSelected,
                          ]}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {iconTab === 'photo' && (
                    <View style={styles.photoSection}>
                      {/* Preview */}
                      <View style={styles.photoPreviewWrap}>
                        {photoUri ? (
                          <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                        ) : (
                          <View style={styles.photoPlaceholder}>
                            <Text style={styles.photoPlaceholderEmoji}>{'📷'}</Text>
                            <Text style={styles.photoPlaceholderText}>{'Sem foto\nescolhida'}</Text>
                          </View>
                        )}
                      </View>
                      {/* Buttons */}
                      <View style={styles.photoActions}>
                        <TouchableOpacity onPress={pickPhotoFromCamera} style={styles.photoBtnPrimary} activeOpacity={0.8}>
                          <Text style={styles.photoBtnPrimaryText}>{'📸 C\u00E2mera'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickPhoto} style={styles.photoBtnSecondary} activeOpacity={0.8}>
                          <Text style={styles.photoBtnSecondaryText}>{'🖼\uFE0F Galeria'}</Text>
                        </TouchableOpacity>
                        {photoUri && (
                          <TouchableOpacity onPress={() => { setPhotoUri(null); setIsDirty(true); }} style={styles.photoBtnRemove} activeOpacity={0.8}>
                            <Text style={styles.photoBtnRemoveText}>{'Remover \u2715'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Task name + inline alert */}
                  <Text style={styles.fieldLabel}>Nome da tarefa</Text>
                  <TextInput
                    value={taskName}
                    onChangeText={setTaskName}
                    placeholder={`${selectedEmoji} Ex: Escovar os dentes`}
                    placeholderTextColor={BlueyColors.textPlaceholder}
                    style={styles.input}
                    autoFocus
                  />

                  {/* Educational alert — inline, right below task name input */}
                  {alertVisible && detectedCategory && (
                    <EducationalAlert
                      category={detectedCategory}
                      onViewStrategies={() => {
                        setAlertVisible(false);
                        navigation.navigate('Strategies', { category: detectedCategory });
                      }}
                      onDismiss={() => setAlertVisible(false)}
                    />
                  )}

                  <Text style={styles.fieldLabel}>{'⏱️ Tempo estimado'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {TIME_PRESETS.map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => { setEstimatedMinutes(mins); setIsDirty(true); }}
                        style={[styles.timeOption, estimatedMinutes === mins && styles.timeOptionSelected]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.timeOptionText, estimatedMinutes === mins && styles.timeOptionTextSelected]}>
                          {formatTimePreset(mins)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Routine checkboxes */}
                  <Text style={styles.fieldLabel}>📅 Aparece nas rotinas</Text>
                  <View style={styles.routineCheckboxes}>
                    {([
                      { key: 'morning' as const, label: 'Manhã', emoji: '🌅', color: '#EDCC6F' },
                      { key: 'afternoon' as const, label: 'Tarde', emoji: '☀️', color: '#88CAFC' },
                      { key: 'night' as const, label: 'Noite', emoji: '🌙', color: '#B39DDB' },
                    ]).map((rt) => {
                      const checked = selectedRoutines[rt.key];
                      return (
                        <TouchableOpacity
                          key={rt.key}
                          onPress={() => {
                            const next = { ...selectedRoutines, [rt.key]: !checked };
                            if (!Object.values(next).some((v) => v)) return;
                            setSelectedRoutines(next);
                            setIsDirty(true);
                          }}
                          style={[
                            styles.routineCheckbox,
                            checked && { borderColor: rt.color, backgroundColor: rt.color + '26' },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.routineCheckboxEmoji}>{rt.emoji}</Text>
                          <Text style={styles.routineCheckboxLabel}>{rt.label}</Text>
                          <Text style={[styles.routineCheckboxTick, checked && { color: rt.color }]}>
                            {checked ? '✓' : ' '}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.sensoryRow}>
                    <View style={styles.sensoryLeft}>
                      <Text style={styles.fieldLabel}>Tarefa sensorial?</Text>
                      <Text style={styles.sensoryHint}>Ativa alertas educativos para pais</Text>
                    </View>
                    <Switch
                      value={hasSensory}
                      onValueChange={handleSensoryToggle}
                      trackColor={{ true: BlueyColors.blueyGreen }}
                      thumbColor={hasSensory ? BlueyColors.blueyGreenDark : '#f4f3f4'}
                    />
                  </View>

                  {hasSensory && (
                    <>
                      <Text style={styles.fieldLabel}>Categoria sensorial</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {SENSORY_CATEGORIES.map((cat) => (
                          <TouchableOpacity
                            key={cat.value}
                            onPress={() => handleSensoryCategoryChange(cat.value as Task['sensory_category'])}
                            style={[
                              styles.catOption,
                              sensoryCategory === cat.value && styles.catOptionSelected,
                            ]}
                          >
                            <Text style={styles.catEmoji}>{cat.emoji}</Text>
                            <Text style={styles.catLabel}>{cat.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Description / instructions */}
                  <Text style={styles.fieldLabel}>
                    {'📝 Instru\u00E7\u00F5es para a crian\u00E7a '}
                    <Text style={styles.optionalLabel}>(opcional)</Text>
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder={'Ex: Coloque pasta do tamanho de uma ervilha. Escove por 2 minutos.'}
                    placeholderTextColor={BlueyColors.textPlaceholder}
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  {/* Video URL */}
                  <Text style={styles.fieldLabel}>
                    {'🎬 Link de v\u00EDdeo de exemplo '}
                    <Text style={styles.optionalLabel}>(opcional)</Text>
                  </Text>
                  <TextInput
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    placeholder="https://youtube.com/..."
                    placeholderTextColor={BlueyColors.textPlaceholder}
                    style={styles.input}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {videoUrl.trim().length > 0 && (
                    <TouchableOpacity
                      style={styles.videoTestBtn}
                      onPress={() => Linking.openURL(videoUrl.trim()).catch(() =>
                        Alert.alert('Erro', 'Link inv\u00E1lido ou sem app para abrir.')
                      )}
                    >
                      <Text style={styles.videoTestBtnText}>{'▶ Testar link do v\u00EDdeo'}</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.formActions}>
                    <BlueyButton
                      title="Cancelar"
                      onPress={() => { setShowForm(false); resetForm(); }}
                      type="outline"
                      style={styles.halfBtn}
                    />
                    <BlueyButton
                      title={editingTask ? 'Salvar' : 'Adicionar'}
                      onPress={handleAddTask}
                      loading={saving}
                      style={styles.halfBtn}
                    />
                  </View>
                </View>
              ) : (
                <BlueyButton
                  title="+ Adicionar Tarefa"
                  onPress={() => {
                    setSelectedRoutines(defaultRoutines());
                    setShowForm(true);
                  }}
                  type="secondary"
                  style={styles.addBtn}
                />
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <TaskHelpModal
        visible={helpTask !== null}
        sensoryCategory={helpTask?.sensory_category}
        taskName={helpTask?.name ?? ''}
        onClose={() => setHelpTask(null)}
        onViewStrategies={(cat) => {
          setHelpTask(null);
          navigation.navigate('Strategies', { category: cat });
        }}
      />
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
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  headerSubtitle: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, textAlign: 'center' },
  addBtn: { marginTop: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskCardWrap: { flex: 1 },
  editTaskBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  editTaskBtnText: { fontSize: 18 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.blueyMain,
    padding: 20,
    marginTop: 8,
  },
  formTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 16 },
  fieldLabel: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 8 },
  emojiScroll: { marginBottom: 16 },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  emojiOptionSelected: {
    borderColor: BlueyColors.blueyMain,
    borderWidth: 3,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  emojiText: { fontSize: 26 },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 16,
  },
  inputSmall: { width: 100 },
  sensoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 14,
    padding: 14,
  },
  sensoryLeft: { flex: 1, marginRight: 12 },
  sensoryHint: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  catScroll: { marginBottom: 16 },
  catOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  catOptionSelected: {
    borderColor: BlueyColors.alertOrange,
    backgroundColor: BlueyColors.backgroundYellow,
  },
  catEmoji: { fontSize: 24, marginBottom: 4 },
  catLabel: { ...Typography.labelSmall, color: BlueyColors.textPrimary },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
  optionalLabel: { ...Typography.bodySmall, color: BlueyColors.textSecondary, fontFamily: 'Nunito_600SemiBold' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  photoPreviewWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  photoPreview: { width: 88, height: 88 },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: BlueyColors.backgroundBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPlaceholderEmoji: { fontSize: 26 },
  photoPlaceholderText: { ...Typography.labelSmall, color: BlueyColors.textSecondary, textAlign: 'center', fontSize: 10 },
  photoActions: { flex: 1, gap: 8 },
  photoBtnPrimary: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  photoBtnPrimaryText: { ...Typography.labelMedium, color: '#fff' },
  photoBtnRemove: {
    borderWidth: 2,
    borderColor: '#E57373',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  photoBtnRemoveText: { ...Typography.labelMedium, color: '#E57373' },
  // ── Icon tab toggle ──
  iconTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  iconTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  iconTabActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  iconTabText: {
    ...Typography.labelMedium,
    color: BlueyColors.textSecondary,
  },
  iconTabTextActive: {
    color: BlueyColors.blueyDark,
  },
  // ── Photo section (inside tab) ──
  photoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  photoBtnSecondary: {
    borderWidth: 2,
    borderColor: BlueyColors.blueyMain,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  photoBtnSecondaryText: {
    ...Typography.labelMedium,
    color: BlueyColors.blueyDark,
  },
  // ── Time presets ──
  timeScroll: { marginBottom: 16 },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    marginRight: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionSelected: {
    borderColor: BlueyColors.blueyMain,
    borderWidth: 3,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  timeOptionText: {
    ...Typography.labelMedium,
    color: BlueyColors.textSecondary,
  },
  timeOptionTextSelected: {
    color: BlueyColors.blueyDark,
  },
  inputMultiline: {
    height: 88,
    paddingTop: 12,
  },
  videoTestBtn: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BlueyColors.blueyMain,
  },
  videoTestBtnText: { ...Typography.labelSmall, color: BlueyColors.blueyDark },
  // ── Routine checkboxes ──
  routineCheckboxes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  routineCheckbox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    backgroundColor: '#fff',
  },
  routineCheckboxEmoji: { fontSize: 22, marginBottom: 2 },
  routineCheckboxLabel: { ...Typography.labelSmall, color: BlueyColors.textPrimary, marginBottom: 2 },
  routineCheckboxTick: { ...Typography.titleMedium, color: BlueyColors.borderLight },
});
