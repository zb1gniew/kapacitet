import type { ButtonHTMLAttributes } from "react";

type SettingsToggleSwitchProps = {
  checked: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "aria-pressed">;

export function SettingsToggleSwitch({
  checked,
  className = "",
  ...props
}: SettingsToggleSwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`relative inline-flex h-7 w-12 items-center rounded-[7px] border border-neutral-300 p-1 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] transition ${
        checked ? "bg-blue-600" : "bg-neutral-300"
      } ${className}`}
      {...props}
    >
      <span
        className={`h-5 w-5 rounded-[5px] bg-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
