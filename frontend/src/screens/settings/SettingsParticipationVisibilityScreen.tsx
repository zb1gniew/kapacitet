"use client";

import { SettingsParticipationVisibilityCard } from "@/components/settings/SettingsParticipationVisibilityCard";
import { SettingsScreenLayout } from "@/components/settings/SettingsScreenLayout";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type SettingsParticipationVisibilityScreenProps = {
  user: AuthenticatedUser;
};

export function SettingsParticipationVisibilityScreen({
  user,
}: SettingsParticipationVisibilityScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <SettingsScreenLayout
      user={user}
      t={t}
      activeSection="participationVisibility"
      dataNodeId="1:5257"
    >
      <SettingsParticipationVisibilityCard t={t} />
    </SettingsScreenLayout>
  );
}
