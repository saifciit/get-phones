using EasyPhones.Domain.Entities;

namespace EasyPhones.Domain.Repositories;

public interface IAdRepository
{
    Task<(IReadOnlyList<PhoneAd> Items, int Total)> ListAsync(AdListQuery query, CancellationToken ct = default);
    Task<PhoneAd?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<int> CountTodayByUserAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<PhoneAd>> GetByUserAsync(string userId, CancellationToken ct = default);
    Task AddAsync(PhoneAd ad, CancellationToken ct = default);
    Task UpdateAsync(PhoneAd ad, CancellationToken ct = default);
}

public record AdListQuery(
    int Page,
    int Limit,
    string? Q,
    string? Brand,
    string? Condition,
    string? City,
    decimal? MinPrice,
    decimal? MaxPrice,
    string Sort
);
