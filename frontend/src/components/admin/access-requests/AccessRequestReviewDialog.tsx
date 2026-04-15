import type { ReactNode } from "react";
import type { TranslateFn } from "@/types/i18n";

type AccessRequestReviewDialogProps = {
  t: TranslateFn;
  title: string;
  description: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmClassName: string;
  submitting: boolean;
};

export function AccessRequestReviewDialog({
  t,
  title,
  description,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmClassName,
  submitting,
}: AccessRequestReviewDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172acc] p-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        <h3 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {description}
        </p>
        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`inline-flex h-11 items-center justify-center rounded-[10px] px-4 text-sm font-semibold text-white transition disabled:opacity-50 ${confirmClassName}`}
          >
            {submitting ? t("Processing...") : t(confirmLabel)}
          </button>
        </div>
      </div>
    </div>
  );
}
