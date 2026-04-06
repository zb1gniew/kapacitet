type PlatformSummaryCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "blue" | "green" | "amber" | "slate";
};

const toneClassNames = {
  blue: "border-[#bedbff] bg-[#eff6ff] text-[#1d4ed8]",
  green: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
  amber: "border-[#fde68a] bg-[#fff8db] text-[#92400e]",
  slate: "border-[#d4d4d8] bg-[#fafafa] text-[#334155]",
} as const;

export function PlatformSummaryCard({
  label,
  value,
  helper,
  tone = "blue",
}: PlatformSummaryCardProps) {
  return (
    <article
      className={`rounded-[16px] border p-5 shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)] ${toneClassNames[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-[-0.4492px]">{value}</p>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] opacity-90">
        {helper}
      </p>
    </article>
  );
}
