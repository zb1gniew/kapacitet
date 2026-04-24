using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;

namespace Kapacitet.Tests.Unit;

public class CompanyCategoryCatalogTests
{
    // ── IsValidCategory ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("scaffolding")]
    [InlineData("construction")]
    [InlineData("interior_finishing")]
    [InlineData("electrical")]
    [InlineData("hvac")]
    public void IsValidCategory_WithKnownCategory_ReturnsTrue(string category)
        => CompanyCategoryCatalog.IsValidCategory(category).Should().BeTrue();

    [Theory]
    [InlineData("CONSTRUCTION")]
    [InlineData("Electrical")]
    [InlineData("SCAFFOLDING")]
    [InlineData("Interior_Finishing")]
    public void IsValidCategory_IsCaseInsensitive(string category)
        => CompanyCategoryCatalog.IsValidCategory(category).Should().BeTrue();

    [Theory]
    [InlineData("manufacturing")]
    [InlineData("")]
    [InlineData("unknown_category")]
    [InlineData("IT")]
    [InlineData("software")]
    public void IsValidCategory_WithUnknownCategory_ReturnsFalse(string category)
        => CompanyCategoryCatalog.IsValidCategory(category).Should().BeFalse();

    // ── AreValidCategories ────────────────────────────────────────────────────

    [Fact]
    public void AreValidCategories_WithEmptyList_ReturnsTrue()
        => CompanyCategoryCatalog.AreValidCategories([]).Should().BeTrue();

    [Fact]
    public void AreValidCategories_WithValidCategoriesAtMaxCount_ReturnsTrue()
        => CompanyCategoryCatalog.AreValidCategories(["construction", "electrical", "roofing"]).Should().BeTrue();

    [Fact]
    public void AreValidCategories_WithTooManyCategories_ReturnsFalse()
        => CompanyCategoryCatalog.AreValidCategories(["construction", "electrical", "roofing", "painting"]).Should().BeFalse();

    [Fact]
    public void AreValidCategories_WithOneInvalidCategory_ReturnsFalse()
        => CompanyCategoryCatalog.AreValidCategories(["construction", "not_a_real_category"]).Should().BeFalse();

    // ── ValidateCategoriesField ───────────────────────────────────────────────

    [Fact]
    public void ValidateCategoriesField_WithEmptyList_ReturnsNull()
        => CompanyCategoryCatalog.ValidateCategoriesField([]).Should().BeNull();

    [Fact]
    public void ValidateCategoriesField_WithValidCategories_ReturnsNull()
        => CompanyCategoryCatalog.ValidateCategoriesField(["construction", "electrical"]).Should().BeNull();

    [Fact]
    public void ValidateCategoriesField_AtExactMaxCount_ReturnsNull()
        => CompanyCategoryCatalog.ValidateCategoriesField(["construction", "electrical", "roofing"]).Should().BeNull();

    [Fact]
    public void ValidateCategoriesField_WithTooManyCategories_ReturnsErrorMentioningMaxLimit()
    {
        var error = CompanyCategoryCatalog.ValidateCategoriesField(["construction", "electrical", "roofing", "painting"]);
        error.Should().NotBeNullOrWhiteSpace();
        error.Should().Contain($"{CompanyCategoryCatalog.MaxCategories}");
    }

    [Fact]
    public void ValidateCategoriesField_WithInvalidCategory_ReturnsErrorNamingInvalidValue()
    {
        var error = CompanyCategoryCatalog.ValidateCategoriesField(["construction", "unknown_type"]);
        error.Should().NotBeNullOrWhiteSpace();
        error.Should().Contain("unknown_type");
    }

    [Fact]
    public void ValidateCategoriesField_WithMultipleInvalidCategories_ListsAll()
    {
        var error = CompanyCategoryCatalog.ValidateCategoriesField(["bad1", "bad2"]);
        error.Should().NotBeNull();
        error.Should().Contain("bad1").And.Contain("bad2");
    }
}
