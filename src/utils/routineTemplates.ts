export type TemplateTask = {
  name: string;
  icon_emoji: string;
  estimated_minutes: number;
  has_sensory_issues?: boolean;
  sensory_category?: 'teeth' | 'bath' | 'bathroom' | 'clothes' | 'hair' | 'food' | null;
  steps: { id: string; text: string }[];
};

export type RoutineTemplate = {
  id: string;
  name: string;
  type: 'morning' | 'afternoon' | 'night' | 'custom';
  ageGroup: '2-4' | '5-7' | '8-10' | 'all';
  emoji: string;
  description: string;
  tasks: TemplateTask[];
};

// ─── 12 Templates ─────────────────────────────────────────────────────────────

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [

  // ── MANHÃ (5) ──────────────────────────────────────────────────────────────

  {
    id: 'morning-basic',
    name: 'Manhã Básica',
    type: 'morning',
    ageGroup: '2-4',
    emoji: '🌅',
    description: 'Rotina simples para crianças pequenas com passos curtos e claros.',
    tasks: [
      {
        name: 'Acordar',
        icon_emoji: '🌞',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Abrir os olhos devagar' },
          { id: '2', text: 'Espreguiçar' },
          { id: '3', text: 'Sentar na cama' },
        ],
      },
      {
        name: 'Ir ao banheiro',
        icon_emoji: '🚽',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'bathroom',
        steps: [
          { id: '1', text: 'Ir até o banheiro' },
          { id: '2', text: 'Usar o vaso sanitário' },
          { id: '3', text: 'Dar descarga' },
          { id: '4', text: 'Lavar as mãos com sabão' },
          { id: '5', text: 'Secar as mãos' },
        ],
      },
      {
        name: 'Trocar de roupa',
        icon_emoji: '👕',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Pegar a roupa do dia' },
          { id: '2', text: 'Tirar o pijama' },
          { id: '3', text: 'Vestir a blusa' },
          { id: '4', text: 'Vestir a calça' },
          { id: '5', text: 'Calçar os sapatos' },
        ],
      },
      {
        name: 'Café da manhã',
        icon_emoji: '🥣',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa' },
          { id: '2', text: 'Comer o café da manhã' },
          { id: '3', text: 'Beber água ou suco' },
        ],
      },
      {
        name: 'Escovar os dentes',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Pegar a escova de dentes' },
          { id: '2', text: 'Colocar pasta de dente' },
          { id: '3', text: 'Escovar os dentes por 2 minutos' },
          { id: '4', text: 'Enxaguar a boca' },
          { id: '5', text: 'Guardar a escova' },
        ],
      },
    ],
  },

  {
    id: 'morning-school-5',
    name: 'Manhã Escolar',
    type: 'morning',
    ageGroup: '5-7',
    emoji: '🎒',
    description: 'Rotina completa para dias de escola, com tempo para se preparar bem.',
    tasks: [
      {
        name: 'Acordar',
        icon_emoji: '⏰',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Desligar o alarme' },
          { id: '2', text: 'Levantar da cama' },
          { id: '3', text: 'Abrir as persianas' },
        ],
      },
      {
        name: 'Tomar banho',
        icon_emoji: '🚿',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Verificar a temperatura da água' },
          { id: '2', text: 'Molhar o corpo' },
          { id: '3', text: 'Usar sabonete' },
          { id: '4', text: 'Lavar o cabelo com shampoo' },
          { id: '5', text: 'Enxaguar bem' },
          { id: '6', text: 'Secar com a toalha' },
        ],
      },
      {
        name: 'Vestir o uniforme',
        icon_emoji: '👔',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Pegar o uniforme' },
          { id: '2', text: 'Vestir a camisa' },
          { id: '3', text: 'Vestir a calça ou saia' },
          { id: '4', text: 'Calçar os tênis' },
          { id: '5', text: 'Verificar se está tudo certo' },
        ],
      },
      {
        name: 'Café da manhã',
        icon_emoji: '🍳',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa' },
          { id: '2', text: 'Comer com calma' },
          { id: '3', text: 'Beber água' },
        ],
      },
      {
        name: 'Escovar os dentes',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Escovar por 2 minutos' },
          { id: '2', text: 'Enxaguar a boca' },
        ],
      },
      {
        name: 'Arrumar a mochila',
        icon_emoji: '🎒',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Colocar o estojo' },
          { id: '2', text: 'Colocar o caderno' },
          { id: '3', text: 'Colocar a lancheira' },
          { id: '4', text: 'Fechar a mochila' },
        ],
      },
      {
        name: 'Ir para a escola',
        icon_emoji: '🚌',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Pegar a mochila' },
          { id: '2', text: 'Se despedir' },
          { id: '3', text: 'Fechar a porta' },
        ],
      },
    ],
  },

  {
    id: 'morning-school-8',
    name: 'Manhã Escolar (maior)',
    type: 'morning',
    ageGroup: '8-10',
    emoji: '📚',
    description: 'Rotina mais independente para crianças maiores, com responsabilidades extras.',
    tasks: [
      {
        name: 'Acordar',
        icon_emoji: '⏰',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Desligar o alarme sozinho' },
          { id: '2', text: 'Levantar da cama' },
        ],
      },
      {
        name: 'Tomar banho',
        icon_emoji: '🚿',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Regular a temperatura' },
          { id: '2', text: 'Lavar cabelo e corpo' },
          { id: '3', text: 'Enxaguar e secar' },
        ],
      },
      {
        name: 'Vestir o uniforme',
        icon_emoji: '👕',
        estimated_minutes: 8,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Vestir as roupas' },
          { id: '2', text: 'Calçar o tênis e amarrar' },
        ],
      },
      {
        name: 'Café da manhã',
        icon_emoji: '🥐',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Preparar o café se necessário' },
          { id: '2', text: 'Comer e beber água' },
        ],
      },
      {
        name: 'Escovar os dentes',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Escovar por 2 minutos' },
          { id: '2', text: 'Enxaguar' },
        ],
      },
      {
        name: 'Verificar a lição',
        icon_emoji: '📓',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Abrir a agenda' },
          { id: '2', text: 'Checar o que tem para hoje' },
          { id: '3', text: 'Colocar o material na mochila' },
        ],
      },
      {
        name: 'Arrumar a mochila',
        icon_emoji: '🎒',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Organizar o material' },
          { id: '2', text: 'Colocar a lancheira' },
          { id: '3', text: 'Fechar a mochila' },
        ],
      },
      {
        name: 'Ir para a escola',
        icon_emoji: '🚶',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Pegar a mochila' },
          { id: '2', text: 'Se despedir' },
        ],
      },
    ],
  },

  {
    id: 'morning-weekend',
    name: 'Manhã de Fim de Semana',
    type: 'morning',
    ageGroup: 'all',
    emoji: '🌈',
    description: 'Rotina relaxada para sábados e domingos, com mais tempo livre.',
    tasks: [
      {
        name: 'Acordar',
        icon_emoji: '😴',
        estimated_minutes: 10,
        steps: [
          { id: '1', text: 'Acordar no próprio horário' },
          { id: '2', text: 'Espreguiçar e levantar' },
        ],
      },
      {
        name: 'Ir ao banheiro',
        icon_emoji: '🚽',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'bathroom',
        steps: [
          { id: '1', text: 'Usar o banheiro' },
          { id: '2', text: 'Lavar o rosto e as mãos' },
        ],
      },
      {
        name: 'Café da manhã',
        icon_emoji: '🥞',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Escolher o que quer comer' },
          { id: '2', text: 'Sentar com a família' },
          { id: '3', text: 'Comer com calma' },
        ],
      },
      {
        name: 'Atividade livre',
        icon_emoji: '🎮',
        estimated_minutes: 30,
        steps: [
          { id: '1', text: 'Escolher uma atividade que gosta' },
          { id: '2', text: 'Curtir o tempo livre' },
        ],
      },
    ],
  },

  {
    id: 'morning-vacation',
    name: 'Manhã de Férias',
    type: 'morning',
    ageGroup: 'all',
    emoji: '🏖️',
    description: 'Rotina mínima para dias de férias, mantendo o básico sem pressão.',
    tasks: [
      {
        name: 'Acordar e se arrumar',
        icon_emoji: '🌤️',
        estimated_minutes: 15,
        steps: [
          { id: '1', text: 'Levantar da cama' },
          { id: '2', text: 'Ir ao banheiro' },
          { id: '3', text: 'Lavar o rosto' },
        ],
      },
      {
        name: 'Café da manhã',
        icon_emoji: '🍓',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar para o café' },
          { id: '2', text: 'Comer e beber' },
        ],
      },
      {
        name: 'Planejar o dia',
        icon_emoji: '📅',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Pensar no que quer fazer hoje' },
          { id: '2', text: 'Contar para a família' },
        ],
      },
    ],
  },

  // ── TARDE (3) ──────────────────────────────────────────────────────────────

  {
    id: 'afternoon-school',
    name: 'Volta da Escola',
    type: 'afternoon',
    ageGroup: 'all',
    emoji: '🏠',
    description: 'Rotina para depois da escola: descanso, lição e higiene.',
    tasks: [
      {
        name: 'Chegar em casa',
        icon_emoji: '🏡',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Guardar a mochila no lugar certo' },
          { id: '2', text: 'Tirar o tênis' },
          { id: '3', text: 'Lavar as mãos' },
        ],
      },
      {
        name: 'Lanche da tarde',
        icon_emoji: '🍎',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Escolher o lanche' },
          { id: '2', text: 'Comer sentado à mesa' },
          { id: '3', text: 'Guardar os restos' },
        ],
      },
      {
        name: 'Descansar',
        icon_emoji: '😌',
        estimated_minutes: 20,
        steps: [
          { id: '1', text: 'Escolher uma atividade calma' },
          { id: '2', text: 'Descansar antes de fazer a lição' },
        ],
      },
      {
        name: 'Fazer a lição',
        icon_emoji: '✏️',
        estimated_minutes: 30,
        steps: [
          { id: '1', text: 'Pegar a agenda' },
          { id: '2', text: 'Ver o que precisa fazer' },
          { id: '3', text: 'Fazer a lição de matemática' },
          { id: '4', text: 'Fazer a lição de português' },
          { id: '5', text: 'Guardar tudo na mochila' },
        ],
      },
      {
        name: 'Tomar banho',
        icon_emoji: '🚿',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Regular a água' },
          { id: '2', text: 'Tomar banho' },
          { id: '3', text: 'Secar e trocar de roupa' },
        ],
      },
    ],
  },

  {
    id: 'afternoon-weekend',
    name: 'Tarde de Fim de Semana',
    type: 'afternoon',
    ageGroup: 'all',
    emoji: '☀️',
    description: 'Tarde tranquila com almoço em família e tempo para brincar.',
    tasks: [
      {
        name: 'Almoço',
        icon_emoji: '🍽️',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa com a família' },
          { id: '2', text: 'Experimentar os alimentos' },
          { id: '3', text: 'Comer com calma' },
        ],
      },
      {
        name: 'Descanso pós-almoço',
        icon_emoji: '😴',
        estimated_minutes: 20,
        steps: [
          { id: '1', text: 'Deitar ou ficar quieto' },
          { id: '2', text: 'Assistir algo calmo ou descansar' },
        ],
      },
      {
        name: 'Atividade preferida',
        icon_emoji: '🎨',
        estimated_minutes: 40,
        steps: [
          { id: '1', text: 'Escolher o que quer fazer' },
          { id: '2', text: 'Brincar ou criar' },
          { id: '3', text: 'Guardar tudo ao terminar' },
        ],
      },
      {
        name: 'Lanche da tarde',
        icon_emoji: '🍪',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Pegar o lanche' },
          { id: '2', text: 'Comer sentado' },
        ],
      },
    ],
  },

  {
    id: 'afternoon-home',
    name: 'Tarde em Casa',
    type: 'afternoon',
    ageGroup: 'all',
    emoji: '🏠',
    description: 'Para dias sem escola, mantendo estrutura e momentos de prazer.',
    tasks: [
      {
        name: 'Almoço',
        icon_emoji: '🥗',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa' },
          { id: '2', text: 'Comer com calma' },
        ],
      },
      {
        name: 'Higiene pós-almoço',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Escovar os dentes' },
          { id: '2', text: 'Lavar as mãos' },
        ],
      },
      {
        name: 'Atividade educativa',
        icon_emoji: '🧩',
        estimated_minutes: 30,
        steps: [
          { id: '1', text: 'Escolher um jogo ou livro' },
          { id: '2', text: 'Fazer por 30 minutos' },
          { id: '3', text: 'Guardar ao terminar' },
        ],
      },
      {
        name: 'Lanche da tarde',
        icon_emoji: '🍌',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Pegar a fruta ou lanche' },
          { id: '2', text: 'Comer sentado' },
        ],
      },
    ],
  },

  // ── NOITE (4) ──────────────────────────────────────────────────────────────

  {
    id: 'night-basic',
    name: 'Noite Básica',
    type: 'night',
    ageGroup: '2-4',
    emoji: '🌙',
    description: 'Rotina noturna suave para crianças pequenas, preparando para dormir.',
    tasks: [
      {
        name: 'Jantar',
        icon_emoji: '🍲',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa com a família' },
          { id: '2', text: 'Experimentar a comida' },
          { id: '3', text: 'Comer com calma' },
        ],
      },
      {
        name: 'Tomar banho',
        icon_emoji: '🛁',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Regular a temperatura da água' },
          { id: '2', text: 'Entrar na banheira ou chuveiro' },
          { id: '3', text: 'Lavar o corpo com sabonete' },
          { id: '4', text: 'Lavar o cabelo' },
          { id: '5', text: 'Enxaguar tudo' },
          { id: '6', text: 'Secar com a toalha' },
        ],
      },
      {
        name: 'Vestir o pijama',
        icon_emoji: '🌙',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Pegar o pijama' },
          { id: '2', text: 'Vestir a blusa do pijama' },
          { id: '3', text: 'Vestir a calça do pijama' },
        ],
      },
      {
        name: 'Escovar os dentes',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Pegar a escova com pasta' },
          { id: '2', text: 'Escovar por 2 minutos' },
          { id: '3', text: 'Enxaguar' },
        ],
      },
      {
        name: 'História antes de dormir',
        icon_emoji: '📖',
        estimated_minutes: 10,
        steps: [
          { id: '1', text: 'Escolher um livro' },
          { id: '2', text: 'Deitar na cama' },
          { id: '3', text: 'Ouvir a história com atenção' },
        ],
      },
      {
        name: 'Hora de dormir',
        icon_emoji: '😴',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Apagar a luz' },
          { id: '2', text: 'Fechar os olhos' },
          { id: '3', text: 'Respirar fundo e relaxar' },
        ],
      },
    ],
  },

  {
    id: 'night-school',
    name: 'Noite Escolar',
    type: 'night',
    ageGroup: 'all',
    emoji: '⭐',
    description: 'Rotina noturna completa para dias de escola, com preparação para o dia seguinte.',
    tasks: [
      {
        name: 'Jantar',
        icon_emoji: '🍽️',
        estimated_minutes: 20,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar à mesa' },
          { id: '2', text: 'Comer com calma' },
          { id: '3', text: 'Conversar com a família' },
        ],
      },
      {
        name: 'Tomar banho',
        icon_emoji: '🚿',
        estimated_minutes: 10,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Regular a temperatura' },
          { id: '2', text: 'Lavar o corpo e cabelo' },
          { id: '3', text: 'Secar com a toalha' },
        ],
      },
      {
        name: 'Vestir o pijama',
        icon_emoji: '🌙',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Vestir o pijama completo' },
        ],
      },
      {
        name: 'Escovar os dentes',
        icon_emoji: '🪥',
        estimated_minutes: 5,
        has_sensory_issues: true,
        sensory_category: 'teeth',
        steps: [
          { id: '1', text: 'Escovar por 2 minutos' },
          { id: '2', text: 'Usar fio dental se souber' },
          { id: '3', text: 'Enxaguar' },
        ],
      },
      {
        name: 'Preparar mochila para amanhã',
        icon_emoji: '🎒',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Checar a agenda' },
          { id: '2', text: 'Colocar o material necessário' },
          { id: '3', text: 'Deixar a mochila pronta' },
        ],
      },
      {
        name: 'Ler ou atividade calma',
        icon_emoji: '📚',
        estimated_minutes: 10,
        steps: [
          { id: '1', text: 'Escolher um livro ou atividade tranquila' },
          { id: '2', text: 'Ficar quieto por 10 minutos' },
        ],
      },
      {
        name: 'Hora de dormir',
        icon_emoji: '😴',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Deitar na cama' },
          { id: '2', text: 'Apagar a luz' },
          { id: '3', text: 'Fechar os olhos e relaxar' },
        ],
      },
    ],
  },

  {
    id: 'night-weekend',
    name: 'Noite de Fim de Semana',
    type: 'night',
    ageGroup: 'all',
    emoji: '🌟',
    description: 'Noite mais relaxada no fim de semana, com atividade tranquila antes de dormir.',
    tasks: [
      {
        name: 'Jantar',
        icon_emoji: '🍕',
        estimated_minutes: 25,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Sentar com a família' },
          { id: '2', text: 'Comer com calma' },
        ],
      },
      {
        name: 'Banho',
        icon_emoji: '🛁',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Tomar banho' },
          { id: '2', text: 'Secar bem' },
        ],
      },
      {
        name: 'Pijama e higiene',
        icon_emoji: '🌙',
        estimated_minutes: 8,
        has_sensory_issues: true,
        sensory_category: 'clothes',
        steps: [
          { id: '1', text: 'Vestir o pijama' },
          { id: '2', text: 'Escovar os dentes' },
        ],
      },
      {
        name: 'Atividade tranquila',
        icon_emoji: '🧸',
        estimated_minutes: 20,
        steps: [
          { id: '1', text: 'Escolher uma brincadeira calma' },
          { id: '2', text: 'Brincar tranquilamente' },
          { id: '3', text: 'Guardar os brinquedos ao terminar' },
        ],
      },
      {
        name: 'Hora de dormir',
        icon_emoji: '😴',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Ir para a cama' },
          { id: '2', text: 'Boa noite para a família' },
          { id: '3', text: 'Fechar os olhos' },
        ],
      },
    ],
  },

  {
    id: 'night-simple',
    name: 'Noite Simplificada',
    type: 'night',
    ageGroup: 'all',
    emoji: '💤',
    description: 'Rotina mínima para noites corridas — só o essencial para dormir bem.',
    tasks: [
      {
        name: 'Jantar',
        icon_emoji: '🍲',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'food',
        steps: [
          { id: '1', text: 'Comer o jantar' },
          { id: '2', text: 'Beber água' },
        ],
      },
      {
        name: 'Higiene noturna',
        icon_emoji: '🚿',
        estimated_minutes: 15,
        has_sensory_issues: true,
        sensory_category: 'bath',
        steps: [
          { id: '1', text: 'Tomar banho rápido' },
          { id: '2', text: 'Vestir o pijama' },
          { id: '3', text: 'Escovar os dentes' },
        ],
      },
      {
        name: 'Dormir',
        icon_emoji: '😴',
        estimated_minutes: 5,
        steps: [
          { id: '1', text: 'Ir para a cama' },
          { id: '2', text: 'Apagar a luz' },
          { id: '3', text: 'Boa noite' },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTemplatesByType(type: string): RoutineTemplate[] {
  return ROUTINE_TEMPLATES.filter((t) => t.type === type);
}

export function getTemplateById(id: string): RoutineTemplate | undefined {
  return ROUTINE_TEMPLATES.find((t) => t.id === id);
}
