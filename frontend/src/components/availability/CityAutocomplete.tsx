"use client";

import { useId, useMemo, useRef, useState } from "react";
import { getCitySuggestions } from "@/constants/cities";
import { LocationIcon } from "@/components/availability/icons";

type CityAutocompleteProps = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  /** Use "sm" in compact forms (h-[42px]). Defaults to h-[50px]. */
  size?: "sm" | "md";
  disabled?: boolean;
};

export function CityAutocomplete({
  value,
  onChange,
  placeholder,
  size = "md",
  disabled = false,
}: CityAutocompleteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Suggestions are derived directly from value — no useEffect needed.
  const suggestions = useMemo(() => getCitySuggestions(value), [value]);

  // Reset keyboard selection when the typed value changes.
  // Derived-state pattern (setState during render) — intentional and lint-safe.
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setActiveIndex(-1);
  }

  function handleChange(newValue: string) {
    onChange(newValue);
    setOpen(getCitySuggestions(newValue).length > 0);
  }

  function handleSelect(city: string) {
    onChange(city);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
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
        break;
    }
  }

  return (
    <div className="relative">
      <LocationIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open && activeIndex >= 0
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (!disabled && suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${size === "sm" ? "h-[42px] text-sm" : "h-[50px] text-base"} w-full rounded-[10px] border border-neutral-300 bg-white pl-11 pr-4 tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500`}
      />
      {!disabled && open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[10px] border border-neutral-200 bg-white shadow-lg"
        >
          {suggestions.map((city, index) => (
            <li
              key={city}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(e) => {
                // Prevent the input blur from firing before the selection registers.
                e.preventDefault();
                handleSelect(city);
              }}
              className={`cursor-pointer px-4 py-2.5 text-sm tracking-[-0.1504px] text-neutral-900 first:rounded-t-[10px] last:rounded-b-[10px] ${
                index === activeIndex
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-neutral-50"
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
