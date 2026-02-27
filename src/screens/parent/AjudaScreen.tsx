import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useAuthStore } from '../../stores/authStore';
import {
  createInitialCollapsedCategories,
  toggleCategoryCollapsed,
} from '../../utils/helpChecklist';
import { searchProfessionalsByCategory } from '../../services/professionalSearch.service';
import {
  extractCityFromLocationLabel,
  type ProfessionalCategoryResult,
  type ProfessionalSearchCategory,
} from '../../utils/professionalSearch';

// Types

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

// Professionals

const PROFESSIONALS: Professional[] = [
  { id: 'psicologo',      name: 'Psicologo (ABA/TEACCH)',      specialty: '-> Comportamento e rotinas' },
  { id: 'fono',           name: 'Fonoaudiologo',               specialty: '-> Questoes orais (comida, dentes)' },
  { id: 'nutricionista',  name: 'Nutricionista especializado', specialty: '-> Seletividade alimentar' },
  { id: 'to',             name: 'Terapeuta Ocupacional',       specialty: '-> Integracao sensorial e AVDs' },
  { id: 'neuropediatra',  name: 'Neuropediatra',               specialty: '-> Avaliacao medica e diagnostico' },
  { id: 'psiquiatra',     name: 'Psiquiatra infantil',         specialty: '-> Medicacao e comportamentos extremos' },
  { id: 'pedagogo',       name: 'Pedagogo especializado',      specialty: '-> Aprendizagem e inclusao escolar' },
];

const ALL_PROFS = ['psicologo', 'fono', 'nutricionista', 'to', 'neuropediatra', 'psiquiatra', 'pedagogo'];
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

function resolveCityFromReverseGeocode(
  geocode: Location.LocationGeocodedAddress | undefined
): string | null {
  if (!geocode) return null;

  const cityLikeValues = [geocode.city, geocode.subregion, geocode.district].filter(
    (value): value is string => Boolean(value?.trim())
  );

  for (const candidate of cityLikeValues) {
    const city = extractCityFromLocationLabel(candidate);
    if (city) return city;
  }

  return null;
}

function formatLocationLabel(city: string, region?: string | null): string {
  const trimmedRegion = region?.trim();
  if (!trimmedRegion) return city;
  return `${city}, ${trimmedRegion}`;
}

