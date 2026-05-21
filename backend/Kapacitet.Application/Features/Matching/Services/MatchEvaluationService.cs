using System.Globalization;
using Kapacitet.Domain.Entities;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchEvaluationService
{
    private const int SkillWeight = 15;
    private const int CertificateWeight = 15;
    private const int DateWeight = 30;
    private const int LocationWeight = 10;
    private const int QuantityWeight = 30;

    // Availability may start/end up to this many days outside the request window
    // and still qualify as a match (with a reduced date score).
    public const int DateToleranceDays = 2;

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

        if (!DatePeriodsAlignWithinTolerance(request, availability))
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
            CoversFullPeriod = CoversRequestPeriodStrict(request, availability),
            IsPartial = offeredQuantity < requestRemainingQuantity,
            Explanation = BuildExplanation(request, score, locationAssessment, offeredQuantity, requestRemainingQuantity),
            Score = score
        };
    }

    // Passes when availability overlaps the request within ±DateToleranceDays on each end.
    // e.g. avail 21 May–28 May still matches a request 23 May–30 May (2-day shortfall at end).
    private static bool DatePeriodsAlignWithinTolerance(CapacityRequest request, AvailabilityDeclaration availability)
    {
        return availability.StartDate.Date <= request.StartDate.Date.AddDays(DateToleranceDays) &&
               availability.EndDate.Date >= request.EndDate.Date.AddDays(-DateToleranceDays);
    }

    // Strict check — availability must fully contain the request period.
    private static bool CoversRequestPeriodStrict(CapacityRequest request, AvailabilityDeclaration availability)
    {
        return availability.StartDate.Date <= request.StartDate.Date &&
               availability.EndDate.Date >= request.EndDate.Date;
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
        var requestStart = request.StartDate.Date;
        var requestEnd   = request.EndDate.Date;
        var availStart   = availability.StartDate.Date;
        var availEnd     = availability.EndDate.Date;

        var requestedDays = Math.Max(1, (requestEnd - requestStart).Days + 1);

        // Days of the request period NOT covered by availability (under-coverage penalty).
        var missedAtStart = Math.Max(0, (availStart - requestStart).Days);
        var missedAtEnd   = Math.Max(0, (requestEnd - availEnd).Days);
        var missedDays    = missedAtStart + missedAtEnd;

        // Extra days availability extends beyond the request (over-coverage penalty).
        var leadingSlack  = Math.Max(0, (requestStart - availStart).Days);
        var trailingSlack = Math.Max(0, (availEnd - requestEnd).Days);
        var slackDays     = leadingSlack + trailingSlack;

        // Penalise under-coverage fully, but cap over-coverage slack to at most requestedDays.
        // Without the cap a standing year-long availability gets DateScore ≈ 1 for a 1-week
        // request, even though it can cover the period perfectly.
        // Cap ensures the floor for over-coverage alone is 50 % of max (requestedDays / 2·requestedDays).
        var coveredDays  = requestedDays - missedDays;
        var cappedSlack  = Math.Min(slackDays, requestedDays);
        var alignment    = coveredDays / (double)(requestedDays + cappedSlack);

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

    private static string NormalizeLocation(string value) =>
        MatchingCityCoordinateCatalog.NormalizeForLookup(value);

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
