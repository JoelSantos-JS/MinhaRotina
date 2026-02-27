import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={BlueyColors.blueyMain} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: BlueyColors.backgroundMain,
  },
  message: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
