using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Repositories;
using EasyPhones.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EasyPhones.Persistence.Repositories;

public class AdRepository : IAdRepository
{
    private readonly AppDbContext _db;
    public AdRepository(AppDbContext db) => _db = db;

    public async Task<(IReadOnlyList<PhoneAd> Items, int Total)> ListAsync(AdListQuery q, CancellationToken ct)
    {
        var query = _db.PhoneAds.AsQueryable().Where(a => a.IsActive);

        if (!string.IsNullOrWhiteSpace(q.Q))
        {
            var search = q.Q.ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(search) ||
                a.Brand.ToLower().Contains(search) ||
                a.Model.ToLower().Contains(search) ||
                a.City.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(q.Brand))
            query = query.Where(a => a.Brand.ToLower() == q.Brand.ToLower());

        if (!string.IsNullOrWhiteSpace(q.City))
            query = query.Where(a => a.City.ToLower() == q.City.ToLower());

        if (!string.IsNullOrWhiteSpace(q.Condition))
        {
            var condStr = q.Condition.ToLower();
            query = query.Where(a => EF.Functions.Like(a.Condition.ToString(), condStr));
        }

        if (q.MinPrice.HasValue) query = query.Where(a => a.Price >= q.MinPrice.Value);
        if (q.MaxPrice.HasValue) query = query.Where(a => a.Price <= q.MaxPrice.Value);

        query = q.Sort switch
        {
            "oldest"     => query.OrderBy(a => a.CreatedAt),
            "price_asc"  => query.OrderBy(a => a.Price),
            "price_desc" => query.OrderByDescending(a => a.Price),
            _            => query.OrderByDescending(a => a.CreatedAt)
        };

        var total = await query.CountAsync(ct);
        var items = await query.Skip((q.Page - 1) * q.Limit).Take(q.Limit).ToListAsync(ct);
        return (items, total);
    }

    public Task<PhoneAd?> GetByIdAsync(string id, CancellationToken ct)
        => _db.PhoneAds.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<int> CountTodayByUserAsync(string userId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        return await _db.PhoneAds
            .CountAsync(a => a.UserId == userId && a.CreatedAt >= today, ct);
    }

    public async Task<IReadOnlyList<PhoneAd>> GetByUserAsync(string userId, CancellationToken ct)
        => await _db.PhoneAds
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(PhoneAd ad, CancellationToken ct)
    {
        _db.PhoneAds.Add(ad);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(PhoneAd ad, CancellationToken ct)
    {
        _db.PhoneAds.Update(ad);
        await _db.SaveChangesAsync(ct);
    }
}
