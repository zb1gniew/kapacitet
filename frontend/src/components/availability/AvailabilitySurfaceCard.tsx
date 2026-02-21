import type { ReactNode } from "react";

type AvailabilitySurfaceCardProps = {
  children: ReactNode;
};

export function AvailabilitySurfaceCard({ children }: AvailabilitySurfaceCardProps) {
  return (
    <section className="rounded-[14px] border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      {children}
    </section>
  );
}
