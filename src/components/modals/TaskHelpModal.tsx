import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { TASK_TIPS } from '../../data/strategyTips';

interface TaskHelpModalProps {
  visible: boolean;
  sensoryCategory: string | null | undefined;
  taskName: string;
  onClose: () => void;
  onViewStrategies: (category: string) => void;
}

export const TaskHelpModal: React.FC<TaskHelpModalProps> = ({
  visible,
  sensoryCategory,
  taskName,
  onClose,
  onViewStrategies,
}) => {
  const tips = sensoryCategory ? TASK_TIPS[sensoryCategory] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>❓</Text>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>E se não conseguir?</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{taskName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {!tips ? (
              <View style={styles.noTips}>
                <Text style={styles.noTipsText}>
                  Para ver dicas específicas, marque esta tarefa como sensorial e selecione a categoria.
                </Text>
              </View>
            ) : (
              <>
                {/* Intro */}
                <View style={styles.intro}>
                  <Text style={styles.introIcon}>{tips.icon}</Text>
                  <Text style={styles.introText}>
                    Esta tarefa pode ter dificuldades relacionadas a questões sensoriais. Veja abaixo os motivos comuns e o que você pode fazer.
                  </Text>
                </View>

                {/* Reasons */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔍 Motivos comuns de resistência:</Text>
                  <View style={styles.sectionBox}>
                    {tips.reasons.map((reason, i) => (
                      <View key={i} style={styles.reasonRow}>
                        <Text style={styles.reasonIcon}>{reason.icon}</Text>
                        <Text style={styles.reasonText}>{reason.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Strategies */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>✅ O que você pode fazer:</Text>
                  <View style={styles.strategiesBox}>
                    {tips.strategies.map((s, i) => (
                      <View key={i} style={styles.strategyCard}>
                        <View style={styles.strategyNum}>
                          <Text style={styles.strategyNumText}>{i + 1}</Text>
                        </View>
                        <View style={styles.strategyContent}>
                          <Text style={styles.strategyTitle}>{s.title}</Text>
                          <Text style={styles.strategyDesc}>{s.description}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* CTA */}
                <TouchableOpacity
                  style={styles.ctaBtn}
                  onPress={() => onViewStrategies(sensoryCategory!)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={BlueyGradients.yellowHorizontal}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>Ver Todas as Estratégias na Biblioteca →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: BlueyColors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerEmoji: { fontSize: 32 },
  headerText: { flex: 1 },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  headerSub: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BlueyColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: BlueyColors.textSecondary,
    fontFamily: 'Nunito_700Bold',
  },
  noTips: {
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  noTipsText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BlueyColors.backgroundMain,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BlueyColors.bingoMain,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  introIcon: { fontSize: 28 },
  introText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    flex: 1,
    lineHeight: 24,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 10,
  },
  sectionBox: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderLeftWidth: 4,
    borderLeftColor: BlueyColors.blueyMain,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reasonIcon: { fontSize: 22 },
  reasonText: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, flex: 1 },
  strategiesBox: {
    borderWidth: 2,
    borderColor: BlueyColors.blueyGreen,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    backgroundColor: '#fff',
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: BlueyColors.backgroundGreen,
    borderLeftWidth: 3,
    borderLeftColor: BlueyColors.blueyGreen,
    borderRadius: 10,
    padding: 12,
  },
  strategyNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BlueyColors.blueyGreen,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  strategyNumText: {
    ...Typography.labelSmall,
    color: '#fff',
    fontSize: 14,
  },
  strategyContent: { flex: 1 },
  strategyTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  strategyDesc: { ...Typography.bodySmall, color: BlueyColors.textSecondary, lineHeight: 20 },
  ctaBtn: {
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 4,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    ...Typography.labelMedium,
    color: BlueyColors.textPrimary,
  },
});
