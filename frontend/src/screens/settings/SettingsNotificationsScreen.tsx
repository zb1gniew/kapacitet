"use client";

import { SettingsNotificationsCard } from "@/components/settings/SettingsNotificationsCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type SettingsNotificationsScreenProps = {
  user: AuthenticatedUser;
};

export function SettingsNotificationsScreen({
  user,
}: SettingsNotificationsScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <SettingsScreenLayout
      user={user}
      t={t}
      activeSection="notifications"
      dataNodeId="1:5654"
    >
      <SettingsNotificationsCard t={t} user={user} />
    </SettingsScreenLayout>
  );
}
