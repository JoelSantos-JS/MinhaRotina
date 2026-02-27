import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { supabase } from '../../config/supabase';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

export const ChangePasswordScreen: React.FC<ParentScreenProps<'ChangePassword'>> = ({ navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async () => {
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      Alert.alert('✅ Senha alterada!', 'Sua senha foi atualizada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const isValid = newPassword.length >= 6 && confirmPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alterar Senha</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconBox}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.subtitle}>Crie uma nova senha segura para sua conta</Text>
          </View>

          <View style={styles.card}>
            <BlueyInput
              label="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              isPassword
            />
            <BlueyInput
              label="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Digite a senha novamente"
              isPassword
              error={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'As senhas não coincidem' : ''}
            />
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💡 Use uma combinação de letras, números e símbolos para criar uma senha forte.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <BlueyButton
            title="✅ Alterar Senha"
            onPress={handleChange}
            loading={loading}
            disabled={!isValid}
            style={styles.btn}
          />
        </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { ...Typography.titleMedium, color: BlueyColors.blueyDark },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  iconBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  lockIcon: { fontSize: 56, marginBottom: 12 },
  subtitle: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 20,
    marginBottom: 16,
  },
  tipBox: {
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  tipText: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
  },
  btn: { marginTop: 8 },
});
