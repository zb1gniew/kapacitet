using Kapacitet.Application.Features.Common.Errors;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Infrastructure;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IHostEnvironment _environment;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(
        IHostEnvironment environment,
        ILogger<GlobalExceptionHandler> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = CreateProblemDetails(exception);

        if ((problemDetails.Status ?? StatusCodes.Status500InternalServerError) >= 500)
        {
            _logger.LogError(exception, "Unhandled request failure.");
        }
        else
        {
            _logger.LogWarning(exception, "Request failed with a handled application error.");
        }

        httpContext.Response.StatusCode =
            problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private ProblemDetails CreateProblemDetails(Exception exception)
    {
        return exception switch
        {
            ValidationException validationException => CreateValidationProblemDetails(validationException),
            KeyNotFoundException => CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Resource not found",
                "not-found",
                exception.Message),
            InvalidOperationException => CreateProblemDetails(
                StatusCodes.Status409Conflict,
                "Conflict",
                "conflict",
                exception.Message),
            ArgumentException => CreateProblemDetails(
                StatusCodes.Status422UnprocessableEntity,
                "Validation failed",
                "validation-error",
                exception.Message),
            UnauthorizedAccessException => CreateProblemDetails(
                StatusCodes.Status403Forbidden,
                "Forbidden",
                "forbidden",
                exception.Message),
            _ => CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Internal server error",
                "internal-error",
                _environment.IsDevelopment() ? exception.Message : null)
        };
    }

    private static ProblemDetails CreateValidationProblemDetails(ValidationException exception)
    {
        var problemDetails = CreateProblemDetails(
            StatusCodes.Status422UnprocessableEntity,
            "Validation failed",
            "validation-error",
            exception.Message);
        problemDetails.Extensions["fieldErrors"] = exception.FieldErrors;
        return problemDetails;
    }

    private static ProblemDetails CreateProblemDetails(
        int status,
        string title,
        string type,
        string? detail)
    {
        return new ProblemDetails
        {
            Status = status,
            Title = title,
            Type = type,
            Detail = detail
        };
    }
}
