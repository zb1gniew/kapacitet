"use client";

import { useMemo, useState } from "react";
import {
  getAvailabilityDraftStorageKey,
  getCapacityRequestDraftStorageKey,
} from "@/lib/workflows/payloads";
import { APP_ROUTES } from "@/constants/routes";
import type {
  AvailabilityDraft,
  CapacityRequestDraft,
  StoredDraft,
} from "@/types/workflows";

export type SavedDraftInfo = {
  type: "availability" | "request";
  titleKey: string;
  updatedAt: string;
  resumeHref: string;
  storageKey: string;
};

function readStoredDraft<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft<T>;
  } catch {
    return null;
  }
}

function hasMeaningfulData(
  draft: AvailabilityDraft | CapacityRequestDraft,
): boolean {
  return (
    draft.quantity !== "" ||
    draft.skillIds.length > 0 ||
    draft.startDate !== "" ||
    draft.locationCity !== ""
  );
}

function getResumeHref(
  draft: AvailabilityDraft | CapacityRequestDraft,
  type: "availability" | "request",
): string {
  const step3Complete = draft.startDate !== "" && draft.locationCity !== "";
  const step2Complete =
    draft.quantity !== "" ||
    draft.skillIds.length > 0 ||
    draft.certificateIds.length > 0;

  if (type === "availability") {
    if (step3Complete) return APP_ROUTES.declareAvailabilityWorkersStep4;
    if (step2Complete) return APP_ROUTES.declareAvailabilityWorkersStep3;
    return APP_ROUTES.declareAvailabilityWorkersStep2;
  } else {
    if (step3Complete) return APP_ROUTES.requestCapacityWorkersStep4;
    if (step2Complete) return APP_ROUTES.requestCapacityWorkersStep3;
    return APP_ROUTES.requestCapacityWorkersStep2;
  }
}

export function useSavedDrafts(userId: string) {
  const [discardedStorageKeys, setDiscardedStorageKeys] = useState<string[]>(
    [],
  );

  const drafts = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const results: SavedDraftInfo[] = [];

    const availabilityKey = getAvailabilityDraftStorageKey(userId);
    const availabilityDraft =
      readStoredDraft<AvailabilityDraft>(availabilityKey);
    if (availabilityDraft && hasMeaningfulData(availabilityDraft.data)) {
      results.push({
        type: "availability",
        titleKey: "Declare availability",
        updatedAt: availabilityDraft._updatedAt ?? availabilityDraft._createdAt,
        resumeHref: getResumeHref(availabilityDraft.data, "availability"),
        storageKey: availabilityKey,
      });
    }

    const requestKey = getCapacityRequestDraftStorageKey(userId);
    const requestDraft = readStoredDraft<CapacityRequestDraft>(requestKey);
    if (requestDraft && hasMeaningfulData(requestDraft.data)) {
      results.push({
        type: "request",
        titleKey: "Request capacity",
        updatedAt: requestDraft._updatedAt ?? requestDraft._createdAt,
        resumeHref: getResumeHref(requestDraft.data, "request"),
        storageKey: requestKey,
      });
    }

    return results.filter(
      (draft) => !discardedStorageKeys.includes(draft.storageKey),
    );
  }, [discardedStorageKeys, userId]);

  const discardDraft = (storageKey: string) => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore storage errors
    }
    setDiscardedStorageKeys((prev) =>
      prev.includes(storageKey) ? prev : [...prev, storageKey],
    );
  };

  return { drafts, discardDraft };
}
