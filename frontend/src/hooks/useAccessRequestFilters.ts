"use client";

import { useMemo, useState } from "react";
import type {
  AccessRequestAdvancedFilters,
  SavedAccessRequestView,
} from "@/components/admin/access-requests/types";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";

const DEFAULT_ADVANCED_FILTERS: AccessRequestAdvancedFilters = {
  search: "",
  industry: "",
  location: "",
  reviewer: "",
  dateField: "Submitted",
  fromDate: "",
  toDate: "",
  rejectionReason: "All",
  provisioningLink: "All",
};

const SAVED_VIEWS_STORAGE_KEY =
  "kapacitet.admin.access-requests.saved-views.v1";

function getStartOfDayTimestamp(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function getEndOfDayTimestamp(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
}

type UseAccessRequestFiltersArgs = {
  requests: AccessRequest[];
  currentActiveTab: AccessRequestFilterTab;
  t: TranslateFn;
  setToastMessage: (message: string) => void;
};

export function useAccessRequestFilters({
  requests,
  currentActiveTab,
  t,
  setToastMessage,
}: UseAccessRequestFiltersArgs) {
  const [advancedFilters, setAdvancedFilters] =
    useState<AccessRequestAdvancedFilters>(DEFAULT_ADVANCED_FILTERS);
  const [saveViewName, setSaveViewName] = useState("");
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(
    null,
  );
  const [savedViews, setSavedViews] = useLocalStorageState<
    SavedAccessRequestView[]
  >(SAVED_VIEWS_STORAGE_KEY, []);

  const industryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          requests.flatMap((request) =>
            request.categories.filter((category) => category.trim().length > 0),
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [requests],
  );

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(requests.map((request) => request.location))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [requests],
  );

  const reviewerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          requests
            .map((request) => request.reviewedBy?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = advancedFilters.search.trim().toLowerCase();

    return requests.filter((request) => {
      if (currentActiveTab !== "All" && request.status !== currentActiveTab) {
        return false;
      }

      if (
        advancedFilters.industry &&
        !request.categories.includes(advancedFilters.industry)
      ) {
        return false;
      }

      if (
        advancedFilters.location &&
        request.location !== advancedFilters.location
      ) {
        return false;
      }

      if (
        advancedFilters.reviewer &&
        (request.reviewedBy ?? "") !== advancedFilters.reviewer
      ) {
        return false;
      }

      if (advancedFilters.rejectionReason === "With reason") {
        if (request.status !== "Rejected" || !request.rejectionReason?.trim()) {
          return false;
        }
      }

      if (advancedFilters.rejectionReason === "Without reason") {
        if (
          request.status !== "Rejected" ||
          Boolean(request.rejectionReason?.trim())
        ) {
          return false;
        }
      }

      if (
        advancedFilters.provisioningLink === "Linked" &&
        !request.provisionedCompanyId
      ) {
        return false;
      }

      if (
        advancedFilters.provisioningLink === "Not linked" &&
        request.provisionedCompanyId
      ) {
        return false;
      }

      if (advancedFilters.fromDate || advancedFilters.toDate) {
        const referenceValue =
          advancedFilters.dateField === "Reviewed"
            ? request.reviewedAt
            : request.createdAt;

        if (!referenceValue) {
          return false;
        }

        const referenceTime = new Date(referenceValue).getTime();
        if (Number.isNaN(referenceTime)) {
          return false;
        }

        if (
          advancedFilters.fromDate &&
          referenceTime < getStartOfDayTimestamp(advancedFilters.fromDate)
        ) {
          return false;
        }

        if (
          advancedFilters.toDate &&
          referenceTime > getEndOfDayTimestamp(advancedFilters.toDate)
        ) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        String(request.id),
        request.provisionedCompanyId
          ? String(request.provisionedCompanyId)
          : "",
        request.name,
        ...request.categories,
        request.location,
        request.contactEmail,
        request.message,
        request.reviewedBy,
        request.rejectionReason,
      ]
        .filter(Boolean)
        .some((value) =>
          value?.toString().toLowerCase().includes(normalizedSearch),
        );
    });
  }, [advancedFilters, currentActiveTab, requests]);

  function handleAdvancedFilterChange<
    K extends keyof AccessRequestAdvancedFilters,
  >(key: K, value: AccessRequestAdvancedFilters[K]) {
    setAdvancedFilters((current: AccessRequestAdvancedFilters) => ({
      ...current,
      [key]: value,
    }));
    setActiveSavedViewId(null);
  }

  function handleClearFilters() {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
    setActiveSavedViewId(null);
    setSaveViewName("");
  }

  function handleSaveCurrentView() {
    const trimmedName = saveViewName.trim();
    if (!trimmedName) {
      setToastMessage(t("Enter a name before saving this view."));
      return;
    }

    const existingView = savedViews.find(
      (view) => view.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    const nextView: SavedAccessRequestView = {
      id: existingView?.id ?? crypto.randomUUID(),
      name: trimmedName,
      tab: currentActiveTab,
      filters: advancedFilters,
    };

    setSavedViews((current) => {
      if (existingView) {
        return current.map((view) =>
          view.id === existingView.id ? nextView : view,
        );
      }

      return [nextView, ...current];
    });
    setActiveSavedViewId(nextView.id);
    setSaveViewName("");
    setToastMessage(
      existingView
        ? t('Updated saved view "{{name}}".', { name: trimmedName })
        : t('Saved view "{{name}}".', { name: trimmedName }),
    );
  }

  function handleApplySavedView(id: string) {
    const view = savedViews.find((savedView) => savedView.id === id);
    if (!view) {
      return null;
    }

    setAdvancedFilters(view.filters);
    setActiveSavedViewId(view.id);
    setSaveViewName(view.name);
    return view.tab;
  }

  function handleDeleteSavedView(id: string) {
    const deletedView = savedViews.find((view) => view.id === id);
    setSavedViews((current) => current.filter((view) => view.id !== id));
    if (activeSavedViewId === id) {
      setActiveSavedViewId(null);
    }
    if (deletedView) {
      setToastMessage(
        t('Deleted saved view "{{name}}".', {
          name: deletedView.name,
        }),
      );
    }
  }

  return {
    advancedFilters,
    filteredRequests,
    industryOptions,
    locationOptions,
    reviewerOptions,
    savedViews,
    activeSavedViewId,
    saveViewName,
    setSaveViewName,
    handleAdvancedFilterChange,
    handleClearFilters,
    handleSaveCurrentView,
    handleApplySavedView,
    handleDeleteSavedView,
  };
}
