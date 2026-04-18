namespace Kapacitet.Domain.Utilities;

public static class EmailAddressNormalizer
{
    public static string Canonicalize(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        return email.Trim();
    }

    public static string NormalizeForLookup(string email)
    {
        return Canonicalize(email).ToLowerInvariant();
    }
}
