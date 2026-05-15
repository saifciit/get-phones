using System.ComponentModel.DataAnnotations;

namespace EasyPhones.Application.Dtos.AdsDtos;

public class CreateAdDto
{
    [Required, MinLength(5), MaxLength(120)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Brand { get; set; } = string.Empty;

    [Required, MinLength(1), MaxLength(80)]
    public string Model { get; set; } = string.Empty;

    [Required, Range(0.01, 9999999)]
    public decimal Price { get; set; }

    [Required]
    public string Condition { get; set; } = string.Empty;

    [Required]
    public string City { get; set; } = string.Empty;

    [Required, MinLength(10), MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\+?\d{10,15}$")]
    public string ContactNumber { get; set; } = string.Empty;
}

public class UpdateAdDto
{
    [MinLength(5), MaxLength(120)]
    public string? Title { get; set; }

    public string? Brand { get; set; }

    [MinLength(1), MaxLength(80)]
    public string? Model { get; set; }

    [Range(0.01, 9999999)]
    public decimal? Price { get; set; }

    public string? Condition { get; set; }
    public string? City { get; set; }

    [MinLength(10), MaxLength(1000)]
    public string? Description { get; set; }

    [RegularExpression(@"^\+?\d{10,15}$")]
    public string? ContactNumber { get; set; }
}

public class AdListRequestDto
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
    public string? Q { get; set; }
    public string? Brand { get; set; }
    public string? Condition { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string Sort { get; set; } = "newest";
}

public class AdDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public List<string> PhotoUrls { get; set; } = [];
    public string UserId { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}
