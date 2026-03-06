import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

const SECTIONS = [
  {
    title: '1. Dados coletados',
    text:
      'Coletamos dados de conta (nome e email do responsável), dados de crianças cadastradas ' +
      '(nome, idade, preferências e rotinas), dados de uso (progresso das tarefas) e dados de mídia ' +
      '(fotos e videos enviados no app).',
  },
  {
    title: '2. Finalidades',
    text:
      'Usamos os dados para autenticar usuários, permitir criação de rotinas e tarefas, exibir progresso, ' +
      'sincronizar informações entre dispositivos e melhorar estabilidade e segurança da aplicação.',
  },
  {
    title: '3. Base legal e LGPD',
    text:
      'Tratamos dados com base na execução do serviço solicitado pelo usuário, cumprimento de obrigações legais ' +
      'e interesses legítimos de segurança e prevenção a fraude, respeitando os direitos previstos na LGPD.',
  },
  {
    title: '4. Compartilhamento',
    text:
      'Não vendemos dados pessoais. O compartilhamento ocorre apenas com operadores essenciais da plataforma, ' +
      'como infraestrutura de autenticação, banco de dados e armazenamento de arquivos.',
  },
  {
    title: '5. Retenção e exclusão',
    text:
      'Mantemos os dados enquanto a conta estiver ativa ou pelo período necessário para cumprir obrigações legais. ' +
      'O usuário pode solicitar exclusão da conta e dos dados associados pelo canal de privacidade.',
  },
  {
    title: '6. Segurança',
    text:
      'Aplicamos controles técnicos como autenticação, regras de acesso por usuário (RLS) e monitoramento de erros. ' +
      'Nenhum sistema é totalmente imune, mas adotamos medidas proporcionais para reduzir riscos.',
  },
  {
    title: '7. Direitos do titular',
    text:
      'Você pode solicitar confirmação de tratamento, acesso, correção, anonimização quando cabível, ' +
      'portabilidade e exclusão de dados pessoais, conforme a legislação aplicável.',
  },
  {
    title: '8. Crianças e adolescentes',
    text:
      'O app é destinado a uso por responsáveis legais. Dados de crianças devem ser inseridos e gerenciados por ' +
      'adultos autorizados. Recomendamos não incluir informações sensíveis desnecessárias.',
  },
  {
    title: '9. Localização e permissões',
    text:
      'A permissão de localização é opcional e usada para buscar profissionais próximos na funcionalidade de ajuda. ' +
      'Câmera e galeria são usadas apenas para anexar mídia no app.',
  },
  {
    title: '10. Atualizações desta política',
    text:
      'Podemos atualizar esta política para refletir mudanças legais, técnicas ou de produto. ' +
      'A data de atualização será exibida nesta tela.',
  },
  {
    title: '11. Contato de privacidade',
    text:
      'Para solicitar direitos LGPD ou exclusao de conta/dados, entre em contato: privacidade@minharotina.app',
  },
];

export const PrivacyPolicyScreen: React.FC<ParentScreenProps<'PrivacyPolicy'>> = ({
  navigation,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'<'} Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>[Privacidade]</Text>
            <Text style={styles.introTitle}>Política de Privacidade</Text>
            <Text style={styles.introDate}>Última atualização: 2 de março de 2026</Text>
          </View>

          {SECTIONS.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionText}>{section.text}</Text>
            </View>
          ))}

          <View style={styles.footerCard}>
            <Text style={styles.footerText}>
              Ao continuar usando o app, você declara ciência desta política.
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
    paddingVertical: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  introEmoji: { ...Typography.labelSmall, color: BlueyColors.textSecondary, marginBottom: 8 },
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
