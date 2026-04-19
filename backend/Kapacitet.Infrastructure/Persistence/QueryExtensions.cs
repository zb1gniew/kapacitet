using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence;

public static class QueryExtensions
{
    public static IQueryable<User> WhereEmailMatches(
        this IQueryable<User> query,
        string email)
    {
        var normalizedEmail = EmailAddressNormalizer.NormalizeForLookup(email);

        return query.Where(user =>
            (EF.Property<string?>(user, PersistenceModelConstants.NormalizedEmailProperty)
                ?? user.Email.Trim().ToLower()) == normalizedEmail);
    }

    public static IQueryable<AccessRequest> WhereContactEmailMatches(
        this IQueryable<AccessRequest> query,
        string email)
    {
        var normalizedEmail = EmailAddressNormalizer.NormalizeForLookup(email);

        return query.Where(request =>
            (EF.Property<string?>(request, PersistenceModelConstants.NormalizedContactEmailProperty)
                ?? request.ContactEmail.Trim().ToLower()) == normalizedEmail);
    }
}
