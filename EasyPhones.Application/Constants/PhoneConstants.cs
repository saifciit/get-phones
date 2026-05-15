namespace EasyPhones.Application.Constants;

public static class PhoneConstants
{
    public static readonly string[] AllowedBrands =
    [
        "Samsung", "Apple", "Xiaomi", "OnePlus", "Oppo", "Vivo",
        "Realme", "Tecno", "Infinix", "Nokia", "Motorola", "Google",
        "Huawei", "Nothing"
    ];

    public static readonly string[] AllowedCities =
    [
        "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar",
        "Quetta", "Multan", "Faisalabad", "Abbottabad", "Sialkot",
        "Gujranwala", "Hyderabad", "Sukkur", "Mardan"
    ];

    public static readonly ConditionMeta[] Conditions =
    [
        new("brandNew", "Brand New"),
        new("likeNew",  "Like New"),
        new("good",     "Good"),
        new("fair",     "Fair")
    ];

    public static readonly string[] AllowedConditionValues = Conditions.Select(c => c.Value).ToArray();

    public static bool IsBrandAllowed(string brand)
        => AllowedBrands.Any(b => b.Equals(brand, StringComparison.OrdinalIgnoreCase));

    public static bool IsCityAllowed(string city)
        => AllowedCities.Any(c => c.Equals(city, StringComparison.OrdinalIgnoreCase));

    public static bool IsConditionAllowed(string cond)
        => AllowedConditionValues.Contains(cond);

    public static string NormaliseBrand(string brand)
        => AllowedBrands.FirstOrDefault(b => b.Equals(brand, StringComparison.OrdinalIgnoreCase)) ?? brand;

    public static string NormaliseCity(string city)
        => AllowedCities.FirstOrDefault(c => c.Equals(city, StringComparison.OrdinalIgnoreCase)) ?? city;
}

public record ConditionMeta(string Value, string Label);
