import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsParticipationVisibilityCard } from "./SettingsParticipationVisibilityCard";
import type { AuthenticatedUser } from "@/types/auth";

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

describe("SettingsParticipationVisibilityCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a read-only notice for viewers after loading settings", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          receiveCapacityRequests: true,
          participateInNetworkWide: false,
          allowPartialMatches: true,
          matchOutsideCategory: false,
        }),
        { status: 200 },
      ),
    );

    render(
      <SettingsParticipationVisibilityCard
        t={(key) => key}
        user={viewerUser}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Read-only settings")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Only company managers can change participation and visibility settings. You can still review how the company is currently configured.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save preferences" }),
    ).not.toBeInTheDocument();
  });

  it("lets managers change a preference and persist the updated settings", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            receiveCapacityRequests: true,
            participateInNetworkWide: true,
            allowPartialMatches: false,
            matchOutsideCategory: false,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            receiveCapacityRequests: true,
            participateInNetworkWide: false,
            allowPartialMatches: false,
            matchOutsideCategory: false,
          }),
          { status: 200 },
        ),
      );

    render(
      <SettingsParticipationVisibilityCard
        t={(key) => key}
        user={managerUser}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save preferences" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen
        .getAllByRole("button")
        .find((button) => button.hasAttribute("aria-pressed"))!,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/company/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          receiveCapacityRequests: true,
          participateInNetworkWide: false,
          allowPartialMatches: false,
          matchOutsideCategory: false,
        }),
      });
    });

    expect(screen.getByText("Preferences saved.")).toBeInTheDocument();
  });

  it("shows retry and load errors when the initial fetch fails", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ detail: "Settings service unavailable" }),
          {
            status: 503,
            headers: { "content-type": "application/problem+json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            receiveCapacityRequests: true,
            participateInNetworkWide: true,
            allowPartialMatches: true,
            matchOutsideCategory: true,
          }),
          { status: 200 },
        ),
      );

    render(
      <SettingsParticipationVisibilityCard
        t={(key) => key}
        user={managerUser}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Settings service unavailable"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByRole("button", { name: "Save preferences" }),
    ).toBeInTheDocument();
  });
});
