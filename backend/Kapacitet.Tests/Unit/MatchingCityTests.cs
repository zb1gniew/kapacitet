using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Tests.Unit;

/// <summary>
/// Tests for city catalog lookup, normalization, and radius-based location matching.
/// </summary>
public class MatchingCityTests
{
    // ── NormalizeForLookup ────────────────────────────────────────────────────

    [Theory]
    [InlineData("Aarhus",      "AARHUS")]      // plain ASCII
    [InlineData("aarhus",      "AARHUS")]      // lowercase
    [InlineData("  Aalborg  ", "AALBORG")]     // leading/trailing spaces
    [InlineData("Sønderborg",  "SØNDERBORG")]  // ø does NOT decompose → stays
    [InlineData("Sonderborg",  "SONDERBORG")]  // ASCII variant of the same city
    [InlineData("Hillerød",    "HILLERØD")]    // ø stays
    [InlineData("Hillerod",    "HILLEROD")]    // ASCII variant
    [InlineData("Göteborg",    "GOTEBORG")]    // ö DOES decompose → stripped to o
    [InlineData("Malmö",       "MALMO")]       // ö → o
    [InlineData("Næstved",     "NÆSTVED")]     // æ does NOT decompose → stays
    [InlineData("Holbæk",      "HOLBÆK")]      // æ stays
    [InlineData("Grenå",       "GRENA")]       // å DOES decompose → stripped to a
    [InlineData("Allerød",     "ALLERØD")]     // ø stays
    [InlineData("Køge",        "KØGE")]        // ø stays
    [InlineData("Brønderslev", "BRØNDERSLEV")] // ø stays
    [InlineData("Tønder",      "TØNDER")]      // ø stays
    public void NormalizeForLookup_ProducesExpectedKey(string input, string expected)
    {
        MatchingCityCoordinateCatalog.NormalizeForLookup(input)
            .Should().Be(expected);
    }

    // ── IsSupportedCity ───────────────────────────────────────────────────────

    [Theory]
    // Cities present in the catalog
    [InlineData("Aarhus",           true)]
    [InlineData("AARHUS",           true)]  // case-insensitive
    [InlineData("aarhus",           true)]
    [InlineData("Sønderborg",       true)]
    [InlineData("Sonderborg",       true)]  // ASCII fallback key
    [InlineData("Hillerød",         true)]
    [InlineData("Hillerod",         true)]  // ASCII fallback key
    [InlineData("Aabenraa",         true)]  // newly added
    [InlineData("Horsens",          true)]  // newly added
    [InlineData("Silkeborg",        true)]  // newly added
    [InlineData("Næstved",          true)]  // newly added
    [InlineData("Holbæk",           true)]  // newly added, æ stays
    [InlineData("Grenå",            true)]  // newly added, å→a → GRENA
    [InlineData("Malmö",            true)]  // ö→o → MALMO
    [InlineData("Göteborg",         true)]  // ö→o → GOTEBORG
    [InlineData("Copenhagen",       true)]  // English alias
    [InlineData("København",        true)]  // Danish name
    [InlineData("Oslo",             true)]
    [InlineData("Stockholm",        true)]
    // Cities NOT in the catalog
    [InlineData("Warsaw",           false)]
    [InlineData("Syddanmark",       false)] // was in old placeholder — must fail
    [InlineData("",                 false)]
    [InlineData("   ",              false)]
    [InlineData("xyz",              false)]
    [InlineData("Berlin",           false)]
    public void IsSupportedCity_ReturnsExpectedResult(string cityName, bool expected)
    {
        MatchingCityCoordinateCatalog.IsSupportedCity(cityName)
            .Should().Be(expected);
    }

    // ── Location matching via MatchEvaluationService ──────────────────────────

    private readonly MatchEvaluationService _svc = new();

    private static CapacityRequest MakeRequest(string city, int radiusKm) => new()
    {
        Id = 1, CompanyId = 1,
        ResourceType = ResourceType.Worker,
        StartDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate   = new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = city, LocationRadiusKm = radiusKm,
        Quantity = 5, Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow,
        Skills = [], Certificates = []
    };

    private static AvailabilityDeclaration MakeAvailability(string city, int radiusKm) => new()
    {
        Id = 2, CompanyId = 2,
        ResourceType = ResourceType.Worker,
        StartDate = new DateTime(2026, 5, 31, 0, 0, 0, DateTimeKind.Utc),
        EndDate   = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = city, LocationRadiusKm = radiusKm,
        Quantity = 5, Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow,
        Skills = [], Certificates = []
    };

