import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccessRequestFilters } from "./useAccessRequestFilters";
import type { AccessRequest } from "@/types/admin";

const requests: AccessRequest[] = [
  {
    id: 1,
    name: "Nordic Builders",
    categories: ["construction"],
    location: "Aarhus",
    contactEmail: "nordic@test.local",
    status: "Pending",
    createdAt: "2026-05-01T08:00:00Z",
    message: "Need access to the platform",
  },
  {
    id: 2,
    name: "Blue Electric",
    categories: ["electrical"],
    location: "Odense",
    contactEmail: "blue@test.local",
    status: "Rejected",
    createdAt: "2026-05-02T08:00:00Z",
    reviewedAt: "2026-05-03T10:00:00Z",
    reviewedBy: "Admin One",
    rejectionReason: "Missing documents",
  },
  {
    id: 3,
    name: "Green Paint",
    categories: ["painting"],
    location: "Aarhus",
    contactEmail: "green@test.local",
    status: "Approved",
    createdAt: "2026-05-04T08:00:00Z",
    reviewedAt: "2026-05-05T10:00:00Z",
    reviewedBy: "Admin Two",
    provisionedCompanyId: 88,
  },
  {
    id: 4,
    name: "Legacy Co",
    categories: ["old_industry"],
    location: "Warsaw",
    contactEmail: "legacy@test.local",
    status: "Pending",
    createdAt: "2026-05-06T08:00:00Z",
  },
];

