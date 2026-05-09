import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchesInfoBanner } from "./MatchesInfoBanner";

describe("MatchesInfoBanner", () => {
  it("renders the translated notice text inside the banner", () => {
    const t = vi.fn((key: string) =>
      key === "notice.pending" ? "Pending matches need your review." : key,
    );

    render(<MatchesInfoBanner noticeKey="notice.pending" t={t} />);

    expect(t).toHaveBeenCalledWith("notice.pending");
    expect(
      screen.getByText("Pending matches need your review."),
    ).toBeInTheDocument();
  });
});
