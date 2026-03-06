import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { ProgressDots } from '../../components/ui/ProgressDots';
import { onboardingService } from '../../services/onboardingService';
import { useAuthStore } from '../../stores/authStore';
import type { ParentScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  skipText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    opacity: 0.8,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 70,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  contentBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  bodyText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Nunito_800ExtraBold',
    color: BlueyColors.textPrimary,
  },
  hintBox: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderLeftWidth: 4,
    borderLeftColor: BlueyColors.blueyMain,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  hintText: {
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BlueyColors.borderLight,
    borderRadius: 14,
    padding: 12,
  },
  rowEmoji: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  rowText: {
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  dotsRow: { marginBottom: 20 },
  nextBtn: {
    width: width - 48,
    borderRadius: 28,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    ...Typography.labelLarge,
    color: '#fff',
  },
});

type InfoItem = { emoji: string; text: string };

const InfoList: React.FC<{ items: InfoItem[] }> = ({ items }) => (
  <View style={styles.list}>
    {items.map((item, index) => (
      <View key={`${index}-${item.text}`} style={styles.row}>
        <Text style={styles.rowEmoji}>{item.emoji}</Text>
        <Text style={styles.rowText}>{item.text}</Text>
      </View>
    ))}
  </View>
);

const Page0Content: React.FC = () => (
  <View>
    <Text style={styles.bodyText}>
      O <Text style={styles.bold}>Minha Rotina</Text> foi criado para ajudar famílias com crianças autistas a
      organizarem o dia com mais previsibilidade e menos estresse.
    </Text>
    <View style={styles.hintBox}>
      <Text style={styles.hintText}>
        Este tutorial também fica disponível em Ajustes {'>'} Ver tutorial novamente.
      </Text>
    </View>
    <Text style={styles.bodyText}>
      Aqui você cria rotinas visuais, acompanha progresso, registra observações importantes e acessa
      estratégias práticas para o dia a dia.
    </Text>
  </View>
);

const Page1Content: React.FC = () => (
  <InfoList
    items={[
      {
        emoji: '\u{1F511}',
        text: 'Conta do responsável com autenticação segura e confirmação por email.',
      },
      {
        emoji: '\u{1F476}',
        text: 'Login infantil por email da família + PIN de 4 dígitos.',
      },
      {
        emoji: '\u{1F9D2}',
        text: 'Perfil da criança com tema visual e configurações adaptadas.',
      },
      {
        emoji: '\u{1F512}',
        text: 'Separação de acesso para manter autonomia da criança com controle dos pais.',
      },
    ]}
  />
);

const Page2Content: React.FC = () => (
  <InfoList
    items={[
      {
        emoji: '\u{1F4CB}',
        text: 'Rotinas por período (manhã, tarde, noite) e rotinas personalizadas.',
      },
      {
        emoji: '\u{2705}',
        text: 'Tarefas com emoji, tempo estimado, descrição e ordem definida pelos pais.',
      },
      {
        emoji: '\u{1F4F7}',
        text: 'Suporte a foto da tarefa para reforço visual.',
      },
      {
        emoji: '\u{1F3A5}',
        text: 'Vídeo de apoio e passos da tarefa para ensino em sequência.',
      },
      {
        emoji: '\u{1F9E0}',
        text: 'Marcação sensorial para identificar tarefas com maior chance de dificuldade.',
      },
    ]}
  />
);

const Page3Content: React.FC = () => (
  <InfoList
    items={[
      {
        emoji: '\u{1F3AE}',
        text: 'Tela infantil focada em autonomia: a criança segue uma tarefa por vez.',
      },
      {
        emoji: '\u{2705}',
        text: 'Registro de conclusão com horário e histórico automático.',
      },
      {
        emoji: '\u23ED\uFE0F',
        text: 'Opção de pular ou tentar depois quando houver dificuldade no momento.',
      },
      {
        emoji: '\u{1F389}',
        text: 'Celebrações e feedback positivo para manter motivação.',
      },
      {
        emoji: '\u{1F3C6}',
        text: 'Sistema de recompensas para reforçar constância e engajamento.',
      },
    ]}
  />
);

