using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Kapacitet.Tests.Helpers;

public static class TestDbFactory
{
    public static AppDbContext Create(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings =>
                warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new AppDbContext(options);
    }

    public static async Task<AppDbContext> CreatePostgresAsync()
    {
        var baseConnectionString = await SharedPostgresContainer.GetConnectionStringAsync();
        var builder = new NpgsqlConnectionStringBuilder(baseConnectionString)
        {
            Database = $"kapacitet_unit_tests_{Guid.NewGuid():N}"
        };

        EnsureDatabaseExists(baseConnectionString, builder.Database);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(builder.ConnectionString)
            .Options;

        var db = new AppDbContext(options);
        await db.Database.MigrateAsync();

        return db;
    }

    private static void EnsureDatabaseExists(string baseConnectionString, string databaseName)
    {
        using var connection = new NpgsqlConnection(baseConnectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
        command.ExecuteNonQuery();
    }

    private static class SharedPostgresContainer
    {
        private static readonly SemaphoreSlim Gate = new(1, 1);
        private static PostgreSqlContainer? _postgres;
        private static string? _connectionString;

        public static async Task<string> GetConnectionStringAsync()
        {
            if (_connectionString is not null)
            {
                return _connectionString;
            }

            await Gate.WaitAsync();

            try
            {
                if (_connectionString is not null)
                {
                    return _connectionString;
                }

                _postgres = new PostgreSqlBuilder()
                    .WithImage("postgres:15-alpine")
                    .Build();

                await _postgres.StartAsync();
                _connectionString = _postgres.GetConnectionString();
                return _connectionString;
            }
            finally
            {
                Gate.Release();
            }
        }

        // Intentional process-lifetime container reuse to keep relational test setup stable.
    }
}
