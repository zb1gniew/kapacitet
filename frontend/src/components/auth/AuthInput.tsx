import type { ReactNode } from "react";

type AuthInputProps = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  placeholder?: string;
  autoComplete?: string;
  icon: ReactNode;
  required?: boolean;
};

export function AuthInput({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  required = true,
}: AuthInputProps) {
  return (
    <div className="w-full space-y-2" data-name="Field">
      <label
        htmlFor={id}
        className="block text-sm font-semibold tracking-[-0.15px] text-neutral-900"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-[50px] w-full rounded-[10px] border border-neutral-300 bg-white pl-12 pr-4 text-base tracking-[-0.312px] text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.10)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          required={required}
        />
      </div>
    </div>
  );
}
