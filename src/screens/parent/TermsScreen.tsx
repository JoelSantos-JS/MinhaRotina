import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

const SECTIONS = [
  {
    title: '1. Aceitação dos Termos',
    text: 'Ao utilizar o aplicativo Minha Rotina, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o aplicativo.',
  },
  {
    title: '2. Uso do Aplicativo',
    text: 'O Minha Rotina é um aplicativo destinado a auxiliar famílias com crianças autistas na criação e gerenciamento de rotinas visuais. O uso é exclusivo para fins pessoais e não comerciais.',
  },
  {
    title: '3. Privacidade e Dados',
    text: 'Coletamos apenas os dados necessários para o funcionamento do aplicativo: nome, email e informações das crianças cadastradas. Não compartilhamos dados pessoais com terceiros. Os dados são armazenados de forma segura e criptografada.',
  },
  {
    title: '4. Cadastro de Crianças',
    text: 'Ao cadastrar uma criança, você confirma ser responsável legal por ela. As informações devem ser precisas e mantidas atualizadas. É sua responsabilidade manter o PIN de acesso seguro.',
  },
  {
    title: '5. Responsabilidades',
    text: 'O aplicativo é uma ferramenta de suporte e não substitui acompanhamento médico ou terapêutico profissional. As estratégias apresentadas são informativas e devem ser adaptadas às necessidades específicas de cada criança.',
  },
  {
    title: '6. Modificações',
    text: 'Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do aplicativo. O uso continuado após as alterações constitui aceitação dos novos termos.',
  },
  {
    title: '7. Limitação de Responsabilidade',
    text: 'O Minha Rotina é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais resultantes do uso do aplicativo.',
  },
  {
    title: '8. Contato',
    text: 'Para dúvidas sobre estes termos, entre em contato através do nosso suporte. Faremos o possível para responder dentro de 48 horas úteis.',
  },
];

export const TermsScreen: React.FC<ParentScreenProps<'Terms'>> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Termos de Uso</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>📋</Text>
            <Text style={styles.introTitle}>Termos de Uso</Text>
            <Text style={styles.introDate}>Última atualização: Janeiro de 2024</Text>
          </View>

          {SECTIONS.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionText}>{section.text}</Text>
            </View>
          ))}

          <View style={styles.footerCard}>
            <Text style={styles.footerText}>
              Ao usar o Minha Rotina, você confirma que leu e compreendeu estes Termos de Uso.
            </Text>
          </View>
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
  introCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  introEmoji: { fontSize: 48, marginBottom: 12 },
  introTitle: { ...Typography.headlineMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  introDate: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 8 },
  sectionText: { ...Typography.bodySmall, color: BlueyColors.textSecondary, lineHeight: 20 },
  footerCard: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  footerText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
