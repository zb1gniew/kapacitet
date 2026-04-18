using System.Security.Claims;
using Kapacitet.Domain.Enums;

namespace Kapacitet.API.Auth;

public static class AuthorizationRoles
{
    public const string AppRoleClaimType = "kapacitet:user-role";
    public const string PlatformAdminPolicy = "PlatformAdmin";
    public const string CompanyViewerPolicy = "CompanyViewer";
    public const string CompanyManagerPolicy = "CompanyManager";
    public const string Admin = nameof(UserRole.Admin);
    public const string Manager = nameof(UserRole.Manager);
    public const string Viewer = nameof(UserRole.Viewer);
    public const string LegacyOperatorAdmin = "OperatorAdmin";

    public static bool TryGetApplicationUserRole(ClaimsPrincipal user, out UserRole role)
    {
        var roleValue = user.FindFirstValue(AppRoleClaimType);
        return Enum.TryParse(roleValue, ignoreCase: true, out role);
    }
}
