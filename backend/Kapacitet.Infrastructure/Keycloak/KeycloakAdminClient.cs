using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kapacitet.Infrastructure.Keycloak;

public class KeycloakAdminClient
{
    private const string PasswordCredentialType = "password";
    private const string UpdatePasswordAction = "UPDATE_PASSWORD";

    private readonly HttpClient _httpClient;
    private readonly KeycloakAdminOptions _options;
    private readonly ILogger<KeycloakAdminClient> _logger;

    public KeycloakAdminClient(
        HttpClient httpClient,
        IOptions<KeycloakAdminOptions> options,
        ILogger<KeycloakAdminClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> GetAdminTokenAsync()
    {
        var tokenUrl = $"{_options.BaseUrl}/realms/master/protocol/openid-connect/token";
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["client_id"] = "admin-cli",
            ["username"] = _options.AdminUsername,
            ["password"] = _options.AdminPassword,
        });

        var response = await _httpClient.PostAsync(tokenUrl, content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("access_token").GetString()!;
    }

    public async Task<string?> FindUserByEmailAsync(string email)
    {
        var users = await GetUsersByEmailAsync(email);
        return users is { Length: > 0 }
            ? users[0].GetProperty("id").GetString()
            : null;
    }

    public async Task<string> CreateUserAsync(string email)
    {
        var token = await GetAdminTokenAsync();
        var url = $"{_options.BaseUrl}/admin/realms/{_options.Realm}/users";

        var userPayload = new
        {
            email,
            username = email,
            emailVerified = true,
            enabled = true,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(userPayload);

        var response = await _httpClient.SendAsync(request);

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogWarning("Keycloak user with email {Email} already exists, looking up existing user", email);
            var existingId = await FindUserByEmailAsync(email);
            if (existingId != null) return existingId;
            throw new InvalidOperationException($"Keycloak returned 409 for {email} but user was not found");
        }

        response.EnsureSuccessStatusCode();

        var location = response.Headers.Location?.ToString();
        if (location == null)
            throw new InvalidOperationException("Keycloak did not return a Location header after user creation");

        var keycloakUserId = location.Split('/').Last();
        _logger.LogInformation("Created Keycloak user {KeycloakUserId} for email {Email}", keycloakUserId, email);
        return keycloakUserId;
    }

    public async Task SetTemporaryPasswordAsync(string keycloakUserId, string password)
    {
        await ResetPasswordAsync(keycloakUserId, password, temporary: true);

        _logger.LogInformation(
            "Set temporary password for Keycloak user {KeycloakUserId}",
            keycloakUserId);
    }

    public async Task<bool> IsFirstTimeUserAsync(string email)
    {
        var users = await GetUsersByEmailAsync(email);
        return users is { Length: > 0 } && HasRequiredAction(users[0], UpdatePasswordAction);
    }

    public async Task SetPermanentPasswordAsync(string email, string password)
    {
        var keycloakUserId = await FindUserByEmailAsync(email)
            ?? throw new InvalidOperationException($"Keycloak user with email {email} not found");

        await ResetPasswordAsync(keycloakUserId, password, temporary: false);

        _logger.LogInformation("Set permanent password for Keycloak user {Email}", email);
    }

    public async Task SendRequiredActionsEmailAsync(string keycloakUserId, List<string> actions)
    {
        var token = await GetAdminTokenAsync();
        var url = $"{_options.BaseUrl}/admin/realms/{_options.Realm}/users/{keycloakUserId}/execute-actions-email";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(actions);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        _logger.LogInformation(
            "Sent required actions email to Keycloak user {KeycloakUserId} with actions {Actions}",
            keycloakUserId, string.Join(", ", actions));
    }

    private async Task<JsonElement[]> GetUsersByEmailAsync(string email)
    {
        var token = await GetAdminTokenAsync();
        var url = $"{_options.BaseUrl}/admin/realms/{_options.Realm}/users?email={Uri.EscapeDataString(email)}&exact=true";

        using var request = CreateAuthorizedRequest(HttpMethod.Get, url, token);
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<JsonElement[]>() ?? [];
    }

    private async Task ResetPasswordAsync(string keycloakUserId, string password, bool temporary)
    {
        var token = await GetAdminTokenAsync();
        var url = $"{_options.BaseUrl}/admin/realms/{_options.Realm}/users/{keycloakUserId}/reset-password";

        var payload = new
        {
            type = PasswordCredentialType,
            value = password,
            temporary,
        };

        using var request = CreateAuthorizedRequest(HttpMethod.Put, url, token);
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    private static HttpRequestMessage CreateAuthorizedRequest(
        HttpMethod method,
        string url,
        string token)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static bool HasRequiredAction(JsonElement user, string action)
    {
        if (!user.TryGetProperty("requiredActions", out var requiredActions) ||
            requiredActions.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (var requiredAction in requiredActions.EnumerateArray())
        {
            if (requiredAction.GetString() == action)
                return true;
        }

        return false;
    }
}
