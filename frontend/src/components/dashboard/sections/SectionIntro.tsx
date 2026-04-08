import type { ReactNode } from "react";

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  aside,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: SectionIntroProps) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 ${eyebrowClassName ?? ""}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h3
            className={`text-sm font-semibold text-neutral-900 ${titleClassName ?? ""}`}
          >
            {title}
          </h3>
        </div>
        {aside}
      </div>
      {description ? (
        <p
          className={`mb-3 text-xs leading-5 text-neutral-500 ${descriptionClassName ?? ""}`}
        >
          {description}
        </p>
      ) : null}
    </>
  );
}
