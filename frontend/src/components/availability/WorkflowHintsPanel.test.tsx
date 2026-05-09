import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowHintsPanel } from "./WorkflowHintsPanel";
import type { WorkflowHint } from "@/lib/workflows/hints";

const translations: Record<string, string> = {};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      translations[key] ?? (options?.defaultValue as string | undefined) ?? key,
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

  it("shows a loading indicator while hints are being calculated", () => {
    render(<WorkflowHintsPanel hints={[]} isLoading flow="availability" />);

    expect(screen.getByText("Analysing your network…")).toBeInTheDocument();
  });
});
