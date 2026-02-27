import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tip {
  title: string;
  explanation: string;
}

interface TimelinePhase {
  period: string;
  description: string;
}

interface Strategy {
  id: string;
  problemEmoji: string;
  problem: string;
  preview: string;
  why: string;
  tips: Tip[];
  timeline?: TimelinePhase[];
  warning: string;
  videoQuery: string;
}

interface Category {
  id: string;
  emoji: string;
  label: string;
  color: string;
  gradient: [string, string];
  intro: string;
  strategies: Strategy[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'teeth',
    emoji: '🪥',
    label: 'Dentes',
    color: '#64B5F6',
    gradient: ['#88CAFC', '#64B5F6'],
    intro:
      '70% das crianças autistas resistem a escovar os dentes por questões SENSORIAIS, não por birra. O barulho da escova raspando, a textura da pasta, e a sensação na boca podem ser extremamente desconfortáveis.',
    strategies: [
      {
        id: 'teeth-noise',
        problemEmoji: '🔊',
        problem: 'Barulho da Escova',
        preview: 'O som raspando pode ser muito intenso para o sistema auditivo sensível...',
        why: 'O barulho da escova manual raspando nos dentes pode ser extremamente desconfortável para crianças autistas com sensibilidade auditiva. O som é imprevisível e pode parecer muito mais alto do que realmente é.',
        tips: [
          {
            title: 'Use escova elétrica',
            explanation:
              'O barulho é constante e previsível, diferente do raspado irregular da escova manual. Escolha uma com som mais grave e deixe a criança ligar/desligar para ter controle.',
          },
          {
            title: 'Música de fundo',
            explanation:
              'Toque uma música calma que a criança goste durante a escovação. Use sempre a mesma para criar previsibilidade — o som familiar mascara o barulho da escova.',
          },
          {
            title: 'Comece sem escovar de verdade',
            explanation:
              'Apenas encoste a escova nos dentes sem fazer movimentos. Aumente gradualmente a pressão e o movimento ao longo de semanas.',
          },
          {
            title: 'Feche a porta do banheiro',
            explanation:
              'Reduza ecos e reverberação. Azulejos amplificam o som — tapete de borracha no chão ajuda a absorver.',
          },
          {
            title: 'Timer visual silencioso',
            explanation:
              'Use ampulheta ou timer de LED (não sonoro). Criança sabe quanto tempo falta, reduzindo a ansiedade de "quando vai acabar?"',
          },
        ],
        warning:
          'Nunca force a criança a escovar com barulho que a incomoda. Isso pode criar trauma e fazer ela ter ainda mais resistência no futuro.',
        videoQuery: 'autismo escovação dentes barulho criança sensorial estratégia',
      },
      {
        id: 'teeth-paste',
        problemEmoji: '🧴',
        problem: 'Textura da Pasta',
        preview: 'A espuma e textura da pasta podem causar náusea real...',
        why: 'A textura cremosa, o gosto forte, e principalmente a ESPUMA da pasta de dente podem causar náusea e desconforto oral em crianças autistas com sensibilidade tátil na boca.',
        tips: [
          {
            title: 'Comece SEM pasta',
            explanation:
              'Escove apenas com água nas primeiras semanas. A escovação mecânica já remove placa. Adicione pasta somente quando a criança estiver confortável.',
          },
          {
            title: 'Pasta sem sabor forte',
            explanation:
              'Existem pastas infantis sem sabor. Evite menta e tutti-frutti. Algumas crianças preferem pasta completamente neutra.',
          },
          {
            title: 'Quantidade mínima',
            explanation:
              'Use quantidade do tamanho de um grão de arroz. Menos pasta = menos espuma = menos desconforto. Dentistas recomendam essa quantidade mesmo.',
          },
          {
            title: 'Gel dental ao invés de pasta',
            explanation:
              'Textura diferente pode ser melhor tolerada. Não faz tanta espuma. Teste diferentes marcas com a criança antes.',
          },
          {
            title: 'Deixe a criança escolher',
            explanation:
              'Vá à farmácia e deixe ela sentir o cheiro e ver as embalagens. Criança com mais controle tem menos ansiedade.',
          },
          {
            title: 'Enxágue imediato garantido',
            explanation:
              'Tenha água pronta para enxaguar logo. Criança sabe que pode tirar rápido se incomodar, reduzindo a ansiedade antecipatória.',
          },
        ],
        timeline: [
          {
            period: 'Semana 1-2',
            description:
              'Deixe a criança VER e CHEIRAR a pasta. Não precisa usar ainda. Deixe tocar na pasta com o dedo.',
          },
          {
            period: 'Semana 3-4',
            description:
              'Coloque pouquíssima pasta (grão de arroz) e escove só os dentes da frente. Enxágue imediatamente.',
          },
          {
            period: 'Semana 5-8',
            description:
              'Aumente gradualmente a área escovada. Mantenha quantidade mínima. Criança pode cuspir a qualquer momento.',
          },
          {
            period: 'Semana 9-12',
            description:
              'Escovação completa com pasta. A quantidade de grão de arroz continua sendo a certa. Rotina estabelecida!',
          },
        ],
        warning:
          'Se a criança vomitar ou ter náusea forte, PARE. Volte para água apenas e tente um novo tipo de pasta após 2 semanas.',
        videoQuery: 'autismo pasta de dente seletividade sensorial criança',
      },
      {
        id: 'teeth-sensitivity',
        problemEmoji: '😬',
        problem: 'Sensibilidade Oral',
        preview: 'Sensação da escova na boca pode ser intolerável para alguns...',
        why: 'Algumas crianças autistas têm hipersensibilidade tátil na boca. A sensação da escova tocando dentes, gengiva e língua pode ser extremamente desconfortável, similar ao "osso engraçado" do cotovelo.',
        tips: [
          {
            title: 'Massagem gengival preparatória',
            explanation:
              '5 minutos antes, massageie as gengivas com dedo limpo. Ajuda a "acordar" a boca e reduzir a sensibilidade. Faça virar parte da rotina.',
          },
          {
            title: 'Escova de cerdas EXTRA macias',
            explanation:
              'Procure por "extra soft" ou "ultra soft". Cerdas de silicone podem ser melhores. Troque a cada 2 meses pois desgastam rápido.',
          },
          {
            title: 'Deixe a criança escovar primeiro',
            explanation:
              'Ela tem controle da pressão e sente quando está desconfortável. Você apenas "ajuda" ou "termina" a escovação.',
          },
          {
            title: 'Escove um quadrante por vez',
            explanation:
              'Divida a boca em 4 partes. Escove 1 parte, pausa, próxima parte. Reduz o tempo de desconforto contínuo.',
          },
          {
            title: 'Escova vibratória (não elétrica)',
            explanation:
              'Vibração pode dessensibilizar. Diferente de escova elétrica (não roda/move). Encontrada em lojas de material ortodôntico.',
          },
        ],
        warning:
          'NUNCA force a boca aberta ou segure a cabeça. Isso cria trauma e piora a resistência.',
        videoQuery: 'autismo hipersensibilidade oral escovação dentes',
      },
    ],
  },
  {
    id: 'bath',
    emoji: '🛁',
    label: 'Banho',
    color: '#5C6BC0',
    gradient: ['#64B5F6', '#5C6BC0'],
    intro:
      '65% das crianças autistas têm dificuldade com banho por causa do barulho da água caindo, temperatura imprevisível, e sensação de gotas na pele. É questão de processamento sensorial, não frescura.',
    strategies: [
      {
        id: 'bath-noise',
        problemEmoji: '🚿',
        problem: 'Barulho do Chuveiro',
        preview: 'Som da água caindo pode ser muito intenso em banheiros de azulejo...',
        why: 'O som do chuveiro, especialmente em banheiros com azulejo, pode ser MUITO alto para crianças com sensibilidade auditiva. Parece uma cachoeira barulhenta ao invés de um chuveiro normal.',
        tips: [
          {
            title: 'Regador de jardim',
            explanation:
              'Use regador manual ao invés do chuveiro. Você controla o fluxo e a direção, o som é muito mais baixo, e a criança pode segurar junto.',
          },
          {
            title: 'Reduza pressão do chuveiro',
            explanation:
              'Abra o registro só um pouco. Fluxo menor = menos barulho. Demora mais, mas é menos estressante.',
          },
          {
            title: 'Banho de caneca e bacia',
            explanation:
              'Encha uma bacia com água morna e jogue com caneca. SEM barulho de chuveiro. É comum em muitas culturas e funciona muito bem.',
          },
          {
            title: 'Protetor auricular',
            explanation:
              'Use protetor auricular de silicone. Não elimina todo o som mas reduz muito. Criança ainda ouve você falar. Encontrado em lojas de construção.',
          },
        ],
        warning:
          'Nunca ligue o chuveiro de surpresa. Sempre avise: "Vou ligar o chuveiro agora, vai fazer barulho". Surpresas aumentam o trauma.',
        videoQuery: 'autismo banho chuveiro barulho criança sensorial',
      },
      {
        id: 'bath-temperature',
        problemEmoji: '🌡️',
        problem: 'Sensibilidade à Temperatura',
        preview: 'Água "normal" pode parecer gelada ou fervendo para a criança...',
        why: 'Crianças autistas podem ter dificuldade de regular temperatura corporal e perceber temperatura da água. Água que você acha morna pode parecer gelada ou fervendo para ela.',
        tips: [
          {
            title: 'Termômetro de banho',
            explanation:
              'Use termômetro de água de bebê. Temperatura ideal: 36-37°C. Mostre o número para a criança — previsibilidade reduz ansiedade.',
          },
          {
            title: 'Deixe a criança regular',
            explanation:
              'Ensine como mexer no registro. Ela ajusta até sentir confortável. Supervisione mas dê autonomia — controle reduz ansiedade.',
          },
          {
            title: 'Teste em partes do corpo',
            explanation:
              'Comece molhando só os pés, depois mãos, depois braços. O corpo se acostuma gradualmente à temperatura.',
          },
          {
            title: 'Mantenha SEMPRE a mesma temperatura',
            explanation:
              'Anote a temperatura ideal e use sempre a mesma. Criança sabe o que esperar — previsibilidade é fundamental.',
          },
          {
            title: 'Evite mudanças bruscas',
            explanation:
              'Não alterne quente-frio. Não adicione água quente de repente. Previsibilidade constante reduz ansiedade.',
          },
        ],
        warning:
          'Nunca mude a temperatura sem avisar. Diga sempre o que vai acontecer antes de acontecer.',
        videoQuery: 'autismo banho temperatura sensorial estratégia criança',
      },
    ],
  },
  {
    id: 'bathroom',
    emoji: '🚽',
    label: 'Banheiro',
    color: '#8FB875',
    gradient: ['#A8C98E', '#8FB875'],
    intro:
      '60% das crianças autistas têm dificuldade com banheiro por textura do vaso, barulho da descarga, e sensação de "vazio" embaixo. O processo de desfralde pode levar 3-6 meses e forçar pode criar trauma.',
    strategies: [
      {
        id: 'bathroom-toilet',
        problemEmoji: '😰',
        problem: 'Desconforto com o Vaso',
        preview: 'Textura fria e sensação de vazio podem ser intoleráveis...',
        why: 'O vaso sanitário é frio, duro, tem textura estranha, e há uma sensação de "vazio" embaixo que pode ser muito desconfortável. Isso NÃO é birra — é questão sensorial real.\n\n💬 "Minha irmã usou fralda até os 5 anos porque a família não sabia que era questão de textura. Achavam que era birra."',
        tips: [
          {
            title: 'Redutor de assento acolchoado',
            explanation:
              'Assento menor e mais confortável com textura mais macia. Criança se sente mais segura. Encontrado em lojas de bebê.',
          },
          {
            title: 'Banquinho para os pés',
            explanation:
              'Pés apoiados = menos sensação de vazio. Posição mais natural para evacuar. Reduz a ansiedade de "cair".',
          },
          {
            title: 'Mantenha fralda inicialmente',
            explanation:
              'Criança usa fralda mas SENTA no vaso. Se acostuma com a posição sem pressão de fazer. Remove a fralda só quando confortável — pode levar meses.',
          },
          {
            title: 'Assento aquecido no inverno',
            explanation:
              'Assento quente é mais confortável. Menos choque sensorial ao sentar. Encontrado em lojas de materiais.',
          },
          {
            title: 'Deixe a criança personalizar',
            explanation:
              'Adesivos no vaso, redutor da cor favorita. Criança sente que é "dela" — autonomia reduz resistência.',
          },
        ],
        timeline: [
          {
            period: 'Mês 1',
            description:
              'Criança VISITA banheiro várias vezes ao dia. Senta no vaso COM ROUPA, só se acostuma. SEM pressão — pode brincar ou olhar livro.',
          },
          {
            period: 'Mês 2',
            description:
              'Senta no vaso COM FRALDA. Se conseguir fazer, ótimo, mas sem pressão. Estabeleça horários fixos (após refeições).',
          },
          {
            period: 'Mês 3-4',
            description:
              'Algumas vezes tenta SEM fralda. Se não conseguir, OK, volta para fralda. COMEMORE MUITO quando conseguir qualquer coisa!',
          },
          {
            period: 'Mês 5-6',
            description:
              'Mais vezes sem fralda que com. Acidentes são NORMAIS. Nunca brigue por acidentes — é parte natural do processo.',
          },
        ],
        warning:
          'FORÇAR PODE CRIAR TRAUMA DURADOURO. Se criança chorar, gritar ou ter medo intenso, PARE imediatamente. Não há "idade certa" — 3-6 meses de processo é NORMAL.',
        videoQuery: 'autismo desfralde treino banheiro estratégia gradual',
      },
      {
        id: 'bathroom-flush',
        problemEmoji: '💥',
        problem: 'Barulho da Descarga',
        preview: 'Som súbito e alto pode ser aterrorizante para a criança...',
        why: 'O barulho da descarga é súbito, alto, e imprevisível. Para crianças com sensibilidade auditiva, pode ser similar a um trovão dentro do banheiro.',
        tips: [
          {
            title: 'Criança sai antes da descarga',
            explanation:
              'Ela sai do banheiro, você dá a descarga. A porta fechada abafa o som. Ela retorna quando estiver silencioso.',
          },
          {
            title: 'Protetor auricular',
            explanation:
              'Abafador de ruído (tipo de construção). Criança coloca ANTES da descarga. Ela tem controle sobre o processo.',
          },
          {
            title: 'Avise SEMPRE antes com contagem',
            explanation:
              '"Vou dar descarga agora" com contagem 3-2-1. Nunca dê descarga de surpresa — previsibilidade é tudo.',
          },
          {
            title: 'Use o banheiro mais silencioso',
            explanation:
              'Teste todos os banheiros da casa. Use o mais silencioso. Ou instale descarga com regulagem de pressão.',
          },
        ],
        warning:
          'Nunca dê a descarga de surpresa enquanto a criança está no banheiro. Avisar antes é não-negociável.',
        videoQuery: 'autismo medo descarga barulho banheiro criança',
      },
    ],
  },
  {
    id: 'clothes',
    emoji: '👕',
    label: 'Roupa',
    color: '#E8A730',
    gradient: ['#EDCC6F', '#F1B873'],
    intro:
      'Etiquetas, costuras, e texturas de tecidos podem ser extremamente desconfortáveis. Não é capricho — o cérebro autista processa sensações táteis de forma mais intensa que o normal.',
    strategies: [
      {
        id: 'clothes-tags',
        problemEmoji: '🏷️',
        problem: 'Etiquetas e Costuras',
        preview: 'Etiquetas podem parecer lixa na pele o dia inteiro...',
        why: 'Etiquetas e costuras podem ser EXTREMAMENTE desconfortáveis. Para o tato sensível, uma etiqueta comum parece uma lixa raspando a pele o dia inteiro, afetando humor, concentração e bem-estar.',
        tips: [
          {
            title: 'Remova TODAS as etiquetas',
            explanation:
              "Use descosturador ou tesoura pequena. Corte bem rente. Se ficar restinho, lixe suavemente com lixa d'água fina.",
          },
          {
            title: 'Vire roupas do avesso',
            explanation:
              'Costuras ficam do lado de fora. Solução rápida e fácil. Funciona especialmente bem com moletons e camisetas.',
          },
          {
            title: 'Roupas "seamless" (sem costura)',
            explanation:
              'Marcas especializadas em "sensory-friendly clothing". Mais caras mas valem MUITO a pena para crianças com hipersensibilidade tátil.',
          },
          {
            title: 'Lave roupas novas várias vezes antes',
            explanation:
              'Roupas novas têm textura mais áspera. 3-4 lavadas deixam muito mais macias. Use amaciante sem perfume forte.',
          },
          {
            title: 'Deixe a criança escolher',
            explanation:
              'Deixe tocar na roupa antes de comprar. Se ela disser "coça", ACREDITE. Prefira sempre algodão macio.',
          },
        ],
        warning:
          'Nunca minimize a queixa de "coça". Para a criança autista, a sensação é real e muito desconfortável.',
        videoQuery: 'autismo etiqueta roupa hipersensibilidade tátil criança',
      },
      {
        id: 'clothes-texture',
        problemEmoji: '🧵',
        problem: 'Textura dos Tecidos',
        preview: 'Lã, poliéster e sintéticos podem irritar constantemente...',
        why: 'Lã, poliéster, e tecidos sintéticos podem ser muito irritantes. Cada fibra parece uma agulhada para crianças com hipersensibilidade tátil.',
        tips: [
          {
            title: 'Prefira algodão 100%',
            explanation:
              'Algodão é mais suave e respirável. Evite poliéster, lã e sintéticos. Vale pagar mais pela qualidade.',
          },
          {
            title: 'Roupas largas',
            explanation:
              'Roupas apertadas aumentam fricção na pele. Prefira tamanhos maiores. Criança se move mais livremente.',
          },
          {
            title: 'Mantenha peças favoritas',
            explanation:
              'Se criança tem 1-2 peças que aceita, compre várias iguais. Previsibilidade da textura conhecida reduz resistência.',
          },
          {
            title: 'Meias sem costura na ponta',
            explanation:
              'Existem meias específicas sem costura nos dedos. Pesquise "sensory socks" online. Fazem MUITA diferença.',
          },
        ],
        warning:
          'Forçar roupa desconfortável é como usar uma roupa que coça o dia inteiro — afeta humor, concentração, e bem-estar.',
        videoQuery: 'autismo textura roupa sensorial algodão criança',
      },
    ],
  },
  {
    id: 'hair',
    emoji: '✂️',
    label: 'Cabelo',
    color: '#9575CD',
    gradient: ['#B39DDB', '#9575CD'],
    intro:
      'Barulho da tesoura, sensação de cabelo caindo no corpo, e toque na cabeça são gatilhos sensoriais muito comuns. Muitas crianças precisam de dessensibilização gradual para aceitar corte e penteado.',
    strategies: [
      {
        id: 'hair-cut',
        problemEmoji: '✂️',
        problem: 'Cortar Cabelo',
        preview: 'Som da tesoura e cabelo caindo no corpo são gatilhos muito comuns...',
        why: 'O som da tesoura cortando perto da orelha, a sensação de cabelo caindo no corpo, e o toque no couro cabeludo são gatilhos sensoriais muito comuns em crianças autistas.',
        tips: [
          {
            title: 'Corte em casa, não em salão',
            explanation:
              'Ambiente familiar e controlado. Sem barulho de secador dos outros clientes. Sem cheiro forte de produtos. Pode pausar quando quiser.',
          },
          {
            title: 'Use máquina elétrica silenciosa',
            explanation:
              'Máquina faz menos barulho que tesoura. Som constante é mais previsível. Também é mais rápido.',
          },
          {
            title: 'Distraia com tablet ou TV',
            explanation:
              'Desenho favorito durante o corte. Atenção em outra coisa. Associa o corte com algo prazeroso.',
          },
          {
            title: 'Cubra bem com capa lisa',
            explanation:
              'Cabelo não cai na pele. Menos gatilho sensorial. Use capa de plástico lisa (não tecido áspero).',
          },
          {
            title: 'Corte quando criança está cansada',
            explanation:
              'Menos energia para resistir. Mais cooperativa. Evite quando está irritada ou com fome.',
          },
          {
            title: 'Processo gradual',
            explanation:
              'Primeira vez apara só as pontas. Segunda vez um pouco mais. Pode levar MESES para corte completo — tudo bem!',
          },
        ],
        warning:
          'Nunca corte o cabelo de surpresa ou "na marra". Mesmo que pareça rápido para você, pode ser traumático para a criança.',
        videoQuery: 'autismo corte cabelo criança sensorial estratégia',
      },
      {
        id: 'hair-brush',
        problemEmoji: '💇',
        problem: 'Pentear o Cabelo',
        preview: 'Tração no couro cabeludo pode ser muito dolorosa...',
        why: 'O couro cabeludo de crianças autistas pode ser hipersensível ao toque. Pentear pode parecer doloroso mesmo com pente macio, causando resistência intensa.',
        tips: [
          {
            title: 'Use desembaraçante ANTES',
            explanation:
              'Aplique desembaraçante em cabelo molhado. Reduz tração e puxão drasticamente. Espere 2 minutos antes de pentear.',
          },
          {
            title: 'Pente de dentes largos',
            explanation:
              'Causa menos desconforto que pente fino. Comece pelas pontas, suba gradualmente. Nunca comece pelo couro cabeludo.',
          },
          {
            title: 'Segure o cabelo na raiz',
            explanation:
              'Enquanto penteia, segure o cabelo entre o couro e o pente. A criança sente menos tração.',
          },
          {
            title: 'Opte por cabelo mais curto',
            explanation:
              'Cabelos curtos precisam de menos penteado. Pode facilitar muito a rotina diária.',
          },
        ],
        warning:
          'Se a criança chora ou grita ao pentear, não é "frescura" — dói de verdade. Use sempre desembaraçante e nunca force.',
        videoQuery: 'autismo pentear cabelo hipersensibilidade couro cabeludo',
      },
    ],
  },
  {
    id: 'food',
    emoji: '🍎',
    label: 'Comer',
    color: '#EC407A',
    gradient: ['#F48FB1', '#EC407A'],
    intro:
      'Seletividade alimentar em autistas geralmente está ligada a textura, cheiro, e aparência visual. Não é manha — é como o cérebro processa experiências sensoriais de comida.',
    strategies: [
      {
        id: 'food-texture',
        problemEmoji: '🤢',
        problem: 'Seletividade por Textura',
        preview: 'Texturas específicas podem causar náusea real, não é frescura...',
        why: 'Seletividade alimentar em autistas raramente é "frescura". Texturas como gosma, viscoso, granulado, ou fibroso podem causar náusea real. O cérebro processa essas sensações de forma muito mais intensa.',
        tips: [
          {
            title: 'Respeite preferências de textura',
            explanation:
              'Se criança só come crocante, ok. Ofereça variedade DENTRO da textura aceita: cenoura crocante, maçã, torrada, etc.',
          },
          {
            title: 'Nunca force comer',
            explanation:
              'Forçar cria trauma e piora a seletividade. Ofereça mas não obrigue. Criança não vai morrer de fome — instinto de sobrevivência é forte.',
          },
          {
            title: 'Introdução MUITO gradual',
            explanation:
              'Semana 1: novo alimento no prato (não precisa comer). Semana 2-3: pode tocar e cheirar. Semana 4: lambe (não precisa mastigar). O processo pode levar MESES.',
          },
          {
            title: 'Mesma apresentação sempre',
            explanation:
              'Maçã sempre cortada do mesmo jeito. Arroz sempre na mesma tigela. Previsibilidade visual reduz a ansiedade de provar.',
          },
          {
            title: 'Aceite "comidas bege"',
            explanation:
              'Arroz, pão, batata, frango empanado. É MUITO comum em autismo e não faz mal com suplementação adequada.',
          },
          {
            title: 'Comidas separadas no prato',
            explanation:
              'Não deixe molho tocar no arroz. Cada coisa no seu espaço. Pratos com divisórias são ótimos para isso.',
          },
          {
            title: 'Consulte nutricionista especializado',
            explanation:
              'Profissional que entende autismo pode recomendar suplementos sem pressão ou julgamento.',
          },
        ],
        warning:
          'Seletividade alimentar severa deve ser acompanhada por nutricionista especializado em autismo, mas NUNCA force. Forçar piora o problema.',
        videoQuery: 'autismo seletividade alimentar textura criança estratégia',
      },
      {
        id: 'food-smell',
        problemEmoji: '👃',
        problem: 'Sensibilidade a Cheiros',
        preview: 'Cheiros fortes podem arruinar toda a refeição...',
        why: 'Crianças autistas frequentemente têm olfato muito mais sensível. Um cheiro que você mal percebe pode ser insuportável para elas, arruinando até alimentos que aceitariam de outra forma.',
        tips: [
          {
            title: 'Identifique cheiros problemáticos',
            explanation:
              'Observe quais alimentos são recusados antes de experimentar (rejeição pelo cheiro). Anote e respeite.',
          },
          {
            title: 'Cozinhe com pouca especiaria',
            explanation:
              'Alimentos simples e com cheiro suave são mais aceitos. Evite alho, cebola, e temperos fortes.',
          },
          {
            title: 'Sirva comida fria ou morna',
            explanation:
              'Alimentos quentes soltam mais cheiro. Mornos ou frios têm odor mais suave e são mais aceitos.',
          },
          {
            title: 'Ventile a cozinha',
            explanation:
              'Janela aberta durante e após cozinhar. Extrator de ar funciona bem. Cheiro de comida acumulado pode ser gatilho.',
          },
        ],
        warning:
          'Nunca force a criança a ficar perto de alimentos com cheiro insuportável. Pode criar aversão permanente.',
        videoQuery: 'autismo seletividade alimentar cheiro olfato criança',
      },
    ],
  },
];

