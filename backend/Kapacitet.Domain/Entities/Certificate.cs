using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class Certificate
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}