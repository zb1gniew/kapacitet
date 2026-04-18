namespace Kapacitet.Infrastructure.Persistence;

public static class PersistenceModelConstants
{
    public const string NormalizedEmailProperty = "NormalizedEmail";
    public const string NormalizedContactEmailProperty = "NormalizedContactEmail";

    public const string UsersNormalizedEmailIndex = "IX_users_normalized_email";
    public const string AccessRequestsPendingNormalizedContactEmailIndex =
        "IX_access_requests_pending_normalized_contact_email";
}
