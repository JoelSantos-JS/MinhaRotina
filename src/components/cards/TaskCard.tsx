import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { Task } from '../../types/models';

interface TaskCardProps {
  task: Task;
  onDelete?: () => void;
  onInfo?: () => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onInfo, compact = false }) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactEmoji}>{task.icon_emoji}</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{task.name}</Text>
          <Text style={styles.compactTime}>~{task.estimated_minutes} min</Text>
        </View>
        {task.has_sensory_issues && onInfo && (
          <TouchableOpacity onPress={onInfo} style={styles.infoButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.infoIcon}>❓</Text>
          </TouchableOpacity>
        )}
        {task.has_sensory_issues && !onInfo && (
          <View style={styles.sensoryBadge}>
            <Text style={styles.sensoryBadgeText}>💡</Text>
          </View>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={BlueyGradients.blueVertical}
      style={styles.container}
    >
      <Text style={styles.emoji}>{task.icon_emoji}</Text>
      <Text style={styles.name}>{task.name}</Text>
      <Text style={styles.time}>~{task.estimated_minutes} minutos</Text>
      {task.has_sensory_issues && (
        <View style={styles.sensoryAlert}>
          <Text style={styles.sensoryAlertText}>💡 Tarefa sensorial</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BlueyColors.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  name: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  time: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    marginBottom: 12,
  },
  sensoryAlert: {
    backgroundColor: BlueyColors.bingoMain + '44',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  sensoryAlertText: {
    ...Typography.labelSmall,
    color: BlueyColors.alertOrange,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BlueyColors.backgroundMain,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 12,
    marginBottom: 8,
  },
  compactEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
  },
  compactTime: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  sensoryBadge: {
    marginRight: 8,
  },
  sensoryBadgeText: {
    fontSize: 18,
  },
  infoButton: {
    padding: 4,
    marginRight: 4,
  },
  infoIcon: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
