import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PinInput } from '../../components/ui/PinInput';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ChildAccount } from '../../types/models';
import type { AuthScreenProps } from '../../types/navigation';

type Step = 'email' | 'pin';
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 30_000;

function symbolFromCodePoint(...codePoints: number[]): string {
  return String.fromCodePoint(...codePoints);
}

const UI_SYMBOLS = {
  child: symbolFromCodePoint(0x1F467),
  pin: symbolFromCodePoint(0x1F511),
  sad: symbolFromCodePoint(0x1F641),
  star: symbolFromCodePoint(0x2731),
};

function mapChildLoginRpcError(error: unknown): string {
  const msg = String((error as { message?: string })?.message ?? '').toLowerCase();

  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'Falha de conexao. Verifique a internet e tente novamente.';
  }
  return 'Nao foi possivel entrar agora. Tente novamente.';
}

async function tryLegacyChildLogin(email: string, pin: string): Promise<{
  child: ChildAccount | null;
  error: unknown | null;
}> {
  const { data: parentData, error: parentError } = await supabase.rpc(
    'get_parent_for_child_login',
    { p_email: email }
  );
  if (parentError) return { child: null, error: parentError };

  const parentId = (parentData as { id?: string } | null)?.id;
  if (!parentId) return { child: null, error: null };

  const { data: childData, error: childError } = await supabase.rpc(
    'authenticate_child_pin',
    {
      p_parent_id: parentId,
      p_pin: pin,
    }
  );
  if (childError) return { child: null, error: childError };

  return { child: (childData as ChildAccount | null) ?? null, error: null };
}

export const LoginChildScreen: React.FC<AuthScreenProps<'LoginChild'>> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinKey, setPinKey] = useState(0);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [pinLockUntilMs, setPinLockUntilMs] = useState<number | null>(null);

  const setChild = useAuthStore((s) => s.setChild);

  const handleEmailSubmit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Digite o email do responsavel.');
      return;
    }

    // Anti-enumeracao: nao valida existencia de email nesta etapa.
    setError('');
    setStep('pin');
  };

  const handlePinComplete = async (pin: string) => {
    const now = Date.now();
    if (pinLockUntilMs && pinLockUntilMs > now) {
      const waitSeconds = Math.ceil((pinLockUntilMs - now) / 1000);
      setPinError(true);
      setError(`Muitas tentativas. Aguarde ${waitSeconds}s para tentar novamente.`);
      setPinKey((k) => k + 1);
      return;
    }

    setLoading(true);
    setError('');
    setPinError(false);

    try {
      const { data: directData, error: directError } = await supabase.rpc(
        'authenticate_child_login',
        {
          p_email: email.trim().toLowerCase(),
          p_pin: pin,
        }
      );

      let matchedChildData = directData as ChildAccount | null;
      let finalError: unknown = directError;

      // Fallback para projetos que ainda estao no fluxo legado.
      if (directError) {
        const legacy = await tryLegacyChildLogin(email.trim().toLowerCase(), pin);
        if (legacy.child) {
          matchedChildData = legacy.child;
          finalError = null;
        } else if (!legacy.error) {
          matchedChildData = null;
          finalError = null;
        } else {
          finalError = legacy.error;
        }
      }

      if (finalError) throw finalError;

      if (!matchedChildData) {
        const nextAttempts = failedPinAttempts + 1;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPinError(true);

        if (nextAttempts >= MAX_PIN_ATTEMPTS) {
          setFailedPinAttempts(0);
          setPinLockUntilMs(Date.now() + PIN_LOCK_MS);
          setError('Muitas tentativas de login. Aguarde 30s para tentar novamente.');
        } else {
          setFailedPinAttempts(nextAttempts);
          setError(`Email ou PIN incorreto. Tentativa ${nextAttempts}/${MAX_PIN_ATTEMPTS}.`);
        }

        setPinKey((k) => k + 1);
        return;
      }

      const matchedChild = matchedChildData as ChildAccount;
      setFailedPinAttempts(0);
      setPinLockUntilMs(null);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChild(matchedChild);
    } catch (err) {
      if (__DEV__) {
        console.warn('[LoginChildScreen] child login RPC error', err);
      }
      setPinError(true);
      setError(mapChildLoginRpcError(err));
      setPinKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('email');
      setError('');
      setPinError(false);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.skyVertical} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'} Voltar</Text>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {step === 'email' ? (
                <>
                  <Text style={styles.emoji}>{UI_SYMBOLS.child}</Text>
                  <Text style={styles.title}>Login da Crianca</Text>
                  <Text style={styles.subtitle}>Digite o email do responsavel para continuar</Text>

                  <View style={styles.inputArea}>
                    <BlueyInput
                      label="Email do Responsavel"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      error={error || undefined}
                    />
                    <BlueyButton
                      title="Continuar"
                      onPress={handleEmailSubmit}
                      loading={loading}
                      disabled={!email.trim()}
                      type="primary"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.emoji}>{UI_SYMBOLS.pin}</Text>
                  <Text style={styles.title}>Qual e o seu PIN?</Text>
                  <Text style={styles.subtitle}>Digite os 4 numeros do seu PIN</Text>

                  {loading ? (
                    <LoadingSpinner message="Verificando..." />
                  ) : (
                    <PinInput key={pinKey} onComplete={handlePinComplete} error={pinError} />
                  )}

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorEmoji}>{UI_SYMBOLS.sad}</Text>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </>
              )}

              <View style={styles.stars}>
                <Text style={styles.star}>{UI_SYMBOLS.star}</Text>
                <Text style={[styles.star, styles.starBig]}>{UI_SYMBOLS.star}</Text>
                <Text style={styles.star}>{UI_SYMBOLS.star}</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  kav: { flex: 1 },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backText: {
    ...Typography.titleMedium,
    color: BlueyColors.blueyDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 16,
  },
  title: {
    ...Typography.headlineLarge,
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
  inputArea: {
    width: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: BlueyColors.errorRed,
    width: '100%',
  },
  errorEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  errorText: {
    ...Typography.titleMedium,
    color: BlueyColors.errorRed,
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    gap: 8,
  },
  star: {
    fontSize: 28,
  },
  starBig: {
    fontSize: 40,
  },
});
