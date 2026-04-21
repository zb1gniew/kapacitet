namespace Kapacitet.Application.Features.Matching.Services;

public static class CompanyCategoryCatalog
{
    public const int MaxCategories = 3;

    private static readonly HashSet<string> ValidCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "scaffolding",
        "construction",
        "renovation",
        "demolition",
        "carpentry",
        "roofing",
        "painting",
        "plumbing",
        "electrical",
        "hvac",
        "flooring",
        "tiling",
        "gardening",
        "landscaping",
        "cleaning",
        "facility_services",
        "logistics",
        "moving",
        "insulation",
        "glass_installation",
        "metal_work",
        "concrete_work",
        "interior_finishing",
    };

    public static bool IsValidCategory(string category) =>
        ValidCategories.Contains(category);

    public static bool AreValidCategories(IEnumerable<string> categories)
    {
        var list = categories.ToList();
        return list.Count <= MaxCategories && list.All(IsValidCategory);
    }

    public static string? ValidateCategoriesField(List<string> categories)
    {
        if (categories.Count > MaxCategories)
            return $"A maximum of {MaxCategories} categories is allowed.";

        var invalid = categories.Where(c => !IsValidCategory(c)).ToList();
        if (invalid.Count > 0)
            return $"Invalid category value(s): {string.Join(", ", invalid)}.";

        return null;
    }
}
