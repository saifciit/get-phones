using EasyPhones.Domain.Entities.Base;
using EasyPhones.Domain.Enums;

namespace EasyPhones.Domain.Entities;

public class PhoneAd : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ConditionValue Condition { get; set; }
    public string City { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string PhotoUrlsJson { get; set; } = "[]";
    public string UserId { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public User? User { get; set; }
}
