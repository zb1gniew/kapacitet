"use client";

import { SettingsCompanyInformationCard } from "@/components/settings/SettingsCompanyInformationCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type SettingsCompanyInformationScreenProps = {
  user: AuthenticatedUser;
};

export function SettingsCompanyInformationScreen({
  user,
}: SettingsCompanyInformationScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <SettingsScreenLayout
      user={user}
      t={t}
      activeSection="companyInformation"
      dataNodeId="1:5053"
    >
      <SettingsCompanyInformationCard t={t} user={user} />
    </SettingsScreenLayout>
  );
}
