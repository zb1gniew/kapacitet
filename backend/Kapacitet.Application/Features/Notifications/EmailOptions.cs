namespace Kapacitet.Application.Features.Notifications;

public class EmailOptions
{
    public string ApiKey { get; set; } = "";
    public string FromAddress { get; set; } = "noreply@example.com";
    public string FromName { get; set; } = "Kapacitet";
    public bool DevMode { get; set; } = true;
    public string AppUrl { get; set; } = "https://localhost";
}