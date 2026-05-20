import { isSupportedCity } from "@/constants/cities";
import type { WorkflowCatalog } from "@/lib/backend/catalog";
import type {
  AvailabilityDraft,
  CapacityRequestDraft,
  StoredDraft,
} from "@/types/workflows";

export const WORKFLOW_DRAFT_VERSION = 2;
export const EXPERIENCE_LEVEL_OPTIONS = ["junior", "mid", "senior"] as const;
type ExperienceLevelOption = (typeof EXPERIENCE_LEVEL_OPTIONS)[number];

export const DEFAULT_AVAILABILITY_DRAFT: AvailabilityDraft = {
  quantity: "",
  experienceLevel: "",
  skillIds: [],
  certificateIds: [],
  startDate: "",
  endDate: "",
  locationCity: "",
  locationRadiusKm: 50,
};

export const DEFAULT_CAPACITY_REQUEST_DRAFT: CapacityRequestDraft = {
  quantity: "",
  experienceLevel: "",
  skillIds: [],
  certificateIds: [],
  startDate: "",
  endDate: "",
  locationCity: "",
  locationRadiusKm: 50,
  urgency: "normal",
};

export type WorkflowPayloadResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[]; fieldErrors?: Record<string, string[]> };

export type AvailabilityCreatePayload = {
  clientDraftKey: string;
  startDate: string;
  endDate: string;
  locationCity: string;
  locationRadiusKm: number;
  quantity: number;
  experienceLevel?: "junior" | "mid" | "senior";
  skillIds: number[];
  certificateIds: number[];
};

export type CapacityRequestCreatePayload = AvailabilityCreatePayload & {
  urgency: "Medium" | "High";
};

export function getAvailabilityDraftStorageKey(userId: string) {
  return `kapacitet.availability.draft.${userId}`;
}

export function getCapacityRequestDraftStorageKey(userId: string) {
  return `kapacitet.request-capacity.draft.${userId}`;
}

function normalizeInput(value: string) {
  return value.trim();
}

function parseQuantity(value: string) {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) ? quantity : NaN;
}

export function isWorkerDetailsStepComplete(
  draft: Pick<
    AvailabilityDraft | CapacityRequestDraft,
    "quantity" | "skillIds" | "certificateIds"
  >,
) {
  const quantity = parseQuantity(draft.quantity);

  return (
    Number.isInteger(quantity) &&
    quantity > 0 &&
    draft.skillIds.length > 0 &&
    draft.certificateIds.length > 0
  );
}

export function getWorkerPeriodStepErrors(
  draft: Pick<
    AvailabilityDraft | CapacityRequestDraft,
    "startDate" | "endDate" | "locationCity"
  >,
) {
  const errors: string[] = [];
  const locationCity = normalizeInput(draft.locationCity);
  const today = new Date().toISOString().split("T")[0];

  if (!draft.startDate) {
    errors.push("Select a start date.");
  } else if (draft.startDate < today) {
    errors.push("Start date cannot be in the past.");
  }

  if (!draft.endDate) {
    errors.push("Select an end date.");
  }

  if (draft.startDate && draft.endDate && draft.endDate <= draft.startDate) {
    errors.push("End date must be after the start date.");
  }

  if (!locationCity) {
    errors.push("Enter a location.");
  } else if (locationCity.length > 32) {
    errors.push("Location must be 32 characters or fewer.");
  } else if (!isSupportedCity(locationCity)) {
    errors.push("Please select a city from the suggestions.");
  }

  return errors;
}

