import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ChildAccount } from '../../types/models';

interface ChildCardProps {
  child: ChildAccount;
  onPress: () => void;
  onSettings?: () => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ child, onPress, onSettings }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: child.color_theme + '33' }]}>
        <Text style={styles.icon}>{child.icon_emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{child.name}</Text>
        <Text style={styles.age}>{child.age} anos</Text>
      </View>

      {onSettings && (
        <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.accent, { backgroundColor: child.color_theme }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BlueyColors.backgroundMain,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 2,
  },
  age: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
});
