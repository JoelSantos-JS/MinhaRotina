import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

export const EditProfileScreen: React.FC<ParentScreenProps<'EditProfile'>> = ({ navigation }) => {
  const parent = useAuthStore((s) => s.parent);
  const setParent = useAuthStore((s) => s.setParent);

  const [name, setName] = useState(parent?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Digite seu nome.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('parent_accounts')
        .update({ name: name.trim() })
        .eq('id', parent!.id);

      if (dbError) throw dbError;
      setParent({ ...parent!, name: name.trim() });
      Alert.alert('✅ Salvo!', 'Seu perfil foi atualizado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👤</Text>
            <Text style={styles.avatarName}>{parent?.name}</Text>
            <Text style={styles.avatarEmail}>{parent?.email}</Text>
          </View>

          <View style={styles.card}>
            <BlueyInput
              label="Seu nome"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Maria Silva"
              autoCapitalize="words"
            />

            <View style={styles.emailBox}>
              <Text style={styles.emailLabel}>Email</Text>
              <Text style={styles.emailValue}>{parent?.email}</Text>
              <Text style={styles.emailHint}>O email não pode ser alterado aqui.</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <BlueyButton
            title="✅ Salvar Alterações"
            onPress={handleSave}
            loading={loading}
            disabled={!name.trim() || name.trim() === parent?.name}
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
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  avatarEmoji: { fontSize: 64, marginBottom: 12 },
  avatarName: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 4 },
  avatarEmail: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 20,
    marginBottom: 16,
  },
  emailBox: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  emailLabel: { ...Typography.labelSmall, color: BlueyColors.textSecondary, marginBottom: 4 },
  emailValue: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  emailHint: { ...Typography.bodySmall, color: BlueyColors.textPlaceholder },
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
