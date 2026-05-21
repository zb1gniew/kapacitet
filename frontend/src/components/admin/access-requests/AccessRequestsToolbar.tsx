"use client";

import { getCategoryLabel } from "@/constants/categories";
import type {
  AccessRequestAdvancedFilters,
  AccessRequestDateField,
  AccessRequestProvisioningFilter,
  AccessRequestRejectionReasonFilter,
  SavedAccessRequestView,
} from "@/components/admin/access-requests/types";
import type { TranslateFn } from "@/types/i18n";

type AccessRequestsToolbarProps = {
  t: TranslateFn;
  filters: AccessRequestAdvancedFilters;
  onFilterChange: <K extends keyof AccessRequestAdvancedFilters>(
    key: K,
    value: AccessRequestAdvancedFilters[K],
  ) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
  industries: string[];
  locations: string[];
  reviewers: string[];
  savedViews: SavedAccessRequestView[];
  activeSavedViewId: string | null;
  saveViewName: string;
  onSaveViewNameChange: (value: string) => void;
  onSaveCurrentView: () => void;
  onApplySavedView: (id: string) => void;
  onDeleteSavedView: (id: string) => void;
};

export function AccessRequestsToolbar({
  t,
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
  industries,
  locations,
  reviewers,
  savedViews,
  activeSavedViewId,
  saveViewName,
  onSaveViewNameChange,
  onSaveCurrentView,
  onApplySavedView,
  onDeleteSavedView,
}: AccessRequestsToolbarProps) {
  return (
    <section className="mt-6 rounded-[18px] border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("Advanced filters")}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {t(
                "Slice the request queue by company profile, reviewer activity, decision detail, and provisioning status.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-neutral-700">
              {t("Showing {{count}} of {{total}} requests", {
                count: resultCount,
                total: totalCount,
              })}
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              {t("Clear filters")}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Search")}
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder={t(
                "Search by request ID, company ID, company, contact email, or note",
              )}
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Industry")}
            </span>
            <select
              value={filters.industry}
              onChange={(event) =>
                onFilterChange("industry", event.target.value)
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="">{t("All industries")}</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {t(getCategoryLabel(industry))}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Location")}
            </span>
            <select
              value={filters.location}
              onChange={(event) =>
                onFilterChange("location", event.target.value)
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="">{t("All locations")}</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Reviewer")}
            </span>
            <select
              value={filters.reviewer}
              onChange={(event) =>
                onFilterChange("reviewer", event.target.value)
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="">{t("All reviewers")}</option>
              {reviewers.map((reviewer) => (
                <option key={reviewer} value={reviewer}>
                  {reviewer}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Date field")}
            </span>
            <select
              value={filters.dateField}
              onChange={(event) =>
                onFilterChange(
                  "dateField",
                  event.target.value as AccessRequestDateField,
                )
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="Submitted">{t("Submitted date")}</option>
              <option value="Reviewed">{t("Reviewed date")}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("From")}
            </span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) =>
                onFilterChange("fromDate", event.target.value)
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("To")}
            </span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => onFilterChange("toDate", event.target.value)}
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Rejection reason")}
            </span>
            <select
              value={filters.rejectionReason}
              onChange={(event) =>
                onFilterChange(
                  "rejectionReason",
                  event.target.value as AccessRequestRejectionReasonFilter,
                )
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="All">{t("All requests")}</option>
              <option value="With reason">{t("With rejection reason")}</option>
              <option value="Without reason">
                {t("Without rejection reason")}
              </option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Provisioning link")}
            </span>
            <select
              value={filters.provisioningLink}
              onChange={(event) =>
                onFilterChange(
                  "provisioningLink",
                  event.target.value as AccessRequestProvisioningFilter,
                )
              }
              className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
            >
              <option value="All">{t("All requests")}</option>
              <option value="Linked">{t("Provisioning linked")}</option>
              <option value="Not linked">{t("Provisioning not linked")}</option>
            </select>
          </label>
        </div>

        <div className="rounded-[14px] border border-neutral-200 bg-[#fafafa] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                {t("Saved views")}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {t(
                  "Save reusable queue slices for common review workflows. The current tab is included in the saved view.",
                )}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[520px]">
              <input
                type="text"
                value={saveViewName}
                onChange={(event) => onSaveViewNameChange(event.target.value)}
                placeholder={t("Save current filters as...")}
                className="h-11 flex-1 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
              />
              <button
                type="button"
                onClick={onSaveCurrentView}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#1d4ed8] px-4 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              >
                {t("Save view")}
              </button>
            </div>
          </div>

          {savedViews.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">
              {t(
                "No saved views yet. Save your current filters to reuse them.",
              )}
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {savedViews.map((view) => {
                const isActive = view.id === activeSavedViewId;

                return (
                  <div
                    key={view.id}
                    className={`flex items-center gap-2 rounded-[12px] border px-3 py-2 ${
                      isActive
                        ? "border-[#1d4ed8] bg-[#eff6ff]"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onApplySavedView(view.id)}
                      className={`text-sm font-semibold ${
                        isActive ? "text-[#1d4ed8]" : "text-neutral-800"
                      }`}
                    >
                      {view.name}
                    </button>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-neutral-500">
                      {t(view.tab)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedView(view.id)}
                      className="text-xs font-semibold text-neutral-500 transition hover:text-[#b91c1c]"
                    >
                      {t("Delete")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
