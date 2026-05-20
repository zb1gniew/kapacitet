"use client";

import { SettingsAccountAccessCard } from "@/components/settings/SettingsAccountAccessCard";
import { SettingsLanguageCard } from "@/components/settings/SettingsLanguageCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { SettingsTeamMembersCard } from "@/components/settings/SettingsTeamMembersCard";
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
      <div className="space-y-4">
        <SettingsLanguageCard />
        <SettingsAccountAccessCard t={t} user={user} />
        <SettingsTeamMembersCard t={t} user={user} />
      </div>
    </SettingsScreenLayout>
  );
}
