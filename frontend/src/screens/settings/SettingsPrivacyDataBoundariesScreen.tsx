"use client";

import { SettingsPrivacyDataBoundariesCard } from "@/components/settings/SettingsPrivacyDataBoundariesCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type SettingsPrivacyDataBoundariesScreenProps = {
  user: AuthenticatedUser;
};

export function SettingsPrivacyDataBoundariesScreen({
  user,
}: SettingsPrivacyDataBoundariesScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <SettingsScreenLayout
      user={user}
      t={t}
      activeSection="privacyDataBoundaries"
      dataNodeId="1:5451"
    >
      <SettingsPrivacyDataBoundariesCard t={t} />
    </SettingsScreenLayout>
  );
}
