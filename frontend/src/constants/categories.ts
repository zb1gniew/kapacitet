export const COMPANY_CATEGORIES = [
  "scaffolding",
  "construction",
  "renovation",
  "demolition",
  "carpentry",
  "roofing",
  "painting",
  "plumbing",
  "electrical",
  "hvac",
  "flooring",
  "tiling",
  "gardening",
  "landscaping",
  "cleaning",
  "facility_services",
  "logistics",
  "moving",
  "insulation",
  "glass_installation",
  "metal_work",
  "concrete_work",
  "interior_finishing",
] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export const MAX_CATEGORIES = 3;

/** English label for each category key — also used as the i18n translation key. */
export const CATEGORY_LABELS: Record<CompanyCategory, string> = {
  scaffolding: "Scaffolding",
  construction: "Construction",
  renovation: "Renovation",
  demolition: "Demolition",
  carpentry: "Carpentry",
  roofing: "Roofing",
  painting: "Painting",
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  flooring: "Flooring",
  tiling: "Tiling",
  gardening: "Gardening",
  landscaping: "Landscaping",
  cleaning: "Cleaning",
  facility_services: "Facility Services",
  logistics: "Logistics",
  moving: "Moving",
  insulation: "Insulation",
  glass_installation: "Glass Installation",
  metal_work: "Metalwork",
  concrete_work: "Concrete Work",
  interior_finishing: "Interior Finishing",
};

const CATEGORY_LABEL_ALIASES: Record<string, string> = {
  glass_insitallation: "Glass Installation",
};

export function getCategoryLabel(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory in CATEGORY_LABELS) {
    return CATEGORY_LABELS[normalizedCategory as CompanyCategory];
  }

  if (normalizedCategory in CATEGORY_LABEL_ALIASES) {
    return CATEGORY_LABEL_ALIASES[normalizedCategory];
  }

  return normalizedCategory
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function isValidCategory(value: string): value is CompanyCategory {
  return (COMPANY_CATEGORIES as readonly string[]).includes(value);
}

export function areValidCategories(values: string[]): boolean {
  return values.length <= MAX_CATEGORIES && values.every(isValidCategory);
}
