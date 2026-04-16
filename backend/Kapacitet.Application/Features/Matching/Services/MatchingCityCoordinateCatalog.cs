using System.Globalization;
using System.Text;

namespace Kapacitet.Application.Features.Matching.Services;

internal static class MatchingCityCoordinateCatalog
{
    // Normalization rules (applied before every catalog lookup):
    //   å  → a  (decomposes in NFD: a + combining ring above → ring stripped)
    //   ö  → o  (decomposes in NFD: o + combining diaeresis → diaeresis stripped)
    //   ø  → Ø  (does NOT decompose in NFD — stays as-is)
    //   æ  → Æ  (does NOT decompose in NFD — stays as-is)
    //   é  → e, ü → u, ñ → n, etc. (all combining marks stripped)
    //
    // Each catalog entry therefore uses the post-normalization form as its key.
    // Cities whose names contain ø/æ need a single entry (e.g. "SØNDERBORG").
    // Cities with ö/å get stripped ASCII (e.g. "Göteborg" → "GOTEBORG").
    // Legacy ASCII-fallback entries are kept for data already in the database.

    public static readonly IReadOnlyDictionary<string, GeoPoint> CityCoordinates =
        new Dictionary<string, GeoPoint>(StringComparer.OrdinalIgnoreCase)
        {
            // ── Denmark ───────────────────────────────────────────────────────────
            ["AALBORG"]              = new(57.0488,  9.9217),
            ["AABENRAA"]             = new(55.0443,  9.4186),
            ["AARHUS"]               = new(56.1629, 10.2039),
            ["ALLERØD"]              = new(55.8699, 12.3527),
            ["ASSENS"]               = new(55.2705,  9.8994),
            ["BALLERUP"]             = new(55.7308, 12.3598),
            ["BRØNDERSLEV"]          = new(57.2684,  9.9509),
            ["ESBJERG"]              = new(55.4765,  8.4594),
            ["FAABORG"]              = new(55.0961, 10.2434),
            ["FREDERICIA"]           = new(55.5657,  9.7526),
            ["FREDERIKSBERG"]        = new(55.6784, 12.5206),
            ["FREDERIKSHAVN"]        = new(57.4394, 10.5371),
            ["GLADSAXE"]             = new(55.7376, 12.4603),
            // "Grenå" normalizes å→a → key "GRENA"
            ["GRENA"]                = new(56.4141, 10.8773),
            ["GREVE"]                = new(55.5894, 12.0960),
            ["HADERSLEV"]            = new(55.2527,  9.4899),
            ["HELSINGØR"]            = new(56.0360, 12.6136),
            ["HELSINGOR"]            = new(56.0360, 12.6136), // ASCII fallback
            ["HERNING"]              = new(56.1386,  8.9730),
            ["HILLERØD"]             = new(55.9279, 12.3008),
            ["HILLEROD"]             = new(55.9279, 12.3008), // ASCII fallback
            ["HJØRRING"]             = new(57.4642,  9.9806),
            ["HOLBÆK"]               = new(55.7175, 11.7135),
            ["HOLSTEBRO"]            = new(56.3594,  8.6162),
            ["HORSENS"]              = new(55.8607,  9.8501),
            ["HVIDOVRE"]             = new(55.6471, 12.4714),
            ["IKAST"]                = new(56.1381,  9.1566),
            ["KALUNDBORG"]           = new(55.6817, 11.0940),
            ["KERTEMINDE"]           = new(55.4500, 10.6600),
            ["KOLDING"]              = new(55.4904,  9.4722),
            ["KØBENHAVN"]            = new(55.6761, 12.5683),
            ["COPENHAGEN"]           = new(55.6761, 12.5683), // English alias
            ["KORSØR"]               = new(55.3265, 11.1435),
            ["KØGE"]                 = new(55.4567, 12.1782),
            ["LEMVIG"]               = new(56.5530,  8.3101),
            ["LYNGBY"]               = new(55.7697, 12.5025),
            ["MIDDELFART"]           = new(55.5050,  9.7331),
            ["NÆSTVED"]              = new(55.2296, 11.7598),
            ["NYBORG"]               = new(55.3100, 10.7901),
            ["NYKØBING FALSTER"]     = new(54.7689, 11.8744),
            ["NYKØBING SJÆLLAND"]    = new(55.9249, 11.6741),
            ["ODENSE"]               = new(55.4038, 10.4024),
            ["RANDERS"]              = new(56.4606, 10.0364),
            ["RINGKØBING"]           = new(56.0908,  8.2412),
            ["RINGSTED"]             = new(55.4443, 11.7901),
            ["ROSKILDE"]             = new(55.6415, 12.0803),
            ["SILKEBORG"]            = new(56.1701,  9.5491),
            ["SKANDERBORG"]          = new(56.0343,  9.9318),
            ["SKIVE"]                = new(56.5674,  9.0246),
            ["SLAGELSE"]             = new(55.4024, 11.3543),
            ["SØNDERBORG"]           = new(54.9088,  9.7898),
            ["SONDERBORG"]           = new(54.9088,  9.7898), // ASCII fallback
            ["STRUER"]               = new(56.4918,  8.5895),
            ["SVENDBORG"]            = new(55.0599, 10.6072),
            ["TAASTRUP"]             = new(55.6538, 12.3075),
            ["THISTED"]              = new(56.9570,  8.6943),
            ["TØNDER"]               = new(54.9339,  8.8619),
            ["VARDE"]                = new(55.6241,  8.1073),
            ["VEJEN"]                = new(55.4842,  9.1397),
            ["VEJLE"]                = new(55.7113,  9.5364),
            ["VIBORG"]               = new(56.4531,  9.4023),

            // ── Sweden ────────────────────────────────────────────────────────────
            // "Göteborg" normalizes ö→o → key "GOTEBORG"
            ["GOTEBORG"]             = new(57.7089, 11.9746),
            ["GOTHENBURG"]           = new(57.7089, 11.9746), // English alias
            ["HELSINGBORG"]          = new(56.0465, 12.6945),
            // "Malmö" normalizes ö→o → key "MALMO"
            ["MALMO"]                = new(55.6050, 13.0038),
            ["STOCKHOLM"]            = new(59.3293, 18.0686),

            // ── Norway ────────────────────────────────────────────────────────────
            ["BERGEN"]               = new(60.3913,  5.3221),
            ["OSLO"]                 = new(59.9139, 10.7522),
            ["TRONDHEIM"]            = new(63.4305, 10.3951),
        };

