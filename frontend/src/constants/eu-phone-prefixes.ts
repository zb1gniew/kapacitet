export type EuCountryPhone = {
  code: string;
  name: string;
  prefix: string;
  minDigits: number;
  maxDigits: number;
  flag: string;
};

export const EU_PHONE_PREFIXES: readonly EuCountryPhone[] = [
  {
    code: "AT",
    name: "Austria",
    prefix: "+43",
    minDigits: 10,
    maxDigits: 11,
    flag: "🇦🇹",
  },
  {
    code: "BE",
    name: "Belgium",
    prefix: "+32",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇧🇪",
  },
  {
    code: "BG",
    name: "Bulgaria",
    prefix: "+359",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇧🇬",
  },
  {
    code: "HR",
    name: "Croatia",
    prefix: "+385",
    minDigits: 8,
    maxDigits: 9,
    flag: "🇭🇷",
  },
  {
    code: "CY",
    name: "Cyprus",
    prefix: "+357",
    minDigits: 8,
    maxDigits: 8,
    flag: "🇨🇾",
  },
  {
    code: "CZ",
    name: "Czech Republic",
    prefix: "+420",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇨🇿",
  },
  {
    code: "DK",
    name: "Denmark",
    prefix: "+45",
    minDigits: 8,
    maxDigits: 8,
    flag: "🇩🇰",
  },
  {
    code: "EE",
    name: "Estonia",
    prefix: "+372",
    minDigits: 7,
    maxDigits: 8,
    flag: "🇪🇪",
  },
  {
    code: "FI",
    name: "Finland",
    prefix: "+358",
    minDigits: 9,
    maxDigits: 10,
    flag: "🇫🇮",
  },
  {
    code: "FR",
    name: "France",
    prefix: "+33",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇫🇷",
  },
  {
    code: "DE",
    name: "Germany",
    prefix: "+49",
    minDigits: 10,
    maxDigits: 11,
    flag: "🇩🇪",
  },
  {
    code: "GR",
    name: "Greece",
    prefix: "+30",
    minDigits: 10,
    maxDigits: 10,
    flag: "🇬🇷",
  },
  {
    code: "HU",
    name: "Hungary",
    prefix: "+36",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇭🇺",
  },
  {
    code: "IE",
    name: "Ireland",
    prefix: "+353",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇮🇪",
  },
  {
    code: "IT",
    name: "Italy",
    prefix: "+39",
    minDigits: 9,
    maxDigits: 11,
    flag: "🇮🇹",
  },
  {
    code: "LV",
    name: "Latvia",
    prefix: "+371",
    minDigits: 8,
    maxDigits: 8,
    flag: "🇱🇻",
  },
  {
    code: "LT",
    name: "Lithuania",
    prefix: "+370",
    minDigits: 8,
    maxDigits: 8,
    flag: "🇱🇹",
  },
  {
    code: "LU",
    name: "Luxembourg",
    prefix: "+352",
    minDigits: 6,
    maxDigits: 9,
    flag: "🇱🇺",
  },
  {
    code: "MT",
    name: "Malta",
    prefix: "+356",
    minDigits: 8,
    maxDigits: 8,
    flag: "🇲🇹",
  },
  {
    code: "NL",
    name: "Netherlands",
    prefix: "+31",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇳🇱",
  },
  {
    code: "PL",
    name: "Poland",
    prefix: "+48",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇵🇱",
  },
  {
    code: "PT",
    name: "Portugal",
    prefix: "+351",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇵🇹",
  },
  {
    code: "RO",
    name: "Romania",
    prefix: "+40",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇷🇴",
  },
  {
    code: "SK",
    name: "Slovakia",
    prefix: "+421",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇸🇰",
  },
  {
    code: "SI",
    name: "Slovenia",
    prefix: "+386",
    minDigits: 8,
    maxDigits: 9,
    flag: "🇸🇮",
  },
  {
    code: "ES",
    name: "Spain",
    prefix: "+34",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇪🇸",
  },
  {
    code: "SE",
    name: "Sweden",
    prefix: "+46",
    minDigits: 9,
    maxDigits: 9,
    flag: "🇸🇪",
  },
] as const satisfies EuCountryPhone[];

export const DEFAULT_EU_COUNTRY = EU_PHONE_PREFIXES.find(
  (c) => c.code === "DK",
)!;

/** Parse a stored E.164 string like "+4512345678" into country + local number. */
export function parsePhoneValue(value: string): {
  country: EuCountryPhone;
  localNumber: string;
} {
  if (!value) return { country: DEFAULT_EU_COUNTRY, localNumber: "" };
  // Try longest prefix first to avoid e.g. "+3" matching "+30"
  const sorted = [...EU_PHONE_PREFIXES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const country of sorted) {
    if (value.startsWith(country.prefix)) {
      return { country, localNumber: value.slice(country.prefix.length) };
    }
  }
  return { country: DEFAULT_EU_COUNTRY, localNumber: value };
}

/** Return true when the local-number digit count is valid for the given country. */
export function isValidPhoneDigitCount(
  country: EuCountryPhone,
  localNumber: string,
): boolean {
  return (
    localNumber.length >= country.minDigits &&
    localNumber.length <= country.maxDigits
  );
}
