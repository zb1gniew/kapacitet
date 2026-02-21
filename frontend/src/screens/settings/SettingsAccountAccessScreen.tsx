"use client";

import { SettingsAccountAccessCard } from "@/components/settings/SettingsAccountAccessCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type SettingsAccountAccessScreenProps = {
  user: AuthenticatedUser;
};

export function SettingsAccountAccessScreen({
  user,
}: SettingsAccountAccessScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <SettingsScreenLayout
      user={user}
      t={t}
      activeSection="accountAccess"
      dataNodeId="1:5876"
    >
      <SettingsAccountAccessCard t={t} />
    </SettingsScreenLayout>
  );
}
