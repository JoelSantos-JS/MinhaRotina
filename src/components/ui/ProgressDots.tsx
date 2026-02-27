import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlueyColors } from '../../theme/colors';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, current }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index < current ? styles.dotCompleted : null,
            index === current ? styles.dotActive : null,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BlueyColors.borderMedium,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
  },
  dotCompleted: {
    backgroundColor: BlueyColors.blueyGreen,
    borderColor: BlueyColors.blueyGreenDark,
  },
  dotActive: {
    backgroundColor: BlueyColors.blueyMain,
    borderColor: BlueyColors.blueyDark,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
