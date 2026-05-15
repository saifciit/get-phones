using EasyPhones.Application.Dtos.AuthDtos;
using EasyPhones.Application.Services;
using EasyPhones.Application.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyPhones.WebAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly UserContextService _ctx;

    public AuthController(AuthService auth, UserContextService ctx)
    {
        _auth = auth;
        _ctx = ctx;
    }

    /// <summary>Register a new user account.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse>> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var result = await _auth.RegisterAsync(dto, ct);
        return StatusCode(201, ApiResponse.Success(result, result.Message));
    }

    /// <summary>Login with email and password.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var result = await _auth.LoginAsync(dto, ct);
        return Ok(ApiResponse.Success(result, result.Message));
    }

    /// <summary>Refresh access token using a refresh token.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse>> Refresh([FromBody] RefreshDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var result = await _auth.RefreshAsync(dto.RefreshToken, ct);
        return Ok(ApiResponse.Success(result));
    }

    /// <summary>Logout and revoke refresh token.</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Logout([FromBody] LogoutDto dto, CancellationToken ct)
    {
        await _auth.LogoutAsync(dto.RefreshToken, ct);
        return Ok(ApiResponse.Success(message: "Logged out successfully."));
    }

    /// <summary>Verify email address via token.</summary>
    [HttpGet("verify-email")]
    public async Task<ActionResult<ApiResponse>> VerifyEmail([FromQuery] string token, CancellationToken ct)
    {
        var message = await _auth.VerifyEmailAsync(token, ct);
        return Ok(ApiResponse.Success(message: message));
    }

    /// <summary>Request a password reset email.</summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse>> ForgotPassword([FromBody] ForgotPasswordDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var message = await _auth.ForgotPasswordAsync(dto, ct);
        return Ok(ApiResponse.Success(message: message));
    }

    /// <summary>Reset password using the token from email.</summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse>> ResetPassword([FromBody] ResetPasswordDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var message = await _auth.ResetPasswordAsync(dto, ct);
        return Ok(ApiResponse.Success(message: message));
    }

    /// <summary>Get the currently authenticated user.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Me(CancellationToken ct)
    {
        var user = await _auth.GetMeAsync(_ctx.UserId, ct);
        return Ok(ApiResponse.Success(user));
    }
}
