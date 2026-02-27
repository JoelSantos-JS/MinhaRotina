import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import {
  createInitialCollapsedCategories,
  toggleCategoryCollapsed,
} from '../../utils/helpChecklist';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SymptomItem {
  id: string;
  label: string;
  professionals: string[];
  isOther?: boolean;
}

interface SymptomCategory {
  id: string;
  title: string;
  emoji: string;
  items: SymptomItem[];
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

// ─── Profissionais ────────────────────────────────────────────────────────────

const PROFESSIONALS: Professional[] = [
  { id: 'psicologo',      name: 'Psicólogo (ABA/TEACCH)',      specialty: '→ Comportamento e rotinas' },
  { id: 'fono',           name: 'Fonoaudiólogo',                specialty: '→ Questões orais (comida, dentes)' },
  { id: 'nutricionista',  name: 'Nutricionista especializado',  specialty: '→ Seletividade alimentar' },
  { id: 'to',             name: 'Terapeuta Ocupacional',        specialty: '→ Integração sensorial e AVDs' },
  { id: 'neuropediatra',  name: 'Neuropediatra',                specialty: '→ Avaliação médica e diagnóstico' },
  { id: 'psiquiatra',     name: 'Psiquiatra infantil',          specialty: '→ Medicação e comportamentos extremos' },
  { id: 'pedagogo',       name: 'Pedagogo especializado',       specialty: '→ Aprendizagem e inclusão escolar' },
];

const ALL_PROFS = ['psicologo', 'fono', 'nutricionista', 'to', 'neuropediatra', 'psiquiatra', 'pedagogo'];

// ─── Categorias com itens expandidos + "Outros" ────────────────────────────────

const CATEGORIES: SymptomCategory[] = [
  {
    id: 'rotinas',
    emoji: '🔄',
    title: 'ROTINAS EXTREMAMENTE RÍGIDAS',
    items: [
      { id: 'r1', label: 'Crise severa com mínima mudança na rotina',      professionals: ['psicologo', 'to'] },
      { id: 'r2', label: 'Impossível sair de casa sem crise',               professionals: ['psicologo', 'neuropediatra'] },
      { id: 'r3', label: 'Rituais consomem horas do dia',                   professionals: ['psicologo'] },
      { id: 'r4', label: 'Insiste em percursos ou trajetos idênticos',      professionals: ['psicologo', 'to'] },
      { id: 'r5', label: 'Objetos precisam estar sempre no mesmo lugar',    professionals: ['psicologo'] },
      { id: 'r6', label: 'Resistência extrema a qualquer novidade',         professionals: ['psicologo', 'neuropediatra'] },
      { id: 'r7', label: 'Outros comportamentos de rigidez',                professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'sensorial',
    emoji: '⚡',
    title: 'QUESTÕES SENSORIAIS GRAVES',
    items: [
      { id: 's1', label: 'Meltdowns diários ou quase diários',              professionals: ['psicologo', 'to', 'neuropediatra'] },
      { id: 's2', label: 'Evita 90%+ dos alimentos (risco nutricional)',    professionals: ['fono', 'nutricionista', 'neuropediatra'] },
      { id: 's3', label: 'Não tolera toque (dificulta cuidados)',           professionals: ['to', 'psicologo'] },
      { id: 's4', label: 'Auto-lesão quando sobrecarregada',                professionals: ['psicologo', 'psiquiatra', 'neuropediatra'] },
      { id: 's5', label: 'Hipersensibilidade extrema a sons',               professionals: ['to', 'neuropediatra'] },
      { id: 's6', label: 'Não tolera roupas, etiquetas ou tecidos',         professionals: ['to', 'psicologo'] },
      { id: 's7', label: 'Busca sensorial intensa (bate cabeça, morde)',    professionals: ['to', 'psicologo', 'neuropediatra'] },
      { id: 's8', label: 'Outros comportamentos sensoriais',                professionals: ['to', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'comunicacao',
    emoji: '💬',
    title: 'COMUNICAÇÃO E LINGUAGEM',
    items: [
      { id: 'c1', label: 'Não fala ou perdeu palavras que já sabia',        professionals: ['fono', 'neuropediatra'] },
      { id: 'c2', label: 'Não responde ao próprio nome',                    professionals: ['fono', 'neuropediatra'] },
      { id: 'c3', label: 'Dificuldade severa para se expressar',            professionals: ['fono', 'psicologo'] },
      { id: 'c4', label: 'Repete frases fora de contexto (ecolalia)',       professionals: ['fono', 'psicologo'] },
      { id: 'c5', label: 'Não aponta para objetos ou pessoas',              professionals: ['fono', 'neuropediatra'] },
      { id: 'c6', label: 'Comunicação unidirecional (não espera resposta)', professionals: ['fono', 'psicologo'] },
      { id: 'c7', label: 'Outros problemas de comunicação',                 professionals: ['fono', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'comportamento',
    emoji: '🌪️',
    title: 'COMPORTAMENTOS DESAFIADORES',
    items: [
      { id: 'b1', label: 'Agressividade frequente e intensa',               professionals: ['psicologo', 'psiquiatra'] },
      { id: 'b2', label: 'Hiperatividade extrema sem controle',             professionals: ['neuropediatra', 'psicologo'] },
      { id: 'b3', label: 'Não consegue ficar em escola ou creche',          professionals: ['psicologo', 'pedagogo', 'to'] },
      { id: 'b4', label: 'Movimentos repetitivos muito intensos (stimming)',professionals: ['to', 'psicologo'] },
      { id: 'b5', label: 'Ausência de contato visual',                      professionals: ['psicologo', 'neuropediatra'] },
      { id: 'b6', label: 'Birras extremas com duração superior a 30 min',  professionals: ['psicologo', 'neuropediatra'] },
      { id: 'b7', label: 'Não imita gestos ou brincadeiras simples',        professionals: ['psicologo', 'fono'] },
      { id: 'b8', label: 'Outros comportamentos desafiadores',              professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'social',
    emoji: '👥',
    title: 'INTERAÇÃO SOCIAL',
    items: [
      { id: 'so1', label: 'Não brinca com outras crianças',                 professionals: ['psicologo', 'to'] },
      { id: 'so2', label: 'Indiferença total a pessoas ao redor',           professionals: ['psicologo', 'neuropediatra'] },
      { id: 'so3', label: 'Não compartilha atenção ou interesse',           professionals: ['psicologo', 'fono'] },
      { id: 'so4', label: 'Não demonstra afeto a familiares próximos',      professionals: ['psicologo', 'neuropediatra'] },
      { id: 'so5', label: 'Prefere brincar sempre sozinha',                 professionals: ['psicologo'] },
      { id: 'so6', label: 'Outros problemas de interação social',           professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'sono_alim',
    emoji: '🌙',
    title: 'SONO E ALIMENTAÇÃO',
    items: [
      { id: 'sl1', label: 'Insônia severa quase toda noite',                professionals: ['neuropediatra', 'psicologo'] },
      { id: 'sl2', label: 'Come menos de 5 alimentos diferentes',           professionals: ['nutricionista', 'fono'] },
      { id: 'sl3', label: 'Recusa total e absoluta a novos alimentos',      professionals: ['fono', 'nutricionista', 'psicologo'] },
      { id: 'sl4', label: 'Acorda várias vezes por noite chorando',         professionals: ['neuropediatra'] },
      { id: 'sl5', label: 'Dificuldades de mastigação ou deglutição',       professionals: ['fono', 'nutricionista'] },
      { id: 'sl6', label: 'Recusa alimentação que não seja de uma marca',   professionals: ['fono', 'nutricionista', 'psicologo'] },
      { id: 'sl7', label: 'Outros problemas de sono ou alimentação',        professionals: ['neuropediatra', 'nutricionista'], isOther: true },
    ],
  },
  {
    id: 'desenvolvimento',
    emoji: '📈',
    title: 'DESENVOLVIMENTO GERAL',
    items: [
      { id: 'd1', label: 'Regressão de habilidades já conquistadas',        professionals: ['neuropediatra', 'psicologo'] },
      { id: 'd2', label: 'Atraso significativo em relação à idade',         professionals: ['neuropediatra', 'pedagogo'] },
      { id: 'd3', label: 'Não faz atividades de vida diária da sua idade',  professionals: ['to', 'psicologo'] },
      { id: 'd4', label: 'Dificuldade extrema de aprendizagem escolar',     professionals: ['pedagogo', 'neuropediatra', 'psicologo'] },
      { id: 'd5', label: 'Não controla esfíncteres na idade esperada',      professionals: ['neuropediatra', 'psicologo'] },
      { id: 'd6', label: 'Outros atrasos de desenvolvimento',               professionals: ALL_PROFS, isOther: true },
    ],
  },
];

// ─── Componentes ──────────────────────────────────────────────────────────────

function CheckItem({
  label,
  checked,
  onToggle,
  isOther,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  isOther?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.checkItem, isOther && styles.checkItemOther]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <Text style={[
        styles.checkLabel,
        checked && styles.checkLabelChecked,
        isOther && styles.checkLabelOther,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProfessionalRow({ professional }: { professional: Professional }) {
  return (
    <View style={styles.profRow}>
      <View style={styles.profCheck}>
        <Text style={styles.profCheckIcon}>✓</Text>
      </View>
      <View style={styles.profInfo}>
        <Text style={styles.profName}>{professional.name}</Text>
        <Text style={styles.profSpecialty}>{professional.specialty}</Text>
      </View>
    </View>
  );
}

function CategoryCard({
  category,
  checked,
  onToggle,
  collapsed,
  onToggleCollapsed,
}: {
  category: SymptomCategory;
  checked: Set<string>;
  onToggle: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const checkedCount = category.items.filter((i) => checked.has(i.id)).length;

  return (
    <View style={styles.categoryCard}>
      {/* Cabeçalho clicável para recolher */}
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={onToggleCollapsed}
        activeOpacity={0.8}
      >
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <View style={styles.categoryRight}>
          {checkedCount > 0 && (
            <View style={styles.checkedBadge}>
              <Text style={styles.checkedBadgeText}>{checkedCount}</Text>
            </View>
          )}
          <Text style={styles.collapseIcon}>{collapsed ? '▶' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Itens */}
      {!collapsed && category.items.map((item) => (
        <CheckItem
          key={item.id}
          label={item.label}
          checked={checked.has(item.id)}
          onToggle={() => onToggle(item.id)}
          isOther={item.isOther}
        />
      ))}
    </View>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────

export const AjudaScreen: React.FC = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [collapsedByCategory, setCollapsedByCategory] = useState(() =>
    createInitialCollapsedCategories(CATEGORIES.map((c) => c.id))
  );

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recommendedProfIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of CATEGORIES) {
      for (const item of cat.items) {
        if (checked.has(item.id)) {
          item.professionals.forEach((p) => ids.add(p));
        }
      }
    }
    return ids;
  }, [checked]);

  const recommendedProfs = PROFESSIONALS.filter((p) => recommendedProfIds.has(p.id));
  const totalChecked = checked.size;

  const handleBuscar = () => {
    Linking.openURL('https://www.google.com/search?q=profissionais+autismo+perto+de+mim');
  };

  const handleLimpar = () => setChecked(new Set());
  const handleToggleCategory = (categoryId: string) => {
    setCollapsedByCategory((prev) => toggleCategoryCollapsed(prev, categoryId));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Quando Buscar Ajuda?</Text>
              <Text style={styles.headerSub}>Marque os sinais que sua criança apresenta</Text>
            </View>
            {totalChecked > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleLimpar}>
                <Text style={styles.clearBtnText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contador */}
          {totalChecked > 0 && (
            <View style={styles.counterRow}>
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>{totalChecked} sinais marcados</Text>
              </View>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <View style={styles.introBanner}>
            <Text style={styles.introEmoji}>🔍</Text>
            <Text style={styles.introText}>
              Selecione os comportamentos observados. Toque no título de cada categoria para expandir/recolher. O app indica os profissionais adequados.
            </Text>
          </View>

          {/* Categorias */}
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              checked={checked}
              onToggle={toggle}
              collapsed={collapsedByCategory[cat.id] ?? true}
              onToggleCollapsed={() => handleToggleCategory(cat.id)}
            />
          ))}

          {/* Profissionais recomendados */}
          {recommendedProfs.length > 0 && (
            <View style={styles.profsCard}>
              <View style={styles.profsHeader}>
                <Text style={styles.profsTitle}>Profissionais Indicados</Text>
                <View style={styles.profsBadge}>
                  <Text style={styles.profsBadgeText}>{recommendedProfs.length}</Text>
                </View>
              </View>
              <Text style={styles.profsSub}>
                Com base nos {totalChecked} sinais marcados:
              </Text>
              {recommendedProfs.map((p) => (
                <ProfessionalRow key={p.id} professional={p} />
              ))}
            </View>
          )}

          {/* Aviso */}
          <View style={styles.warningBox}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.warningText}>
              Este checklist é orientativo e não substitui avaliação médica. Consulte sempre um especialista para diagnóstico preciso.
            </Text>
          </View>

          {/* Botão buscar */}
          <TouchableOpacity style={styles.buscarBtn} onPress={handleBuscar} activeOpacity={0.85}>
            <LinearGradient
              colors={['#88CAFC', '#64B5F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buscarGradient}
            >
              <Text style={styles.buscarIcon}>🔎</Text>
              <Text style={styles.buscarText}>BUSCAR PROFISSIONAIS NA REGIÃO</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 16 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
  },
  headerSub: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: BlueyColors.borderLight,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    ...Typography.labelSmall,
    color: BlueyColors.textSecondary,
    fontSize: 12,
  },
  counterRow: {
    marginTop: 8,
  },
  counterPill: {
    alignSelf: 'flex-start',
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  counterText: {
    ...Typography.labelSmall,
    color: '#fff',
    fontSize: 12,
  },

  content: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    gap: 12,
  },
  introEmoji: { fontSize: 26 },
  introText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // ── Categorias ──
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF8F4',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE8D6',
    gap: 8,
  },
  categoryEmoji: { fontSize: 18 },
  categoryTitle: {
    ...Typography.labelSmall,
    color: BlueyColors.alertOrange,
    fontSize: 11,
    letterSpacing: 0.6,
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkedBadge: {
    backgroundColor: BlueyColors.blueyMain,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
  },
  collapseIcon: {
    fontSize: 10,
    color: BlueyColors.textSecondary,
  },

  // ── Itens ──
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    gap: 12,
  },
  checkItemOther: {
    backgroundColor: '#FAFAFA',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BlueyColors.blueyMain,
    borderColor: BlueyColors.blueyMain,
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    marginTop: -1,
  },
  checkLabel: {
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    flex: 1,
    lineHeight: 19,
  },
  checkLabelChecked: {
    color: BlueyColors.blueyDark,
    fontFamily: 'Nunito_700Bold',
  },
  checkLabelOther: {
    color: BlueyColors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Profissionais ──
  profsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BlueyColors.blueyGreen,
    marginBottom: 12,
    padding: 14,
  },
  profsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profsTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    flex: 1,
  },
  profsBadge: {
    backgroundColor: BlueyColors.blueyGreen,
    borderRadius: 12,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profsBadgeText: {
    ...Typography.labelSmall,
    color: '#fff',
    fontSize: 12,
  },
  profsSub: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginBottom: 12,
  },
  profRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    gap: 12,
  },
  profCheck: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BlueyColors.successGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profCheckIcon: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Nunito_900Black',
  },
  profInfo: { flex: 1 },
  profName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    fontSize: 14,
  },
  profSpecialty: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 1,
  },

  // ── Aviso ──
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BlueyColors.backgroundYellow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: BlueyColors.bingoMain,
  },
  warningEmoji: { fontSize: 18, marginTop: 1 },
  warningText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // ── Botão buscar ──
  buscarBtn: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  buscarGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buscarIcon: { fontSize: 20 },
  buscarText: {
    ...Typography.labelMedium,
    color: '#fff',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
