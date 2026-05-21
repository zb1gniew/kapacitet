import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditTimelineEventCard } from "./AuditTimelineEventCard";
import type { AuditTimelineEvent } from "@/types/admin";

const submissionEvent: AuditTimelineEvent = {
  id: "submission-1",
  timestamp: "2026-05-21T08:30:00Z",
  type: "Submission",
  requestId: 1,
  companyName: "Nordic Builders",
  contactEmail: "hello@nordic.test",
  summary: "Access request submitted",
  detail: "Nordic Builders submitted a new company access request.",
};

describe("AuditTimelineEventCard", () => {
  it("shows a generic source for submission events", () => {
    render(<AuditTimelineEventCard event={submissionEvent} t={(key) => key} />);

    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Request form")).toBeInTheDocument();
    expect(screen.queryByText("system")).not.toBeInTheDocument();
  });

  it("shows the same generic label for review events", () => {
    render(
      <AuditTimelineEventCard
        event={{
          ...submissionEvent,
          id: "approval-1",
          type: "Approval",
          actor: "admin@kapacitet.test",
        }}
        t={(key) => key}
      />,
    );

    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("admin@kapacitet.test")).toBeInTheDocument();
  });
});
