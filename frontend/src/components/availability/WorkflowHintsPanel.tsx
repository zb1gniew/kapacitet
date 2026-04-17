import type { WorkflowHint } from "@/lib/workflows/hints";

type WorkflowHintsPanelProps = {
  hints: WorkflowHint[];
};

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9 1.5A5.25 5.25 0 0 0 3.75 6.75c0 1.96 1.073 3.67 2.659 4.577.246.14.41.388.447.666L7.14 13.5h3.72l.284-1.507a.75.75 0 0 1 .447-.666A5.25 5.25 0 0 0 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M7.125 13.5v.75A1.125 1.125 0 0 0 9 15.375a1.125 1.125 0 0 0 1.875-.75V13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WorkflowHintsPanel({ hints }: WorkflowHintsPanelProps) {
  if (hints.length === 0) return null;

  return (
    <div className="space-y-2">
      {hints.map((hint) => (
        <div
          key={hint.id}
          className="flex items-start gap-3 rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3"
        >
          <LightbulbIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-blue-500" />
          <p className="text-xs leading-[19.5px] tracking-[-0.1172px] text-blue-800">
            {hint.message}
          </p>
        </div>
      ))}
    </div>
  );
}
