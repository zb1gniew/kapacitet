import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "./icons";

type OnboardingActionCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: ReactNode;
  highlighted?: boolean;
};

export function OnboardingActionCard({
  title,
  description,
  ctaLabel,
  href,
  icon,
  highlighted = false,
}: OnboardingActionCardProps) {
  return (
    <article
      className={`rounded-[14px] border p-6 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] ${
        highlighted
          ? "border-[#8ec5ff] bg-[#eff6ff]"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] ${
          highlighted
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {icon}
      </div>

      <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
        {title}
      </h3>
      <p className="mt-2 min-h-[68px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {description}
      </p>

      <Link
        href={href}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-base font-semibold tracking-[-0.3125px] ${
          highlighted
            ? "bg-blue-600 text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]"
            : "border border-neutral-300 bg-neutral-100 text-neutral-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]"
        }`}
      >
        <span>{ctaLabel}</span>
        <ArrowRightIcon className="h-[18px] w-[18px]" />
      </Link>
    </article>
  );
}
