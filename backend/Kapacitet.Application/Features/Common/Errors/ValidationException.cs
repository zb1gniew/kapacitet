namespace Kapacitet.Application.Features.Common.Errors;

public sealed class ValidationException : Exception
{
    public ValidationException(
        IReadOnlyDictionary<string, string[]> fieldErrors,
        string message = "One or more validation errors occurred.")
        : base(message)
    {
        FieldErrors = fieldErrors;
    }

    public IReadOnlyDictionary<string, string[]> FieldErrors { get; }
}
