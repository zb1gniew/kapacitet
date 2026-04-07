type PlatformMockPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  actionLabel?: string;
};

export function PlatformMockPanel({
  eyebrow,
  title,
  description,
  items,
  actionLabel = "Planned interaction",
}: PlatformMockPanelProps) {
  return (
    <article className="rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563eb]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.3125px] text-neutral-900">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-[24px] tracking-[-0.1504px] text-neutral-600">
        {description}
      </p>

      <div className="mt-5 rounded-[14px] border border-[#dbeafe] bg-[#f8fbff] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#1d4ed8]">
          {actionLabel}
        </p>
        <ul className="mt-3 space-y-3 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-700">
          {items.map((item) => (
            <li key={item} className="rounded-[10px] bg-white px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