    [Fact]
    public void Location_SameCity_Matches()
    {
        // Same city → immediate match, no radius needed
        var result = _svc.Evaluate(MakeRequest("Aarhus", 0), MakeAvailability("Aarhus", 0), 5, 5);
        result.Should().NotBeNull();
        result!.Score.LocationScore.Should().Be(10); // max location score
    }

    [Fact]
    public void Location_SameCity_DiacriticVariants_Match()
    {
        // "Sønderborg" and "Sonderborg" normalize to different keys
        // but both exist in catalog and both refer to the same coordinates,
        // so they should match as "same city" after normalization comparison.
        // SØNDERBORG vs SONDERBORG → different keys → falls through to distance check
        // Distance = 0 km (same coordinates) → within any radius
        var result = _svc.Evaluate(
            MakeRequest("Sønderborg", 0),
            MakeAvailability("Sonderborg", 0),
            5, 5);
        result.Should().NotBeNull("diacritic variants of the same city should match");
    }

    [Fact]
    public void Location_AarhusToHorsens_WithinCombinedRadius_Matches()
    {
        // Aarhus → Horsens ≈ 40 km. Combined radius 25+25=50 → within range.
        var result = _svc.Evaluate(MakeRequest("Aarhus", 25), MakeAvailability("Horsens", 25), 5, 5);
        result.Should().NotBeNull("Aarhus–Horsens (~40 km) should be within combined 50 km radius");
    }

    [Fact]
    public void Location_AarhusToHorsens_RadiusTooSmall_DoesNotMatch()
    {
        // Aarhus → Horsens ≈ 40 km. Combined radius 10+10=20 → outside range.
        var result = _svc.Evaluate(MakeRequest("Aarhus", 10), MakeAvailability("Horsens", 10), 5, 5);
        result.Should().BeNull("Aarhus–Horsens (~40 km) should not be within combined 20 km radius");
    }

    [Fact]
    public void Location_AarhusToCopenhagen_LargeRadius_Matches()
    {
        // Aarhus → Copenhagen ≈ 180 km. Combined radius 100+100=200 → within range.
        var result = _svc.Evaluate(MakeRequest("Aarhus", 100), MakeAvailability("Copenhagen", 100), 5, 5);
        result.Should().NotBeNull("Aarhus–Copenhagen (~180 km) should be within combined 200 km radius");
    }

    [Fact]
    public void Location_AarhusToCopenhagen_SmallRadius_DoesNotMatch()
    {
        // Aarhus → Copenhagen ≈ 180 km. Combined radius 50+50=100 → outside range.
        var result = _svc.Evaluate(MakeRequest("Aarhus", 50), MakeAvailability("Copenhagen", 50), 5, 5);
        result.Should().BeNull("Aarhus–Copenhagen (~180 km) should not be within combined 100 km radius");
    }

    [Fact]
    public void Location_NewlyAddedCity_Aabenraa_CanMatch()
    {
        // Aabenraa → Sønderborg ≈ 25 km. Was missing before; now in catalog.
        var result = _svc.Evaluate(MakeRequest("Aabenraa", 15), MakeAvailability("Sønderborg", 15), 5, 5);
        result.Should().NotBeNull("Aabenraa–Sønderborg (~25 km) should match with combined 30 km radius");
    }

    [Fact]
    public void Location_UnknownCity_DoesNotMatch()
    {
        // "Syddanmark" (region, not a city) → not in catalog → no match, no crash
        var result = _svc.Evaluate(MakeRequest("Syddanmark", 200), MakeAvailability("Aarhus", 200), 5, 5);
        result.Should().BeNull("unknown city should not match even with large radius");
    }

    [Fact]
    public void Location_CloserCities_GetHigherLocationScore()
    {
        // Aarhus–Horsens (~40 km, close) vs Aarhus–Copenhagen (~180 km, far)
        // Both within a large radius — but closer pair should score higher.
        var closeResult  = _svc.Evaluate(MakeRequest("Aarhus", 150), MakeAvailability("Horsens",    150), 5, 5);
        var farResult    = _svc.Evaluate(MakeRequest("Aarhus", 150), MakeAvailability("Copenhagen", 150), 5, 5);

        closeResult.Should().NotBeNull();
        farResult.Should().NotBeNull();

        closeResult!.Score.LocationScore.Should()
            .BeGreaterThan(farResult!.Score.LocationScore,
                "closer cities should earn a higher location score");
    }
}
