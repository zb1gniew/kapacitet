import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthField } from "./AuthField";

vi.mock("@/hooks/useLocalizedScreen", () => ({
  useLocalizedScreen: () => ({
    t: (key: string) => key,
  }),
}));

describe("AuthField", () => {
  it("renders optional labels and helper text for editable inputs", () => {
    render(
      <AuthField
        id="company-name"
        label="Company name"
        optional
        placeholder="Nordic Builders"
        helperText="Used in the company registry."
      />,
    );

    expect(screen.getByLabelText(/Company name/)).toHaveAttribute(
      "placeholder",
      "Nordic Builders",
    );
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    expect(
      screen.getByText("Used in the company registry."),
    ).toBeInTheDocument();
  });

  it("renders readonly multiline values and validation errors", () => {
    render(
      <AuthField
        id="message"
        label="Message"
        multiline
        readOnly
        value="Readonly project note"
        error="A message is required."
      />,
    );

    const input = screen.getByLabelText("Message") as HTMLTextAreaElement;
    expect(input).toHaveValue("Readonly project note");
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByText("A message is required.")).toBeInTheDocument();
  });
});
