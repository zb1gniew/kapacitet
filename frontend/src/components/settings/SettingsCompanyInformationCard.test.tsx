import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsCompanyInformationCard } from "./SettingsCompanyInformationCard";
import type { AuthenticatedUser } from "@/types/auth";

vi.mock("@/components/availability/CategoryMultiSelect", () => ({
  CategoryMultiSelect: ({
    value,
    onChange,
    disabled,
  }: {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange([...value, "electrical"])}
    >
      Add category
    </button>
  ),
}));

vi.mock("@/components/availability/CityAutocomplete", () => ({
  CityAutocomplete: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <input
      aria-label="Primary location input"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/PhoneInput", () => ({
  PhoneInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <input
      aria-label="Contact phone input"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const managerUser: AuthenticatedUser = {
  sub: "1",
  email: "manager@test.local",
  appRole: "Manager",
};

const viewerUser: AuthenticatedUser = {
  sub: "2",
  email: "viewer@test.local",
  appRole: "Viewer",
};

function buildCompanyInformation() {
  return {
    name: "Nordic Build",
    cvr: "12345678",
    categories: ["construction"],
    defaultLocation: "Aarhus",
    contactEmail: "hello@nordic.test",
    contactPhone: "+4512345678",
  };
}

describe("SettingsCompanyInformationCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a read-only notice for viewers after loading company information", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(buildCompanyInformation()), { status: 200 }),
    );

    render(
      <SettingsCompanyInformationCard t={(key) => key} user={viewerUser} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Read-only settings")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Only company managers can update company information. You can review the current values here, but changes must be made by a manager account.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });

  it("lets managers update company details and persists the saved values", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(buildCompanyInformation()), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...buildCompanyInformation(),
            categories: ["construction", "electrical"],
            defaultLocation: "Odense",
            contactPhone: "+4598765432",
          }),
          { status: 200 },
        ),
      );

    render(
      <SettingsCompanyInformationCard t={(key) => key} user={managerUser} />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add category" }));
    fireEvent.change(screen.getByLabelText("Primary location input"), {
      target: { value: "Odense" },
    });
    fireEvent.change(screen.getByLabelText("Contact phone input"), {
      target: { value: "+4598765432" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/company/information", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categories: ["construction", "electrical"],
          defaultLocation: "Odense",
          contactPhone: "+4598765432",
        }),
      });
    });

    expect(screen.getByText("Changes saved successfully.")).toBeInTheDocument();
  });

  it("shows backend validation errors and clears a field error when the field changes", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(buildCompanyInformation()), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: "Please review the highlighted fields.",
            fieldErrors: {
              defaultLocation: ["Select a supported city."],
              contactPhone: ["Enter a valid phone number."],
            },
          }),
          {
            status: 422,
            headers: { "content-type": "application/problem+json" },
          },
        ),
      );

    render(
      <SettingsCompanyInformationCard t={(key) => key} user={managerUser} />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please review the highlighted fields."),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Select a supported city.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Primary location input"), {
      target: { value: "Odense" },
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Select a supported city."),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(
      screen.queryByText("Please review the highlighted fields."),
    ).not.toBeInTheDocument();
  });
});
