namespace EasyPhones.Application.Wrappers;

public class ApiResponse
{
    public bool Succeeded { get; set; }
    public object? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public object? Details { get; set; }

    public static ApiResponse Success(object? data = null, string? message = null)
        => new() { Succeeded = true, Data = data, Message = message };

    public static ApiResponse Fail(string error, string? message = null, object? details = null)
        => new() { Succeeded = false, Error = error, Message = message ?? error, Details = details };
}

public class PagedResponse<T>
{
    public IReadOnlyList<T> Data { get; set; } = [];
    public PageMeta Meta { get; set; } = new();
}

public class PageMeta
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
    public bool HasMore { get; set; }
}
