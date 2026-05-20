using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class WorkflowHintsService(AppDbContext db)
{
    // Request Capacity flow
    public async Task<WorkflowHintsResult> GetRequestHintsAsync(int companyId, WorkflowHintsRequest req)
    {
        var hasDateRange = req.StartDate.HasValue && req.EndDate.HasValue
                           && req.EndDate.Value > req.StartDate.Value;

        var requester = await db.Companies
            .Include(c => c.CompanySettings)
            .AsNoTracking()
            .FirstAsync(c => c.Id == companyId);

        var effectiveCity = !string.IsNullOrWhiteSpace(req.LocationCity)
            ? req.LocationCity
            : requester.DefaultLocation;
        var hasCity = !string.IsNullOrWhiteSpace(effectiveCity);
        var matchOutsideCategory = requester.CompanySettings?.MatchOutsideCategory ?? true;

        var skills = req.SkillIds.Count > 0
            ? await db.Skills.AsNoTracking().Where(s => req.SkillIds.Contains(s.Id)).ToListAsync()
            : [];
        var certs = req.CertificateIds.Count > 0
            ? await db.Certificates.AsNoTracking().Where(c => req.CertificateIds.Contains(c.Id)).ToListAsync()
            : [];

        var baseQuery = db.AvailabilityDeclarations
            .AsSplitQuery()
            .Include(a => a.Company).ThenInclude(c => c.CompanySettings)
            .Include(a => a.Skills)
            .Include(a => a.Certificates)
            .AsNoTracking()
            .Where(a =>
                a.Status == ListingStatus.Active &&
                a.Company.Status == CompanyStatus.Active &&
                a.CompanyId != companyId &&
                a.ResourceType == ResourceType.Worker);

        // If dates are provided, limit to declarations that at least overlap the period.
        // We split into full-cover and partial-overlap in memory.
        List<AvailabilityDeclaration> pool;
        List<AvailabilityDeclaration> partialPool = [];
        if (hasDateRange)
        {
            var start = req.StartDate!.Value;
            var end = req.EndDate!.Value;
            var allOverlapping = await baseQuery
                .Where(a => a.StartDate <= end && a.EndDate >= start)
                .ToListAsync();

            pool = allOverlapping
                .Where(a => a.StartDate <= start && a.EndDate >= end)
                .ToList();

            partialPool = allOverlapping
                .Where(a => !(a.StartDate <= start && a.EndDate >= end))
                .ToList();
        }
        else
        {
            pool = await baseQuery.ToListAsync();
        }

        var hints = new List<WorkflowHintDto>();

        var baseMatches = FilterAvailabilities(pool, req.SkillIds, req.CertificateIds, effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories);
        var baseCount = baseMatches.Count;

        // 1. Overall match count
        if (req.SkillIds.Count > 0 || req.CertificateIds.Count > 0)
        {
            if (baseCount == 0)
                hints.Add(Warn("no-matches", "No active availability in your network matches your current criteria. The suggestions below can help expand your pool."));
            else if (baseCount >= 5)
                hints.Add(Good("match-count", $"Your criteria match {baseCount} active availability declarations — strong match potential.", new { count = baseCount, strong = true }));
            else if (baseCount >= 2)
                hints.Add(Info("match-count", $"Your criteria match {baseCount} active declarations in your network.", new { count = baseCount, strong = false }));
            else
                hints.Add(Info("match-count", "1 active declaration matches your criteria.", new { count = 1, strong = false }));
        }

        // 2. Radius expansion
        if (hasCity && req.LocationRadiusKm < 175)
        {
            var suggested = SuggestRadius(req.LocationRadiusKm);
            var expanded = FilterAvailabilities(pool, req.SkillIds, req.CertificateIds, effectiveCity, suggested, matchOutsideCategory, requester.Categories);
            var diff = expanded.Count - baseCount;
            if (diff >= 1)
                hints.Add(Info("radius",
                    $"Expanding your radius from {req.LocationRadiusKm} km to {suggested} km near {effectiveCity} would add {diff} potential {Plural("match", diff)} ({expanded.Count} total).",
                    new { current = req.LocationRadiusKm, suggested, city = effectiveCity, count = diff, total = expanded.Count }));
        }

        // 3. Certificate bottleneck
        if (req.CertificateIds.Count > 0 && baseCount < 8)
        {
            var (topCert, topDiff) = certs
                .Select(cert =>
                {
                    var without = req.CertificateIds.Where(id => id != cert.Id).ToList();
                    var count = FilterAvailabilities(pool, req.SkillIds, without, effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories).Count;
                    return (cert, diff: count - baseCount);
                })
                .Where(x => x.diff > 0)
                .OrderByDescending(x => x.diff)
                .Select(x => (x.cert, x.diff))
                .FirstOrDefault();

            if (topCert is not null && topDiff > 0)
                hints.Add(Warn("cert-bottleneck",
                    $"\"{topCert.Name}\" is the most restrictive requirement — removing it would unlock {topDiff} more potential {Plural("match", topDiff)}.",
                    new { certName = topCert.Name, count = topDiff }));

            if (req.CertificateIds.Count >= 2)
            {
                var noCerts = FilterAvailabilities(pool, req.SkillIds, [], effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories).Count;
                if (noCerts > baseCount)
                    hints.Add(Info("cert-all",
                        $"Removing all certificate requirements would expand your pool to {noCerts} {Plural("match", noCerts)}.",
                        new { count = noCerts }));
            }
        }

        // 4. Skill bottleneck
        if (req.SkillIds.Count > 1 && baseCount < 8)
        {
            var (topSkill, topDiff) = skills
                .Select(skill =>
                {
                    var without = req.SkillIds.Where(id => id != skill.Id).ToList();
                    var count = FilterAvailabilities(pool, without, req.CertificateIds, effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories).Count;
                    return (skill, diff: count - baseCount);
                })
                .Where(x => x.diff > 0)
                .OrderByDescending(x => x.diff)
                .Select(x => (x.skill, x.diff))
                .FirstOrDefault();

            if (topSkill is not null && topDiff > 0)
                hints.Add(Info("skill-bottleneck",
                    $"\"{topSkill.Name}\" is limiting your pool — removing it would unlock {topDiff} more {Plural("match", topDiff)}.",
                    new { skillName = topSkill.Name, count = topDiff }));
        }

        // 5. Experience level breakdown
        if (!string.IsNullOrEmpty(req.ExperienceLevel) && baseCount > 0)
        {
            var withMatchingLevel = baseMatches.Count(a => a.ExperienceLevel == req.ExperienceLevel);
            var withOtherLevel = baseCount - withMatchingLevel;
            if (withOtherLevel > 0)
                hints.Add(Info("experience-level",
                    $"{withOtherLevel} of your {baseCount} {Plural("match", baseCount)} declared a different experience level. Experience level is advisory and does not block these matches.",
                    new { count = withOtherLevel, total = baseCount }));
        }

        // 6. Date hints
        if (hasDateRange)
        {
            // Partial overlaps: declarations that overlap but don't fully cover the period
            var partialMatches = FilterAvailabilities(partialPool, req.SkillIds, req.CertificateIds, effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories);
            if (partialMatches.Count > 0)
                hints.Add(Info("date-partial",
                    $"{partialMatches.Count} {Plural("declaration", partialMatches.Count)} partially overlap your dates but don't cover the full period. Adjusting your start or end date could unlock {(partialMatches.Count == 1 ? "it" : "them")}.",
                    new { count = partialMatches.Count }));

            // Extended end date: try +7 days
            if (partialMatches.Count == 0)
            {
                var extendedEnd = req.EndDate!.Value.AddDays(7);
                var extendedPool = await db.AvailabilityDeclarations
                    .AsSplitQuery()
                    .Include(a => a.Company)
                    .Include(a => a.Skills)
                    .Include(a => a.Certificates)
                    .AsNoTracking()
                    .Where(a =>
                        a.Status == ListingStatus.Active &&
                        a.Company.Status == CompanyStatus.Active &&
                        a.CompanyId != companyId &&
                        a.StartDate <= req.StartDate!.Value &&
                        a.EndDate >= extendedEnd)
                    .ToListAsync();
                var extendedMatches = FilterAvailabilities(extendedPool, req.SkillIds, req.CertificateIds, effectiveCity, req.LocationRadiusKm, matchOutsideCategory, requester.Categories);
                var extDiff = extendedMatches.Count - baseCount;
                if (extDiff > 0)
                    hints.Add(Info("date-extend",
                        $"Extending your end date by 1 week would unlock {extDiff} more {Plural("match", extDiff)} from declarations that cover the broader period.",
                        new { count = extDiff }));
            }
        }

        // 7. Quantity feasibility
        if (baseCount > 0 && req.Quantity > 1)
        {
            var totalAvailable = baseMatches.Sum(a => a.Quantity);
            if (totalAvailable < req.Quantity)
                hints.Add(Warn("quantity",
                    $"Matching declarations can cover up to {totalAvailable} {Plural("worker", totalAvailable)} in total, but you need {req.Quantity}. Consider reducing quantity or broadening your criteria.",
                    new { count = totalAvailable, needed = req.Quantity }));
        }

        // 8. Urgency suggestion
        if (req.Urgency == "normal" && req.StartDate.HasValue)
        {
            var daysUntil = (req.StartDate.Value.Date - DateTime.UtcNow.Date).Days;
            if (daysUntil is >= 0 and <= 10 && baseCount < 3)
            {
                var label = daysUntil == 0 ? "today" : daysUntil == 1 ? "tomorrow" : $"in {daysUntil} days";
                hints.Add(Warn("urgency",
                    $"Your start date is {label} with only {baseCount} {Plural("match", baseCount)} found. Switching to Urgent triggers wider network outreach to find capacity faster.",
                    new { days = daysUntil, matchCount = baseCount }));
            }
        }

        // 9. Skill rarity
        // Count how many active declarations network-wide declare each required skill.
      if (req.SkillIds.Count > 0 && baseCount < 5)
        {
            var skillNetworkCounts = await db.AvailabilityDeclarations
                .AsNoTracking()
                .Where(a =>
                    a.Status == ListingStatus.Active &&
                    a.Company.Status == CompanyStatus.Active &&
                    a.ResourceType == ResourceType.Worker &&
                    a.CompanyId != companyId)
                .SelectMany(a => a.Skills.Where(s => req.SkillIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }))
                .GroupBy(s => new { s.Id, s.Name })
                .Select(g => new { g.Key.Name, Count = g.Count() })
                .ToListAsync();

            // Skills with zero declarations won't appear - add them explicitly
            var foundIds = skillNetworkCounts.Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var zeroSkills = skills.Where(s => !foundIds.Contains(s.Name)).Select(s => new { s.Name, Count = 0 });
            var allSkillCounts = skillNetworkCounts.Concat(zeroSkills).OrderBy(x => x.Count).ToList();

            var rarest = allSkillCounts.First();
            if (rarest.Count < 5)
                hints.Add(rarest.Count == 0
                    ? Warn("skill-rarity",
                        $"\"{rarest.Name}\" is not declared by any active company in your network. No matching pool exists for this skill.",
                        new { skillName = rarest.Name, count = 0 })
                    : Warn("skill-rarity",
                        $"\"{rarest.Name}\" is declared by only {rarest.Count} {Plural("company", rarest.Count)} in your entire network — this is the fundamental supply constraint.",
                        new { skillName = rarest.Name, count = rarest.Count }));
        }

        return new WorkflowHintsResult { EstimatedMatchCount = baseCount, Hints = hints };
    }

    // Declare Availability flow
    public async Task<WorkflowHintsResult> GetAvailabilityHintsAsync(int companyId, WorkflowHintsRequest req)
    {
        var hasDateRange = req.StartDate.HasValue && req.EndDate.HasValue
                           && req.EndDate.Value > req.StartDate.Value;

        var supplier = await db.Companies
            .AsNoTracking()
            .FirstAsync(c => c.Id == companyId);

        var effectiveCity = !string.IsNullOrWhiteSpace(req.LocationCity)
            ? req.LocationCity
            : supplier.DefaultLocation;
        var hasCity = !string.IsNullOrWhiteSpace(effectiveCity);

        var baseQuery = db.CapacityRequests
            .AsSplitQuery()
            .Include(r => r.Company).ThenInclude(c => c.CompanySettings)
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .AsNoTracking()
            .Where(r =>
                r.Status == ListingStatus.Active &&
                r.Company.Status == CompanyStatus.Active &&
                r.CompanyId != companyId &&
                r.ResourceType == ResourceType.Worker);

        List<CapacityRequest> pool;
        List<CapacityRequest> nearMissPool = [];
        if (hasDateRange)
        {
            var start = req.StartDate!.Value;
            var end = req.EndDate!.Value;
            // Full coverage: availability fully covers the request period
            pool = await baseQuery
                .Where(r => r.StartDate >= start && r.EndDate <= end)
                .ToListAsync();

            // Near-miss: requests that start within our window but end after
            nearMissPool = await baseQuery
                .Where(r => r.StartDate >= start && r.EndDate > end)
                .ToListAsync();
        }
        else
        {
            pool = await baseQuery.ToListAsync();
        }

        var hints = new List<WorkflowHintDto>();

        var baseMatches = FilterRequests(pool, req.SkillIds, req.CertificateIds, effectiveCity, req.LocationRadiusKm, supplier.Categories);
        var baseCount = baseMatches.Count;

        // 1. Match count
        if (baseCount == 0)
            hints.Add(Warn("no-matches", "No active capacity requests in your network match your current availability criteria."));
        else if (baseCount >= 3)
            hints.Add(Good("match-count", $"Your declaration matches {baseCount} active capacity {Plural("request", baseCount)} in your network.", new { count = baseCount, strong = true }));
        else
            hints.Add(Info("match-count", $"Your declaration matches {baseCount} active {Plural("request", baseCount)} in your network.", new { count = baseCount, strong = false }));

        // 2. Radius expansion
        if (hasCity && req.LocationRadiusKm < 175)
        {
            var suggested = SuggestRadius(req.LocationRadiusKm);
            var expanded = FilterRequests(pool, req.SkillIds, req.CertificateIds, effectiveCity, suggested, supplier.Categories);
            var diff = expanded.Count - baseCount;
            if (diff >= 1)
                hints.Add(Info("radius",
                    $"Expanding your service radius to {suggested} km near {effectiveCity} would make you eligible for {diff} more {Plural("request", diff)}.",
                    new { suggested, city = effectiveCity, count = diff }));
        }

        // 3. Certificate opportunity
        var unmatched = pool.Except(baseMatches).ToList();
        if (unmatched.Count > 0)
        {
            var opportunity = unmatched
                .SelectMany(r => r.Certificates)
                .Where(c => !req.CertificateIds.Contains(c.Id))
                .GroupBy(c => c.Id)
                .Select(g => (CertName: g.First().Name, Count: g.Count()))
                .OrderByDescending(x => x.Count)
                .FirstOrDefault();

            if (opportunity.CertName is not null && opportunity.Count >= 2)
                hints.Add(Info("cert-opportunity",
                    $"Adding \"{opportunity.CertName}\" to your workers' certificates could make you eligible for {opportunity.Count} more {Plural("request", opportunity.Count)} that currently require it.",
                    new { certName = opportunity.CertName, count = opportunity.Count }));
        }

        // 4. Skill opportunity
        if (unmatched.Count > 0)
        {
            var skillOpp = unmatched
                .SelectMany(r => r.Skills)
                .Where(s => !req.SkillIds.Contains(s.Id))
                .GroupBy(s => s.Id)
                .Select(g => (SkillName: g.First().Name, Count: g.Count()))
                .OrderByDescending(x => x.Count)
                .FirstOrDefault();

            if (skillOpp.SkillName is not null && skillOpp.Count >= 2)
                hints.Add(Info("skill-opportunity",
                    $"Adding \"{skillOpp.SkillName}\" as a declared skill could make you eligible for {skillOpp.Count} more {Plural("request", skillOpp.Count)}.",
                    new { skillName = skillOpp.SkillName, count = skillOpp.Count }));
        }

        // 5. Date coverage extension
        if (hasDateRange && nearMissPool.Count > 0)
        {
            var nearMissMatches = FilterRequests(nearMissPool, req.SkillIds, req.CertificateIds, effectiveCity, req.LocationRadiusKm, supplier.Categories);
            if (nearMissMatches.Count > 0)
                hints.Add(Info("date-coverage",
                    $"{nearMissMatches.Count} {Plural("request", nearMissMatches.Count)} start within your window but end after your availability period. Extending your end date could cover {(nearMissMatches.Count == 1 ? "it" : "them")}.",
                    new { count = nearMissMatches.Count }));
        }

        // 6. Quantity demand
        if (baseCount > 0 && req.Quantity > 0)
        {
            var totalDemand = baseMatches.Sum(r => r.Quantity);
            if (totalDemand > req.Quantity * 2)
                hints.Add(Info("quantity-demand",
                    $"Matched requests need {totalDemand} workers in total. Declaring more workers (if available) could help fill more of this demand.",
                    new { totalDemand, declared = req.Quantity }));
        }

        return new WorkflowHintsResult { EstimatedMatchCount = baseCount, Hints = hints };
    }

    // Filtering helpers

    // Request side: availability must have ALL the required skill/cert IDs
    private static List<AvailabilityDeclaration> FilterAvailabilities(
        List<AvailabilityDeclaration> candidates,
        List<int> requiredSkillIds,
        List<int> requiredCertIds,
        string? city,
        int radiusKm,
        bool matchOutsideCategory = true,
        List<string>? requesterCategories = null)
    {
        return candidates.Where(a =>
        {
            var aSkills = a.Skills.Select(s => s.Id).ToHashSet();
            if (requiredSkillIds.Any(id => !aSkills.Contains(id))) return false;

            var aCerts = a.Certificates.Select(c => c.Id).ToHashSet();
            if (requiredCertIds.Any(id => !aCerts.Contains(id))) return false;

            if (!matchOutsideCategory
                && requesterCategories?.Count > 0
                && a.Company.Categories.Count > 0
                && !requesterCategories.Any(c => a.Company.Categories.Contains(c)))
                return false;

            if (!string.IsNullOrWhiteSpace(city))
                return LocationMatches(city, radiusKm, a.LocationCity, a.LocationRadiusKm);

            return true;
        }).ToList();
    }

    // Availability side: OUR declaration (skillIds/certIds) must satisfy ALL of each request's requirements
    private static List<CapacityRequest> FilterRequests(
        List<CapacityRequest> requests,
        List<int> ourSkillIds,
        List<int> ourCertIds,
        string? ourCity,
        int ourRadiusKm,
        List<string>? ourCategories = null)
    {
        var ourSkills = ourSkillIds.ToHashSet();
        var ourCerts = ourCertIds.ToHashSet();

        return requests.Where(r =>
        {
            if (r.Skills.Any(s => !ourSkills.Contains(s.Id))) return false;
            if (r.Certificates.Any(c => !ourCerts.Contains(c.Id))) return false;

            var requesterAllowsOutside = r.Company.CompanySettings?.MatchOutsideCategory ?? true;
            if (!requesterAllowsOutside
                && ourCategories?.Count > 0
                && r.Company.Categories.Count > 0
                && !ourCategories.Any(c => r.Company.Categories.Contains(c)))
                return false;

            if (!string.IsNullOrWhiteSpace(ourCity))
                return LocationMatches(ourCity, ourRadiusKm, r.LocationCity, r.LocationRadiusKm);

            return true;
        }).ToList();
    }

    private static bool LocationMatches(string cityA, int radiusA, string cityB, int radiusB)
    {
        var normA = MatchingCityCoordinateCatalog.NormalizeForLookup(cityA);
        var normB = MatchingCityCoordinateCatalog.NormalizeForLookup(cityB);

        if (StringComparer.OrdinalIgnoreCase.Equals(normA, normB)) return true;

        if (!MatchingCityCoordinateCatalog.CityCoordinates.TryGetValue(normA, out var pointA) ||
            !MatchingCityCoordinateCatalog.CityCoordinates.TryGetValue(normB, out var pointB))
            return false;

        var distanceKm = HaversineKm(pointA, pointB);
        return distanceKm <= radiusA + radiusB;
    }

    private static double HaversineKm(GeoPoint from, GeoPoint to)
    {
        const double R = 6371.0;
        var dLat = Rad(to.Latitude - from.Latitude);
        var dLon = Rad(to.Longitude - from.Longitude);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(Rad(from.Latitude)) * Math.Cos(Rad(to.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double Rad(double deg) => deg * Math.PI / 180d;

    private static int SuggestRadius(int current) =>
        Math.Max(current + 25, Math.Min(200, (int)Math.Ceiling(current * 2.0 / 25) * 25));

    private static string Plural(string word, int count) => count == 1 ? word : word + "s";

    private static WorkflowHintDto Info(string id, string msg, object? p = null) =>
        new() { Id = id, Severity = "info", Message = msg, Params = ToDict(p) };
    private static WorkflowHintDto Warn(string id, string msg, object? p = null) =>
        new() { Id = id, Severity = "warning", Message = msg, Params = ToDict(p) };
    private static WorkflowHintDto Good(string id, string msg, object? p = null) =>
        new() { Id = id, Severity = "positive", Message = msg, Params = ToDict(p) };

    private static Dictionary<string, object?> ToDict(object? obj)
    {
        if (obj is null) return [];
        return obj.GetType().GetProperties()
            .ToDictionary(p => p.Name, p => (object?)p.GetValue(obj));
    }
}
