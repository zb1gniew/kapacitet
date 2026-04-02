using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kapacitet.Infrastructure.Keycloak;

public class KeycloakAdminClient
{
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
        var token = await GetAdminTokenAsync();
        var url = $"{_options.BaseUrl}/admin/realms/{_options.Realm}/users?email={Uri.EscapeDataString(email)}&exact=true";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var users = await response.Content.ReadFromJsonAsync<JsonElement[]>();
        if (users is { Length: > 0 })
        {
            return users[0].GetProperty("id").GetString();
        }

        return null;
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
}
