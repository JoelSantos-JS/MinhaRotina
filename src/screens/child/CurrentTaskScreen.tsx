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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { feedbackService } from '../../services/feedbackService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { routineService, taskService } from '../../services/routine.service';
import { useAuthStore } from '../../stores/authStore';
import { useRoutineStore } from '../../stores/routineStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { isRoutineAvailableNow } from '../../utils/timeWindow';
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
// Uses the two-halves mask technique: two white semicircles rotate to
// cover/uncover a colored disc, creating a Time Timer-style countdown.

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
  size = 108,
}) => {
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 1;
  const elapsed = 1 - progress;
  const half = size / 2;

  // Right mask: starts rotated OUT (180°=blue visible) → rotates IN (0°=white covers right)
  const rightRotate = 180 * (1 - Math.min(elapsed * 2, 1));
  // Left mask: starts rotated OUT (-180°=blue visible) → rotates IN (0°=white covers left)
  const leftRotate = -180 + Math.max(0, (elapsed - 0.5) * 2) * 180;

  const fillColor = remaining <= 30 && remaining > 0 ? '#E57373' : color;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${secs}s`;

  return (
    <View style={{ width: size, height: size }}>
      {/* Track (light background disc) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: half, backgroundColor: color + '30' },
        ]}
      />
      {/* Fill (the colored "remaining" disc) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: half, backgroundColor: fillColor },
        ]}
      />

      {/* Right half-mask (clips to right 50%, inner circle rotates to reveal/cover) */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: half,
          height: size,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: -half,
            top: 0,
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: CARD_BG,
            transform: [{ rotate: `${rightRotate}deg` }],
          }}
        />
      </View>

      {/* Left half-mask */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: half,
          height: size,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: CARD_BG,
            transform: [{ rotate: `${leftRotate}deg` }],
          }}
        />
      </View>

      {/* Outer ring (always visible, shows full circle boundary) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: half,
            borderWidth: 3,
            borderColor: fillColor + '80',
          },
        ]}
      />

      {/* Center countdown text */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={[styles.timerText, { color: remaining <= 30 ? '#fff' : '#fff' }]}>
          {timeStr}
        </Text>
      </View>
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

  // Local queue (supports "try later" reordering)
  const [localQueue, setLocalQueue] = useState<Task[]>([]);
  const [localIndex, setLocalIndex] = useState(0);

  // UI state
  const [completing, setCompleting] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState(300);
  const [totalTime, setTotalTime] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const taskOpacity = useRef(new Animated.Value(1)).current;
  const taskSlide = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());

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
          setLocalQueue([...freshTasks]);
          setLocalIndex(0);
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
    setTimeout(() => setParticles([]), 1100);
  }, []);

  // ── Button scale animation ──────────────────────────────────────────────────
  const animateButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 90, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 5 }),
    ]).start();
  }, [btnScale]);

  // ── Complete task ────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!currentTask || completing) return;
    setCompleting(true);
    animateButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerMiniCelebration();

    const tookMinutes = Math.round((Date.now() - startTime.current) / 60000);
    try {
      await taskService.recordCompletion(childId, routineId, currentTask.id, tookMinutes);
    } catch {}

    if (isLastTask) {
      await feedbackService.triggerRoutineComplete(childId);
      setTimeout(() => {
        navigation.replace('Celebration', { childId, routineName: 'Rotina' });
      }, 700);
    } else {
      animateTransition(() => {
        setLocalIndex((prev) => prev + 1);
        setCompleting(false);
      });
    }
  };

  // ── Skip — pular por agora ──────────────────────────────────────────────────
  const handleSkipNow = () => {
    setSkipVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentTask) {
      taskService.recordSkip(childId, routineId, currentTask.id, 'skip_now').catch(() => {});
    }
    if (isLastTask || localQueue.length <= 1) {
      navigation.replace('Celebration', { childId, routineName: 'Rotina' });
      return;
    }
    animateTransition(() => {
      setLocalIndex((prev) => prev + 1);
      setCompleting(false);
    });
  };

  // ── Skip — tentar no final ──────────────────────────────────────────────────
  const handleTryLater = () => {
    setSkipVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
      setLocalQueue(newQueue);
      // localIndex stays same → now points to next task (which moved up)
    });
  };

  // ── Loading / empty states ──────────────────────────────────────────────────
  if (isLoading || !fetchDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner fullScreen message="Preparando sua rotina..." />
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
              setCalmMode((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
            {/* Timer (hidden in calm mode) */}
            {!calmMode && (
              <View style={styles.timerWrap}>
                <CircularTimer
                  remaining={timeLeft}
                  total={totalTime}
                  color={themeColor}
                  size={108}
                />
              </View>
            )}

            {/* Task image or emoji */}
            {currentTask?.photo_url ? (
              <Image
                source={{ uri: currentTask.photo_url }}
                style={[styles.taskPhoto, calmMode && styles.taskPhotoCalm]}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.taskEmoji, calmMode && styles.taskEmojiCalm]}>
                {currentTask?.icon_emoji}
              </Text>
            )}

            {/* Task name */}
            <Text style={styles.taskName}>{currentTask?.name}</Text>

            {/* Instructions */}
            {currentTask?.description ? (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{currentTask.description}</Text>
              </View>
            ) : null}

            {/* Video example button */}
            {currentTask?.video_url ? (
              <TouchableOpacity
                style={[styles.videoBtn, { borderColor: themeColor }]}
                onPress={() => Linking.openURL(currentTask.video_url!).catch(() => {})}
                activeOpacity={0.8}
              >
                <Text style={styles.videoBtnEmoji}>{'▶\uFE0F'}</Text>
                <Text style={[styles.videoBtnText, { color: themeColor }]}>
                  {'Ver v\u00EDdeo de exemplo'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* "O que vem depois" (hidden in calm mode) */}
          {!calmMode && (
            <View style={[styles.nextCard, { borderColor: themeColor + '44' }]}>
              {nextTaskData ? (
                <>
                  <Text style={styles.nextLabel}>Depois vem:</Text>
                  <View style={styles.nextRow}>
                    <View style={[styles.nextIconBg, { backgroundColor: themeColor + '25' }]}>
                      <Text style={styles.nextEmoji}>{nextTaskData.icon_emoji}</Text>
                    </View>
                    <Text style={styles.nextName}>{nextTaskData.name}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.nextRow}>
                  <Text style={styles.nextEmoji}>🎉</Text>
                  <Text style={[styles.nextName, { color: '#8FB875' }]}>
                    Última tarefa — depois vem a celebração!
                  </Text>
                </View>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 14,
  },

  // ── Task card ──
  taskCard: {
    backgroundColor: CARD_BG,
    borderRadius: 32,
    borderWidth: 3,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  timerWrap: {
    marginBottom: 20,
  },
  timerText: {
    fontFamily: 'Nunito_900Black',
    fontSize: 22,
    color: '#FFFFFF',
  },
  taskEmoji: {
    fontSize: 120,
    marginBottom: 12,
    lineHeight: 132,
  },
  taskEmojiCalm: {
    fontSize: 160,
    lineHeight: 180,
  },
  taskPhoto: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 12,
  },
  taskPhotoCalm: {
    width: 160,
    height: 160,
    borderRadius: 30,
  },
  taskName: {
    ...Typography.headlineLarge,
    fontSize: 28,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
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
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 14,
    gap: 6,
  },
  nextLabel: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    fontSize: 13,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEmoji: { fontSize: 28 },
  nextName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
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
});

