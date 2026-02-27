import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ChildAccount } from '../../types/models';

interface AccessCodesModalProps {
  visible: boolean;
  child: ChildAccount | null;
  onClose: () => void;
  onRegeneratePin?: () => Promise<void>;
}

export const AccessCodesModal: React.FC<AccessCodesModalProps> = ({
  visible,
  child,
  onClose,
  onRegeneratePin,
}) => {
  const [pinCopied, setPinCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!child) return null;

  const displayPin = child.access_pin ?? '••••';
  const pinText = `${displayPin} - ${child.name.toUpperCase()}`;

  const handleCopyPin = () => {
    Clipboard.setString(pinText);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (!onRegeneratePin) return;
    Alert.alert(
      '🔄 Gerar Novo PIN',
      'Tem certeza? O PIN antigo não funcionará mais. Anote o novo antes de sair desta tela.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Gerar Novo',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              await onRegeneratePin();
            } catch {
              Alert.alert('Erro', 'Não foi possível gerar novo PIN.');
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  // QR code data encodes child_id + name for login
  const qrData = JSON.stringify({
    type: 'child_login',
    child_id: child.id,
    name: child.name,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.childIcon, { backgroundColor: (child.color_theme ?? BlueyColors.blueyMain) + '33' }]}>
                <Text style={styles.childEmoji}>{child.icon_emoji}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Códigos de Acesso</Text>
                <Text style={styles.headerSub}>{child.name} pode usar qualquer um destes códigos para entrar no app</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* PIN Section */}
            <View style={styles.pinSection}>
              <Text style={styles.sectionLabel}>🔢 PIN Numérico</Text>
              <View style={styles.pinDisplay}>
                <Text style={styles.pinText} selectable>
                  {displayPin}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyPin}
                  style={[styles.copyBtn, pinCopied && styles.copyBtnDone]}
                >
                  <Text style={styles.copyBtnText}>{pinCopied ? '✓ Copiado!' : '📋 Copiar'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <Text style={styles.sectionLabel}>📷 QR Code</Text>
              <View style={styles.qrBox}>
                <QRCode
                  value={qrData}
                  size={180}
                  color={BlueyColors.textPrimary}
                  backgroundColor="#FFFFFD"
                />
              </View>
              <Text style={styles.qrHint}>
                A câmera do app lê este QR Code para login automático
              </Text>
            </View>

            {/* Tip */}
            <View style={styles.tipBox}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                Você pode imprimir o QR Code e colar no quarto da criança. Assim ela pode escanear para entrar sem digitar o PIN.
              </Text>
            </View>

            {/* Regenerate PIN */}
            {onRegeneratePin && (
              <TouchableOpacity
                style={styles.regenBtn}
                onPress={handleRegenerate}
                disabled={regenerating}
              >
                <Text style={styles.regenText}>
                  {regenerating ? 'Gerando novo PIN...' : '🔄 Gerar Novo PIN'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: BlueyColors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  childIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childEmoji: { fontSize: 28 },
  headerText: { flex: 1 },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  headerSub: { ...Typography.bodySmall, color: BlueyColors.textSecondary, lineHeight: 18 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BlueyColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: BlueyColors.textSecondary,
    fontFamily: 'Nunito_700Bold',
  },

  // PIN
  pinSection: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.blueyMain,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 12,
  },
  pinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinText: {
    flex: 1,
    ...Typography.headlineLarge,
    color: BlueyColors.textPrimary,
    letterSpacing: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  copyBtn: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  copyBtnDone: {
    backgroundColor: BlueyColors.successGreen,
  },
  copyBtnText: {
    ...Typography.labelSmall,
    color: '#fff',
  },
  pinHidden: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // QR
  qrSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.blueyMain,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFD',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    marginBottom: 12,
  },
  qrHint: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
  },

  // Tip
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BlueyColors.backgroundYellow,
    borderLeftWidth: 4,
    borderLeftColor: BlueyColors.bingoMain,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  tipEmoji: { fontSize: 20 },
  tipText: { ...Typography.bodySmall, color: BlueyColors.textSecondary, flex: 1, lineHeight: 20 },

  // Regenerate
  regenBtn: {
    borderWidth: 2,
    borderColor: BlueyColors.alertOrange,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  regenText: { ...Typography.labelMedium, color: BlueyColors.alertOrange },
});
