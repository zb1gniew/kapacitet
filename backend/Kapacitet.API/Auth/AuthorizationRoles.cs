using Kapacitet.Domain.Enums;

namespace Kapacitet.API.Auth;

public static class AuthorizationRoles
{
    public const string PlatformAdminPolicy = "PlatformAdmin";
    public const string Admin = nameof(UserRole.Admin);
    public const string LegacyOperatorAdmin = "OperatorAdmin";
}
