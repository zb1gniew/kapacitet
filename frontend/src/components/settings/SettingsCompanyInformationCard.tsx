import {
  CircleCheckIcon,
  EmailIcon,
  InfoIcon,
  MapPinIcon,
} from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";

type SettingsCompanyInformationCardProps = {
  t: TranslateFn;
};

function Label({ label }: { label: string }) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
    </label>
  );
}

function Input({
  value,
  icon,
  type = "text",
}: {
  value: string;
  icon?: "location" | "email";
  type?: "text" | "email" | "tel";
}) {
  const leadingIcon =
    icon === "location" ? (
      <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
    ) : icon === "email" ? (
      <EmailIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
    ) : null;

  return (
    <div className="relative">
      {leadingIcon}
      <input
        type={type}
        defaultValue={value}
        className={`h-[42px] w-full rounded-[10px] border border-neutral-300 bg-white pr-4 text-sm tracking-[-0.1504px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none ${
          icon ? "pl-11" : "pl-4"
        }`}
      />
    </div>
  );
}

export function SettingsCompanyInformationCard({
  t,
}: SettingsCompanyInformationCardProps) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Company information")}
      </h2>

      <div className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-3">
        <div className="flex items-start gap-2 text-[#193cb8]">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
            {t(
              "This information is used internally for account management and displayed to cooperation partners only after mutual confirmation. Changes require administrator approval.",
            )}
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label label={t("Company name")} />
          <Input value={t("Dansk Byggefirma A/S")} />
          <p className="text-[11px] leading-4 text-neutral-500">
            {t("Contact support to update company name")}
          </p>
        </div>

        <div className="space-y-2">
          <Label label={t("Industry")} />
          <Input value={t("Bygge & Anlæg")} />
        </div>

        <div className="space-y-2">
          <Label label={t("Primary location")} />
          <Input value={t("Sønderborg, Danmark")} icon="location" />
        </div>

        <div className="space-y-2">
          <Label label={t("Contact email")} />
          <Input
            value={t("admin@danskbyggefirma.dk")}
            icon="email"
            type="email"
          />
          <p className="text-[11px] leading-4 text-neutral-500">
            {t("Primary contact for platform communications")}
          </p>
        </div>

        <div className="space-y-2">
          <Label label={t("Contact phone")} />
          <Input value={t("+45 74 12 34 56")} type="tel" />
        </div>

        <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700"
          >
            <CircleCheckIcon className="h-4 w-4" />
            {t("Save changes")}
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 transition hover:bg-neutral-100"
          >
            {t("Cancel")}
          </button>
        </div>
      </form>
    </article>
  );
}
