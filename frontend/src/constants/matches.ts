import type {
  AwaitingConfirmationOffer,
  DirectMatchOffer,
  MatchesSummaryCard,
} from "@/types/matches";

export const MATCHES_ANONYMIZATION_NOTICE =
  "All matches are anonymized. Offers are generated based on certificates, skills, availability, and location. Company identities are revealed only after mutual confirmation by both parties.";

export const MATCHES_SUMMARY_CARDS: ReadonlyArray<MatchesSummaryCard> = [
  {
    id: "available",
    titleKey: "Available to review",
    valueKey: "3",
    helperKey: "Ready for your decision",
    tone: "success",
  },
  {
    id: "awaiting",
    titleKey: "Awaiting confirmation",
    valueKey: "1",
    helperKey: "Supplier reviewing your acceptance",
    tone: "warning",
  },
  {
    id: "ready",
    titleKey: "Ready to coordinate",
    valueKey: "0",
    helperKey: "Mutual confirmation complete",
    tone: "primary",
  },
];

export const MATCHES_AVAILABLE_OFFERS: ReadonlyArray<DirectMatchOffer> = [
  {
    id: "welders-3",
    titleKey: "3 Welders",
    statusKey: "Direct match",
    updatedAtKey: "2 hours ago",
    validUntilKey: "Valid until Feb 13, 2026",
    availabilityValueKey: "Feb 15 - Mar 30",
    locationValueKey: "Sønderborg (12 km)",
    certificatesValueKey: "2 verified",
    certificateKeys: ["Hot work certification", "Safety training (BAS-U)"],
    scoreKey: "98%",
  },
  {
    id: "welders-2",
    titleKey: "2 Welders",
    statusKey: "Direct match",
    updatedAtKey: "5 hours ago",
    validUntilKey: "Valid until Feb 12, 2026",
    availabilityValueKey: "Feb 16 - Mar 28",
    locationValueKey: "Sønderborg Kommune (8 km)",
    certificatesValueKey: "3 verified",
    certificateKeys: [
      "Hot work certification",
      "Safety training (BAS-U)",
      "Working at heights",
    ],
    scoreKey: "92%",
  },
];

export const MATCHES_AWAITING_CONFIRMATION_OFFER: AwaitingConfirmationOffer = {
  id: "mobile-crane-2",
  titleKey: "2 Mobile crane",
  statusKey: "Awaiting confirmation",
  descriptionKey:
    "You accepted this offer. The capacity provider is reviewing your request and will confirm or decline within 48 hours.",
  periodValueKey: "Feb 15 - Mar 15",
  locationValueKey: "Sønderborg (15 km)",
  certificatesValueKey: "0 certificates verified",
};

export const MATCHES_ACCEPTANCE_NOTICE =
  "Accepting sends a confirmation request to the capacity provider. Cooperation begins only after mutual confirmation.";
