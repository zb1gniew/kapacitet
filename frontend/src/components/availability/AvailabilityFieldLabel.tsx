type AvailabilityFieldLabelProps = {
  label: string;
  required?: boolean;
};

export function AvailabilityFieldLabel({
  label,
  required = true,
}: AvailabilityFieldLabelProps) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
      {required ? <span className="text-red-600">*</span> : null}
    </label>
  );
}
