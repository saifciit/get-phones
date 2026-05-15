using System.ComponentModel.DataAnnotations;

namespace EasyPhones.Application.Dtos.AuthDtos;

public class RegisterDto
{
    [Required, MinLength(2), MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\+?\d{10,15}$", ErrorMessage = "Phone must be +? followed by 10-15 digits.")]
    public string Phone { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RefreshDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class LogoutDto
{
    public string? RefreshToken { get; set; }
}

public class ForgotPasswordDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class AuthResultDto
{
    public string Message { get; set; } = string.Empty;
    public UserDto? User { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
}

public class TokenResultDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
