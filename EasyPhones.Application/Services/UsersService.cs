using EasyPhones.Application.Dtos.AuthDtos;
using EasyPhones.Application.Dtos.UsersDtos;
using EasyPhones.Application.Exceptions;
using EasyPhones.Domain.Repositories;
using BCrypt.Net;

namespace EasyPhones.Application.Services;

public class UsersService
{
    private readonly IUserRepository _users;
    private readonly IAdRepository _ads;
    private readonly IFileService _files;

    public UsersService(IUserRepository users, IAdRepository ads, IFileService files)
    {
        _users = users;
        _ads = ads;
        _files = files;
    }

    // ── Public profile ────────────────────────────────────────────────────────
    public async Task<PublicProfileDto> GetPublicProfileAsync(string id, string baseUrl, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(id, ct)
            ?? throw ApiException.NotFound("User not found.");

        var userAds = await _ads.GetByUserAsync(id, ct);
        var activeCount = userAds.Count(a => a.IsActive);

        var avatarUrl = user.AvatarPath is not null
            ? _files.ServeUrl(user.AvatarPath, baseUrl)
            : user.AvatarUrl;

        return new PublicProfileDto
        {
            Id = user.Id,
            Name = user.Name,
            AvatarUrl = avatarUrl,
            CreatedAt = user.CreatedAt.ToString("O"),
            AdCount = activeCount
        };
    }

    // ── Update profile ────────────────────────────────────────────────────────
    public async Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileDto dto, string baseUrl, CancellationToken ct)
    {
        if (dto.Phone is not null)
        {
            var conflict = await _users.GetByPhoneAsync(dto.Phone, ct);
            if (conflict is not null && conflict.Id != userId)
                throw ApiException.Conflict("This phone number is already in use.", "phone_taken");
        }

        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw ApiException.NotFound("User not found.");

        if (dto.Name is not null)  user.Name = dto.Name.Trim();
        if (dto.Phone is not null) user.Phone = dto.Phone;
        user.UpdatedAt = DateTime.UtcNow;

        await _users.UpdateAsync(user, ct);

        var avatarUrl = user.AvatarPath is not null
            ? _files.ServeUrl(user.AvatarPath, baseUrl)
            : user.AvatarUrl;

        return new UserProfileDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = avatarUrl,
            CreatedAt = user.CreatedAt.ToString("O")
        };
    }

    // ── Update avatar ─────────────────────────────────────────────────────────
    public async Task<UserProfileDto> UpdateAvatarAsync(
        string userId, string fileName, string contentType, long size, byte[] bytes,
        string baseUrl, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw ApiException.NotFound("User not found.");

        if (user.AvatarPath is not null)
            await _files.DeleteByPathAsync(user.AvatarPath, ct).ContinueWith(_ => { });

        var saved = await _files.SaveAsync(new FileUploadInput(fileName, contentType, size, bytes, "users", userId), ct);
        user.AvatarPath = saved.Path;
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        return new UserProfileDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = _files.ServeUrl(saved.Path, baseUrl),
            CreatedAt = user.CreatedAt.ToString("O")
        };
    }

    // ── Change password ───────────────────────────────────────────────────────
    public async Task ChangePasswordAsync(string userId, ChangePasswordDto dto, CancellationToken ct)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw ApiException.Validation("Passwords do not match.");

        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw ApiException.NotFound("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            throw ApiException.Validation("Current password is incorrect.", "invalid_credentials");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 12);
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);
    }
}
