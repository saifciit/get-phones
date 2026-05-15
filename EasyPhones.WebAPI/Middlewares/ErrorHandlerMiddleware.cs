using System.Net;
using System.Text.Json;
using EasyPhones.Application.Exceptions;
using EasyPhones.Application.Wrappers;

namespace EasyPhones.WebAPI.Middlewares;

public class ErrorHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlerMiddleware> _logger;

    public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string error;
        string message;

        if (ex is ApiException apiEx)
        {
            statusCode = (int)apiEx.StatusCode;
            error = apiEx.ErrorCode;
            message = apiEx.Message;
        }
        else if (ex is KeyNotFoundException)
        {
            statusCode = (int)HttpStatusCode.NotFound;
            error = "not_found";
            message = ex.Message;
        }
        else
        {
            statusCode = (int)HttpStatusCode.InternalServerError;
            error = "server_error";
            message = "Internal server error.";
        }

        context.Response.StatusCode = statusCode;

        var response = ApiResponse.Fail(error, message);
        var result = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(result);
    }
}
