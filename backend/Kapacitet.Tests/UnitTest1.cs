using FluentAssertions;
using Kapacitet.Domain.Utilities;

namespace Kapacitet.Tests;

public class EmailAddressNormalizerSmokeTests
{
    [Fact]
    public void Canonicalize_TrimsWhitespace()
    {
        var result = EmailAddressNormalizer.Canonicalize("  User@Example.com  ");

        result.Should().Be("User@Example.com");
    }

    [Fact]
    public void NormalizeForLookup_LowercasesTrimmedEmail()
    {
        var result = EmailAddressNormalizer.NormalizeForLookup("  User@Example.com  ");

        result.Should().Be("user@example.com");
    }
}