describe("useAccessRequestFilters", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
    });

    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        randomUUID: vi.fn(() => "saved-view-id"),
      },
    });
  });

  it("filters requests by active tab, reviewer, rejection reason, and search", async () => {
    const toast = vi.fn();
    const { result } = renderHook(() =>
      useAccessRequestFilters({
        requests,
        currentActiveTab: "Rejected",
        t: (key, options) =>
          typeof options?.name === "string"
            ? key.replace("{{name}}", options.name)
            : key,
        setToastMessage: toast,
      }),
    );

    await waitFor(() => {
      expect(result.current.filteredRequests).toHaveLength(1);
    });

    act(() => {
      result.current.handleAdvancedFilterChange("reviewer", "Admin One");
      result.current.handleAdvancedFilterChange(
        "rejectionReason",
        "With reason",
      );
      result.current.handleAdvancedFilterChange("search", "missing");
    });

    expect(
      result.current.filteredRequests.map((request) => request.id),
    ).toEqual([2]);
    expect(result.current.industryOptions).toContain("construction");
    expect(result.current.industryOptions).toContain("electrical");
    expect(result.current.industryOptions).toContain("painting");
    expect(result.current.industryOptions).not.toContain("old_industry");
    expect(result.current.locationOptions).toContain("Aarhus");
    expect(result.current.locationOptions).toContain("Odense");
    expect(result.current.locationOptions).not.toContain("Warsaw");
    expect(result.current.reviewerOptions).toEqual(["Admin One", "Admin Two"]);
  });

  it("applies date and provisioning filters and clears them cleanly", async () => {
    const { result } = renderHook(() =>
      useAccessRequestFilters({
        requests,
        currentActiveTab: "All",
        t: (key) => key,
        setToastMessage: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.filteredRequests).toHaveLength(4);
    });

    act(() => {
      result.current.handleAdvancedFilterChange("dateField", "Reviewed");
      result.current.handleAdvancedFilterChange("fromDate", "2026-05-04");
      result.current.handleAdvancedFilterChange("provisioningLink", "Linked");
    });

    expect(
      result.current.filteredRequests.map((request) => request.id),
    ).toEqual([3]);

    act(() => {
      result.current.handleClearFilters();
    });

    expect(result.current.filteredRequests).toHaveLength(4);
    expect(result.current.advancedFilters.search).toBe("");
    expect(result.current.activeSavedViewId).toBeNull();
  });

  it("filters by submitted and reviewed calendar dates inclusively", async () => {
    const { result } = renderHook(() =>
      useAccessRequestFilters({
        requests: [
          {
            id: 11,
            name: "Same Day Submitted",
            categories: ["construction"],
            location: "Aarhus",
            contactEmail: "same-day@test.local",
            status: "Pending",
            createdAt: "2026-05-04T00:15:00Z",
          },
          {
            id: 12,
            name: "Next Day Submitted",
            categories: ["construction"],
            location: "Odense",
            contactEmail: "next-day@test.local",
            status: "Approved",
            createdAt: "2026-05-05T09:00:00Z",
            reviewedAt: "2026-05-06T18:30:00Z",
            reviewedBy: "Admin Three",
          },
        ],
        currentActiveTab: "All",
        t: (key) => key,
        setToastMessage: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.filteredRequests).toHaveLength(2);
    });

    act(() => {
      result.current.handleAdvancedFilterChange("fromDate", "2026-05-04");
      result.current.handleAdvancedFilterChange("toDate", "2026-05-04");
    });

    expect(
      result.current.filteredRequests.map((request) => request.id),
    ).toEqual([11]);

    act(() => {
      result.current.handleAdvancedFilterChange("dateField", "Reviewed");
      result.current.handleAdvancedFilterChange("fromDate", "2026-05-06");
      result.current.handleAdvancedFilterChange("toDate", "2026-05-06");
    });

    expect(
      result.current.filteredRequests.map((request) => request.id),
    ).toEqual([12]);
  });

  it("saves, applies, updates, and deletes saved views", async () => {
    const toast = vi.fn();
    const { result } = renderHook(() =>
      useAccessRequestFilters({
        requests,
        currentActiveTab: "Approved",
        t: (key, options) =>
          typeof options?.name === "string"
            ? key.replace("{{name}}", options.name)
            : key,
        setToastMessage: toast,
      }),
    );

    await waitFor(() => {
      expect(result.current.filteredRequests).toHaveLength(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleAdvancedFilterChange("location", "Aarhus");
      result.current.setSaveViewName("Aarhus approvals");
    });

    act(() => {
      result.current.handleSaveCurrentView();
    });

    await waitFor(() => {
      expect(result.current.savedViews).toHaveLength(1);
    });
    expect(result.current.savedViews[0].tab).toBe("Approved");
    expect(toast).toHaveBeenCalledWith('Saved view "Aarhus approvals".');

    act(() => {
      result.current.handleAdvancedFilterChange("location", "Odense");
    });

    let appliedTab: string | null = null;
    act(() => {
      appliedTab = result.current.handleApplySavedView("saved-view-id");
    });

    expect(appliedTab).toBe("Approved");
    expect(result.current.advancedFilters.location).toBe("Aarhus");

    act(() => {
      result.current.setSaveViewName("Aarhus approvals");
    });

    act(() => {
      result.current.handleSaveCurrentView();
    });

    act(() => {
      result.current.handleDeleteSavedView("saved-view-id");
    });

    await waitFor(() => {
      expect(result.current.savedViews).toHaveLength(0);
    });
    expect(toast).toHaveBeenCalledWith(
      'Updated saved view "Aarhus approvals".',
    );
    expect(toast).toHaveBeenCalledWith(
      'Deleted saved view "Aarhus approvals".',
    );
  });

  it("shows a toast instead of saving when the view name is blank", async () => {
    const toast = vi.fn();
    const { result } = renderHook(() =>
      useAccessRequestFilters({
        requests,
        currentActiveTab: "All",
        t: (key) => key,
        setToastMessage: toast,
      }),
    );

    await waitFor(() => {
      expect(result.current.filteredRequests).toHaveLength(4);
    });

    act(() => {
      result.current.handleSaveCurrentView();
    });

    expect(toast).toHaveBeenCalledWith("Enter a name before saving this view.");
    expect(result.current.savedViews).toHaveLength(0);
  });
});
