import { DASHBOARD_REMINDERS } from "@/constants/dashboard";
import type { DashboardReminder } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { EyeIcon } from "@/components/auth/icons";

type RemindersSectionProps = {
  t: TranslateFn;
};

function getReminderBorderClass(reminder: DashboardReminder) {
  switch (reminder.tone) {
    case "success":
      return "border-l-amber-500";
    case "primary":
      return "border-l-blue-500";
    case "danger":
      return "border-l-red-400";
    default:
      return "border-l-neutral-400";
  }
}

export function RemindersSection({ t }: RemindersSectionProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center gap-2">
        <EyeIcon className="h-4 w-4 text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-900">
          {t("Reminders")}
        </h3>
      </div>
      <div className="space-y-3">
        {DASHBOARD_REMINDERS.map((reminder) => (
          <article
            key={reminder.titleKey}
            className={`rounded-r-[10px] border-l-4 bg-neutral-50 px-3 py-2.5 ${getReminderBorderClass(
              reminder,
            )}`}
          >
            <h4 className="text-sm font-medium text-neutral-900">
              {t(reminder.titleKey)}
            </h4>
            <p className="mt-1 text-xs text-neutral-600">
              {t(reminder.descriptionKey)}
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-500">
              {t(reminder.dateKey)}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}
