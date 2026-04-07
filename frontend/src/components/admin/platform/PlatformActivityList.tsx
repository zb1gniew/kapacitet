import Link from "next/link";

type PlatformActivityTone = "neutral" | "success" | "warning" | "danger";

type PlatformActivityItem = {
  id: string;
  title: string;
  meta: string;
  helper?: string;
  href?: string;
  statusLabel?: string;
  statusTone?: PlatformActivityTone;
};

type PlatformActivityListProps = {
  items: PlatformActivityItem[];
  emptyMessage: string;
  ctaLabel?: string;
};

function getStatusClasses(tone: PlatformActivityTone = "neutral") {
  switch (tone) {
    case "success":
      return "border-[#b9f8cf] bg-[#f0fdf4] text-[#166534]";
    case "warning":
      return "border-[#fde68a] bg-[#fff8db] text-[#92400e]";
    case "danger":
      return "border-[#fecaca] bg-[#fff5f5] text-[#b91c1c]";
    default:
      return "border-neutral-200 bg-[#fafafa] text-neutral-700";
  }
}

export function PlatformActivityList({
  items,
  emptyMessage,
  ctaLabel = "Open",
}: PlatformActivityListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-600">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const content = (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {item.title}
                </p>
                {item.statusLabel ? (
                  <span
                    className={`inline-flex rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      item.statusTone,
                    )}`}
                  >
                    {item.statusLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-neutral-600">{item.meta}</p>
              {item.helper ? (
                <p className="mt-1 text-sm text-neutral-700">{item.helper}</p>
              ) : null}
            </div>
            {item.href ? (
              <span className="text-sm font-semibold text-[#1d4ed8]">
                {ctaLabel}
              </span>
            ) : null}
          </>
        );

        if (!item.href) {
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3"
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 transition hover:border-[#bedbff] hover:bg-[#f8fbff]"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
