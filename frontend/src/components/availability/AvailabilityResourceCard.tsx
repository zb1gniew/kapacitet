import type { ReactNode } from "react";

type AvailabilityResourceCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  selected?: boolean;
  onSelect: () => void;
};

export function AvailabilityResourceCard({
  title,
  description,
  icon,
  selected = false,
  onSelect,
}: AvailabilityResourceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[14px] border p-8 text-left shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition ${
        selected
          ? "border-blue-600 bg-[#eff6ff]"
          : "border-neutral-200 bg-white hover:border-blue-300"
      }`}
    >
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-600 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
        {icon}
      </span>
      <h3 className="mt-6 text-lg font-bold leading-7 tracking-[-0.4395px] text-neutral-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {description}
      </p>
    </button>
  );
}
