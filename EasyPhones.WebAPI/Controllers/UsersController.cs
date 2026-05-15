using EasyPhones.Application.Dtos.UsersDtos;
using EasyPhones.Application.Services;
using EasyPhones.Application.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyPhones.WebAPI.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UsersService _users;
    private readonly UserContextService _ctx;

    public UsersController(UsersService users, UserContextService ctx)
    {
        _users = users;
        _ctx = ctx;
    }

    private string BaseUrl() => $"{Request.Scheme}://{Request.Host}";

    /// <summary>Get a user's public profile.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse>> GetPublicProfile(string id, CancellationToken ct)
    {
        var profile = await _users.GetPublicProfileAsync(id, BaseUrl(), ct);
        return Ok(ApiResponse.Success(profile));
    }

    /// <summary>Update the authenticated user's name and/or phone.</summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var profile = await _users.UpdateProfileAsync(_ctx.UserId, dto, BaseUrl(), ct);
        return Ok(ApiResponse.Success(profile));
    }

    /// <summary>Upload a new avatar (multipart/form-data, field "avatar").</summary>
    [HttpPut("me/avatar")]
    [Authorize]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse>> UpdateAvatar(CancellationToken ct)
    {
        var file = Request.Form.Files.GetFile("avatar");
        if (file is null)
            return UnprocessableEntity(ApiResponse.Fail("validation_error", "avatar file is required."));

        var allowed = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif" };
        if (!allowed.Contains(file.ContentType))
            return UnprocessableEntity(ApiResponse.Fail("validation_error",
                "Only image files are allowed (jpeg, png, webp, gif)."));

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var profile = await _users.UpdateAvatarAsync(
            _ctx.UserId, file.FileName, file.ContentType, file.Length, ms.ToArray(), BaseUrl(), ct);

        return Ok(ApiResponse.Success(profile));
    }

    /// <summary>Change the authenticated user's password.</summary>
    [HttpPut("me/password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        await _users.ChangePasswordAsync(_ctx.UserId, dto, ct);
        return Ok(ApiResponse.Success(message: "Password changed successfully."));
    }
}
