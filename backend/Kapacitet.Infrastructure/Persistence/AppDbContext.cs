using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Company> Companies { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Skill> Skills { get; set; } = null!;
    public DbSet<Certificate> Certificates { get; set; } = null!;
    public DbSet<AvailabilityDeclaration> AvailabilityDeclarations { get; set; } = null!;
    public DbSet<CapacityRequest> CapacityRequests { get; set; } = null!;
    public DbSet<MatchOffer> MatchOffers { get; set; } = null!;
    public DbSet<CooperationAgreement> CooperationAgreements { get; set; } = null!;
    public DbSet<NetworkEscalation> NetworkEscalations { get; set; } = null!;
    public DbSet<NetworkResponse> NetworkResponses { get; set; } = null!;
    public DbSet<AccessRequest> AccessRequests { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}