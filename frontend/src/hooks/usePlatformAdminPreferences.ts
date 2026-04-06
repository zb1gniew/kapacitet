"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AccessRequestFilterTab,
  AuditEventFilterTab,
  PlatformAdminPreferences,
} from "@/types/admin";

const PREFERENCES_ENDPOINT = "/api/admin/platform-preferences";

type Listener = () => void;

const listeners = new Set<Listener>();

let cachedPreferences: PlatformAdminPreferences;
let hasLoadedPreferences = false;
let inFlightPreferencesRequest: Promise<PlatformAdminPreferences> | null = null;

export const DEFAULT_PLATFORM_ADMIN_PREFERENCES: PlatformAdminPreferences = {
  defaultAccessRequestsTab: "Pending",
  defaultAuditFilter: "All",
  prioritizeFollowUpCompanies: true,
  highlightProvisioningAlerts: true,
};

cachedPreferences = DEFAULT_PLATFORM_ADMIN_PREFERENCES;

function isAccessRequestsTab(value: string): value is AccessRequestFilterTab {
  return ["Pending", "Approved", "Rejected", "All"].includes(value);
}

function isAuditFilter(value: string): value is AuditEventFilterTab {
  return ["All", "Submissions", "Decisions", "Provisioning"].includes(value);
}

function normalizePreferences(
  value: Partial<PlatformAdminPreferences> | null | undefined,
): PlatformAdminPreferences {
  const rawAccessRequestsTab = value?.defaultAccessRequestsTab;
  const rawAuditFilter = value?.defaultAuditFilter;

  const defaultAccessRequestsTab =
    rawAccessRequestsTab && isAccessRequestsTab(rawAccessRequestsTab)
      ? rawAccessRequestsTab
    : DEFAULT_PLATFORM_ADMIN_PREFERENCES.defaultAccessRequestsTab;
  const defaultAuditFilter =
    rawAuditFilter && isAuditFilter(rawAuditFilter)
      ? rawAuditFilter
    : DEFAULT_PLATFORM_ADMIN_PREFERENCES.defaultAuditFilter;

  return {
    defaultAccessRequestsTab,
    defaultAuditFilter,
    prioritizeFollowUpCompanies:
      value?.prioritizeFollowUpCompanies ??
      DEFAULT_PLATFORM_ADMIN_PREFERENCES.prioritizeFollowUpCompanies,
    highlightProvisioningAlerts:
      value?.highlightProvisioningAlerts ??
      DEFAULT_PLATFORM_ADMIN_PREFERENCES.highlightProvisioningAlerts,
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      detail?: string;
      title?: string;
    };

    return (
      payload.message ??
      payload.detail ??
      payload.title ??
      "Unable to load platform preferences right now."
    );
  } catch {
    return "Unable to load platform preferences right now.";
  }
}

async function fetchPreferences(force = false): Promise<PlatformAdminPreferences> {
  if (hasLoadedPreferences && !force) {
    return cachedPreferences;
  }

  if (inFlightPreferencesRequest && !force) {
    return inFlightPreferencesRequest;
  }

  inFlightPreferencesRequest = fetch(PREFERENCES_ENDPOINT, {
    method: "GET",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as PlatformAdminPreferences;
      cachedPreferences = normalizePreferences(payload);
      hasLoadedPreferences = true;
      emitChange();

      return cachedPreferences;
    })
    .finally(() => {
      inFlightPreferencesRequest = null;
    });

  return inFlightPreferencesRequest;
}

async function persistPreferences(
  nextPreferences: PlatformAdminPreferences,
): Promise<PlatformAdminPreferences> {
  const response = await fetch(PREFERENCES_ENDPOINT, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(nextPreferences),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as PlatformAdminPreferences;
  cachedPreferences = normalizePreferences(payload);
  hasLoadedPreferences = true;
  emitChange();

  return cachedPreferences;
}

export function usePlatformAdminPreferences() {
  const [preferences, setPreferences] = useState<PlatformAdminPreferences>(
    cachedPreferences,
  );
  const [loaded, setLoaded] = useState(hasLoadedPreferences);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const syncFromCache = () => {
      setPreferences(cachedPreferences);
      setLoaded(hasLoadedPreferences);
    };

    const unsubscribe = subscribe(syncFromCache);
    syncFromCache();

    if (!hasLoadedPreferences) {
      void fetchPreferences()
        .then(() => {
          setErrorMessage("");
          setLoaded(true);
        })
        .catch((error: unknown) => {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load platform preferences right now.",
          );
          setLoaded(true);
        });
    }

    return unsubscribe;
  }, []);

  const updatePreferences = useCallback(
    async (nextPreferences: PlatformAdminPreferences) => {
      setErrorMessage("");
      await persistPreferences(normalizePreferences(nextPreferences));
    },
    [],
  );

  const resetPreferences = useCallback(async () => {
    setErrorMessage("");
    await persistPreferences(DEFAULT_PLATFORM_ADMIN_PREFERENCES);
  }, []);

  return {
    preferences,
    loaded,
    errorMessage,
    updatePreferences,
    resetPreferences,
  };
}