const Page4Content: React.FC = () => (
  <InfoList
    items={[
      {
        emoji: '\u{1F4D6}',
        text: 'Diário dos pais com tarefas concluídas e tarefas com dificuldade.',
      },
      {
        emoji: '\u{1F4AC}',
        text: 'Anotação individual por tarefa para registrar contexto do dia.',
      },
      {
        emoji: '\u{1F4CA}',
        text: 'Tela de progresso com estatísticas por período e histórico por data.',
      },
      {
        emoji: '\u{1F4C8}',
        text: 'Acompanhamento de consistência para ajustar rotina com base em dados reais.',
      },
    ]}
  />
);

const Page5Content: React.FC = () => (
  <View>
    <InfoList
      items={[
        {
          emoji: '\u{1F9E9}',
          text: 'Biblioteca de estratégias com orientações práticas para desafios comuns.',
        },
        {
          emoji: '\u{1F6A8}',
          text: 'Tela Quando Buscar Ajuda para apoiar decisões em sinais de alerta.',
        },
        {
          emoji: '\u{1F50D}',
          text: 'Busca de profissionais por localização para facilitar encaminhamento.',
        },
        {
          emoji: '\u{1F6E1}\uFE0F',
          text: 'Camadas de segurança no app e no banco para proteger dados da família.',
        },
      ]}
    />
    <View style={[styles.hintBox, { marginTop: 12, marginBottom: 0 }]}>
      <Text style={styles.hintText}>
        Dica: revise este tutorial quando quiser em Ajustes {'>'} Ver tutorial novamente.
      </Text>
    </View>
  </View>
);

interface PageDef {
  emoji: string;
  title: string;
  gradient: readonly [string, string, ...string[]];
  Content: React.FC;
}

const PAGES: PageDef[] = [
  {
    emoji: '\u2B50',
    title: 'Bem-vindo ao\nMinha Rotina',
    gradient: BlueyGradients.skyVertical,
    Content: Page0Content,
  },
  {
    emoji: '\u{1F512}',
    title: 'Conta da família\ne da criança',
    gradient: ['#EAF4FF', '#D6ECFF', '#C7E6FF'] as const,
    Content: Page1Content,
  },
  {
    emoji: '\u{1F4CB}',
    title: 'Rotinas e tarefas\ndetalhadas',
    gradient: ['#F0F8FF', '#E1F0FF', '#D2EBFF'] as const,
    Content: Page2Content,
  },
  {
    emoji: '\u{1F3AE}',
    title: 'Execução infantil\ncom autonomia',
    gradient: ['#FFF8E1', '#F5E5C0', '#EDCC6F'] as const,
    Content: Page3Content,
  },
  {
    emoji: '\u{1F4CA}',
    title: 'Diário, progresso\ne anotações',
    gradient: ['#E8F5E9', '#C8E6C9', '#A8C98E'] as const,
    Content: Page4Content,
  },
  {
    emoji: '\u{1F4A1}',
    title: 'Estratégias, ajuda\ne segurança',
    gradient: BlueyGradients.yellowHorizontal,
    Content: Page5Content,
  },
];

export const OnboardingScreen: React.FC<ParentScreenProps<'Onboarding'>> = ({ navigation, route }) => {
  const [page, setPage] = useState(0);
  const parent = useAuthStore((s) => s.parent);
  const setShowOnboarding = useAuthStore((s) => s.setShowOnboarding);
  const fromSettings = route.params?.fromSettings === true;

  const isLast = page === PAGES.length - 1;

  const handleFinish = async () => {
    if (parent?.id) {
      await onboardingService.markAsCompleted(parent.id);
    }

    setShowOnboarding(false);

    if (fromSettings && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('ParentTabs');
  };

  const handleNext = () => {
    if (isLast) {
      void handleFinish();
      return;
    }

    setPage((prev) => prev + 1);
  };

  const handleSkip = () => {
    void handleFinish();
  };

  const { emoji, title, gradient, Content } = PAGES[page];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.heroEmoji}>{emoji}</Text>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.contentBox}>
              <Content />
            </View>
          </View>

          <View style={styles.dotsRow}>
            <ProgressDots total={PAGES.length} current={page} />
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={BlueyGradients.greenHorizontal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>{isLast ? 'Começar agora' : 'Próximo >'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 12 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};