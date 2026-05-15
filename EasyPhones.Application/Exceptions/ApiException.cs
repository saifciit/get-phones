using System.Net;

namespace EasyPhones.Application.Exceptions;

public class ApiException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string ErrorCode { get; }

    public ApiException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, string errorCode = "api_error")
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }

    public static ApiException NotFound(string message = "Resource not found.", string code = "not_found")
        => new(message, HttpStatusCode.NotFound, code);

    public static ApiException Forbidden(string message = "Access denied.", string code = "forbidden")
        => new(message, HttpStatusCode.Forbidden, code);

    public static ApiException Conflict(string message, string code = "conflict")
        => new(message, HttpStatusCode.Conflict, code);

    public static ApiException Validation(string message, string code = "validation_error")
        => new(message, HttpStatusCode.UnprocessableEntity, code);

    public static ApiException Unauthorized(string message = "Not authenticated.", string code = "not_authenticated")
        => new(message, HttpStatusCode.Unauthorized, code);

    public static ApiException TooManyRequests(string message, string code = "rate_limit_exceeded")
        => new(message, (HttpStatusCode)429, code);
}
