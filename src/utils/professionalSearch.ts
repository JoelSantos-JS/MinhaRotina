export interface ProfessionalSearchCategory {
  id: string;
  name: string;
}

export interface ProfessionalPlaceResult {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  mapsUrl: string;
  clinicPhone: string | null;
  whatsappUrl: string | null;
  professionalId: string;
  professionalName: string;
}

export interface ProfessionalCategoryResult {
  professionalId: string;
  professionalName: string;
  places: ProfessionalPlaceResult[];
}

const PROFESSIONAL_QUERY_BY_ID: Record<string, string> = {
  psicologo: 'psicologo infantil autismo ABA',
  fono: 'fonoaudiologo infantil autismo',
  nutricionista: 'nutricionista infantil seletividade alimentar autismo',
  to: 'terapeuta ocupacional integracao sensorial infantil',
  neuropediatra: 'neuropediatra infantil autismo',
  psiquiatra: 'psiquiatra infantil autismo',
  pedagogo: 'psicopedagogo autismo inclusao escolar',
};

const BRAZIL_STATE_TOKENS = new Set([
  'ac',
  'acre',
  'al',
  'alagoas',
  'ap',
  'amapa',
  'am',
  'amazonas',
  'ba',
  'bahia',
  'ce',
  'ceara',
  'df',
  'distrito federal',
  'es',
  'espirito santo',
  'go',
  'goias',
  'ma',
  'maranhao',
  'mt',
  'mato grosso',
  'ms',
  'mato grosso do sul',
  'mg',
  'minas gerais',
  'pa',
  'para',
  'pb',
  'paraiba',
  'pr',
  'parana',
  'pe',
  'pernambuco',
  'pi',
  'piaui',
  'rj',
  'rio de janeiro',
  'rn',
  'rio grande do norte',
  'rs',
  'rio grande do sul',
  'ro',
  'rondonia',
  'rr',
  'roraima',
  'sc',
  'santa catarina',
  'sp',
  'sao paulo',
  'se',
  'sergipe',
  'to',
  'tocantins',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function buildWhatsAppUrlFromPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = normalizeDigits(phone);
  if (!digits) return null;

  if (digits.length >= 12 && digits.startsWith('55')) {
    return `https://wa.me/${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }

  return null;
}

export function extractCityFromLocationLabel(locationLabel?: string): string | null {
  const trimmed = locationLabel?.trim();
  if (!trimmed) return null;
  const hasComma = trimmed.includes(',');

  const cityCandidate = trimmed.split(',')[0]?.trim();
  if (!cityCandidate) return null;

  const normalizedCity = normalizeText(cityCandidate);
  if (!normalizedCity) return null;
  if (!hasComma && BRAZIL_STATE_TOKENS.has(normalizedCity)) return null;

  return cityCandidate;
}

export function doesAddressMatchCity(address: string, city: string): boolean {
  const normalizedAddress = normalizeText(address);
  const normalizedCity = normalizeText(city);

  if (!normalizedAddress || !normalizedCity) return false;
  return normalizedAddress.includes(normalizedCity);
}

export function buildProfessionalTextQuery(
  professionalId: string,
  locationLabel?: string
): string {
  const baseQuery =
    PROFESSIONAL_QUERY_BY_ID[professionalId] ?? `${professionalId} autismo infantil`;
  const trimmedLocation = locationLabel?.trim();

  if (!trimmedLocation) return baseQuery;
  return `${baseQuery} em ${trimmedLocation}`;
}

export function pickTopUniqueResultsByCategory(
  categories: ProfessionalSearchCategory[],
  resultsByCategory: Record<string, ProfessionalPlaceResult[]>
): ProfessionalPlaceResult[] {
  const usedPlaceIds = new Set<string>();
  const picked: ProfessionalPlaceResult[] = [];

  for (const category of categories) {
    const options = resultsByCategory[category.id] ?? [];
    if (options.length === 0) continue;

    const uniqueOption = options.find((place) => !usedPlaceIds.has(place.id));
    const selected = uniqueOption ?? options[0];

    picked.push(selected);
    usedPlaceIds.add(selected.id);
  }

  return picked;
}

export function buildTopPlacesByCategory(
  categories: ProfessionalSearchCategory[],
  resultsByCategory: Record<string, ProfessionalPlaceResult[]>,
  maxPerCategory = 3
): ProfessionalCategoryResult[] {
  return categories
    .map((category) => {
      const options = resultsByCategory[category.id] ?? [];
      const seen = new Set<string>();
      const unique = options.filter((place) => {
        if (seen.has(place.id)) return false;
        seen.add(place.id);
        return true;
      });

      return {
        professionalId: category.id,
        professionalName: category.name,
        places: unique.slice(0, maxPerCategory),
      };
    })
    .filter((entry) => entry.places.length > 0);
}
