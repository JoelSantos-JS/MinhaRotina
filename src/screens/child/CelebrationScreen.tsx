import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useRoutineStore } from '../../stores/routineStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { feedbackService } from '../../services/feedbackService';
import type { ChildScreenProps } from '../../types/navigation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = ['#A8C98E', '#88CAFC', '#EDCC6F', '#F1B873', '#F48FB1', '#CE93D8'];
const CONFETTI_COUNT = 45;

const CELEBRATION_MESSAGES = [
  'INCRÍVEL! 🌟',
  'VOCÊ ARRASOU! 🚀',
  'QUE ORGULHO! 🏆',
  'PARABÉNS! 🎉',
  'VOCÊ É DEMAIS! ⭐',
];

interface ConfettiParticle {
  id: number;
  color: string;
  x: number;
  size: number;
  isCircle: boolean;
  rotateDir: 1 | -1;
  delay: number;
  duration: number;
  swayAmount: number;
  fallAnim: Animated.Value;
  swayAnim: Animated.Value;
  rotateAnim: Animated.Value;
}

function buildParticles(): ConfettiParticle[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.random(),
    size: 7 + Math.random() * 9,
    isCircle: i % 3 === 0,
    rotateDir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
    delay: Math.random() * 2200,
    duration: 2000 + Math.random() * 1800,
    swayAmount: (Math.random() - 0.5) * 110,
    fallAnim: new Animated.Value(0),
    swayAnim: new Animated.Value(0),
    rotateAnim: new Animated.Value(0),
  }));
}

const ConfettiPiece: React.FC<{ p: ConfettiParticle }> = ({ p }) => {
  const translateY = p.fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, SCREEN_H + 80],
  });
  const translateX = p.swayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, p.swayAmount],
  });
  const rotate = p.rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${p.rotateDir * 360}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: p.x * SCREEN_W,
          width: p.size,
          height: p.isCircle ? p.size : p.size * 0.55,
          borderRadius: p.isCircle ? p.size / 2 : 2,
          backgroundColor: p.color,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
};

export const CelebrationScreen: React.FC<ChildScreenProps<'Celebration'>> = ({
  navigation,
  route,
}) => {
  const { routineName } = route.params;
  const child = useAuthStore((s) => s.child);
  const resetProgress = useRoutineStore((s) => s.resetProgress);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const particles = useRef<ConfettiParticle[]>(buildParticles()).current;
  const message = useRef(
    CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
  ).current;

  useEffect(() => {
    // Haptic pattern for routine complete
    feedbackService.triggerRoutineComplete(child?.id ?? '');

    // Trophy bounce
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 40,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 5,
      }),
    ]).start();

    // Spinning star loop
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Confetti — each particle loops independently
    particles.forEach((p) => {
      const runParticle = () => {
        p.fallAnim.setValue(0);
        p.swayAnim.setValue(0);
        p.rotateAnim.setValue(0);
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.fallAnim, {
              toValue: 1,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.timing(p.swayAnim, {
              toValue: 1,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.timing(p.rotateAnim, {
              toValue: 1,
              duration: p.duration,
              useNativeDriver: true,
            }),
          ]),
        ]).start(({ finished }) => {
          if (finished) runParticle();
        });
      };
      runParticle();
    });
  }, []);

  const spinRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleDone = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.91, useNativeDriver: true, speed: 60 }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 60 }),
    ]).start(() => {
      resetProgress();
      navigation.popToTop();
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.celebrationVertical} style={styles.gradient}>
        {/* Confetti layer — rendered behind content */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p) => (
            <ConfettiPiece key={p.id} p={p} />
          ))}
        </View>

        <View style={styles.content}>
          {/* Trophy */}
          <Animated.Text
            style={[styles.trophy, { transform: [{ scale: scaleAnim }] }]}
          >
            🏆
          </Animated.Text>

          <Text style={styles.message}>{message}</Text>

          <Text style={styles.childName}>{child?.name}!</Text>

          <Text style={styles.subtitle}>
            Você completou a rotina de{'\n'}
            <Text style={styles.routineName}>"{routineName}"</Text>
          </Text>

          {/* Spinning star */}
          <Animated.Text style={[styles.spinStar, { transform: [{ rotate: spinRotate }] }]}>
            ⭐
          </Animated.Text>

          {/* Motivational note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              Cada tarefa completa é uma conquista! Você está crescendo muito! 🌱
            </Text>
          </View>
        </View>

        {/* Done button */}
        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity onPress={handleDone} activeOpacity={0.85} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Começar Novo Dia ✨</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  trophy: {
    fontSize: 120,
    marginBottom: 20,
  },
  message: {
    ...Typography.displayLarge,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  childName: {
    ...Typography.headlineLarge,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  routineName: {
    fontFamily: 'Nunito_900Black',
  },
  spinStar: {
    fontSize: 48,
    marginBottom: 24,
  },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  noteText: {
    ...Typography.bodyMedium,
    color: '#fff',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  doneBtn: {
    backgroundColor: '#fff',
    borderRadius: 40,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  doneBtnText: {
    ...Typography.headlineMedium,
    color: BlueyColors.blueyGreenDark,
  },
});
