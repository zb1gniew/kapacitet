import { notFound } from "next/navigation";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { CompanyListingReviewScreen } from "@/screens/listings/CompanyListingReviewScreen";

export default async function RequestCapacityReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireServerAuthSession();
  const { id } = await params;
  const listingId = Number(id);

  if (!Number.isFinite(listingId)) {
    notFound();
  }

  return (
    <CompanyListingReviewScreen
      user={session.user}
      listingId={listingId}
      kind="request"
    />
  );
}