// ─── StrategyCard Component ────────────────────────────────────────────────────

interface StrategyCardProps {
  strategy: Strategy;
  categoryColor: string;
  expanded: boolean;
  onToggle: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  categoryColor,
  expanded,
  onToggle,
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const openVideo = () => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(strategy.videoQuery)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.card, expanded ? { borderColor: categoryColor } : null]}>
      {/* Collapsed header — always visible */}
      <TouchableOpacity onPress={onToggle} style={styles.cardHeader} activeOpacity={0.8}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardProblemEmoji}>{strategy.problemEmoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardProblem}>Problema: {strategy.problem}</Text>
            {!expanded ? (
              <Text style={styles.cardPreview} numberOfLines={2}>
                {strategy.preview}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.badge, { backgroundColor: categoryColor + '33' }]}>
            <Text style={[styles.badgeText, { color: categoryColor }]}>
              {strategy.tips.length} dicas
            </Text>
          </View>
          <Text style={[styles.expandIcon, { color: categoryColor }]}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded ? (
        <View style={styles.cardContent}>
          {/* Why section */}
          <View
            style={[
              styles.whySection,
              { borderLeftColor: categoryColor, backgroundColor: categoryColor + '18' },
            ]}
          >
            <Text style={styles.whyTitle}>Por que isso acontece?</Text>
            <Text style={styles.whyText}>{strategy.why}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsSectionTitle}>🛠️ O que você pode fazer:</Text>
            {strategy.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={[styles.tipNumber, { backgroundColor: categoryColor }]}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipExplanation}>{tip.explanation}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Timeline (optional) */}
          {strategy.timeline ? (
            <View style={styles.timelineSection}>
              <Text style={styles.timelineTitle}>📅 Processo Gradual (Timeline Sugerida)</Text>
              {strategy.timeline.map((phase, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={[styles.timelineBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.timelineBadgeText}>{phase.period}</Text>
                  </View>
                  <Text style={styles.timelineDesc}>{phase.description}</Text>
                  {i < (strategy.timeline?.length ?? 0) - 1 ? (
                    <View
                      style={[
                        styles.timelineConnector,
                        { borderLeftColor: categoryColor + '66' },
                      ]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Warning */}
          <View style={styles.warningSection}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.warningText}>{strategy.warning}</Text>
          </View>

          {/* Video */}
          <TouchableOpacity style={styles.videoCard} onPress={openVideo} activeOpacity={0.85}>
            <View style={styles.videoIconWrap}>
              <Text style={styles.videoIcon}>▶</Text>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>Ver vídeo sobre este tema</Text>
              <Text style={styles.videoSub}>Busca no YouTube →</Text>
            </View>
          </TouchableOpacity>

          {/* Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackQuestion}>Esta estratégia foi útil?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                onPress={() => setFeedback('up')}
                style={[styles.feedbackBtn, feedback === 'up' ? styles.feedbackBtnUpActive : null]}
              >
                <Text style={styles.feedbackIcon}>👍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFeedback('down')}
                style={[
                  styles.feedbackBtn,
                  feedback === 'down' ? styles.feedbackBtnDownActive : null,
                ]}
              >
                <Text style={styles.feedbackIcon}>👎</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const StrategiesScreen: React.FC<ParentScreenProps<'Strategies'>> = ({
  navigation,
  route,
}) => {
  const focusCategory = route.params?.category;
  const canGoBack = navigation.canGoBack();

  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORIES.some((c) => c.id === focusCategory) ? (focusCategory as string) : CATEGORIES[0].id
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const cardYPositions = useRef<Record<string, number>>({});

  const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);

    if (isExpanding) {
      setTimeout(() => {
        const y = cardYPositions.current[id];
        if (y !== undefined) {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        }
      }, 220);
    }
  };

  const handleCategoryChange = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(id);
    setExpandedId(null);
    cardYPositions.current = {};
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Fixed Header ── */}
      <LinearGradient colors={['#EDCC6F', '#F1B873']} style={styles.header}>
        {/* Compact single-row title */}
        <View style={styles.headerTop}>
          <View style={styles.headerSide}>
            {canGoBack ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>💡 Biblioteca de Estratégias</Text>
          </View>

          <View style={styles.headerSide} />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          style={styles.tabsRow}
        >
          {CATEGORIES.map((cat) =>
            activeCategory === cat.id ? (
              <LinearGradient
                key={cat.id}
                colors={cat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabActive}
              >
                <TouchableOpacity
                  onPress={() => handleCategoryChange(cat.id)}
                  style={styles.tabTouchable}
                  activeOpacity={0.9}
                >
                  <Text style={styles.tabEmoji}>{cat.emoji}</Text>
                  <Text style={styles.tabLabelActive}>{cat.label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryChange(cat.id)}
                style={styles.tabInactive}
                activeOpacity={0.7}
              >
                <Text style={styles.tabEmoji}>{cat.emoji}</Text>
                <Text style={styles.tabLabelInactive}>{cat.label}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </LinearGradient>

      {/* ── Scrollable Content ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Category intro */}
        <View style={[styles.introBanner, { borderLeftColor: category.color }]}>
          <Text style={styles.introTitle}>
            Por que {category.label.toLowerCase()} pode ser difícil?
          </Text>
          <Text style={styles.introText}>{category.intro}</Text>
        </View>

        {/* Strategy accordion cards */}
        {category.strategies.map((strategy) => (
          <View
            key={strategy.id}
            onLayout={(e) => {
              cardYPositions.current[strategy.id] = e.nativeEvent.layout.y;
            }}
          >
            <StrategyCard
              strategy={strategy}
              categoryColor={category.color}
              expanded={expandedId === strategy.id}
              onToggle={() => handleToggle(strategy.id)}
            />
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BlueyColors.backgroundMain },

  // ── Header ──
  header: {
    paddingTop: 8,
    shadowColor: '#E27A37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
    minHeight: 40,
  },
  headerSide: { width: 44 },
  headerCenter: { flex: 1, alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnText: { fontSize: 20, color: BlueyColors.textPrimary, lineHeight: 24 },
  headerTitle: {
    ...Typography.titleMedium,
    fontSize: 17,
    color: BlueyColors.textPrimary,
    textAlign: 'center',
  },

  // ── Tabs ──
  tabsRow: { marginTop: 0 },
  tabs: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tabActive: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  tabTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.75)',
    gap: 5,
  },
  tabEmoji: { fontSize: 16 },
  tabLabelActive: { ...Typography.labelSmall, fontSize: 13, color: '#FFFFFF' },
  tabLabelInactive: { ...Typography.labelSmall, fontSize: 13, color: BlueyColors.blueyDark },

  // ── Content ──
  contentScroll: { flex: 1, backgroundColor: BlueyColors.backgroundMain },
  contentContainer: { padding: 16, paddingTop: 14, gap: 12 },
  bottomPadding: { height: 80 },

  // ── Intro Banner ──
  introBanner: {
    backgroundColor: BlueyColors.backgroundYellow,
    borderLeftWidth: 5,
    borderRadius: 14,
    padding: 18,
    marginBottom: 4,
  },
  introTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 8,
  },
  introText: {
    ...Typography.bodyMedium,
    color: BlueyColors.textSecondary,
    lineHeight: 26,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFD',
    borderWidth: 3,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeaderLeft: { flexDirection: 'row', flex: 1, gap: 12, alignItems: 'flex-start' },
  cardProblemEmoji: { fontSize: 32, lineHeight: 38 },
  cardHeaderText: { flex: 1 },
  cardProblem: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  cardPreview: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  cardHeaderRight: { alignItems: 'flex-end', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { ...Typography.labelSmall, fontSize: 12 },
  expandIcon: { fontSize: 16, fontWeight: 'bold' },

  // ── Card Expanded ──
  cardContent: { marginTop: 20 },

  whySection: {
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  whyTitle: { ...Typography.labelMedium, color: BlueyColors.textPrimary, marginBottom: 8 },
  whyText: { ...Typography.bodySmall, color: BlueyColors.textSecondary, lineHeight: 22 },

  tipsSection: {
    backgroundColor: '#FFFFFD',
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tipsSectionTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 16 },
  tipItem: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  tipNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  tipNumberText: { ...Typography.labelSmall, color: '#FFFFFF', fontSize: 14 },
  tipContent: { flex: 1 },
  tipTitle: { ...Typography.labelMedium, color: BlueyColors.textPrimary, marginBottom: 3 },
  tipExplanation: { ...Typography.bodySmall, color: BlueyColors.textSecondary, lineHeight: 20 },

  timelineSection: {
    backgroundColor: '#EEF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  timelineTitle: { ...Typography.titleMedium, color: BlueyColors.textPrimary, marginBottom: 14 },
  timelineItem: { marginBottom: 4 },
  timelineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  timelineBadgeText: { ...Typography.labelSmall, color: '#FFFFFF', fontSize: 12 },
  timelineDesc: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    lineHeight: 20,
    paddingLeft: 4,
    marginBottom: 4,
  },
  timelineConnector: {
    height: 16,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: 20,
    marginTop: 2,
    marginBottom: 4,
  },

  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(229,115,115,0.1)',
    borderLeftWidth: 4,
    borderLeftColor: BlueyColors.errorRed,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  warningEmoji: { fontSize: 24, lineHeight: 28 },
  warningText: { ...Typography.bodySmall, color: BlueyColors.textPrimary, flex: 1, lineHeight: 20 },

  feedbackSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: BlueyColors.borderLight,
    paddingTop: 14,
  },
  feedbackQuestion: { ...Typography.bodySmall, color: BlueyColors.textSecondary },
  feedbackButtons: { flexDirection: 'row', gap: 10 },
  feedbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BlueyColors.backgroundBlue,
  },
  feedbackBtnUpActive: { backgroundColor: '#C8E6C9' },
  feedbackBtnDownActive: { backgroundColor: '#FFCDD2' },
  feedbackIcon: { fontSize: 20 },

  // ── Video Card ──
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FFB74D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  videoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 3,
  },
  videoInfo: { flex: 1 },
  videoTitle: { ...Typography.labelMedium, color: BlueyColors.textPrimary, marginBottom: 2 },
  videoSub: { ...Typography.bodySmall, color: '#E65100', fontSize: 12 },
});
