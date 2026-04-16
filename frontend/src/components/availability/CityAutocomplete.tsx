"use client";

import { useEffect, useRef, useState } from "react";
import { getCitySuggestions } from "@/constants/cities";
import { LocationIcon } from "@/components/availability/icons";

type CityAutocompleteProps = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
};

export function CityAutocomplete({
  value,
  onChange,
  placeholder,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hits = getCitySuggestions(value);
    setSuggestions(hits);
    setOpen(hits.length > 0);
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSelect(city: string) {
    onChange(city);
    setOpen(false);
    inputRef.current?.blur();
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
      case "Escape":
        setOpen(false);
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
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <LocationIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-[50px] w-full rounded-[10px] border border-neutral-300 bg-white pl-11 pr-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
      />
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[10px] border border-neutral-200 bg-white shadow-lg"
        >
          {suggestions.map((city, index) => (
            <li
              key={city}
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(event) => {
                // Prevent the input from losing focus before the click registers
                event.preventDefault();
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