function toTelUrl(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

// Categories with expandable items + "Outros"

const CATEGORIES: SymptomCategory[] = [
  {
    id: 'rotinas',
    emoji: 'R',
    title: 'ROTINAS EXTREMAMENTE RIGIDAS',
    items: [
      { id: 'r1', label: 'Crise severa com minima mudanca na rotina',      professionals: ['psicologo', 'to'] },
      { id: 'r2', label: 'Impossivel sair de casa sem crise',               professionals: ['psicologo', 'neuropediatra'] },
      { id: 'r3', label: 'Rituais consomem horas do dia',                   professionals: ['psicologo'] },
      { id: 'r4', label: 'Insiste em percursos ou trajetos identicos',      professionals: ['psicologo', 'to'] },
      { id: 'r5', label: 'Objetos precisam estar sempre no mesmo lugar',    professionals: ['psicologo'] },
      { id: 'r6', label: 'Resistencia extrema a qualquer novidade',         professionals: ['psicologo', 'neuropediatra'] },
      { id: 'r7', label: 'Outros comportamentos de rigidez',                professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'sensorial',
    emoji: 'S',
    title: 'QUESTOES SENSORIAIS GRAVES',
    items: [
      { id: 's1', label: 'Meltdowns diarios ou quase diarios',              professionals: ['psicologo', 'to', 'neuropediatra'] },
      { id: 's2', label: 'Evita 90%+ dos alimentos (risco nutricional)',    professionals: ['fono', 'nutricionista', 'neuropediatra'] },
      { id: 's3', label: 'Nao tolera toque (dificulta cuidados)',           professionals: ['to', 'psicologo'] },
      { id: 's4', label: 'Auto-lesao quando sobrecarregada',                professionals: ['psicologo', 'psiquiatra', 'neuropediatra'] },
      { id: 's5', label: 'Hipersensibilidade extrema a sons',               professionals: ['to', 'neuropediatra'] },
      { id: 's6', label: 'Nao tolera roupas, etiquetas ou tecidos',         professionals: ['to', 'psicologo'] },
      { id: 's7', label: 'Busca sensorial intensa (bate cabeca, morde)',    professionals: ['to', 'psicologo', 'neuropediatra'] },
      { id: 's8', label: 'Outros comportamentos sensoriais',                professionals: ['to', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'comunicacao',
    emoji: 'C',
    title: 'COMUNICACAO E LINGUAGEM',
    items: [
      { id: 'c1', label: 'Nao fala ou perdeu palavras que ja sabia',         professionals: ['fono', 'neuropediatra'] },
      { id: 'c2', label: 'Nao responde ao proprio nome',                     professionals: ['fono', 'neuropediatra'] },
      { id: 'c3', label: 'Dificuldade severa para se expressar',            professionals: ['fono', 'psicologo'] },
      { id: 'c4', label: 'Repete frases fora de contexto (ecolalia)',       professionals: ['fono', 'psicologo'] },
      { id: 'c5', label: 'Nao aponta para objetos ou pessoas',               professionals: ['fono', 'neuropediatra'] },
      { id: 'c6', label: 'Comunicacao unidirecional (nao espera resposta)',  professionals: ['fono', 'psicologo'] },
      { id: 'c7', label: 'Outros problemas de comunicacao',                  professionals: ['fono', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'comportamento',
    emoji: 'B',
    title: 'COMPORTAMENTOS DESAFIADORES',
    items: [
      { id: 'b1', label: 'Agressividade frequente e intensa',               professionals: ['psicologo', 'psiquiatra'] },
      { id: 'b2', label: 'Hiperatividade extrema sem controle',             professionals: ['neuropediatra', 'psicologo'] },
      { id: 'b3', label: 'Nao consegue ficar em escola ou creche',          professionals: ['psicologo', 'pedagogo', 'to'] },
      { id: 'b4', label: 'Movimentos repetitivos muito intensos (stimming)',professionals: ['to', 'psicologo'] },
      { id: 'b5', label: 'Ausencia de contato visual',                      professionals: ['psicologo', 'neuropediatra'] },
      { id: 'b6', label: 'Birras extremas com duracao superior a 30 min',   professionals: ['psicologo', 'neuropediatra'] },
      { id: 'b7', label: 'Nao imita gestos ou brincadeiras simples',        professionals: ['psicologo', 'fono'] },
      { id: 'b8', label: 'Outros comportamentos desafiadores',              professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'social',
    emoji: 'I',
    title: 'INTERACAO SOCIAL',
    items: [
      { id: 'so1', label: 'Nao brinca com outras criancas',                  professionals: ['psicologo', 'to'] },
      { id: 'so2', label: 'Indiferenca total a pessoas ao redor',            professionals: ['psicologo', 'neuropediatra'] },
      { id: 'so3', label: 'Nao compartilha atencao ou interesse',            professionals: ['psicologo', 'fono'] },
      { id: 'so4', label: 'Nao demonstra afeto a familiares proximos',       professionals: ['psicologo', 'neuropediatra'] },
      { id: 'so5', label: 'Prefere brincar sempre sozinha',                 professionals: ['psicologo'] },
      { id: 'so6', label: 'Outros problemas de interacao social',            professionals: ['psicologo', 'neuropediatra'], isOther: true },
    ],
  },
  {
    id: 'sono_alim',
    emoji: 'N',
    title: 'SONO E ALIMENTACAO',
    items: [
      { id: 'sl1', label: 'Insonia severa quase toda noite',                professionals: ['neuropediatra', 'psicologo'] },
      { id: 'sl2', label: 'Come menos de 5 alimentos diferentes',           professionals: ['nutricionista', 'fono'] },
      { id: 'sl3', label: 'Recusa total e absoluta a novos alimentos',      professionals: ['fono', 'nutricionista', 'psicologo'] },
      { id: 'sl4', label: 'Acorda varias vezes por noite chorando',         professionals: ['neuropediatra'] },
      { id: 'sl5', label: 'Dificuldades de mastigacao ou degluticao',       professionals: ['fono', 'nutricionista'] },
      { id: 'sl6', label: 'Recusa alimentacao que nao seja de uma marca',   professionals: ['fono', 'nutricionista', 'psicologo'] },
      { id: 'sl7', label: 'Outros problemas de sono ou alimentacao',        professionals: ['neuropediatra', 'nutricionista'], isOther: true },
    ],
  },
  {
    id: 'desenvolvimento',
    emoji: 'D',
    title: 'DESENVOLVIMENTO GERAL',
    items: [
      { id: 'd1', label: 'Regressao de habilidades ja conquistadas',         professionals: ['neuropediatra', 'psicologo'] },
      { id: 'd2', label: 'Atraso significativo em relacao a idade',          professionals: ['neuropediatra', 'pedagogo'] },
      { id: 'd3', label: 'Nao faz atividades de vida diaria da sua idade',   professionals: ['to', 'psicologo'] },
      { id: 'd4', label: 'Dificuldade extrema de aprendizagem escolar',     professionals: ['pedagogo', 'neuropediatra', 'psicologo'] },
      { id: 'd5', label: 'Nao controla esfincteres na idade esperada',       professionals: ['neuropediatra', 'psicologo'] },
      { id: 'd6', label: 'Outros atrasos de desenvolvimento',               professionals: ALL_PROFS, isOther: true },
    ],
  },
];

// Components

const CheckItem = memo(function CheckItem({
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
        {checked && <Text style={styles.checkboxTick}>x</Text>}
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
});

const ProfessionalRow = memo(function ProfessionalRow({ professional }: { professional: Professional }) {
  return (
    <View style={styles.profRow}>
      <View style={styles.profCheck}>
        <Text style={styles.profCheckIcon}>x</Text>
      </View>
      <View style={styles.profInfo}>
        <Text style={styles.profName}>{professional.name}</Text>
        <Text style={styles.profSpecialty}>{professional.specialty}</Text>
      </View>
    </View>
  );
});

const CategoryCard = memo(function CategoryCard({
  category,
  checked,
  onToggle,
  collapsed,
  checkedSignature,
  onToggleCollapsed,
}: {
  category: SymptomCategory;
  checked: Set<string>;
  onToggle: (id: string) => void;
  collapsed: boolean;
  checkedSignature: string;
  onToggleCollapsed: () => void;
}) {
  const checkedCount = category.items.filter((i) => checked.has(i.id)).length;

  return (
    <View style={styles.categoryCard}>
      {/* Cabecalho clicavel para recolher */}
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
          <Text style={styles.collapseIcon}>{collapsed ? '>' : 'v'}</Text>
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
}, (prev, next) => {
  return (
    prev.category.id === next.category.id &&
    prev.collapsed === next.collapsed &&
    prev.checkedSignature === next.checkedSignature
  );
});

const SearchResultsSkeleton = memo(function SearchResultsSkeleton() {
  return (
    <View style={styles.resultsCard}>
      <Text style={styles.resultsTitle}>Buscando melhores profissionais...</Text>
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <View key={`skeleton-group-${groupIndex}`} style={styles.resultGroup}>
          <View style={styles.skeletonGroupTitle} />
          {Array.from({ length: 3 }).map((__, itemIndex) => (
            <View key={`skeleton-item-${groupIndex}-${itemIndex}`} style={styles.skeletonItem}>
              <View style={styles.skeletonLinePrimary} />
              <View style={styles.skeletonLineSecondary} />
              <View style={styles.skeletonLineLink} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

// Main screen

export const AjudaScreen: React.FC = () => {
  const parent = useAuthStore((state) => state.parent);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [collapsedByCategory, setCollapsedByCategory] = useState(() =>
    createInitialCollapsedCategories(CATEGORIES.map((c) => c.id))
  );
  const [locationLabel, setLocationLabel] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ProfessionalCategoryResult[]>([]);
  const [missingProfessionals, setMissingProfessionals] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
  const checkedSignatureByCategory = useMemo(() => {
    const signatures: Record<string, string> = {};
    for (const category of CATEGORIES) {
      signatures[category.id] = category.items
        .map((item) => item.id)
        .filter((id) => checked.has(id))
        .join('|');
    }
    return signatures;
  }, [checked]);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    setSearchMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setSearchMessage('Permissao de localizacao negada. Informe sua cidade manualmente.');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setCoordinates(nextCoordinates);

      const geocode = await Location.reverseGeocodeAsync(nextCoordinates);
      const first = geocode[0];
      const city = resolveCityFromReverseGeocode(first);
      if (!city) {
        setSearchMessage('Nao foi possivel identificar sua cidade. Digite a cidade manualmente.');
        return;
      }

      setLocationLabel(formatLocationLabel(city, first?.region));
    } catch {
      setSearchMessage('Nao foi possivel obter sua localizacao atual.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleBuscar = async () => {
    if (!GOOGLE_PLACES_API_KEY) {
      setSearchMessage('Configure EXPO_PUBLIC_GOOGLE_PLACES_API_KEY para buscar profissionais.');
      return;
    }

    const categories: ProfessionalSearchCategory[] = recommendedProfs.map((professional) => ({
      id: professional.id,
      name: professional.name,
    }));

    if (categories.length === 0) {
      setSearchMessage('Marque pelo menos um sinal para gerar recomendacoes.');
      return;
    }

    const resolvedCity = extractCityFromLocationLabel(locationLabel);
    if (!resolvedCity) {
      setSearchMessage('Informe a cidade da pessoa para buscar na area correta. Ex: Jequie, BA.');
      return;
    }

    setIsSearching(true);
    setSearchMessage(null);
    setSearchResults([]);
    setMissingProfessionals([]);

    try {
      let searchCoordinates = coordinates ?? undefined;
      if (!searchCoordinates) {
        const geocoded = await Location.geocodeAsync(resolvedCity);
        const first = geocoded[0];
        if (first) {
          searchCoordinates = {
            latitude: first.latitude,
            longitude: first.longitude,
          };
          setCoordinates(searchCoordinates);
        }
      }

      const results = await searchProfessionalsByCategory({
        categories,
        apiKey: GOOGLE_PLACES_API_KEY,
        locationLabel: resolvedCity,
        coordinates: searchCoordinates,
        maxPlacesPerCategory: 3,
        rateLimitKey: parent?.id ?? 'anonymous-parent',
      });

      const totalPlaces = results.reduce((acc, group) => acc + group.places.length, 0);
      const foundIds = new Set(results.map((group) => group.professionalId));
      const missing = categories
        .filter((category) => !foundIds.has(category.id))
        .map((category) => category.name);

      setMissingProfessionals(missing);

      if (totalPlaces === 0) {
        setSearchMessage(
          `Nao conseguimos achar profissionais com telefone/WhatsApp na area de ${resolvedCity}.`
        );
        return;
      }

      setSearchResults(results);
      if (missing.length > 0) {
        setSearchMessage(
          `${totalPlaces} opcoes encontradas em ${results.length} categorias. ${missing.length} profissional(is) nao encontrado(s) na area.`
        );
      } else {
        setSearchMessage(
          `${totalPlaces} opcoes encontradas em ${results.length} categorias de profissionais.`
        );
      }
    } catch (e: unknown) {
      setSearchMessage(e instanceof Error ? e.message : 'Erro ao buscar profissionais.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLimpar = useCallback(() => {
    setChecked(new Set());
    setSearchResults([]);
    setMissingProfessionals([]);
    setSearchMessage(null);
  }, []);
  const handleToggleCategory = useCallback((categoryId: string) => {
    setCollapsedByCategory((prev) => toggleCategoryCollapsed(prev, categoryId));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Quando Buscar Ajuda?</Text>
              <Text style={styles.headerSub}>Marque os sinais que sua crianca apresenta</Text>
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
            <Text style={styles.introEmoji}>i</Text>
            <Text style={styles.introText}>
              Selecione os comportamentos observados. Toque no titulo de cada categoria para expandir/recolher. O app indica os profissionais adequados.
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
              checkedSignature={checkedSignatureByCategory[cat.id] ?? ''}
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
            <Text style={styles.warningEmoji}>!</Text>
            <Text style={styles.warningText}>
              Este checklist e orientativo e nao substitui avaliacao medica. Consulte sempre um especialista para diagnostico preciso.
            </Text>
          </View>

          {/* Localizacao da busca */}
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Localizacao da busca</Text>
            <Text style={styles.locationHint}>
              Use sua localizacao atual ou informe a cidade da pessoa.
            </Text>
            <TextInput
              style={styles.locationInput}
              value={locationLabel}
              onChangeText={(value) => {
                setLocationLabel(value);
                setCoordinates(null);
              }}
              placeholder="Ex: Jequie, BA"
              placeholderTextColor={BlueyColors.textPlaceholder}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={getCurrentLocation}
              disabled={isLocating}
              activeOpacity={0.85}
            >
              <Text style={styles.locationBtnText}>
                {isLocating ? 'Obtendo localizacao...' : 'Usar localizacao atual'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botao buscar */}
          <TouchableOpacity
            style={styles.buscarBtn}
            onPress={handleBuscar}
            activeOpacity={0.85}
            disabled={isSearching}
          >
            <LinearGradient
              colors={['#88CAFC', '#64B5F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buscarGradient}
            >
              <Text style={styles.buscarText}>
                {isSearching ? 'BUSCANDO...' : 'BUSCAR PROFISSIONAIS (NOTA 4+)'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {searchMessage ? <Text style={styles.searchMessage}>{searchMessage}</Text> : null}

          {isSearching && <SearchResultsSkeleton />}

          {!isSearching && missingProfessionals.length > 0 && (
            <View style={styles.missingCard}>
              <Text style={styles.missingTitle}>Profissionais nao encontrados na area</Text>
              {missingProfessionals.map((name) => (
                <Text key={name} style={styles.missingItem}>
                  - {name}
                </Text>
              ))}
            </View>
          )}

          {!isSearching && searchResults.length > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Top 3 por profissional</Text>
              {searchResults.map((group) => (
                <View key={group.professionalId} style={styles.resultGroup}>
                  <Text style={styles.resultGroupTitle}>{group.professionalName}</Text>
                  {group.places.map((result, index) => (
                    <View key={`${result.professionalId}-${result.id}-${index}`} style={styles.resultItem}>
                      <Text style={styles.resultName}>
                        {index + 1}. {result.name}
                      </Text>
                      <Text style={styles.resultMeta}>Nota minima 4+ - {result.address}</Text>
                      {result.clinicPhone ? (
                        <Text style={styles.resultContact}>Telefone: {result.clinicPhone}</Text>
                      ) : null}

                      <View style={styles.resultActionsRow}>
                        {result.clinicPhone ? (
                          <TouchableOpacity
                            style={styles.resultActionButton}
                            onPress={() => Linking.openURL(toTelUrl(result.clinicPhone ?? ''))}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.resultActionText}>Ligar</Text>
                          </TouchableOpacity>
                        ) : null}

                        {result.whatsappUrl ? (
                          <TouchableOpacity
                            style={styles.resultActionButton}
                            onPress={() => Linking.openURL(result.whatsappUrl ?? '')}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.resultActionText}>WhatsApp</Text>
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                          style={styles.resultActionButton}
                          onPress={() => Linking.openURL(result.mapsUrl)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.resultActionText}>Maps</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Styles

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

  // Categories
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

  // Items
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

  // Professionals
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

  // Warning
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

  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
    padding: 14,
    marginBottom: 12,
  },
  locationTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
  },
  locationHint: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  locationBtn: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BlueyColors.blueyMain,
    paddingVertical: 10,
    alignItems: 'center',
  },
  locationBtnText: {
    ...Typography.labelSmall,
    color: BlueyColors.blueyDark,
  },

  // Search button
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
  searchMessage: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  missingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BlueyColors.borderMedium,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  missingTitle: {
    ...Typography.labelMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 6,
  },
  missingItem: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginBottom: 2,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  resultsTitle: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  resultGroup: {
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
  },
  resultGroupTitle: {
    ...Typography.labelMedium,
    color: BlueyColors.blueyDark,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  resultItem: {
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
  },
  resultName: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    fontSize: 14,
  },
  resultMeta: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  resultContact: {
    ...Typography.bodySmall,
    color: BlueyColors.textPrimary,
    marginTop: 2,
  },
  resultActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  resultActionButton: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderWidth: 1,
    borderColor: BlueyColors.blueyMain,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultActionText: {
    ...Typography.labelSmall,
    color: BlueyColors.blueyDark,
  },
  skeletonGroupTitle: {
    height: 14,
    borderRadius: 7,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    width: '48%',
    backgroundColor: BlueyColors.borderLight,
  },
  skeletonItem: {
    borderTopWidth: 1,
    borderTopColor: BlueyColors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  skeletonLinePrimary: {
    height: 14,
    borderRadius: 7,
    width: '82%',
    backgroundColor: BlueyColors.borderLight,
  },
  skeletonLineSecondary: {
    height: 12,
    borderRadius: 6,
    width: '94%',
    backgroundColor: BlueyColors.borderMedium,
  },
  skeletonLineLink: {
    height: 11,
    borderRadius: 6,
    width: '30%',
    backgroundColor: BlueyColors.backgroundBlue,
  },
});


