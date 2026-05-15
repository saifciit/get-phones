using EasyPhones.Domain.Entities.Base;

namespace EasyPhones.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? AvatarPath { get; set; }
    public bool IsVerified { get; set; } = false;
    public string? VerificationToken { get; set; }
    public string? ResetPasswordToken { get; set; }
    public DateTime? ResetPasswordExpires { get; set; }
}
