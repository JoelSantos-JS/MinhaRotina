import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface BlueyInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

export const BlueyInput: React.FC<BlueyInputProps> = ({
  label,
  error,
  hint,
  isPassword = false,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={BlueyColors.textPlaceholder}
          style={[
            styles.input,
            error ? styles.inputError : null,
            isPassword ? styles.inputPassword : null,
            style,
          ]}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 3,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 16,
    paddingHorizontal: 18,
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    backgroundColor: BlueyColors.backgroundMain,
  },
  inputError: {
    borderColor: BlueyColors.errorRed,
  },
  inputPassword: {
    paddingRight: 56,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  eyeIcon: {
    fontSize: 24,
  },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    marginTop: 6,
  },
  hint: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 6,
  },
});
