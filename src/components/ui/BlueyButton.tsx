import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type ButtonType = 'primary' | 'secondary' | 'outline' | 'danger';

interface BlueyButtonProps {
  title: string;
  onPress: () => void;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export const BlueyButton: React.FC<BlueyButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  loading = false,
  style,
  small = false,
}) => {
  const getColors = (): readonly [string, string] => {
    switch (type) {
      case 'primary':
        return BlueyGradients.greenHorizontal;
      case 'secondary':
        return BlueyGradients.blueHorizontal;
      case 'danger':
        return ['#E57373', '#EF9A9A'];
      default:
        return ['transparent', 'transparent'];
    }
  };

  const isOutline = type === 'outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[small ? styles.containerSmall : styles.container, style]}
    >
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          small ? styles.gradientSmall : styles.gradient,
          isOutline && styles.outlineContainer,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isOutline ? BlueyColors.textPrimary : '#fff'} />
        ) : (
          <Text style={[small ? styles.textSmall : styles.text, isOutline && styles.outlineText]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  containerSmall: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientSmall: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  outlineContainer: {
    borderWidth: 3,
    borderColor: BlueyColors.borderActive,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.labelLarge,
    color: '#fff',
  },
  textSmall: {
    ...Typography.labelMedium,
    color: '#fff',
  },
  outlineText: {
    color: BlueyColors.textPrimary,
  },
});
