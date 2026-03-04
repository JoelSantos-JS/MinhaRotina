import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  Image,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');
// Telas pequenas (<680px de altura) usam tamanhos reduzidos
const SMALL = SCREEN_H < 680;
const TIMER_SIZE  = SMALL ? 72  : 88;
const EMOJI_SIZE  = SMALL ? 72  : 96;
const EMOJI_LINE  = SMALL ? 82  : 108;
const CARD_PAD    = SMALL ? 16  : 22;
const NAME_SIZE   = SMALL ? 22  : 26;
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  onTaskCompleted,
  onMoveToNextTask,
  onTaskSkipped,
  onCalmModeEntered,
  onRoutineStarted,
} from '../../utils/taskEventHandlers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { routineService, taskService } from '../../services/routine.service';
import { useAuthStore } from '../../stores/authStore';
import { useRoutineStore } from '../../stores/routineStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { isRoutineAvailableNow } from '../../utils/timeWindow';
import { useParentSettingsStore } from '../../stores/parentSettingsStore';
import type { Task } from '../../types/models';
import type { ChildScreenProps } from '../../types/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_BG = '#FFFFFD';

function getRoutineTypeLabel(type: string): string {
  if (type === 'morning') return 'manha';
  if (type === 'afternoon') return 'tarde';
  if (type === 'night') return 'noite';
  return 'periodo personalizado';
}


// ─── Circular Timer Component ─────────────────────────────────────────────────
// Implementação simples e confiável no Android: anel colorido + texto central.
// A opacidade do preenchimento diminui à medida que o tempo passa.

