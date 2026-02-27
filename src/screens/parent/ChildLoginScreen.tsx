import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PinInput } from '../../components/ui/PinInput';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useChildStore } from '../../stores/childStore';
import { useAuthStore } from '../../stores/authStore';
import { verifyPin } from '../../utils/pinUtils';
import { supabase } from '../../config/supabase';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

export const ChildLoginScreen: React.FC<ParentScreenProps<'ChildLogin'>> = ({
  navigation,
  route,
}) => {
  const { childId } = route.params;
  const { children } = useChildStore();
  const setChild = useAuthStore((s) => s.setChild);

  const child = children.find((c) => c.id === childId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinKey, setPinKey] = useState(0); // increment to reset PinInput

  if (!child) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Criança não encontrada.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const resetPin = () => setPinKey((k) => k + 1);

  const handlePinComplete = async (enteredPin: string) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      // Verify PIN against THIS specific child only — no global search, no collision
      const correct = await verifyPin(enteredPin, child.pin_hash);
      if (!correct) {
        setError('PIN incorreto. Tente de novo! 🔒');
        resetPin();
        return;
      }

      // Update last_login_at
      await supabase
        .from('child_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', child.id);

      // Switch to child mode — RootNavigator will render ChildNavigator
      setChild(child);
    } catch {
      setError('Erro ao entrar. Tente novamente.');
      resetPin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Child avatar */}
          <View style={[styles.avatar, { borderColor: child.color_theme ?? BlueyColors.blueyMain }]}>
            <Text style={styles.avatarEmoji}>{child.icon_emoji}</Text>
          </View>

          <Text style={styles.title}>Olá, {child.name}! 👋</Text>
          <Text style={styles.subtitle}>Digite seu PIN para entrar</Text>

          {/* PIN input — resets via key when wrong PIN */}
          <View style={styles.pinWrapper}>
            <PinInput
              key={pinKey}
              onComplete={handlePinComplete}
              error={!!error}
            />
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          ) : null}

          {/* Loading */}
          {loading && <LoadingSpinner message="Verificando..." />}

          {/* Hint for parents */}
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              🔒 O PIN foi definido pelo responsável. Em caso de dúvida, acesse{' '}
              <Text style={styles.hintHighlight}>FILHOS → ⚙️ → Alterar PIN</Text>.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backText: {
    ...Typography.titleMedium,
    color: BlueyColors.blueyDark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarEmoji: { fontSize: 56 },
  title: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  pinWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BlueyColors.errorRed,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  errorMsg: {
    ...Typography.bodyMedium,
    color: BlueyColors.errorRed,
    textAlign: 'center',
  },
  hintBox: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
  },
  hintText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  hintHighlight: {
    color: BlueyColors.blueyDark,
    fontWeight: '700',
  },
  errorText: {
    ...Typography.bodyMedium,
    color: BlueyColors.errorRed,
    textAlign: 'center',
    margin: 24,
  },
  backLink: {
    ...Typography.titleMedium,
    color: BlueyColors.blueyDark,
    textAlign: 'center',
  },
});
