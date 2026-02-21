import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { MatchesScreen } from "@/screens/matches/MatchesScreen";

export default async function MatchesPage() {
  const session = await requireServerAuthSession();

  return <MatchesScreen user={session.user} />;
}
