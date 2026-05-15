using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace EasyPhones.WebAPI;

public sealed class UserContextService
{
    private readonly IHttpContextAccessor _http;
    public UserContextService(IHttpContextAccessor http) => _http = http;

    public string UserId =>
        _http.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? throw new UnauthorizedAccessException("Not authenticated.");

    public string UserEmail =>
        _http.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
}
