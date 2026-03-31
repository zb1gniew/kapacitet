import type { ReactNode } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  icon?: ReactNode;
  placeholder?: string;
  value?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  readOnly?: boolean;
};

export function AuthField({
  id,
  label,
  required,
  optional,
  icon,
  placeholder,
  value,
  helperText,
  multiline,
  rows = 4,
  readOnly = false,
}: AuthFieldProps) {
  const sharedInputClassName = [
    "w-full rounded-[10px] border border-neutral-300 shadow-[0_1px_3px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.10)]",
    "text-base tracking-[-0.3125px] text-neutral-950",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
    readOnly ? "bg-neutral-50" : "bg-white",
  ].join(" ");

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900"
      >
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
        {optional ? (
          <span className="ml-1 font-normal text-neutral-500">(optional)</span>
        ) : null}
      </label>

      {multiline ? (
        readOnly ? (
          <textarea
            id={id}
            name={id}
            rows={rows}
            value={value ?? ""}
            readOnly
            className={`${sharedInputClassName} resize-none px-4 py-3 leading-6`}
          />
        ) : (
          <textarea
            id={id}
            name={id}
            rows={rows}
            placeholder={placeholder}
            defaultValue={value}
            required={required}
            className={`${sharedInputClassName} resize-none px-4 py-3 leading-6`}
          />
        )
      ) : (
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </span>
          ) : null}
          {readOnly ? (
            <input
              id={id}
              name={id}
              type="text"
              value={value ?? ""}
              readOnly
              className={`${sharedInputClassName} h-[50px] ${
                icon ? "pl-12 pr-4" : "px-4"
              }`}
            />
          ) : (
            <input
              id={id}
              name={id}
              type="text"
              placeholder={placeholder}
              defaultValue={value}
              required={required}
              className={`${sharedInputClassName} h-[50px] ${
                icon ? "pl-12 pr-4" : "px-4"
              }`}
            />
          )}
        </div>
      )}

      {helperText ? (
        <p className="text-xs leading-4 tracking-[-0.15px] text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