function validateSharedDraftFields(
  draft: AvailabilityDraft | CapacityRequestDraft,
  catalog: WorkflowCatalog,
) {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  const quantity = parseQuantity(draft.quantity);
  const locationCity = normalizeInput(draft.locationCity);
  const catalogSkillIds = new Set(catalog.skills.map((skill) => skill.id));
  const catalogCertificateIds = new Set(
    catalog.certificates.map((certificate) => certificate.id),
  );
  const invalidSkillIds = draft.skillIds.filter(
    (id) => !catalogSkillIds.has(id),
  );
  const invalidCertificateIds = draft.certificateIds.filter(
    (id) => !catalogCertificateIds.has(id),
  );
  const experienceLevel: ExperienceLevelOption | "" =
    draft.experienceLevel &&
    EXPERIENCE_LEVEL_OPTIONS.includes(draft.experienceLevel)
      ? draft.experienceLevel
      : "";

  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.push("Enter a valid worker quantity greater than zero.");
    fieldErrors.quantity = ["Enter a valid worker quantity greater than zero."];
  }

  if (draft.skillIds.length === 0) {
    errors.push("Select at least one skill or trade.");
    fieldErrors.skillIds = ["Select at least one skill or trade."];
  }

  if (draft.certificateIds.length === 0) {
    errors.push("Select at least one required certificate.");
    fieldErrors.certificateIds = ["Select at least one required certificate."];
  }

  if (invalidSkillIds.length > 0) {
    errors.push("Refresh the page and reselect the required skills.");
    fieldErrors.skillIds = ["One or more selected skills are no longer valid."];
  }

  if (invalidCertificateIds.length > 0) {
    errors.push("Refresh the page and reselect the required certificates.");
    fieldErrors.certificateIds = [
      "One or more selected certificates are no longer valid.",
    ];
  }

  const today = new Date().toISOString().split("T")[0];

  if (!draft.startDate) {
    errors.push("Select a start date.");
    fieldErrors.startDate = ["Select a start date."];
  } else if (draft.startDate < today) {
    errors.push("Start date cannot be in the past.");
    fieldErrors.startDate = ["Start date cannot be in the past."];
  }

  if (!draft.endDate) {
    errors.push("Select an end date.");
    fieldErrors.endDate = ["Select an end date."];
  }

  if (draft.startDate && draft.endDate && draft.endDate <= draft.startDate) {
    errors.push("End date must be after the start date.");
    fieldErrors.endDate = ["End date must be after the start date."];
  }

  if (!locationCity) {
    errors.push("Enter a location.");
    fieldErrors.locationCity = ["Enter a location."];
  } else if (locationCity.length > 32) {
    errors.push("Location must be 32 characters or fewer.");
    fieldErrors.locationCity = ["Location must be 32 characters or fewer."];
  } else if (!isSupportedCity(locationCity)) {
    errors.push("Please select a city from the suggestions.");
    fieldErrors.locationCity = ["Please select a city from the suggestions."];
  }

  if (draft.experienceLevel && !experienceLevel) {
    errors.push("Select a valid experience level.");
    fieldErrors.experienceLevel = ["Select a valid experience level."];
  }

  return {
    errors,
    fieldErrors,
    quantity,
    experienceLevel,
    skillIds: draft.skillIds,
    certificateIds: draft.certificateIds,
    locationCity,
  };
}

export function createStoredDraft<T>(data: T): StoredDraft<T> {
  return {
    _v: WORKFLOW_DRAFT_VERSION,
    _createdAt: new Date().toISOString(),
    _clientKey: crypto.randomUUID(),
    data,
  };
}

export function buildAvailabilityCreatePayload(
  draft: AvailabilityDraft,
  catalog: WorkflowCatalog,
  clientDraftKey: string,
): WorkflowPayloadResult<AvailabilityCreatePayload> {
  const {
    errors,
    quantity,
    experienceLevel,
    skillIds,
    certificateIds,
    locationCity,
    fieldErrors,
  } = validateSharedDraftFields(draft, catalog);

  if (errors.length > 0) {
    return { ok: false, errors, fieldErrors };
  }

  return {
    ok: true,
    value: {
      clientDraftKey,
      startDate: draft.startDate,
      endDate: draft.endDate,
      locationCity,
      locationRadiusKm: draft.locationRadiusKm,
      quantity,
      ...(experienceLevel ? { experienceLevel } : {}),
      skillIds,
      certificateIds,
    },
  };
}

export function buildCapacityRequestCreatePayload(
  draft: CapacityRequestDraft,
  catalog: WorkflowCatalog,
  clientDraftKey: string,
): WorkflowPayloadResult<CapacityRequestCreatePayload> {
  const {
    errors,
    quantity,
    experienceLevel,
    skillIds,
    certificateIds,
    locationCity,
    fieldErrors,
  } = validateSharedDraftFields(draft, catalog);

  if (errors.length > 0) {
    return { ok: false, errors, fieldErrors };
  }

  return {
    ok: true,
    value: {
      clientDraftKey,
      startDate: draft.startDate,
      endDate: draft.endDate,
      locationCity,
      locationRadiusKm: draft.locationRadiusKm,
      quantity,
      ...(experienceLevel ? { experienceLevel } : {}),
      skillIds,
      certificateIds,
      urgency: draft.urgency === "urgent" ? "High" : "Medium",
    },
  };
}

export function normalizeStoredDraft<T>(
  value: StoredDraft<T>,
  initialValue: T,
): StoredDraft<T> {
  if (
    value &&
    typeof value === "object" &&
    value._v === WORKFLOW_DRAFT_VERSION &&
    typeof value._clientKey === "string" &&
    value._clientKey.length > 0 &&
    "data" in value
  ) {
    return value;
  }

  return createStoredDraft(initialValue);
}
