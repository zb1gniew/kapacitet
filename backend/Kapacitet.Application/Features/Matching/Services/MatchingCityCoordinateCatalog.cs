namespace Kapacitet.Application.Features.Matching.Services;

internal static class MatchingCityCoordinateCatalog
{
    public static readonly IReadOnlyDictionary<string, GeoPoint> CityCoordinates =
        new Dictionary<string, GeoPoint>(StringComparer.OrdinalIgnoreCase)
        {
            ["AALBORG"] = new(57.0488, 9.9217),
            ["AARHUS"] = new(56.1629, 10.2039),
            ["BERGEN"] = new(60.3913, 5.3221),
            ["COPENHAGEN"] = new(55.6761, 12.5683),
            ["ESBJERG"] = new(55.4765, 8.4594),
            ["FREDERICIA"] = new(55.5657, 9.7526),
            ["GOTHENBURG"] = new(57.7089, 11.9746),
            ["GÖTEBORG"] = new(57.7089, 11.9746),
            ["HELSINGBORG"] = new(56.0465, 12.6945),
            ["HELSINGOR"] = new(56.0360, 12.6136),
            ["HELSINGØR"] = new(56.0360, 12.6136),
            ["HERNING"] = new(56.1386, 8.9730),
            ["HILLEROD"] = new(55.9279, 12.3008),
            ["HILLERØD"] = new(55.9279, 12.3008),
            ["KOLDING"] = new(55.4904, 9.4722),
            ["MALMO"] = new(55.6050, 13.0038),
            ["MALMÖ"] = new(55.6050, 13.0038),
            ["ODENSE"] = new(55.4038, 10.4024),
            ["OSLO"] = new(59.9139, 10.7522),
            ["RANDERS"] = new(56.4606, 10.0364),
            ["ROSKILDE"] = new(55.6415, 12.0803),
            ["SKANDERBORG"] = new(56.0343, 9.9318),
            ["SONDERBORG"] = new(54.9088, 9.7898),
            ["SØNDERBORG"] = new(54.9088, 9.7898),
            ["STOCKHOLM"] = new(59.3293, 18.0686),
            ["TRONDHEIM"] = new(63.4305, 10.3951),
            ["VEJLE"] = new(55.7113, 9.5364)
        };
}

internal sealed record GeoPoint(double Latitude, double Longitude);
