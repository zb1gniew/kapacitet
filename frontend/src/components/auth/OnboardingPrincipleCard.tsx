import type { ReactNode } from "react";

type OnboardingPrincipleCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  iconToneClassName: string;
};

export function OnboardingPrincipleCard({
  title,
  description,
  icon,
  iconToneClassName,
}: OnboardingPrincipleCardProps) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-neutral-50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="flex gap-4">
        <div
          className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] border border-neutral-200 bg-white ${iconToneClassName}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
