import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';

export type SensoryAlertCategory = 'teeth' | 'bath' | 'bathroom' | 'clothes' | 'hair' | 'food';

interface EducationalAlertProps {
  category: SensoryAlertCategory;
  onViewStrategies: () => void;
  onDismiss: () => void;
}

interface AlertData {
  emoji: string;
  title: string;
  text: string;
  percentage: number;
  statLabel: string;
}

const ALERT_DATA: Record<SensoryAlertCategory, AlertData> = {
  teeth: {
    emoji: '🦷',
    title: 'Escovação pode ser difícil!',
    text: 'Crianças autistas resistem a escovar os dentes por questões SENSORIAIS — barulho + textura da escova. Isso NÃO é birra!',
    percentage: 70,
    statLabel: '70% das crianças autistas têm dificuldade com escovação',
  },
  bath: {
    emoji: '🛁',
    title: 'Banho pode ser desafiador!',
    text: 'O barulho da água e a sensação na pele são gatilhos sensoriais reais. Estratégias graduais fazem toda diferença!',
    percentage: 65,
    statLabel: '65% têm dificuldade com o banho por sensibilidade sensorial',
  },
  bathroom: {
    emoji: '🚽',
    title: 'Treino de banheiro leva tempo!',
    text: 'Textura do vaso e barulho da descarga são gatilhos comuns. O processo pode levar 3–6 meses — e está tudo bem!',
    percentage: 60,
    statLabel: '60% têm dificuldade no treino de banheiro',
  },
  clothes: {
    emoji: '👕',
    title: 'Roupas podem incomodar muito!',
    text: 'Etiquetas, costuras e texturas podem ser extremamente desconfortáveis. Não é frescura — é hipersensibilidade tátil!',
    percentage: 55,
    statLabel: '55% apresentam hipersensibilidade a texturas e roupas',
  },
  hair: {
    emoji: '💇',
    title: 'Cuidar do cabelo é difícil!',
    text: 'O barulho da tesoura e a sensação do cabelo caindo são gatilhos sensoriais comuns. Paciência e estratégias ajudam!',
    percentage: 50,
    statLabel: '50% têm dificuldade com cuidados capilares',
  },
  food: {
    emoji: '🍎',
    title: 'Alimentação é um desafio seletivo!',
    text: 'Textura, cheiro e temperatura dos alimentos podem ser barreiras sensoriais reais. A seletividade alimentar é muito comum!',
    percentage: 80,
    statLabel: '80% das crianças autistas têm seletividade alimentar',
  },
};

export const EducationalAlert: React.FC<EducationalAlertProps> = ({
  category,
  onViewStrategies,
  onDismiss,
}) => {
  const data = ALERT_DATA[category];
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.setValue(16);
    opacity.setValue(0);
    barAnim.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Anima a barra após o card aparecer
      Animated.timing(barAnim, {
        toValue: data.percentage,
        duration: 800,
        delay: 80,
        useNativeDriver: false, // width não suporta native driver
      }).start();
    });
  }, [category]);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={BlueyGradients.yellowHorizontal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        {/* Badge row */}
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>💡 VOCÊ SABIA?</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{data.emoji}</Text>
          <Text style={styles.title}>{data.title}</Text>
        </View>

        {/* Body text */}
        <Text style={styles.message}>{data.text}</Text>

        {/* Percentage bar */}
        <View style={styles.barContainer}>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: barAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{data.statLabel}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnStrategies} onPress={onViewStrategies} activeOpacity={0.85}>
            <LinearGradient
              colors={BlueyGradients.greenHorizontal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnStrategiesText}>Ver Estratégias →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDismiss} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.btnDismissText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  container: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.alertOrange,
    padding: 18,
  },
  badgeRow: {
    marginBottom: 10,
  },
  badge: {
    ...Typography.labelSmall,
    color: BlueyColors.alertOrange,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
  },
  message: {
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    lineHeight: 22,
    marginBottom: 14,
  },
  barContainer: {
    marginBottom: 16,
  },
  barTrack: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: BlueyColors.alertOrange,
    borderRadius: 6,
  },
  barLabel: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    fontSize: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnStrategies: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnStrategiesText: {
    ...Typography.labelSmall,
    color: '#fff',
    fontSize: 14,
  },
  btnDismiss: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.alertOrange,
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDismissText: {
    ...Typography.labelSmall,
    color: BlueyColors.alertOrange,
    fontSize: 14,
  },
});