    /// <summary>
    /// Returns true if the given city name is supported by the matching engine.
    /// Applies the same Unicode normalization used during match evaluation.
    /// </summary>
    public static bool IsSupportedCity(string cityName)
    {
        if (string.IsNullOrWhiteSpace(cityName))
            return false;

        return CityCoordinates.ContainsKey(NormalizeForLookup(cityName));
    }

    /// <summary>
    /// Returns canonical city names sorted alphabetically, suitable for
    /// populating a frontend dropdown or suggestion list.
    /// </summary>
    public static IReadOnlyList<string> GetSupportedCityNames()
    {
        // Build a deduplicated list of display names by round-tripping each key
        // through the normalization — only keep keys that are their own canonical form.
        // ASCII-fallback keys (e.g. "SONDERBORG") are excluded; the ø-form is kept.
        return CityCoordinates.Keys
            .Where(key => NormalizeForLookup(key) == key)
            .OrderBy(k => k, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>
    /// Normalises a raw city name to the form used as a dictionary key.
    /// Strips NFD combining marks (removes å→a, ö→o, etc.) but preserves
    /// characters that do not decompose in NFD (ø→Ø, æ→Æ).
    /// </summary>
    internal static string NormalizeForLookup(string value)
    {
        var nfd = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(nfd.Length);

        foreach (var ch in nfd)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                builder.Append(ch);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).ToUpperInvariant();
    }
}

internal sealed record GeoPoint(double Latitude, double Longitude);
