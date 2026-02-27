export interface TipReason {
  icon: string;
  text: string;
}

export interface TipStrategy {
  title: string;
  description: string;
}

export interface TaskTips {
  category: string;
  icon: string;
  reasons: TipReason[];
  strategies: TipStrategy[];
}

export const TASK_TIPS: Record<string, TaskTips> = {
  teeth: {
    category: 'Escovar dentes',
    icon: '🦷',
    reasons: [
      { icon: '🎵', text: 'Não gosta do barulho da escova' },
      { icon: '🧴', text: 'Não gosta da textura da pasta dental' },
      { icon: '👄', text: 'Sensibilidade na boca' },
      { icon: '😰', text: 'Não entende por que precisa fazer' },
    ],
    strategies: [
      {
        title: 'Use escova elétrica',
        description: 'O barulho é constante e previsível, diferente do raspado irregular da escova manual',
      },
      {
        title: 'Comece sem pasta',
        description: 'Escove apenas com água nas primeiras semanas para reduzir a sensação na boca',
      },
      {
        title: 'Massagem gengival antes',
        description: 'Massageie as gengivas por 5 minutos antes para dessensibilizar a região',
      },
      {
        title: 'Pasta sem flúor e sem menta',
        description: 'Pastas especiais para crianças sensíveis têm sabor neutro ou frutas suaves',
      },
    ],
  },

  bath: {
    category: 'Banho',
    icon: '🛁',
    reasons: [
      { icon: '🚿', text: 'Barulho forte da água' },
      { icon: '💧', text: 'Sensação da água na pele' },
      { icon: '🌡️', text: 'Dificuldade de regular a temperatura' },
      { icon: '🧼', text: 'Cheiro forte do sabonete ou shampoo' },
    ],
    strategies: [
      {
        title: 'Use chuveiro com pressão baixa',
        description: 'Menor pressão reduz o impacto sensorial na pele',
      },
      {
        title: 'Inicie com água morna constante',
        description: 'Temperatura estável reduz imprevisibilidade. Deixe a criança ajudar a verificar',
      },
      {
        title: 'Sabonetes sem perfume',
        description: 'Produtos hipoalergênicos e sem fragrância reduzem sobrecarga olfativa',
      },
      {
        title: 'Molhe gradualmente',
        description: 'Comece pelos pés e suba devagar, permitindo adaptação sensorial a cada etapa',
      },
    ],
  },

  bathroom: {
    category: 'Banheiro',
    icon: '🚽',
    reasons: [
      { icon: '🔊', text: 'Barulho da descarga é assustador' },
      { icon: '🪑', text: 'Desconforto com a textura do vaso' },
      { icon: '❓', text: 'Não reconhece a sensação de precisar ir' },
      { icon: '😨', text: 'Medo de cair no vaso' },
    ],
    strategies: [
      {
        title: 'Use redutor de vaso',
        description: 'Assentos redutores dão mais segurança e eliminam o medo de cair',
      },
      {
        title: 'Descarregue depois que ela sair',
        description: 'Tire a criança primeiro, depois puxe a descarga. Gradualmente ela pode ficar na porta',
      },
      {
        title: 'Use timer visual',
        description: 'Mostre quantos minutos precisa ficar sentada. Previsibilidade reduz a ansiedade',
      },
      {
        title: 'Tenha paciência de 6 meses',
        description: 'O treino de banheiro pode levar 3–6 meses em crianças autistas. Isso é normal!',
      },
    ],
  },

  clothes: {
    category: 'Roupas',
    icon: '👕',
    reasons: [
      { icon: '🏷️', text: 'Etiquetas causam coceira intensa' },
      { icon: '🧵', text: 'Costuras irregulares incomodam' },
      { icon: '👟', text: 'Desconforto com meias e sapatos' },
      { icon: '🌡️', text: 'Hipersensibilidade a texturas específicas' },
    ],
    strategies: [
      {
        title: 'Corte todas as etiquetas',
        description: 'Sempre corte as etiquetas antes de colocar a roupa pela primeira vez',
      },
      {
        title: 'Roupas com costura invertida',
        description: 'Existem marcas com costura para fora especialmente para crianças com sensibilidade tátil',
      },
      {
        title: 'Meias sem costura no dedo',
        description: 'Existem meias sem costura na ponta especificamente para hipersensibilidade tátil',
      },
      {
        title: 'Deixe ela escolher a roupa',
        description: 'Autonomia na escolha reduz resistência. Use poucas opções pré-selecionadas',
      },
    ],
  },

  hair: {
    category: 'Cabelo',
    icon: '💇',
    reasons: [
      { icon: '✂️', text: 'Barulho da tesoura assusta' },
      { icon: '💈', text: 'Sensação do cabelo caindo' },
      { icon: '🪮', text: 'Pentear puxa e doi' },
      { icon: '💺', text: 'Ficar parada por muito tempo é difícil' },
    ],
    strategies: [
      {
        title: 'Use spray de desembaraçar',
        description: 'Reduz puxões ao pentear. Aplique e espere 1 minuto antes de começar',
      },
      {
        title: 'Máquina elétrica em vez de tesoura',
        description: 'Som constante e previsível da máquina é melhor tolerado que o clique da tesoura',
      },
      {
        title: 'Corte enquanto assiste algo',
        description: 'Distração ajuda muito. Use tablet com o desenho favorito durante o corte',
      },
      {
        title: 'Sessões curtas progressivas',
        description: 'Comece com 2 minutos e aumente gradualmente. Pare antes que haja sobrecarga',
      },
    ],
  },

  food: {
    category: 'Alimentação',
    icon: '🍎',
    reasons: [
      { icon: '🤢', text: 'Textura dos alimentos causa náusea real' },
      { icon: '👃', text: 'Cheiro forte desencadeia recusa' },
      { icon: '🌡️', text: 'Temperatura errada incomoda' },
      { icon: '🎨', text: 'Cor ou aparência diferente gera resistência' },
    ],
    strategies: [
      {
        title: 'Prato separado, sem misturar',
        description: 'Nunca misture alimentos no prato. Cada item em espaço separado, sem encostar',
      },
      {
        title: 'Introduza gradualmente',
        description: 'Coloque o alimento novo no prato por 1 semana antes de pedir que coma. Só a exposição visual já é progresso',
      },
      {
        title: 'Varie na mesma textura',
        description: 'Se aceita crocante, varie os crocantes. Não force texturas desconfortáveis',
      },
      {
        title: 'Deixe tocar antes de comer',
        description: 'Exploração tátil e olfativa prepara o sistema sensorial para o momento de comer',
      },
    ],
  },
};