interface CircularTimerProps {
  remaining: number; // seconds left
  total: number;     // total seconds
  color: string;
  size?: number;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  remaining,
  total,
  color,
  size = 88,
}) => {
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 1;
  const isUrgent = remaining <= 30 && remaining > 0;
  const fillColor = isUrgent ? '#E57373' : color;
  const half = size / 2;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${secs}s`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Fundo fixo (track) */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: half, backgroundColor: fillColor + '22' }]} />
      {/* Preenchimento que some conforme o tempo passa */}
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: half,
        backgroundColor: fillColor,
        opacity: 0.12 + 0.78 * progress,
      }]} />
      {/* Anel externo sempre visível */}
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: half,
        borderWidth: 3,
        borderColor: fillColor,
      }]} />
      {/* Texto central */}
      <Text style={[styles.timerText, { color: '#FFFFFF', fontSize: size * 0.26, lineHeight: size * 0.32, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
        {timeStr}
      </Text>
    </View>
  );
};

// ─── Flying Emoji Particle ────────────────────────────────────────────────────

interface Particle {
  id: number;
  emoji: string;
  offsetX: number;
  travel: Animated.Value;
  opacity: Animated.Value;
}

const FlyingParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const translateY = particle.travel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -260],
  });
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 40,
        bottom: 100,
        alignSelf: 'center',
        marginLeft: particle.offsetX,
        transform: [{ translateY }],
        opacity: particle.opacity,
        zIndex: 200,
      }}
    >
      {particle.emoji}
    </Animated.Text>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CurrentTaskScreen: React.FC<ChildScreenProps<'CurrentTask'>> = ({
  navigation,
  route,
}) => {
  const { childId, routineId } = route.params;
  const child = useAuthStore((s) => s.child);
  const { isLoading, fetchError, fetchTasks } = useRoutineStore();
  const { settings } = useParentSettingsStore();

  // Local queue (supports "try later" reordering)
  const [localQueue, setLocalQueue] = useState<Task[]>([]);
  const [localIndex, setLocalIndex] = useState(0);
  const [allDoneToday, setAllDoneToday] = useState(false);
  const [allTasksForSummary, setAllTasksForSummary] = useState<Task[]>([]);

  // UI state
  const [completing, setCompleting] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);


  // Timer
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalTime, setTotalTime] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);

  // Animations
  const taskOpacity = useRef(new Animated.Value(1)).current;
  const taskSlide = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());

  const scheduleTimeout = useCallback((fn: () => void, delayMs: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
      if (isMountedRef.current) {
        fn();
      }
    }, delayMs);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      timeoutRefs.current.forEach((id) => clearTimeout(id));
      timeoutRefs.current = [];
    },
    []
  );

  // ── Load tasks ──────────────────────────────────────────────────────────────
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    let active = true;

    const validateAndLoad = async () => {
      setFetchDone(false);
      try {
        const routine = await routineService.getRoutineById(routineId);

        if (!active) return;

        if (!routine || routine.child_id !== childId) {
          Alert.alert('Rotina indisponivel', 'Nao foi possivel abrir essa rotina agora.');
          navigation.goBack();
          return;
        }

        if (!isRoutineAvailableNow(routine.type)) {
          const periodLabel = getRoutineTypeLabel(routine.type);
          Alert.alert(
            'Rotina bloqueada',
            `Essa rotina e da ${periodLabel}. Volte quando chegar esse periodo.`
          );
          navigation.goBack();
          return;
        }

        await fetchTasks(routineId);

        if (!active) return;

        const freshTasks = useRoutineStore.getState().tasks;
        if (freshTasks.length > 0) {
          const completedIds = await taskService.getCompletedTaskIdsToday(childId, routineId);
          const completedSet = new Set(completedIds);
          const pending = freshTasks.filter((t) => !completedSet.has(t.id));

          if (pending.length === 0) {
            // All tasks already done today — show summary
            setAllTasksForSummary([...freshTasks]);
            setAllDoneToday(true);
          } else {
            setAllTasksForSummary([...freshTasks]);
            setLocalQueue(pending);
            setLocalIndex(0);
            onRoutineStarted(childId);
          }
        }
      } finally {
        if (active) setFetchDone(true);
      }
    };

    validateAndLoad();

    return () => {
      active = false;
    };
  }, [childId, fetchTasks, navigation, routineId]);

  // ── Timer: reset when task changes ─────────────────────────────────────────
  const currentTaskId = localQueue[localIndex]?.id;
  useEffect(() => {
    const task = localQueue[localIndex];
    if (!task) return;
    const secs = (task.estimated_minutes ?? 5) * 60;
    setTimeLeft(secs);
    setTotalTime(secs);
    startTime.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [localIndex, currentTaskId]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const currentTask = localQueue[localIndex];
  const nextTaskData = localQueue[localIndex + 1] ?? null;
  const isLastTask = localIndex >= localQueue.length - 1;
  const totalTasks = localQueue.length;
  const themeColor = child?.color_theme ?? BlueyColors.blueyMain;

  // Suporte visual: controla o que é exibido no card da tarefa
  // 'images_text'  → tudo (emoji/foto + nome + passos/descrição + vídeo)
  // 'reduced_text' → emoji/foto + nome + descrição (sem checklist de passos)
  // 'images_only'  → emoji/foto + nome (sem texto extra, sem vídeo)
  const visualSupport = child?.visual_support_type ?? 'images_text';

  // Perfil sensorial: adapta animações e exibe alertas quando necessário
  const sensoryProfile = child?.sensory_profile;
  const isVisualSensitive = sensoryProfile?.visual === 'hyper-reactive';

  // ── Task transition animation ───────────────────────────────────────────────
  const animateTransition = useCallback(
    (callback: () => void) => {
      Animated.parallel([
        Animated.timing(taskOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(taskSlide, { toValue: -28, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        callback();
        taskSlide.setValue(36);
        Animated.parallel([
          Animated.timing(taskOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(taskSlide, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      });
    },
    [taskOpacity, taskSlide]
  );

  // ── Mini celebration (flying emojis) ───────────────────────────────────────
  const triggerMiniCelebration = useCallback(() => {
    if (!settings.miniCelebrationsEnabled) return;
    if (isVisualSensitive) return; // visual hyper-reactive: evita estímulos extras
    const EMOJIS = ['⭐', '✨', '🎉', '⭐', '🌟'];
    const newParticles: Particle[] = EMOJIS.map((emoji, i) => ({
      id: Date.now() + i,
      emoji,
      offsetX: -96 + i * 48,
      travel: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }));
    setParticles(newParticles);
    newParticles.forEach((p, i) => {
      Animated.parallel([
        Animated.timing(p.travel, {
          toValue: 1,
          duration: 750 + i * 70,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 750 + i * 70,
          useNativeDriver: true,
        }),
      ]).start();
    });
    scheduleTimeout(() => setParticles([]), 1100);
  }, [scheduleTimeout, isVisualSensitive]);

  // ── Button scale animation ──────────────────────────────────────────────────
  const animateButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 90, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 5 }),
    ]).start();
  }, [btnScale]);

  // ── Complete task ────────────────────────────────────────────────────────────
  const doComplete = useCallback(async (stepNote?: string) => {
    setCompleting(true);
    animateButton();
    triggerMiniCelebration();

    const tookMinutes = Math.round((Date.now() - startTime.current) / 60000);
    try {
      await taskService.recordCompletion(childId, routineId, currentTask!.id, tookMinutes, stepNote);
    } catch {}

    if (isLastTask) {
      onTaskCompleted(childId);
      scheduleTimeout(() => {
        navigation.replace('Celebration', { childId, routineName: 'Rotina' });
      }, 700);
    } else {
      onTaskCompleted(childId);
      animateTransition(() => {
        if (!isMountedRef.current) return;
        setLocalIndex((prev) => prev + 1);
        setCompleting(false);
        onMoveToNextTask(childId);
      });
    }
  }, [animateButton, animateTransition, childId, currentTask, isLastTask, routineId, scheduleTimeout, triggerMiniCelebration]);

  const handleComplete = useCallback(() => {
    if (!currentTask || completing) return;
    doComplete();
  }, [currentTask, completing, doComplete]);

  // ── Skip — pular por agora ──────────────────────────────────────────────────
  const handleSkipNow = () => {
    setSkipVisible(false);
    onTaskSkipped(childId);
    if (currentTask) {
      taskService.recordSkip(childId, routineId, currentTask.id, 'skip_now').catch(() => {});
    }
    if (isLastTask || localQueue.length <= 1) {
      navigation.replace('Celebration', { childId, routineName: 'Rotina' });
      return;
    }
    animateTransition(() => {
      if (!isMountedRef.current) return;
      setLocalIndex((prev) => prev + 1);
      setCompleting(false);
    });
  };

  // ── Skip — tentar no final ──────────────────────────────────────────────────
  const handleTryLater = () => {
    setSkipVisible(false);
    onTaskSkipped(childId);
    if (currentTask) {
      taskService.recordSkip(childId, routineId, currentTask.id, 'try_later').catch(() => {});
    }
    const remaining = localQueue.length - localIndex;
    if (remaining <= 1) {
      navigation.replace('Celebration', { childId, routineName: 'Rotina' });
      return;
    }
    const newQueue = [...localQueue];
    const [skipped] = newQueue.splice(localIndex, 1);
    newQueue.push(skipped);
    animateTransition(() => {
      if (!isMountedRef.current) return;
      setLocalQueue(newQueue);
      // localIndex stays same → now points to next task (which moved up)
    });
  };

  const handleOpenVideo = useCallback(async () => {
    const rawUrl = currentTask?.video_url?.trim();
    if (!rawUrl) return;

    const isHttp = /^https?:\/\//i.test(rawUrl);
    if (!isHttp) {
      Alert.alert('Link invalido', 'Use apenas links com http ou https.');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(rawUrl);
      if (!canOpen) {
        Alert.alert('Nao foi possivel abrir', 'Este link de video nao e suportado no aparelho.');
        return;
      }
      await Linking.openURL(rawUrl);
    } catch {
      Alert.alert('Erro ao abrir video', 'Tente novamente em instantes.');
    }
  }, [currentTask?.video_url]);

  // ── Loading / empty states ──────────────────────────────────────────────────
  if (isLoading || !fetchDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner fullScreen message="Preparando sua rotina..." />
      </SafeAreaView>
    );
  }

  if (allDoneToday) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={[themeColor + 'CC', themeColor + '44', '#FFFFFD']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.allDoneContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.allDoneEmoji}>🏆</Text>
            <Text style={styles.allDoneTitleText}>Tudo feito hoje!</Text>
            <Text style={styles.allDoneSubText}>
              Você já completou toda a rotina hoje. Incrível! ⭐
            </Text>

            <View style={styles.allDoneList}>
              {allTasksForSummary.map((task) => (
                <View key={task.id} style={styles.allDoneRow}>
                  <Text style={styles.allDoneTaskEmoji}>{task.icon_emoji}</Text>
                  <Text style={styles.allDoneTaskName} numberOfLines={1}>
                    {task.name}
                  </Text>
                  <Text style={styles.allDoneCheck}>✅</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.goBackBtn, { backgroundColor: themeColor }]}
            >
              <Text style={styles.goBackText}>Voltar</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (localQueue.length === 0 || !currentTask) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={BlueyGradients.skyVertical} style={styles.gradient}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{fetchError ? '⚠️' : '📋'}</Text>
            <Text style={styles.emptyTitle}>
              {fetchError ? 'Erro ao carregar' : 'Nenhuma tarefa'}
            </Text>
            <Text style={styles.emptyText}>
              {fetchError ?? 'Sua rotina ainda não tem tarefas.'}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
              <Text style={styles.goBackText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const dotSize = totalTasks > 9 ? 10 : totalTasks > 6 ? 13 : 16;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[themeColor + 'DD', themeColor + '33', '#FFFFFD']}
        style={styles.gradient}
      >
        {/* ── Top row: calm toggle + escape button ─────────────────────────── */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => {
              const entering = !calmMode;
              setCalmMode(entering);
              if (entering) {
                onCalmModeEntered(childId);
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.topBtnText}>{calmMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <View style={styles.taskCountPill}>
            <Text style={styles.taskCountText}>
              {localIndex + 1} / {totalTasks}
            </Text>
          </View>

          {settings.helpButtonEnabled && (
            <TouchableOpacity
              style={[styles.topBtn, styles.escapeBtn]}
              onPress={() => {
                setSkipVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.topBtnText}>😔</Text>
            </TouchableOpacity>
          )}
          {!settings.helpButtonEnabled && <View style={{ width: 44 }} />}
        </View>

        {/* ── Progress dots (hidden in calm mode) ──────────────────────────── */}
        {!calmMode && (
          <View style={styles.dotsRow}>
            {Array.from({ length: totalTasks }).map((_, i) => {
              const isDone = i < localIndex;
              const isCurrent = i === localIndex;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                    },
                    isDone
                      ? { backgroundColor: '#A8C98E', borderColor: '#8FB875', borderWidth: 2 }
                      : isCurrent
                      ? {
                          backgroundColor: themeColor,
                          borderColor: themeColor,
                          borderWidth: 3,
                          transform: [{ scale: 1.4 }],
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.4)',
                          borderColor: 'rgba(255,255,255,0.7)',
                          borderWidth: 2,
                        },
                  ]}
                >
                  {isDone ? <Text style={[styles.dotCheck, { fontSize: dotSize * 0.7 }]}>✓</Text> : null}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Main animated area ────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.mainArea,
            { opacity: taskOpacity, transform: [{ translateY: taskSlide }] },
          ]}
        >
          {/* Task card */}
          <View style={[styles.taskCard, { borderColor: themeColor + '66' }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.taskCardContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Timer (hidden in calm mode) */}
              {!calmMode && (
                <View style={styles.timerWrap}>
                  <CircularTimer
                    remaining={timeLeft}
                    total={totalTime}
                    color={themeColor}
                    size={TIMER_SIZE}
                  />
                  <Text style={styles.timerLabel}>⏱ Tempo</Text>
                </View>
              )}

              {/* Task image or emoji */}
              {currentTask?.photo_url ? (
                <Image
                  source={{ uri: currentTask.photo_url }}
                  style={[
                    styles.taskPhoto,
                    (calmMode || visualSupport === 'images_only') && styles.taskPhotoCalm,
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={[
                    styles.taskEmoji,
                    (calmMode || visualSupport === 'images_only') && styles.taskEmojiCalm,
                  ]}
                >
                  {currentTask?.icon_emoji}
                </Text>
              )}

              {/* Task name */}
              <Text style={styles.taskName}>{currentTask?.name}</Text>

              {/* Alerta sensorial tátil */}
              {sensoryProfile?.tactile === 'hyper-reactive' && currentTask?.has_sensory_issues && (
                <View style={styles.sensoryWarning}>
                  <Text style={styles.sensoryWarningText}>
                    🧤 Tarefa com toque — respira fundo antes de começar
                  </Text>
                </View>
              )}

              {/* Passos ou descrição */}
              {visualSupport === 'images_text' && currentTask?.steps && currentTask.steps.length > 0 ? (
                <View style={styles.stepsBox}>
                  <Text style={styles.stepsTitle}>{'📋 Passos'}</Text>
                  {currentTask.steps.map((step, index) => (
                    <View key={step.id} style={styles.stepRow}>
                      <View style={styles.stepBullet}>
                        <Text style={styles.stepBulletText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                  ))}
                </View>
              ) : visualSupport !== 'images_only' && currentTask?.description ? (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>{currentTask.description}</Text>
                </View>
              ) : null}

              {/* Video example button (oculto para images_only) */}
              {visualSupport !== 'images_only' && currentTask?.video_url ? (
                <TouchableOpacity
                  style={[styles.videoBtn, { borderColor: themeColor }]}
                  onPress={handleOpenVideo}
                  activeOpacity={0.8}
                >
                  <Text style={styles.videoBtnEmoji}>{'▶\uFE0F'}</Text>
                  <Text style={[styles.videoBtnText, { color: themeColor }]}>
                    {'Ver v\u00EDdeo de exemplo'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>

          {/* "O que vem depois" (hidden in calm mode) */}
          {!calmMode && (
            <View style={[styles.nextCard, { borderColor: themeColor + '44' }]}>
              {nextTaskData ? (
                <>
                  <Text style={styles.nextLabel}>Depois:</Text>
                  <View style={[styles.nextIconBg, { backgroundColor: themeColor + '25' }]}>
                    <Text style={styles.nextEmoji}>{nextTaskData.icon_emoji}</Text>
                  </View>
                  <Text style={styles.nextName} numberOfLines={1}>{nextTaskData.name}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextEmoji}>🎉</Text>
                  <Text style={[styles.nextName, { color: '#8FB875' }]} numberOfLines={1}>
                    Última tarefa!
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* ── Flying particles ─────────────────────────────────────────────── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p) => (
            <FlyingParticle key={p.id} particle={p} />
          ))}
        </View>

        {/* ── Footer: FEITO button ─────────────────────────────────────────── */}
        <View style={styles.footer}>
          {calmMode && (
            <Text style={styles.calmIndicator}>🌙 Modo Calmo</Text>
          )}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={handleComplete}
              disabled={completing}
              activeOpacity={0.88}
              style={styles.doneBtn}
            >
              <LinearGradient
                colors={
                  isLastTask
                    ? (['#A8C98E', '#8FB875'] as const)
                    : ([themeColor, themeColor + 'AA'] as const)
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneGradient}
              >
                <Text style={styles.doneEmoji}>{isLastTask ? '🏆' : '✅'}</Text>
                <Text style={styles.doneText}>
                  {isLastTask ? 'TERMINEI TUDO!' : 'FIZ ISSO!'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Skip Modal ────────────────────────────────────────────────────── */}
        <Modal
          visible={skipVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setSkipVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>🤗</Text>
              <Text style={styles.modalTitle}>Tudo bem!</Text>
              <Text style={styles.modalText}>
                Você pode pular por agora.{'\n'}Sem problemas! ❤️
              </Text>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E57373' }]}
                onPress={handleSkipNow}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnText}>Pular por Agora</Text>
              </TouchableOpacity>

              {!isLastTask && localQueue.length > 1 && (
                <TouchableOpacity
                  style={[styles.modalBtnOutline, { borderColor: themeColor }]}
                  onPress={handleTryLater}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modalBtnOutlineText, { color: themeColor }]}>
                    ↩ Tentar no Final
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setSkipVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    height: 56,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escapeBtn: {
    opacity: 0.7,
  },
  topBtnText: { fontSize: 22 },
  taskCountPill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  taskCountText: {
    ...Typography.labelMedium,
    color: BlueyColors.textPrimary,
    fontSize: 15,
  },

  // ── Progress dots ──
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 8,
    minHeight: 44,
  },
  dot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCheck: {
    color: '#FFFFFD',
    fontFamily: 'Nunito_900Black',
    lineHeight: 16,
  },

  // ── Main animated area ──
  mainArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
    // sem justifyContent: 'center' — taskCard usa flex:1 e ocupa o espaço disponível
  },

  // ── Task card ──
  taskCard: {
    flex: 1,                // ocupa todo espaço entre dots e nextCard
    backgroundColor: CARD_BG,
    borderRadius: 28,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  taskCardContent: {
    padding: CARD_PAD,
    alignItems: 'center',
    paddingBottom: CARD_PAD + 4,
  },
  timerWrap: {
    marginBottom: 10,
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    ...Typography.labelSmall,
    fontSize: 11,
    color: BlueyColors.textSecondary,
    letterSpacing: 0.5,
  },
  timerText: {
    fontFamily: 'Nunito_900Black',
    fontSize: 18,
    color: '#FFFFFF',
  },
  taskEmoji: {
    fontSize: EMOJI_SIZE,
    marginBottom: 8,
    lineHeight: EMOJI_LINE,
  },
  taskEmojiCalm: {
    fontSize: EMOJI_SIZE + 40,
    lineHeight: EMOJI_LINE + 44,
  },
  taskPhoto: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    borderRadius: 20,
    marginBottom: 8,
  },
  taskPhotoCalm: {
    width: EMOJI_SIZE + 40,
    height: EMOJI_SIZE + 40,
    borderRadius: 26,
  },
  taskName: {
    ...Typography.headlineLarge,
    fontSize: NAME_SIZE,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  descriptionBox: {
    marginTop: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
  },
  descriptionText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  // ── Passo a passo ───────────────────────────────────────────────────────────
  stepsBox: {
    marginTop: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'stretch',
  },
  stepsTitle: {
    ...Typography.labelMedium,
    color: BlueyColors.textSecondary,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  stepBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BlueyColors.blueyMain,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBulletText: {
    color: '#fff',
    fontFamily: 'Nunito_900Black',
    fontSize: 13,
    lineHeight: 16,
  },
  stepText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
    paddingTop: 3,
  },
  sensoryWarning: {
    marginTop: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderColor: '#FFB74D',
  },
  sensoryWarningText: {
    ...Typography.bodySmall,
    color: '#E65100',
    textAlign: 'center',
  },
  videoBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  videoBtnEmoji: { fontSize: 22 },
  videoBtnText: {
    ...Typography.labelMedium,
    fontSize: 16,
  },

  // ── "O que vem depois" card ──
  nextCard: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextLabel: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    fontSize: 12,
    minWidth: 62,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nextIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEmoji: { fontSize: 22 },
  nextName: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
    fontSize: 14,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 4,
    gap: 8,
  },
  calmIndicator: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  doneBtn: {
    borderRadius: 44,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  doneGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 22,
    gap: 14,
  },
  doneEmoji: { fontSize: 40 },
  doneText: {
    ...Typography.headlineMedium,
    color: '#FFFFFF',
    fontSize: 28,
  },

  // ── Skip Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#FFFFFD',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    gap: 12,
  },
  modalEmoji: { fontSize: 64 },
  modalTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
  },
  modalText: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 4,
  },
  modalBtn: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalBtnText: {
    ...Typography.titleMedium,
    color: '#FFFFFF',
  },
  modalBtnOutline: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalBtnOutlineText: {
    ...Typography.titleMedium,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  modalBtnCancelText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
  },

  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  goBackBtn: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  goBackText: { ...Typography.labelMedium, color: '#fff' },

  // ── All done today ──
  allDoneContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    paddingBottom: 48,
  },
  allDoneEmoji: { fontSize: 80, marginBottom: 12 },
  allDoneTitleText: {
    ...Typography.headlineLarge,
    fontSize: 30,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  allDoneSubText: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 28,
  },
  allDoneList: {
    width: '100%',
    gap: 10,
    marginBottom: 32,
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  allDoneTaskEmoji: { fontSize: 28 },
  allDoneTaskName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
  },
  allDoneCheck: { fontSize: 22 },
});
