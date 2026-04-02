namespace Kapacitet.Infrastructure.Keycloak;

public class KeycloakAdminOptions
{
    public string BaseUrl { get; set; } = null!;
    public string Realm { get; set; } = null!;
    public string AdminUsername { get; set; } = null!;
    public string AdminPassword { get; set; } = null!;
}
