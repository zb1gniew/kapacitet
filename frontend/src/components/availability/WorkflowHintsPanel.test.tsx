import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowHintsPanel } from "./WorkflowHintsPanel";
import type { WorkflowHint } from "@/lib/workflows/hints";

const translations: Record<string, string> = {};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const count = options?.count;
      const interpolate = (template: string) =>
        template.replace(/\{\{(\w+)\}\}/g, (_match, token: string) => {
          const value = options?.[token];
          return value === undefined ? `{{${token}}}` : String(value);
        });

      if (count === 0 && translations[`${key}_zero`]) {
        return interpolate(translations[`${key}_zero`]);
      }
      if (count === 1 && translations[`${key}_one`]) {
        return interpolate(translations[`${key}_one`]);
      }
      if (
        typeof count === "number" &&
        count !== 1 &&
        translations[`${key}_other`]
      ) {
        return interpolate(translations[`${key}_other`]);
      }
      return interpolate(
        translations[key] ??
          (options?.defaultValue as string | undefined) ??
          key,
      );
    },
  }),
}));

describe("WorkflowHintsPanel", () => {
  beforeEach(() => {
    Object.keys(translations).forEach((key) => delete translations[key]);
  });

  it("renders translated workflow hints for known keys", () => {
    translations.hint_req_skill_rarity =
      "Rare skills usually narrow the supplier pool.";

    const hints: WorkflowHint[] = [
      {
        id: "skill-rarity",
        severity: "warning",
        message: "Fallback skill hint",
      },
    ];

    render(<WorkflowHintsPanel hints={hints} flow="request" />);

    expect(
      screen.getByText("Rare skills usually narrow the supplier pool."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fallback skill hint")).not.toBeInTheDocument();
  });

  it("falls back to the backend message when no translation exists", () => {
    const hints: WorkflowHint[] = [
      {
        id: "custom-backend-hint",
        severity: "positive",
        message: "This fallback message should stay visible.",
      },
    ];

    render(<WorkflowHintsPanel hints={hints} flow="availability" />);

    expect(
      screen.getByText("This fallback message should stay visible."),
    ).toBeInTheDocument();
  });

  it("renders flow-specific availability hint translations", () => {
    translations["Arc Flash"] = "Lysbue";
    translations.hint_avail_cert_opportunity_other =
      'Translated cert opportunity for "{{certName}}".';

    const hints: WorkflowHint[] = [
      {
        id: "cert-opportunity",
        severity: "info",
        message:
          'Adding "Arc Flash" to your workers\' certificates could make you eligible for 3 more requests that currently require it.',
        params: { certName: "Arc Flash", count: 3 },
      },
    ];

    render(<WorkflowHintsPanel hints={hints} flow="availability" />);

    expect(
      screen.getByText('Translated cert opportunity for "Lysbue".'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Adding "Arc Flash"/)).not.toBeInTheDocument();
  });

  it("translates interpolated skill names inside availability hints", () => {
    translations.Welding = "Svejsning";
    translations.hint_avail_skill_opportunity_other =
      'Adding "{{skillName}}" unlocks {{count}} more requests.';

    const hints: WorkflowHint[] = [
      {
        id: "skill-opportunity",
        severity: "info",
        message:
          'Adding "Welding" as a declared skill could make you eligible for 2 more requests.',
        params: { skillName: "Welding", count: 2 },
      },
    ];

    render(<WorkflowHintsPanel hints={hints} flow="availability" />);

    expect(
      screen.getByText('Adding "Svejsning" unlocks 2 more requests.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Adding "Welding"/)).not.toBeInTheDocument();
  });

  it("renders strong match-count translations for request hints", () => {
    translations.hint_req_match_count_strong =
      "Strong translated request match count.";

    const hints: WorkflowHint[] = [
      {
        id: "match-count",
        severity: "positive",
        message: "Fallback strong request hint",
        params: { count: 6, strong: true },
      },
    ];

    render(<WorkflowHintsPanel hints={hints} flow="request" />);

    expect(
      screen.getByText("Strong translated request match count."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Fallback strong request hint"),
    ).not.toBeInTheDocument();
  });

  it("shows a loading indicator while hints are being calculated", () => {
    render(<WorkflowHintsPanel hints={[]} isLoading flow="availability" />);

    expect(screen.getByText("Analysing your network…")).toBeInTheDocument();
  });
});
