import type { ReactNode } from "react";

type PlatformSurfaceCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function PlatformSurfaceCard({
  title,
  description,
  eyebrow,
  children,
}: PlatformSurfaceCardProps) {
  return (
    <section className="rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563eb]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.3125px] text-neutral-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-[24px] tracking-[-0.1504px] text-neutral-600">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
