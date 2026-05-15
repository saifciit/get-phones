using EasyPhones.Domain.Entities.Base;

namespace EasyPhones.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; } = false;

    public User? User { get; set; }
}
