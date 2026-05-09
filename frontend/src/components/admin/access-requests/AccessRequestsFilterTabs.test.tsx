import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccessRequestsFilterTabs } from "./AccessRequestsFilterTabs";
import type { AccessRequest } from "@/types/admin";

const requests: AccessRequest[] = [
  {
    id: 1,
    name: "Nordic Builders",
    categories: ["construction"],
    location: "Aarhus",
    contactEmail: "pending-one@test.local",
    status: "Pending",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Blue Crane",
    categories: ["construction"],
    location: "Copenhagen",
    contactEmail: "pending-two@test.local",
    status: "Pending",
    createdAt: "2026-01-02T00:00:00Z",
  },
  {
    id: 3,
    name: "Approved Co",
    categories: ["roofing"],
    location: "Odense",
    contactEmail: "approved@test.local",
    status: "Approved",
    createdAt: "2026-01-03T00:00:00Z",
  },
  {
    id: 4,
    name: "Rejected Co",
    categories: ["painting"],
    location: "Aalborg",
    contactEmail: "rejected@test.local",
    status: "Rejected",
    createdAt: "2026-01-04T00:00:00Z",
  },
];

describe("AccessRequestsFilterTabs", () => {
  it("renders counts for each tab and highlights the active tab", () => {
    render(
      <AccessRequestsFilterTabs
        activeTab="Pending"
        onChange={vi.fn()}
        requests={requests}
        t={(key) => key}
      />,
    );

    const pendingButton = screen.getByText("Pending").closest("button");
    const approvedButton = screen.getByText("Approved").closest("button");
    const rejectedButton = screen.getByText("Rejected").closest("button");
    const allButton = screen.getByText("All").closest("button");

    expect(pendingButton).toHaveTextContent("Pending2");
    expect(approvedButton).toHaveTextContent("Approved1");
    expect(rejectedButton).toHaveTextContent("Rejected1");
    expect(allButton).toHaveTextContent("All4");
    expect(pendingButton).not.toBeNull();
    expect(pendingButton).toHaveClass("bg-blue-600");
  });

  it("calls onChange with the selected tab", () => {
    const onChange = vi.fn();

    render(
      <AccessRequestsFilterTabs
        activeTab="Pending"
        onChange={onChange}
        requests={requests}
        t={(key) => key}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Approved/i }));

    expect(onChange).toHaveBeenCalledWith("Approved");
  });
});
