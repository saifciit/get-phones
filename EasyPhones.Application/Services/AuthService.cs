using System.Net;
using System.Security.Cryptography;
using System.Text;
using EasyPhones.Application.Dtos.AuthDtos;
using EasyPhones.Application.Exceptions;
using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BCrypt.Net;

namespace EasyPhones.Application.Services;

public class AuthService
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;

    public AuthService(
        IUserRepository users,
        IRefreshTokenRepository tokens,
        IEmailService email,
        IConfiguration config)
    {
        _users = users;
        _tokens = tokens;
        _email = email;
        _config = config;
    }

    // ── Register ─────────────────────────────────────────────────────────────
    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto, CancellationToken ct)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw ApiException.Validation("Passwords do not match.");

        var existing = await _users.GetByEmailAsync(dto.Email.ToLower(), ct);
        if (existing is not null)
            throw ApiException.Conflict("An account with this email already exists.", "email_taken");

        var phoneExisting = await _users.GetByPhoneAsync(dto.Phone, ct);
        if (phoneExisting is not null)
            throw ApiException.Conflict("This phone number is already registered.", "phone_taken");

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12);
        var verificationToken = GenerateSecureToken();

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name.Trim(),
            Email = dto.Email.ToLower(),
            Phone = dto.Phone,
            PasswordHash = hash,
            VerificationToken = verificationToken,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _users.AddAsync(user, ct);

        _ = _email.SendVerificationLinkAsync(user.Email, verificationToken);

        var (accessToken, refreshToken) = await IssueTokenPairAsync(user, ct);

        return new AuthResultDto
        {
            Message = "Email sent, please verify your email to proceed.",
            User = MapUser(user),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ── Verify Email ──────────────────────────────────────────────────────────
    public async Task<string> VerifyEmailAsync(string token, CancellationToken ct)
    {
        var user = await _users.GetByVerificationTokenAsync(token, ct)
            ?? throw ApiException.Validation("Invalid or expired verification token.", "invalid_token");

        if (user.IsVerified) return "Email already verified.";

        user.IsVerified = true;
        user.VerificationToken = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        return "Email verified successfully.";
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public async Task<AuthResultDto> LoginAsync(LoginDto dto, CancellationToken ct)
    {
        var user = await _users.GetByEmailAsync(dto.Email.ToLower(), ct)
            ?? throw ApiException.Unauthorized("Incorrect email or password.", "invalid_credentials");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw ApiException.Unauthorized("Incorrect email or password.", "invalid_credentials");

        if (!user.IsVerified)
            throw new ApiException("Please verify your email address before logging in.", HttpStatusCode.Forbidden, "not_verified");

        var (accessToken, refreshToken) = await IssueTokenPairAsync(user, ct);

        return new AuthResultDto
        {
            Message = "Login successful",
            User = MapUser(user),
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }

    // ── Forgot Password ───────────────────────────────────────────────────────
    public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto, CancellationToken ct)
    {
        var user = await _users.GetByEmailAsync(dto.Email.ToLower(), ct)
            ?? throw ApiException.NotFound("No account found with this email.");

        var token = GenerateSecureToken();
        user.ResetPasswordToken = token;
        user.ResetPasswordExpires = DateTime.UtcNow.AddMinutes(15);
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        await _email.SendPasswordResetLinkAsync(dto.Email.ToLower(), token);
        return "Password reset link sent to your email.";
    }

    // ── Reset Password ────────────────────────────────────────────────────────
    public async Task<string> ResetPasswordAsync(ResetPasswordDto dto, CancellationToken ct)
    {
        var user = await _users.GetByResetTokenAsync(dto.Token, ct)
            ?? throw ApiException.Validation("Invalid or expired reset token.", "invalid_token");

        if (user.ResetPasswordExpires < DateTime.UtcNow)
            throw ApiException.Validation("Reset link has expired.", "expired_token");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12);
        user.ResetPasswordToken = null;
        user.ResetPasswordExpires = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        return "Password has been reset successfully.";
    }

    // ── Refresh ───────────────────────────────────────────────────────────────
    public async Task<TokenResultDto> RefreshAsync(string rawRefreshToken, CancellationToken ct)
    {
        string userId;
        try
        {
            var principal = ValidateRefreshToken(rawRefreshToken);
            userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? throw new SecurityTokenException();
        }
        catch
        {
            throw ApiException.Unauthorized("Invalid or expired refresh token.", "token_invalid");
        }

        var hash = HashToken(rawRefreshToken);
        var stored = await _tokens.GetByHashAsync(hash, ct);

        if (stored is null || stored.Revoked || stored.ExpiresAt < DateTime.UtcNow)
            throw ApiException.Unauthorized("Refresh token is invalid or has been revoked.", "token_invalid");

        await _tokens.RevokeByHashAsync(hash, ct);

        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw ApiException.Unauthorized("User not found.", "not_authenticated");

        var (newAccessToken, newRefreshToken) = await IssueTokenPairAsync(user, ct);
        return new TokenResultDto { AccessToken = newAccessToken, RefreshToken = newRefreshToken };
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    public async Task LogoutAsync(string? rawRefreshToken, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(rawRefreshToken)) return;
        var hash = HashToken(rawRefreshToken);
        await _tokens.RevokeByHashAsync(hash, ct);
    }

    // ── Get Me ────────────────────────────────────────────────────────────────
    public async Task<UserDto> GetMeAsync(string userId, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw ApiException.NotFound("User not found.");
        return MapUser(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task<(string AccessToken, string RefreshToken)> IssueTokenPairAsync(User user, CancellationToken ct)
    {
        var accessToken = SignAccessToken(user.Id, user.Email);
        var rawRefresh = SignRefreshToken(user.Id);
        var hash = HashToken(rawRefresh);

        var days = ParseDays(_config["JwtOptions:RefreshExpiresIn"] ?? "30d");
        var refreshEntity = new RefreshToken
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _tokens.AddAsync(refreshEntity, ct);

        return (accessToken, rawRefresh);
    }

    private string SignAccessToken(string userId, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtOptions:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.Add(ParseExpiry(_config["JwtOptions:AccessExpiresIn"] ?? "15m"));

        var token = new JwtSecurityToken(
            issuer: _config["JwtOptions:Issuer"],
            audience: _config["JwtOptions:Audience"],
            claims: [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: expires,
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string SignRefreshToken(string userId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtOptions:RefreshSecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var days = ParseDays(_config["JwtOptions:RefreshExpiresIn"] ?? "30d");

        var token = new JwtSecurityToken(
            claims: [new Claim(JwtRegisteredClaimNames.Sub, userId)],
            expires: DateTime.UtcNow.AddDays(days),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal ValidateRefreshToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtOptions:RefreshSecretKey"]!));
        return new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        }, out _);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string GenerateSecureToken()
        => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();

    private static int ParseDays(string s)
    {
        if (s.EndsWith('d') && int.TryParse(s[..^1], out var d)) return d;
        return 30;
    }

    private static TimeSpan ParseExpiry(string s)
    {
        if (s.EndsWith('m') && int.TryParse(s[..^1], out var m)) return TimeSpan.FromMinutes(m);
        if (s.EndsWith('h') && int.TryParse(s[..^1], out var h)) return TimeSpan.FromHours(h);
        if (s.EndsWith('d') && int.TryParse(s[..^1], out var d)) return TimeSpan.FromDays(d);
        return TimeSpan.FromMinutes(15);
    }

    public static UserDto MapUser(User u, string? avatarUrl = null) => new()
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email,
        Phone = u.Phone,
        AvatarUrl = avatarUrl ?? u.AvatarUrl,
        CreatedAt = u.CreatedAt.ToString("O")
    };
}
