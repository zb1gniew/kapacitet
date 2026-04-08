import type { DashboardReminder } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { EyeIcon } from "@/components/auth/icons";

type RemindersSectionProps = {
  t: TranslateFn;
  reminders: DashboardReminder[];
  loading: boolean;
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

function formatReminderDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function LoadingReminderCard() {
  return (
    <article className="rounded-r-[10px] border-l-4 border-l-neutral-300 bg-neutral-50 px-3 py-2.5">
      <div className="h-4 w-32 rounded bg-neutral-200" />
      <div className="mt-2 h-3 w-full rounded bg-neutral-100" />
      <div className="mt-2 h-3 w-24 rounded bg-neutral-100" />
    </article>
  );
}

export function RemindersSection({
  t,
  reminders,
  loading,
}: RemindersSectionProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center gap-2">
        <EyeIcon className="h-4 w-4 text-neutral-500" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            {t("Time-sensitive activity")}
          </p>
          <h3 className="text-sm font-semibold text-neutral-900">
            {t("Reminders")}
          </h3>
        </div>
      </div>
      <p className="mb-3 text-xs leading-5 text-neutral-500">
        {t(
          "Upcoming milestones, expiry dates, and response windows that may need attention.",
        )}
      </p>
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <LoadingReminderCard key={index} />
            ))
          : null}
        {!loading && reminders.length === 0 ? (
          <div className="rounded-r-[10px] border-l-4 border-l-neutral-300 bg-neutral-50 px-3 py-4 text-sm text-neutral-600">
            {t("No upcoming deadlines.")}
          </div>
        ) : null}
        {!loading
          ? reminders.map((reminder) => (
              <article
                key={`${reminder.title}-${reminder.date}`}
                className={`rounded-r-[10px] border-l-4 bg-neutral-50 px-3 py-2.5 ${getReminderBorderClass(
                  reminder,
                )}`}
              >
                <h4 className="text-sm font-medium text-neutral-900">
                  {reminder.title}
                </h4>
                <p className="mt-1 text-xs text-neutral-600">
                  {reminder.description}
                </p>
                <p className="mt-1 text-xs font-medium text-neutral-500">
                  {formatReminderDate(reminder.date)}
                </p>
              </article>
            ))
          : null}
      </div>
    </article>
  );
}
