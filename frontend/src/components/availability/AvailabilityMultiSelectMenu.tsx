"use client";

import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogItem } from "@/lib/backend/catalog";

type AvailabilityMultiSelectMenuProps = {
  items: CatalogItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onClearAll: () => void;
  buttonPlaceholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  selectedLabel: string;
  selectedItemsLabel: string;
  clearAllLabel: string;
};

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="m5.833 7.917 4.167 4.166 4.167-4.166"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M4.167 5.833h11.666M4.167 10h11.666M4.167 14.167h11.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function AvailabilityMultiSelectMenu({
  items,
  selectedIds,
  onToggle,
  onClearAll,
  buttonPlaceholder,
  searchPlaceholder,
  emptyMessage,
  selectedLabel,
  selectedItemsLabel,
  clearAllLabel,
}: AvailabilityMultiSelectMenuProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const searchInputId = useId();

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const category = item.category?.toLowerCase() ?? "";
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.code?.toLowerCase().includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const summaryText =
    selectedItems.length === 0
      ? buttonPlaceholder
      : selectedItems.length <= 2
        ? selectedItems.map((item) => t(item.name)).join(", ")
        : `${selectedItems.length} ${selectedLabel}`;

  return (
    <div className="space-y-3">
      <details className="group overflow-hidden rounded-[12px] border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.08)] [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium tracking-[-0.1504px] text-neutral-700">
                <MenuIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="truncate">{summaryText}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold tracking-[-0.1172px] text-neutral-600">
                {selectedItems.length}
              </span>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
            </div>
          </div>
        </summary>

        <div className="border-t border-neutral-200 px-4 py-4">
          <label htmlFor={searchInputId} className="sr-only">
            {searchPlaceholder}
          </label>
          <input
            id={searchInputId}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-[44px] w-full rounded-[10px] border border-neutral-300 px-3 text-sm tracking-[-0.1504px] text-neutral-900 placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
          />

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-3 transition ${
                      isSelected
                        ? "border-blue-200 bg-blue-50"
                        : "border-neutral-200 bg-neutral-50 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium tracking-[-0.1504px] text-neutral-800">
                        {t(item.name)}
                      </span>
                      {item.category ? (
                        <span className="mt-0.5 block text-xs uppercase tracking-[0.08em] text-neutral-500">
                          {t(item.category)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="rounded-[10px] border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500">
                {emptyMessage}
              </p>
            )}
          </div>

          {selectedItems.length > 0 ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onClearAll}
                className="text-sm font-medium tracking-[-0.1504px] text-blue-700 hover:text-blue-800"
              >
                {clearAllLabel}
              </button>
            </div>
          ) : null}
        </div>
      </details>

      {selectedItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
            {selectedItemsLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium tracking-[-0.1504px] text-blue-700"
              >
                {t(item.name)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
