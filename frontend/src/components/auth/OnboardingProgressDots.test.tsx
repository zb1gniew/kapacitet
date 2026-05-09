import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingProgressDots } from "./OnboardingProgressDots";

describe("OnboardingProgressDots", () => {
  it("marks all steps up to the active step as complete", () => {
    const { container } = render(<OnboardingProgressDots activeStep={2} />);
    const dots = container.querySelectorAll("span");

    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveClass("bg-blue-600");
    expect(dots[1]).toHaveClass("bg-blue-600");
    expect(dots[2]).toHaveClass("bg-neutral-300");
  });
});
