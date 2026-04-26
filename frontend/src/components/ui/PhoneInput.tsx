"use client";

import { useRef, useState } from "react";
import {
  EU_PHONE_PREFIXES,
  parsePhoneValue,
  type EuCountryPhone,
} from "@/constants/eu-phone-prefixes";
import type { TranslateFn } from "@/types/i18n";

type PhoneInputProps = {
  /** Full E.164 phone string, e.g. "+4512345678" or "". */
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  /** "md" = auth-form height (50px), "sm" = settings height (42px). Default: "sm". */
  size?: "sm" | "md";
  placeholder?: string;
  disabled?: boolean;
  t?: TranslateFn;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PhoneInput({
  value,
  onChange,
  error = false,
  size = "sm",
  placeholder,
  disabled = false,
  t = (key) => key,
}: PhoneInputProps) {
  // Fully controlled: derive country + localNumber from value prop every render.
  // No useEffect needed — the parent drives state via onChange.
  const { country, localNumber } = parsePhoneValue(value);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  function openDropdown() {
    setSearch("");
    setOpen(true);
    // focus after the dropdown renders
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function closeDropdown() {
    setOpen(false);
  }

  function toggleDropdown() {
    if (open) closeDropdown();
    else openDropdown();
  }

  function handleLocalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    onChange(country.prefix + digits);
  }

  function selectCountry(c: EuCountryPhone) {
    closeDropdown();
    onChange(c.prefix + localNumber);
    numberRef.current?.focus();
  }

  function handleContainerPointerDown(e: React.PointerEvent) {
    // Close when clicking outside the dropdown but inside container isn't needed;
    // we handle it at document level via onBlur-equivalent below.
    void e;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") closeDropdown();
  }

  const filtered = EU_PHONE_PREFIXES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.prefix.includes(search),
  );

  const height = size === "md" ? "h-[50px]" : "h-[42px]";
  const borderColor = error ? "border-red-300" : "border-neutral-300";

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerDown={handleContainerPointerDown}
      // Close dropdown when focus leaves the whole component
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          closeDropdown();
        }
      }}
    >
      {/* Combined field */}
      <div
        className={`flex ${height} w-full overflow-visible rounded-[10px] border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] ${borderColor} ${disabled ? "opacity-60" : ""}`}
      >
        {/* Country selector */}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("Select country code")}
          className="flex shrink-0 items-center gap-1.5 rounded-l-[10px] border-r border-neutral-200 px-3 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="font-mono text-sm font-medium text-neutral-700">
            {country.prefix}
          </span>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Local number input */}
        <input
          ref={numberRef}
          type="tel"
          inputMode="numeric"
          value={localNumber}
          disabled={disabled}
          onChange={(e) => handleLocalChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            Array.from({ length: country.minDigits }, () => "0").join("")
          }
          className="min-w-0 flex-1 rounded-r-[10px] bg-transparent px-3 text-sm tracking-[-0.1504px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[230px] rounded-[10px] border border-neutral-200 bg-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          {/* Search */}
          <div className="border-b border-neutral-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeDropdown();
              }}
              placeholder={t("Search country…")}
              className="h-8 w-full rounded-[7px] border border-neutral-200 bg-neutral-50 px-2.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* List */}
          <ul
            role="listbox"
            aria-label={t("Country codes")}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.map((c) => (
              <li key={c.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === country.code}
                  onPointerDown={(e) => {
                    // Prevent blur on the container before click registers
                    e.preventDefault();
                    selectCountry(c);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-neutral-50 ${
                    c.code === country.code
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-neutral-700"
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-xs">{t(c.name)}</span>
                  <span className="font-mono text-xs text-neutral-500">
                    {c.prefix}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-400">
                {t("No results")}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
