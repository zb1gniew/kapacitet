using System.Globalization;
using System.Text;
using Kapacitet.Domain.Entities;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchEvaluationService
{
    private const int SkillWeight = 30;
    private const int CertificateWeight = 35;
    private const int DateWeight = 20;
    private const int LocationWeight = 10;
    private const int QuantityWeight = 5;

    public MatchEvaluationResult? Evaluate(
        CapacityRequest request,
        AvailabilityDeclaration availability,
        int requestRemainingQuantity,
        int availabilityRemainingQuantity)
    {
        if (availabilityRemainingQuantity <= 0 || requestRemainingQuantity <= 0)
        {
            return null;
        }

        if (request.ResourceType != availability.ResourceType)
        {
            return null;
        }

        if (!CoversRequestPeriod(request, availability))
        {
            return null;
        }

        var locationAssessment = AssessLocation(request, availability);
        if (!locationAssessment.IsMatch)
        {
            return null;
        }

        var requestSkillIds = request.Skills.Select(s => s.Id).ToHashSet();
        var availabilitySkillIds = availability.Skills.Select(s => s.Id).ToHashSet();
        var matchedSkillCount = requestSkillIds.Count == 0
            ? 0
            : requestSkillIds.Count(id => availabilitySkillIds.Contains(id));

        if (matchedSkillCount < requestSkillIds.Count)
        {
            return null;
        }

        var requestCertificateIds = request.Certificates.Select(c => c.Id).ToHashSet();
        var availabilityCertificateIds = availability.Certificates.Select(c => c.Id).ToHashSet();
        var matchedCertificateCount = requestCertificateIds.Count == 0
            ? 0
            : requestCertificateIds.Count(id => availabilityCertificateIds.Contains(id));

        if (matchedCertificateCount < requestCertificateIds.Count)
        {
            return null;
        }

        var offeredQuantity = Math.Min(requestRemainingQuantity, availabilityRemainingQuantity);
        if (offeredQuantity <= 0)
        {
            return null;
        }

        var score = new MatchScoreBreakdown
        {
            SkillScore = ScaleCoverageScore(matchedSkillCount, requestSkillIds.Count, SkillWeight),
            CertificateScore = ScaleCoverageScore(matchedCertificateCount, requestCertificateIds.Count, CertificateWeight),
            DateScore = CalculateDateScore(request, availability),
            LocationScore = locationAssessment.Score,
            QuantityScore = CalculateQuantityScore(offeredQuantity, requestRemainingQuantity)
        };

        return new MatchEvaluationResult
        {
            Availability = availability,
            OfferedQuantity = offeredQuantity,
            MatchedSkillCount = matchedSkillCount,
            RequiredSkillCount = requestSkillIds.Count,
            MatchedCertificateCount = matchedCertificateCount,
            RequiredCertificateCount = requestCertificateIds.Count,
            CoversFullPeriod = true,
            IsPartial = offeredQuantity < requestRemainingQuantity,
            Explanation = BuildExplanation(request, score, locationAssessment, offeredQuantity, requestRemainingQuantity),
            Score = score
        };
    }

    private static bool CoversRequestPeriod(CapacityRequest request, AvailabilityDeclaration availability)
    {
        return availability.StartDate <= request.StartDate &&
               availability.EndDate >= request.EndDate;
    }

    private static int ScaleCoverageScore(int matchedCount, int requiredCount, int maxScore)
    {
        if (requiredCount == 0)
        {
            return maxScore;
        }

        var coverage = matchedCount / (double)requiredCount;
        return Math.Max(0, (int)Math.Round(coverage * maxScore, MidpointRounding.AwayFromZero));
    }

    private static int CalculateDateScore(CapacityRequest request, AvailabilityDeclaration availability)
    {
        var requestedDays = Math.Max(1, (request.EndDate.Date - request.StartDate.Date).Days + 1);
        var leadingSlack = Math.Max(0, (request.StartDate.Date - availability.StartDate.Date).Days);
        var trailingSlack = Math.Max(0, (availability.EndDate.Date - request.EndDate.Date).Days);
        var slackDays = leadingSlack + trailingSlack;
        var alignment = requestedDays / (double)(requestedDays + slackDays);

        return Math.Max(1, (int)Math.Round(alignment * DateWeight, MidpointRounding.AwayFromZero));
    }

    private static int CalculateQuantityScore(int offeredQuantity, int requestRemainingQuantity)
    {
        if (offeredQuantity >= requestRemainingQuantity)
        {
            return QuantityWeight;
        }

        var coverage = offeredQuantity / (double)requestRemainingQuantity;
        return Math.Max(1, (int)Math.Round(coverage * QuantityWeight, MidpointRounding.AwayFromZero));
    }

    private static LocationAssessment AssessLocation(CapacityRequest request, AvailabilityDeclaration availability)
    {
        var normalizedRequestCity = NormalizeLocation(request.LocationCity);
        var normalizedAvailabilityCity = NormalizeLocation(availability.LocationCity);

        if (normalizedRequestCity == normalizedAvailabilityCity)
        {
            return new LocationAssessment(true, LocationWeight, "Same city match.");
        }

        if (!MatchingCityCoordinateCatalog.CityCoordinates.TryGetValue(normalizedRequestCity, out var requestPoint) ||
            !MatchingCityCoordinateCatalog.CityCoordinates.TryGetValue(normalizedAvailabilityCity, out var availabilityPoint))
        {
            return new LocationAssessment(
                false,
                0,
                $"No coordinate data available for {request.LocationCity} and {availability.LocationCity}.");
        }

        var distanceKm = CalculateDistanceKm(requestPoint, availabilityPoint);
        var allowedDistanceKm = request.LocationRadiusKm + availability.LocationRadiusKm;

        if (distanceKm > allowedDistanceKm)
        {
            return new LocationAssessment(
                false,
                0,
                $"Distance {distanceKm.ToString("0.#", CultureInfo.InvariantCulture)} km exceeds the combined service radius of {allowedDistanceKm} km.");
        }

        var fitRatio = 1d - (distanceKm / Math.Max(1d, allowedDistanceKm));
        var score = Math.Max(1, (int)Math.Round(fitRatio * LocationWeight, MidpointRounding.AwayFromZero));

        return new LocationAssessment(
            true,
            score,
            $"Within radius at {distanceKm.ToString("0.#", CultureInfo.InvariantCulture)} km.");
    }

    private static string NormalizeLocation(string value)
    {
        var normalized = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).ToUpperInvariant();
    }

    private static double CalculateDistanceKm(GeoPoint from, GeoPoint to)
    {
        const double earthRadiusKm = 6371.0;

        var latitudeDelta = DegreesToRadians(to.Latitude - from.Latitude);
        var longitudeDelta = DegreesToRadians(to.Longitude - from.Longitude);

        var fromLatitude = DegreesToRadians(from.Latitude);
        var toLatitude = DegreesToRadians(to.Latitude);

        var haversine =
            Math.Pow(Math.Sin(latitudeDelta / 2), 2) +
            Math.Cos(fromLatitude) * Math.Cos(toLatitude) * Math.Pow(Math.Sin(longitudeDelta / 2), 2);

        var arc = 2 * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));
        return earthRadiusKm * arc;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * (Math.PI / 180d);
    }

    private static string BuildExplanation(
        CapacityRequest request,
        MatchScoreBreakdown score,
        LocationAssessment locationAssessment,
        int offeredQuantity,
        int requestRemainingQuantity)
    {
        var skillNames = request.Skills.Select(s => s.Name).ToList();
        var certificateNames = request.Certificates.Select(c => c.Name).ToList();
        var quantityText = offeredQuantity >= requestRemainingQuantity
            ? $"Can cover the full remaining quantity of {requestRemainingQuantity}."
            : $"Can partially cover the request with {offeredQuantity} out of {requestRemainingQuantity}.";

        return string.Join(" ", new[]
        {
            locationAssessment.Explanation,
            $"Date fit score {score.DateScore}/{DateWeight}.",
            skillNames.Count > 0
                ? $"Required skills matched: {string.Join(", ", skillNames)}."
                : "No mandatory skills were specified.",
            certificateNames.Count > 0
                ? $"Required certificates matched: {string.Join(", ", certificateNames)}."
                : "No mandatory certificates were specified.",
            quantityText
        });
    }
    private sealed record LocationAssessment(bool IsMatch, int Score, string Explanation);
}
