import type { WorkflowCatalog, CatalogItem } from "@/lib/backend/catalog";
import type { CapacityRequestDraft } from "@/types/workflows";

export type WorkflowHint = {
  id: string;
  message: string;
};

function resolveNames(ids: number[], items: CatalogItem[]): string[] {
  return ids
    .map((id) => items.find((item) => item.id === id)?.name)
    .filter((name): name is string => name !== undefined);
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `"${names[0]}"`;
  if (names.length === 2) return `"${names[0]}" and "${names[1]}"`;
  const last = names[names.length - 1];
  const rest = names
    .slice(0, -1)
    .map((n) => `"${n}"`)
    .join(", ");
  return `${rest}, and "${last}"`;
}

function smartRadiusSuggestion(current: number): number {
  // Suggest doubling, rounded to nearest 25, capped at 200
  return Math.min(200, Math.ceil((current * 2) / 25) * 25);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function getStep2Hints(
  draft: CapacityRequestDraft,
  catalog: WorkflowCatalog | null,
): WorkflowHint[] {
  const hints: WorkflowHint[] = [];
  const certs = catalog
    ? resolveNames(draft.certificateIds, catalog.certificates)
    : [];
  const skills = catalog ? resolveNames(draft.skillIds, catalog.skills) : [];

  if (draft.certificateIds.length >= 2) {
    const listed = certs.length >= 2 ? ` (${formatNameList(certs)})` : "";
    const verb =
      draft.certificateIds.length === 2
        ? "Both certificates"
        : `All ${draft.certificateIds.length} certificates`;
    hints.push({
      id: "cert-count",
      message: `${verb}${listed} must be held simultaneously. If any is negotiable, removing it may significantly broaden the available pool.`,
    });
  }

  if (draft.skillIds.length >= 3) {
    const listed = skills.length > 0 ? ` - ${formatNameList(skills)} -` : "";
    hints.push({
      id: "many-skills",
      message: `Workers who cover all ${draft.skillIds.length} skills${listed} are rare. Narrowing to your primary skill will increase matches.`,
    });
  }

  if (draft.experienceLevel !== "") {
    const levelLabel =
      draft.experienceLevel === "junior"
        ? "junior workers (0–3 yrs)"
        : draft.experienceLevel === "mid"
          ? "mid-level workers (3–7 yrs)"
          : "senior workers (7+ yrs)";
    hints.push({
      id: "experience-level",
      message: `Only ${levelLabel} will be matched. Clearing this filter opens requests to all experience levels.`,
    });
  }

  return hints;
}

export function getStep3Hints(draft: CapacityRequestDraft): WorkflowHint[] {
  const hints: WorkflowHint[] = [];
  const { locationRadiusKm, locationCity, startDate, endDate, urgency } = draft;

  // Radius: suggest doubling if below halfway (< 100 km out of 200 max)
  if (locationRadiusKm < 100) {
    const suggested = smartRadiusSuggestion(locationRadiusKm);
    const cityLabel = locationCity ? ` near ${locationCity}` : "";
    hints.push({
      id: "small-radius",
      message: `Your ${locationRadiusKm} km radius${cityLabel} may return few results. Expanding to ${suggested} km could significantly increase available matches.`,
    });
  }

  if (startDate && endDate) {
    const durationDays = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        86_400_000,
    );
    // Short engagement: under 7 days (1 work-week)
    if (durationDays > 0 && durationDays < 7) {
      hints.push({
        id: "short-duration",
        message: `Your ${durationDays}-day window (${formatDate(startDate)}–${formatDate(endDate)}) may deter workers who need to arrange travel or handovers. Even a ${durationDays + 3}–${durationDays + 7} day window improves match rates.`,
      });
    }
  }

  // Near start date: within 10 days and urgency is normal
  if (urgency === "normal" && startDate) {
    const daysUntilStart = Math.round(
      (new Date(startDate).getTime() - Date.now()) / 86_400_000,
    );
    if (daysUntilStart >= 0 && daysUntilStart <= 10) {
      const timeLabel =
        daysUntilStart === 0
          ? "today"
          : daysUntilStart === 1
            ? "tomorrow"
            : `in ${daysUntilStart} days`;
      hints.push({
        id: "near-start-date",
        message: `Start date is ${timeLabel}. Switching to Urgent triggers accelerated matching and wider network outreach to find capacity faster.`,
      });
    }
  }

  return hints;
}
