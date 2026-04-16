// Canonical display names for all cities supported by the matching engine.
// Must stay in sync with MatchingCityCoordinateCatalog.cs on the backend.
// Sorted alphabetically for display.
export const SUPPORTED_CITIES = [
  "Aalborg",
  "Aabenraa",
  "Aarhus",
  "Allerød",
  "Assens",
  "Ballerup",
  "Bergen",
  "Brønderslev",
  "Copenhagen",
  "Esbjerg",
  "Faaborg",
  "Fredericia",
  "Frederiksberg",
  "Frederikshavn",
  "Gladsaxe",
  "Goteborg",
  "Gothenburg",
  "Grenå",
  "Greve",
  "Haderslev",
  "Helsingborg",
  "Helsingør",
  "Herning",
  "Hillerød",
  "Hjørring",
  "Holbæk",
  "Holstebro",
  "Horsens",
  "Hvidovre",
  "Ikast",
  "Kalundborg",
  "Kerteminde",
  "Kolding",
  "Korsør",
  "København",
  "Køge",
  "Lemvig",
  "Lyngby",
  "Malmö",
  "Middelfart",
  "Næstved",
  "Nyborg",
  "Nykøbing Falster",
  "Nykøbing Sjælland",
  "Odense",
  "Oslo",
  "Randers",
  "Ringkøbing",
  "Ringsted",
  "Roskilde",
  "Silkeborg",
  "Skanderborg",
  "Skive",
  "Slagelse",
  "Stockholm",
  "Struer",
  "Svendborg",
  "Sønderborg",
  "Taastrup",
  "Thisted",
  "Trondheim",
  "Tønder",
  "Varde",
  "Vejen",
  "Vejle",
  "Viborg",
] as const;

export type SupportedCity = (typeof SUPPORTED_CITIES)[number];

/**
 * Returns true if the given value exactly matches a supported city name
 * (case-insensitive). Users always pick from the autocomplete dropdown,
 * so this is a simple case-insensitive equality check.
 */
export function isSupportedCity(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return SUPPORTED_CITIES.some((city) => city.toLowerCase() === normalized);
}

/**
 * Returns the cities whose names start with the given query string.
 * Case-insensitive, prefix match only.
 */
export function getCitySuggestions(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  return SUPPORTED_CITIES.filter((city) =>
    city.toLowerCase().startsWith(lower),
  );
}
