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
import { hashPin } from '../../utils/pinUtils';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ChildAccount } from '../../types/models';
import type { AuthScreenProps } from '../../types/navigation';

type Step = 'email' | 'pin';

export const LoginChildScreen: React.FC<AuthScreenProps<'LoginChild'>> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinKey, setPinKey] = useState(0);

  const setChild = useAuthStore((s) => s.setChild);

  // Step 1: find parent by email
  const handleEmailSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Digite o email do responsavel.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('parent_accounts')
        .select('id, name')
        .eq('email', trimmed)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          setError('Email nao encontrado. Verifique o email do responsavel e tente novamente.');
        } else {
          setError('Erro ao conectar. Verifique sua internet e tente novamente.');
        }
        return;
      }
      if (!data) {
        setError('Email nao encontrado. Verifique o email do responsavel e tente novamente.');
        return;
      }

      setParentId(data.id);
      setParentName(data.name);
      setStep('pin');
    } catch {
      setError('Erro ao buscar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify PIN scoped to this parent only
  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError('');
    setPinError(false);

    try {
      const pinHash = await hashPin(pin);

      const { data: matchedChildren, error: dbError } = await supabase
        .from('child_accounts')
        .select('*')
        .eq('created_by', parentId)
        .eq('pin_hash', pinHash);

      if (dbError) throw dbError;

      if (!matchedChildren || matchedChildren.length === 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPinError(true);
        setError('PIN incorreto. Tente de novo!');
        setPinKey((k) => k + 1);
        return;
      }

      if (matchedChildren.length > 1) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPinError(true);
        setError('Encontramos mais de uma crianca com este PIN nessa familia. O responsavel precisa alterar um dos PINs.');
        setPinKey((k) => k + 1);
        return;
      }

      const matchedChild = matchedChildren[0] as ChildAccount;

      await supabase
        .from('child_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', matchedChild.id);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChild(matchedChild);
    } catch {
      setPinError(true);
      setError('Erro ao verificar. Tente novamente.');
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
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.skyVertical} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>{'← Voltar'}</Text>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {step === 'email' ? (
                <>
                  <Text style={styles.emoji}>{'👧'}</Text>
                  <Text style={styles.title}>Login da Crian{'\u00E7'}a</Text>
                  <Text style={styles.subtitle}>
                    Digite o email do respons{'\u00E1'}vel para encontrar as crian{'\u00E7'}as cadastradas
                  </Text>

                  <View style={styles.inputArea}>
                    <BlueyInput
                      label={'Email do Respons\u00E1vel'}
                      placeholder="email@exemplo.com"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      error={error || undefined}
                    />
                    <BlueyButton
                      title={'Continuar \u2192'}
                      onPress={handleEmailSubmit}
                      loading={loading}
                      disabled={!email.trim()}
                      type="primary"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.emoji}>{'🔑'}</Text>
                  <Text style={styles.title}>{'Qual \u00E9 o seu PIN?'}</Text>
                  <Text style={styles.subtitle}>
                    {'Fam\u00EDlia de '}
                    <Text style={styles.parentName}>{parentName}</Text>
                    {'\nDigite os 4 n\u00FAmeros do seu PIN'}
                  </Text>

                  {loading ? (
                    <LoadingSpinner message="Verificando..." />
                  ) : (
                    <PinInput
                      key={pinKey}
                      onComplete={handlePinComplete}
                      error={pinError}
                    />
                  )}

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorEmoji}>{'😅'}</Text>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </>
              )}

              <View style={styles.stars}>
                <Text style={styles.star}>{'⭐'}</Text>
                <Text style={[styles.star, styles.starBig]}>{'⭐'}</Text>
                <Text style={styles.star}>{'⭐'}</Text>
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
    fontSize: 80,
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
  parentName: {
    ...Typography.bodyLarge,
    color: BlueyColors.blueyDark,
    fontWeight: '700',
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
