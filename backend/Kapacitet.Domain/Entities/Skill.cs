using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class Skill
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public string? Category { get; set; }
    public string Name { get; set; } = null!;
}
