"use client";

import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { WorkflowHint } from "@/lib/workflows/hints";

type WorkflowHintsPanelProps = {
  hints: WorkflowHint[];
  isLoading?: boolean;
  flow: "request" | "availability";
};

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 1.5A5.25 5.25 0 0 0 3.75 6.75c0 1.96 1.073 3.67 2.659 4.577.246.14.41.388.447.666L7.14 13.5h3.72l.284-1.507a.75.75 0 0 1 .447-.666A5.25 5.25 0 0 0 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M7.125 13.5v.75A1.125 1.125 0 0 0 9 15.375a1.125 1.125 0 0 0 1.875-.75V13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" className={className}>
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M5.5 9l2.5 2.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 2L16.5 15H1.5L9 2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M9 7.5v3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="9" cy="12.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

const severityConfig = {
  info: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-500",
    text: "text-blue-800",
    Icon: LightbulbIcon,
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    icon: "text-amber-500",
    text: "text-amber-800",
    Icon: WarningIcon,
  },
  positive: {
    container: "border-green-200 bg-green-50",
    icon: "text-green-600",
    text: "text-green-800",
    Icon: CheckCircleIcon,
  },
} as const;

// Map hint ID + flow to the i18n key prefix.
// Hints shared between flows use a generic prefix; flow-specific ones use req_ / avail_.
const FLOW_SPECIFIC_IDS = new Set([
  "no-matches", "match-count", "radius",
]);

function hintKey(hint: WorkflowHint, flow: "request" | "availability"): string {
  const base = hint.id.replace(/-/g, "_");
  if (FLOW_SPECIFIC_IDS.has(hint.id)) {
    return `hint_${flow === "request" ? "req" : "avail"}_${base}`;
  }
  // short-window has two variants: "very short" (<4 days) and "tight" (4-6 days)
  if (hint.id === "short-window" && hint.params?.minBetter !== undefined) {
    return "hint_short_window_very";
  }
  // skill-rarity belongs to the request flow but uses a generic prefix
  if (hint.id === "skill-rarity") {
    return "hint_req_skill_rarity";
  }
  return `hint_${base}`;
}

function renderHintMessage(
  hint: WorkflowHint,
  flow: "request" | "availability",
  t: TFunction,
): string {
  const params = hint.params ?? {};
  const key = hintKey(hint, flow);

  // i18next uses `count` for plural resolution — map the primary numeric param to `count`
  // when the hint doesn't already include it
  const countParam =
    params.count !== undefined
      ? {}
      : hint.id === "urgency" || hint.id === "near-start-urgency"
        ? { count: params.days as number }
        : hint.id === "far-future"
          ? { count: params.days as number }
          : {};

  // i18next returns the key itself when not found — use a sentinel to detect that
  const translated = t(key, { defaultValue: "\x00", ...params, ...countParam });
  return translated === "\x00" ? hint.message : translated;
}

export function WorkflowHintsPanel({
  hints,
  isLoading = false,
  flow,
}: WorkflowHintsPanelProps) {
  const { t } = useTranslation();

  if (hints.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-2">
      {hints.map((hint) => {
        const config = severityConfig[hint.severity] ?? severityConfig.info;
        const { Icon } = config;
        return (
          <div
            key={hint.id}
            className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 ${config.container}`}
          >
            <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${config.icon}`} />
            <p className={`text-xs leading-[19.5px] tracking-[-0.1172px] ${config.text}`}>
              {renderHintMessage(hint, flow, t)}
            </p>
          </div>
        );
      })}
      {isLoading && hints.length === 0 && (
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-500" />
          <p className="text-xs text-neutral-400">{t("Analysing your network…")}</p>
        </div>
      )}
    </div>
  );
}
