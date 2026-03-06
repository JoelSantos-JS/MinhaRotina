import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

const FEATURES = [
  {
    emoji: '\u{1F4CB}',
    title: 'Rotinas Visuais',
    desc: 'Crie rotinas personalizadas com emojis e ícones que as crianças adoram.',
  },
  {
    emoji: '\u{1F9E9}',
    title: 'Para Crianças Autistas',
    desc: 'Desenvolvido especialmente para crianças nos níveis 1 e 2 do espectro autista.',
  },
  {
    emoji: '\u{1F511}',
    title: 'PIN de Acesso',
    desc: 'Cada criança tem seu próprio PIN para acessar o app de forma independente.',
  },
  {
    emoji: '\u{1F389}',
    title: 'Celebrações',
    desc: 'Animações motivadoras ao completar cada tarefa e rotina.',
  },
  {
    emoji: '\u{1F4A1}',
    title: 'Estratégias Sensoriais',
    desc: 'Dicas práticas para lidar com desafios sensoriais comuns.',
  },
  {
    emoji: '\u{1F6E1}\uFE0F',
    title: 'Privacidade',
    desc: 'Os dados ficam seguros no dispositivo e na nuvem criptografada.',
  },
];

export const AboutScreen: React.FC<ParentScreenProps<'About'>> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'< Voltar'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sobre o App</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>{'\u{1F308}'}</Text>
            <Text style={styles.appName}>Minha Rotina</Text>
            <Text style={styles.version}>Versão 1.0.0</Text>
            <Text style={styles.tagline}>
              Tornando cada dia mais previsível e seguro para crianças autistas
            </Text>
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>Nossa Missão</Text>
            <Text style={styles.missionText}>
              O Minha Rotina foi criado para ajudar famílias com crianças autistas a estabelecerem
              rotinas visuais claras e previsíveis. Sabemos que a rotina é essencial para o
              bem-estar e desenvolvimento das crianças no espectro autista.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}

          <View style={styles.creditsCard}>
            <Text style={styles.creditsTitle}>Desenvolvido com {'\u2764\uFE0F'}</Text>
            <Text style={styles.creditsText}>
              Este aplicativo foi desenvolvido com carinho para pais e profissionais que acreditam
              que toda criança merece ter uma rotina estruturada e acolhedora.
            </Text>
          </View>

          <Text style={styles.copyright}>(c) 2026 Minha Rotina. Todos os direitos reservados.</Text>
        </ScrollView>
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
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  appName: { ...Typography.headlineLarge, color: BlueyColors.textPrimary, marginBottom: 4 },
  version: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginBottom: 12 },
  tagline: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  missionCard: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  missionTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 8 },
  missionText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, lineHeight: 22 },
  sectionTitle: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  featureEmoji: { fontSize: 32 },
  featureInfo: { flex: 1 },
  featureTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  featureDesc: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  creditsCard: {
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: BlueyColors.bingoMain,
  },
  creditsTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 8 },
  creditsText: { ...Typography.bodyMedium, color: BlueyColors.textSecondary, lineHeight: 22 },
  copyright: {
    ...Typography.bodySmall,
    color: BlueyColors.textPlaceholder,
    textAlign: 'center',
    marginTop: 8,
  },
});
