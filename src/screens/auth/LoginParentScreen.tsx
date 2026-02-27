import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { AuthScreenProps } from '../../types/navigation';

// Colorful letter palette for the title
const TITLE_COLORS = ['#1E88E5', '#EDCC6F', '#E91E8C', '#FF9800', '#4CAF50', '#9C27B0'];

const ColorfulTitle: React.FC = () => {
  const words = [
    { text: 'Minha', offset: 0 },
    { text: 'Rotina', offset: 3 },
  ];
  return (
    <View style={titleStyles.row}>
      {words.map((word, wi) => (
        <View key={wi} style={titleStyles.wordRow}>
          {word.text.split('').map((char, ci) => (
            <Text
              key={ci}
              style={[titleStyles.letter, { color: TITLE_COLORS[(word.offset + ci) % TITLE_COLORS.length] }]}
            >
              {char}
            </Text>
          ))}
          {wi < words.length - 1 && <Text style={titleStyles.space}> </Text>}
        </View>
      ))}
    </View>
  );
};

const titleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  letter: {
    fontSize: 42,
    fontFamily: 'Nunito_900Black',
    lineHeight: 52,
    // Shadow per letter for depth
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  space: {
    fontSize: 42,
    fontFamily: 'Nunito_900Black',
  },
});

export const LoginParentScreen: React.FC<AuthScreenProps<'LoginParent'>> = ({ navigation }) => {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const setParent = useAuthStore((s) => s.setParent);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Digite seu email.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    const result = await authService.resetPassword(forgotEmail);
    setForgotLoading(false);
    if (result.success) {
      setForgotSent(true);
    } else {
      setForgotError(result.error ?? 'Erro ao enviar link.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSuccess(false);
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha.');
      return;
    }
    if (isCreateMode && !name.trim()) {
      setError('Digite seu nome.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const result = isCreateMode
      ? await authService.createParentAccount(email.trim(), password, name.trim())
      : await authService.loginParent(email.trim(), password);
    setLoading(false);

    if (result.success && result.data) {
      setParent(result.data);
    } else if (result.success && result.needsEmailConfirmation) {
      setIsSuccess(true);
      setError(result.error ?? '');
    } else {
      setError(result.error ?? 'Erro desconhecido');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.skyVertical} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>⭐</Text>
              <ColorfulTitle />
              <Text style={styles.tagline}>
                {'Rotinas visuais para crian\u00E7as autistas'}
              </Text>
            </View>

            {/* ── Form area ── */}
            <View style={styles.formArea}>
              {isCreateMode && (
                <BlueyInput
                  label="Seu nome"
                  value={name}
                  onChangeText={setName}
                  placeholder="Como podemos te chamar?"
                  autoCapitalize="words"
                />
              )}

              <BlueyInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <BlueyInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                isPassword
                hint={isCreateMode ? 'M\u00EDnimo 6 caracteres' : undefined}
              />

              {!isCreateMode && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {
                    setForgotEmail(email.trim());
                    setForgotSent(false);
                    setForgotError('');
                    setShowForgot(true);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>
              )}

              {isSuccess && error ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{error}</Text>
                  <TouchableOpacity
                    onPress={() => { setIsSuccess(false); setIsCreateMode(false); setError(''); }}
                    style={styles.goLoginBtn}
                  >
                    <Text style={styles.goLoginText}>{'J\u00E1 confirmei \u2192 Fazer login'}</Text>
                  </TouchableOpacity>
                </View>
              ) : error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              {!isSuccess && (
                <BlueyButton
                  title={isCreateMode ? 'CRIAR CONTA \uD83D\uDE80' : 'ENTRAR \u2192'}
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitBtn}
                />
              )}

              {/* ── Switch mode (inside card) ── */}
              <TouchableOpacity
                onPress={() => { setIsCreateMode(!isCreateMode); setError(''); }}
                style={styles.switchMode}
              >
                <Text style={styles.switchModeText}>
                  {isCreateMode ? 'J\u00E1 tem conta? ' : 'N\u00E3o tem conta? '}
                  <Text style={styles.switchModeLink}>
                    {isCreateMode ? 'Entrar' : 'Cadastre-se'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Child login ── */}
            <TouchableOpacity
              style={styles.childLoginBtn}
              onPress={() => navigation.navigate('LoginChild')}
            >
              <Text style={styles.childLoginText}>
                {'\uD83D\uDC67 Entrar como crian\u00E7a (PIN)'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={showForgot}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgot(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowForgot(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {forgotSent ? (
              <>
                <Text style={styles.modalEmoji}>📬</Text>
                <Text style={styles.modalTitle}>Link enviado!</Text>
                <Text style={styles.modalBody}>
                  Verifique a caixa de entrada de{'\n'}
                  <Text style={styles.modalEmailHighlight}>{forgotEmail}</Text>
                  {'\n\n'}Clique no link do email para criar uma nova senha e volte para fazer login.
                </Text>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setShowForgot(false)}
                >
                  <Text style={styles.modalBtnText}>OK, entendido ✓</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalEmoji}>🔑</Text>
                <Text style={styles.modalTitle}>Recuperar Senha</Text>
                <Text style={styles.modalBody}>
                  Digite seu email e enviaremos um link para criar uma nova senha.
                </Text>
                <BlueyInput
                  label="Email da conta"
                  value={forgotEmail}
                  onChangeText={(t) => { setForgotEmail(t); setForgotError(''); }}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={forgotError || undefined}
                />
                <BlueyButton
                  title={'Enviar link \u2192'}
                  onPress={handleForgotPassword}
                  loading={forgotLoading}
                  disabled={!forgotEmail.trim()}
                  type="secondary"
                />
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowForgot(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
    letterSpacing: 4,
  },
  tagline: {
    ...Typography.bodyMedium,
    color: BlueyColors.blueyDark,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.85,
  },

  // ── Form area (light card, no heavy border) ──
  formArea: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 18,
  },
  forgotPasswordText: {
    ...Typography.bodySmall,
    color: BlueyColors.blueyDark,
    opacity: 0.75,
  },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
  },
  submitBtn: {
    marginTop: 4,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dividerText: {
    ...Typography.bodySmall,
    color: BlueyColors.blueyDark,
    marginHorizontal: 14,
    opacity: 0.7,
  },

  // ── Child login ──
  childLoginBtn: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  childLoginText: {
    ...Typography.labelMedium,
    color: BlueyColors.blueyDark,
  },

  // ── Switch mode ──
  switchMode: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchModeText: {
    ...Typography.bodyMedium,
    color: BlueyColors.blueyDark,
    opacity: 0.85,
  },
  switchModeLink: {
    color: BlueyColors.blueyDark,
    fontFamily: 'Nunito_800ExtraBold',
    opacity: 1,
    textDecorationLine: 'underline',
  },

  // ── Success box ──
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.blueyGreen,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    lineHeight: 26,
    marginBottom: 12,
  },
  goLoginBtn: {
    backgroundColor: BlueyColors.blueyGreen,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  goLoginText: {
    ...Typography.labelMedium,
    color: '#fff',
  },

  // ── Forgot Password Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43,44,65,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: BlueyColors.blueyMain,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  modalEmailHighlight: {
    ...Typography.bodyMedium,
    color: BlueyColors.blueyDark,
    fontFamily: 'Nunito_700Bold',
  },
  modalBtn: {
    width: '100%',
    backgroundColor: BlueyColors.blueyGreen,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnText: { ...Typography.labelLarge, color: '#fff' },
  modalCancel: { marginTop: 16, paddingVertical: 8 },
  modalCancelText: {
    ...Typography.bodySmall,
    color: BlueyColors.textPlaceholder,
  },
});
