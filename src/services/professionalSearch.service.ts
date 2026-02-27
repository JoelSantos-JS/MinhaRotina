import {
  buildWhatsAppUrlFromPhone,
  buildTopPlacesByCategory,
  buildProfessionalTextQuery,
  doesAddressMatchCity,
  extractCityFromLocationLabel,
  type ProfessionalCategoryResult,
  type ProfessionalPlaceResult,
  type ProfessionalSearchCategory,
} from '../utils/professionalSearch';
import {
  buildProfessionalSearchCacheKey,
  evaluateSearchRateLimit,
  type RateLimitConfig,
  type RateLimitEntry,
} from '../utils/professionalSearchPolicy';

const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_PLACES_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.nationalPhoneNumber,places.internationalPhoneNumber';
const MIN_RATING = 4;
const DEFAULT_RADIUS_METERS = 12000;
const DEFAULT_RESULTS_PER_CATEGORY = 5;
const CACHE_TTL_MS = 30 * 60 * 1000;

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequestsPerWindow: 3,
  minIntervalMs: 5_000,
};

const SEARCH_CACHE = new Map<
  string,
  { expiresAtMs: number; results: ProfessionalCategoryResult[] }
>();

const RATE_LIMIT_BY_KEY = new Map<string, RateLimitEntry>();

interface SearchCoordinates {
  latitude: number;
  longitude: number;
}

interface GoogleTextSearchPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
}

interface GoogleTextSearchResponse {
  places?: GoogleTextSearchPlace[];
}

interface SearchSingleCategoryParams {
  category: ProfessionalSearchCategory;
  apiKey: string;
  locationLabel?: string;
  coordinates?: SearchCoordinates;
  radiusMeters?: number;
}

export interface SearchProfessionalParams {
  categories: ProfessionalSearchCategory[];
  apiKey: string;
  locationLabel?: string;
  coordinates?: SearchCoordinates;
  radiusMeters?: number;
  maxPlacesPerCategory?: number;
  rateLimitKey?: string;
}

async function searchSingleCategory({
  category,
  apiKey,
  locationLabel,
  coordinates,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: SearchSingleCategoryParams): Promise<ProfessionalPlaceResult[]> {
  const textQuery = buildProfessionalTextQuery(category.id, locationLabel);
  const resolvedCity = extractCityFromLocationLabel(locationLabel);

  const body: Record<string, unknown> = {
    textQuery,
    minRating: MIN_RATING,
    maxResultCount: DEFAULT_RESULTS_PER_CATEGORY,
  };

  if (coordinates) {
    body.locationBias = {
      circle: {
        center: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        radius: radiusMeters,
      },
    };
  }

  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erro na busca do Google Places (${response.status})`);
  }

  const data = (await response.json()) as GoogleTextSearchResponse;
  const places = data.places ?? [];

  const mappedPlaces = places
    .map((place): ProfessionalPlaceResult | null => {
      const id = place.id;
      const name = place.displayName?.text;
      const mapsUrl = place.googleMapsUri;
      if (!id || !name || !mapsUrl) return null;

      const clinicPhone = place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null;
      const whatsappUrl = buildWhatsAppUrlFromPhone(
        place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null
      );

      return {
        id,
        name,
        address: place.formattedAddress ?? 'Endereco nao informado',
        rating: null,
        mapsUrl,
        clinicPhone,
        whatsappUrl,
        professionalId: category.id,
        professionalName: category.name,
      };
    })
    .filter(
      (place): place is ProfessionalPlaceResult =>
        Boolean(place && (place.clinicPhone || place.whatsappUrl))
    );

  if (!resolvedCity) return mappedPlaces;
  return mappedPlaces.filter((place) => doesAddressMatchCity(place.address, resolvedCity));
}

export async function searchProfessionalsByCategory({
  categories,
  apiKey,
  locationLabel,
  coordinates,
  radiusMeters = DEFAULT_RADIUS_METERS,
  maxPlacesPerCategory = 3,
  rateLimitKey = 'default',
}: SearchProfessionalParams): Promise<ProfessionalCategoryResult[]> {
  if (!apiKey.trim()) {
    throw new Error('Google Places API key nao configurada');
  }

  if (categories.length === 0) return [];

  const cacheKey = buildProfessionalSearchCacheKey({
    categoryIds: categories.map((category) => category.id),
    locationLabel,
    coordinates,
    radiusMeters,
    maxPerCategory: maxPlacesPerCategory,
  });
  const nowMs = Date.now();

  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && cached.expiresAtMs > nowMs) {
    return cached.results;
  }

  const rateLimitDecision = evaluateSearchRateLimit({
    nowMs,
    previousEntry: RATE_LIMIT_BY_KEY.get(rateLimitKey),
    config: RATE_LIMIT_CONFIG,
  });

  if (!rateLimitDecision.allowed) {
    const waitSeconds = Math.ceil(rateLimitDecision.retryAfterMs / 1000);
    throw new Error(
      `Voce fez muitas buscas em pouco tempo. Tente novamente em ${waitSeconds}s.`
    );
  }
  RATE_LIMIT_BY_KEY.set(rateLimitKey, rateLimitDecision.nextEntry);

  const results = await Promise.all(
    categories.map(async (category) => {
      const places = await searchSingleCategory({
        category,
        apiKey,
        locationLabel,
        coordinates,
        radiusMeters,
      });
      return [category.id, places] as const;
    })
  );

  const resultsByCategory: Record<string, ProfessionalPlaceResult[]> = {};
  for (const [categoryId, places] of results) {
    resultsByCategory[categoryId] = places;
  }

  const selected = buildTopPlacesByCategory(
    categories,
    resultsByCategory,
    maxPlacesPerCategory
  );
  SEARCH_CACHE.set(cacheKey, {
    expiresAtMs: nowMs + CACHE_TTL_MS,
    results: selected,
  });
  return selected;
}
