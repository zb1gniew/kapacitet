import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowHint } from "@/lib/workflows/hints";
import type {
  AvailabilityDraft,
  CapacityRequestDraft,
} from "@/types/workflows";

type Draft = CapacityRequestDraft | AvailabilityDraft;

type HintsResult = {
  hints: WorkflowHint[];
  estimatedMatchCount: number | null;
  isLoading: boolean;
};

// Hint routing: which step each hint ID belongs to
// Step 2 = skills / certs / quantity / experience
// Step 3 = dates / location / radius / urgency
// Step 4+ = review - show everything
const STEP2_HINT_IDS = new Set([
  "cert-bottleneck",
  "cert-all",
  "skill-bottleneck",
  "skill-rarity",
  "experience-level",
  "quantity",
  "cert-opportunity",
  "skill-opportunity",
  "quantity-demand",
  "match-count",
  "no-matches",
]);
const STEP3_HINT_IDS = new Set([
  "radius",
  "date-partial",
  "date-extend",
  "urgency",
  "date-coverage",
  "short-window",
  "weekend-window",
  "near-start-urgency",
  "far-future",
  "match-count",
  "no-matches",
]);

function filterForStep(hints: WorkflowHint[], step: number): WorkflowHint[] {
  if (step >= 4) return hints;
  const allowed =
    step === 2 ? STEP2_HINT_IDS : step === 3 ? STEP3_HINT_IDS : null;
  return allowed ? hints.filter((h) => allowed.has(h.id)) : hints;
}

// Structural hints (instant, no API call needed)

function getStructuralHints(
  flow: "request" | "availability",
  draft: Draft,
  step: number,
): WorkflowHint[] {
  const hints: WorkflowHint[] = [];
  const showDateHints = step === 3 || step >= 4;

  // Date window analysis — only relevant on the step where dates are entered
  if (showDateHints && draft.startDate && draft.endDate) {
    const start = new Date(draft.startDate);
    const end = new Date(draft.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    const daysUntilStart = Math.round(
      (start.getTime() - Date.now()) / 86_400_000,
    );

    if (days > 0 && days < 4) {
      hints.push({
        id: "short-window",
        severity: "warning",
        message: `A ${days}-day window is very short. Workers often need time to arrange travel and handovers — even a ${days + 4}–${days + 7} day window significantly improves matching chances.`,
        params: { days, minBetter: days + 4, maxBetter: days + 7 },
      });
    } else if (days >= 4 && days < 7) {
      hints.push({
        id: "short-window",
        severity: "info",
        message: `Your ${days}-day window is fairly tight. Extending by a few days can make it easier for workers to commit.`,
        params: { days },
      });
    }

    // Weekend-heavy window
    if (days > 0 && days <= 7) {
      let weekendDays = 0;
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (d.getDay() === 0 || d.getDay() === 6) weekendDays++;
      }
      if (weekendDays >= 2 && weekendDays >= Math.ceil(days * 0.5)) {
        hints.push({
          id: "weekend-window",
          severity: "info",
          message: `Your window includes ${weekendDays} weekend day${weekendDays > 1 ? "s" : ""}. Weekend availability is typically lower — consider anchoring to weekdays if possible.`,
          params: { count: weekendDays },
        });
      }
    }

    // Near start date + normal urgency (request only)
    if (flow === "request" && daysUntilStart >= 0 && daysUntilStart <= 10) {
      const urgency = "urgency" in draft ? draft.urgency : null;
      if (urgency === "normal") {
        hints.push({
          id: "near-start-urgency",
          severity: "warning",
          message:
            daysUntilStart === 0
              ? "Start date is today. Switching to Urgent triggers accelerated matching and wider network outreach to find capacity faster."
              : daysUntilStart === 1
                ? "Start date is tomorrow. Switching to Urgent triggers accelerated matching and wider network outreach to find capacity faster."
                : `Start date is in ${daysUntilStart} days. Switching to Urgent triggers accelerated matching and wider network outreach to find capacity faster.`,
          params: { days: daysUntilStart },
        });
      }
    }

    // Very far future (> 60 days) — inform about freshness
    if (daysUntilStart > 60) {
      hints.push({
        id: "far-future",
        severity: "info",
        message: `Start date is ${daysUntilStart} days away. Availability data changes frequently — you may want to re-publish closer to the date for the most accurate matches.`,
        params: { days: daysUntilStart },
      });
    }
  }

  return hints;
}

function draftToPayload(draft: Draft) {
  return {
    skillIds: draft.skillIds,
    certificateIds: draft.certificateIds,
    experienceLevel: draft.experienceLevel || null,
    locationCity: draft.locationCity || null,
    locationRadiusKm: draft.locationRadiusKm,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    quantity: Number(draft.quantity) || 1,
    urgency: "urgency" in draft ? draft.urgency : undefined,
  };
}

// Merge: backend hints override structural hints with the same ID.
// Backend-only IDs are appended after structural hints.
function mergeHints(
  structural: WorkflowHint[],
  backend: WorkflowHint[],
): WorkflowHint[] {
  const backendIds = new Set(backend.map((h) => h.id));
  const kept = structural.filter((h) => !backendIds.has(h.id));
  return [...kept, ...backend];
}

export function useWorkflowHints(
  flow: "request" | "availability",
  draft: Draft,
  step: number,
): HintsResult {
  const [backendHints, setBackendHints] = useState<WorkflowHint[]>([]);
  const [estimatedMatchCount, setEstimatedMatchCount] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const endpoint =
    flow === "request"
      ? "/api/workflows/request-hints"
      : "/api/workflows/availability-hints";

  // Structural hints — computed synchronously, shown immediately
  const structuralHints = useMemo(
    () => getStructuralHints(flow, draft, step),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      flow,
      step,
      draft.skillIds.join(","),
      draft.certificateIds.join(","),
      draft.locationCity,
      draft.locationRadiusKm,
      draft.startDate,
      draft.endDate,
      draft.quantity,
      "urgency" in draft ? draft.urgency : "",
    ],
  );

  useEffect(() => {
    // Need at least one skill or cert to call the backend
    if (draft.skillIds.length === 0 && draft.certificateIds.length === 0) {
      setBackendHints([]);
      setEstimatedMatchCount(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draftToPayload(draft)),
          signal: controller.signal,
        });
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setBackendHints(data.hints ?? []);
        setEstimatedMatchCount(data.estimatedMatchCount ?? null);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
        // abort or network error — keep previous backend hints
      }
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    endpoint,
    draft.skillIds.join(","),
    draft.certificateIds.join(","),
    draft.experienceLevel,
    draft.locationCity,
    draft.locationRadiusKm,
    draft.startDate,
    draft.endDate,
    draft.quantity,
    "urgency" in draft ? draft.urgency : "",
  ]);

  const hints = useMemo(
    () => filterForStep(mergeHints(structuralHints, backendHints), step),
    [structuralHints, backendHints, step],
  );

  return { hints, estimatedMatchCount, isLoading };
}
