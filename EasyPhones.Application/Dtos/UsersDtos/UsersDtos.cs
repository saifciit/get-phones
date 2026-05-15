using System.ComponentModel.DataAnnotations;

namespace EasyPhones.Application.Dtos.UsersDtos;

public class UpdateProfileDto
{
    [MinLength(2), MaxLength(100)]
    public string? Name { get; set; }

    [RegularExpression(@"^\+?\d{10,15}$", ErrorMessage = "Invalid phone format.")]
    public string? Phone { get; set; }
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class PublicProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public int AdCount { get; set; }
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
