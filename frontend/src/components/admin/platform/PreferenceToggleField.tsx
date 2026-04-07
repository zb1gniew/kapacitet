type PreferenceToggleFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function PreferenceToggleField({
  label,
  description,
  checked,
  onChange,
}: PreferenceToggleFieldProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[14px] border border-neutral-200 bg-[#fafafa] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {description}
        </p>
      </div>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#1d4ed8]" : "bg-neutral-300"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}
