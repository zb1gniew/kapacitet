"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  COMPANY_CATEGORIES,
  CATEGORY_LABELS,
  MAX_CATEGORIES,
} from "@/constants/categories";

type CategoryMultiSelectProps = {
  value: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  /** Use "sm" in compact forms (min-h-[42px]). Defaults to min-h-[50px]. */
  size?: "sm" | "md";
  error?: boolean;
};

export function CategoryMultiSelect({
  value,
  onChange,
  placeholder,
  size = "md",
  error = false,
}: CategoryMultiSelectProps) {
  const { t } = useTranslation();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isAtMax = value.length >= MAX_CATEGORIES;

  const suggestions = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return COMPANY_CATEGORIES.filter((key) => {
      if (value.includes(key)) return false;
      if (!lower) return true;
      const label = t(CATEGORY_LABELS[key]).toLowerCase();
      return label.startsWith(lower) || label.includes(lower);
    });
  }, [query, value, t]);

  function handleSelect(key: string) {
    if (value.includes(key) || isAtMax) return;
    onChange([...value, key]);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleRemove(key: string) {
    onChange(value.filter((k) => k !== key));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !query && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (!open) {
      if (event.key === "ArrowDown") {
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          event.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case "Tab":
        if (activeIndex >= 0) {
          event.preventDefault();
          handleSelect(suggestions[activeIndex]);
        } else if (suggestions.length === 1) {
          event.preventDefault();
          handleSelect(suggestions[0]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const borderClass = error
    ? "border-red-300 focus-within:border-red-500"
    : open
      ? "border-blue-600"
      : "border-neutral-300";

  return (
    <div className="relative">
      <div
        className={`flex cursor-text flex-wrap items-center gap-1.5 rounded-[10px] border bg-white px-3 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] ${size === "sm" ? "min-h-[42px] py-1" : "min-h-[50px] py-1.5"} ${borderClass}`}
        onClick={() => {
          if (!isAtMax) inputRef.current?.focus();
        }}
      >
        {value.map((key) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-[6px] bg-blue-50 font-medium text-blue-700 ${size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-sm"}`}
          >
            {t(CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key)}
            <button
              type="button"
              aria-label={`Remove ${t(CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key)}`}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(key);
              }}
              className="leading-none text-blue-400 transition hover:text-blue-700"
            >
              ×
            </button>
          </span>
        ))}

        {!isAtMax ? (
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && activeIndex >= 0
                ? `${listId}-option-${activeIndex}`
                : undefined
            }
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length === 0
                ? (placeholder ?? t("Search categories…"))
                : undefined
            }
            className={`min-w-[120px] flex-1 bg-transparent tracking-[-0.3125px] text-neutral-900 outline-none placeholder:text-neutral-500 ${size === "sm" ? "text-sm" : "text-base"}`}
          />
        ) : (
          <span
            className={`text-neutral-400 ${size === "sm" ? "text-xs" : "text-sm"}`}
          >
            {t("Max {{count}} selected", { count: MAX_CATEGORIES })}
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[10px] border border-neutral-200 bg-white shadow-lg"
        >
          {suggestions.map((key, index) => (
            <li
              key={key}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(e) => {
                // Prevent input blur before selection registers.
                e.preventDefault();
                handleSelect(key);
              }}
              className={`cursor-pointer px-4 py-2.5 text-sm tracking-[-0.1504px] text-neutral-900 first:rounded-t-[10px] last:rounded-b-[10px] ${
                index === activeIndex
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-neutral-50"
              }`}
            >
              {t(CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
