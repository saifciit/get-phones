using System.Text.Json;
using EasyPhones.Application.Constants;
using EasyPhones.Application.Dtos.AdsDtos;
using EasyPhones.Application.Exceptions;
using EasyPhones.Application.Wrappers;
using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Enums;
using EasyPhones.Domain.Repositories;

namespace EasyPhones.Application.Services;

public class AdsService
{
    private readonly IAdRepository _ads;
    private readonly IFileService _files;

    public AdsService(IAdRepository ads, IFileService files)
    {
        _ads = ads;
        _files = files;
    }

    // ── List ──────────────────────────────────────────────────────────────────
    public async Task<PagedResponse<AdDto>> ListAsync(AdListRequestDto req, string baseUrl, CancellationToken ct)
    {
        var page  = Math.Max(1, req.Page);
        var limit = Math.Clamp(req.Limit, 1, 50);

        var query = new AdListQuery(page, limit, req.Q, req.Brand, req.Condition, req.City,
            req.MinPrice, req.MaxPrice, req.Sort ?? "newest");

        var (items, total) = await _ads.ListAsync(query, ct);
        var totalPages = (int)Math.Ceiling((double)total / limit);

        return new PagedResponse<AdDto>
        {
            Data = items.Select(a => MapAd(a, baseUrl)).ToList(),
            Meta = new PageMeta
            {
                Page = page, Limit = limit, Total = total,
                TotalPages = totalPages, HasMore = page < totalPages
            }
        };
    }

    // ── Get by id ─────────────────────────────────────────────────────────────
    public async Task<AdDto> GetByIdAsync(string id, string baseUrl, CancellationToken ct)
    {
        var ad = await _ads.GetByIdAsync(id, ct)
            ?? throw ApiException.NotFound("Ad not found.");
        if (!ad.IsActive) throw ApiException.NotFound("Ad not found.");
        return MapAd(ad, baseUrl);
    }

    // ── Create ────────────────────────────────────────────────────────────────
    public async Task<AdDto> CreateAsync(
        string userId, string sellerName,
        CreateAdDto dto, List<IFormFileProxy> photos,
        string baseUrl, CancellationToken ct)
    {
        if (photos.Count == 0)
            throw ApiException.Validation("At least 1 photo is required.");
        if (photos.Count > 5)
            throw ApiException.Validation("Maximum 5 photos allowed.", "too_many_photos");

        ValidateAdFields(dto.Brand, dto.City, dto.Condition);

        var todayCount = await _ads.CountTodayByUserAsync(userId, ct);
        if (todayCount >= 20)
            throw ApiException.TooManyRequests("Daily limit of 20 ads reached.");

        var photoPaths = new List<string>();
        foreach (var photo in photos)
        {
            var saved = await _files.SaveAsync(new FileUploadInput(
                photo.FileName, photo.ContentType, photo.Length, photo.Bytes, "ads", userId), ct);
            photoPaths.Add(saved.Path);
        }

        var condEnum = ParseCondition(dto.Condition);
        var ad = new PhoneAd
        {
            Id = Guid.NewGuid().ToString(),
            Title = dto.Title.Trim(),
            Brand = PhoneConstants.NormaliseBrand(dto.Brand),
            Model = dto.Model.Trim(),
            Price = dto.Price,
            Condition = condEnum,
            City = PhoneConstants.NormaliseCity(dto.City),
            Description = dto.Description.Trim(),
            ContactNumber = dto.ContactNumber,
            PhotoUrlsJson = JsonSerializer.Serialize(photoPaths),
            UserId = userId,
            SellerName = sellerName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _ads.AddAsync(ad, ct);
        return MapAd(ad, baseUrl);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public async Task<AdDto> UpdateAsync(
        string id, string userId,
        UpdateAdDto dto, List<IFormFileProxy> newPhotos,
        string baseUrl, CancellationToken ct)
    {
        var ad = await _ads.GetByIdAsync(id, ct)
            ?? throw ApiException.NotFound("Ad not found.");
        if (ad.UserId != userId) throw ApiException.Forbidden("You are not allowed to edit this ad.");

        if (dto.Brand is not null) ValidateAdFields(dto.Brand, null, null);
        if (dto.City is not null) ValidateAdFields(null, dto.City, null);
        if (dto.Condition is not null) ValidateAdFields(null, null, dto.Condition);

        if (dto.Title is not null)          ad.Title = dto.Title.Trim();
        if (dto.Brand is not null)          ad.Brand = PhoneConstants.NormaliseBrand(dto.Brand);
        if (dto.Model is not null)          ad.Model = dto.Model.Trim();
        if (dto.Price is not null)          ad.Price = dto.Price.Value;
        if (dto.Condition is not null)      ad.Condition = ParseCondition(dto.Condition);
        if (dto.City is not null)           ad.City = PhoneConstants.NormaliseCity(dto.City);
        if (dto.Description is not null)    ad.Description = dto.Description.Trim();
        if (dto.ContactNumber is not null)  ad.ContactNumber = dto.ContactNumber;

        if (newPhotos.Count > 0)
        {
            if (newPhotos.Count > 5)
                throw ApiException.Validation("Maximum 5 photos allowed.", "too_many_photos");

            // Delete old blobs
            var oldPaths = JsonSerializer.Deserialize<List<string>>(ad.PhotoUrlsJson) ?? [];
            foreach (var p in oldPaths)
                await _files.DeleteByPathAsync(p, ct).ContinueWith(_ => { });

            // Save new blobs
            var newPaths = new List<string>();
            foreach (var photo in newPhotos)
            {
                var saved = await _files.SaveAsync(new FileUploadInput(
                    photo.FileName, photo.ContentType, photo.Length, photo.Bytes, "ads", userId), ct);
                newPaths.Add(saved.Path);
            }
            ad.PhotoUrlsJson = JsonSerializer.Serialize(newPaths);
        }

        ad.UpdatedAt = DateTime.UtcNow;
        await _ads.UpdateAsync(ad, ct);
        return MapAd(ad, baseUrl);
    }

    // ── Soft delete ───────────────────────────────────────────────────────────
    public async Task SoftDeleteAsync(string id, string userId, CancellationToken ct)
    {
        var ad = await _ads.GetByIdAsync(id, ct)
            ?? throw ApiException.NotFound("Ad not found.");
        if (ad.UserId != userId) throw ApiException.Forbidden("You are not allowed to delete this ad.");
        ad.IsActive = false;
        ad.UpdatedAt = DateTime.UtcNow;
        await _ads.UpdateAsync(ad, ct);
    }

    // ── My ads ────────────────────────────────────────────────────────────────
    public async Task<PagedResponse<AdDto>> MyAdsAsync(string userId, string baseUrl, CancellationToken ct)
    {
        var items = await _ads.GetByUserAsync(userId, ct);
        return new PagedResponse<AdDto>
        {
            Data = items.Select(a => MapAd(a, baseUrl)).ToList(),
            Meta = new PageMeta { Total = items.Count }
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static void ValidateAdFields(string? brand, string? city, string? condition)
    {
        if (brand is not null && !PhoneConstants.IsBrandAllowed(brand))
            throw ApiException.Validation("Brand not in allowed list.", "invalid_brand");
        if (city is not null && !PhoneConstants.IsCityAllowed(city))
            throw ApiException.Validation("City not in allowed list.", "invalid_city");
        if (condition is not null && !PhoneConstants.IsConditionAllowed(condition))
            throw ApiException.Validation("Invalid condition value.", "invalid_condition");
    }

    private static ConditionValue ParseCondition(string s) => s switch
    {
        "brandNew" => ConditionValue.BrandNew,
        "likeNew"  => ConditionValue.LikeNew,
        "good"     => ConditionValue.Good,
        "fair"     => ConditionValue.Fair,
        _          => throw ApiException.Validation("Invalid condition value.", "invalid_condition")
    };

    private static string ConditionToString(ConditionValue c) => c switch
    {
        ConditionValue.BrandNew => "brandNew",
        ConditionValue.LikeNew  => "likeNew",
        ConditionValue.Good     => "good",
        ConditionValue.Fair     => "fair",
        _                       => c.ToString()
    };

    private AdDto MapAd(PhoneAd ad, string baseUrl)
    {
        var rawPaths = JsonSerializer.Deserialize<List<string>>(ad.PhotoUrlsJson) ?? [];
        var photoUrls = rawPaths.Select(p => _files.ServeUrl(p, baseUrl)).ToList();

        return new AdDto
        {
            Id = ad.Id,
            Title = ad.Title,
            Brand = ad.Brand,
            Model = ad.Model,
            Price = ad.Price,
            Condition = ConditionToString(ad.Condition),
            City = ad.City,
            Description = ad.Description,
            ContactNumber = ad.ContactNumber,
            PhotoUrls = photoUrls,
            UserId = ad.UserId,
            SellerName = ad.SellerName,
            IsActive = ad.IsActive,
            CreatedAt = ad.CreatedAt.ToString("O"),
            UpdatedAt = ad.UpdatedAt.ToString("O")
        };
    }
}

/// <summary>Abstraction over IFormFile so the service has no ASP.NET dependency.</summary>
public record IFormFileProxy(string FileName, string ContentType, long Length, byte[] Bytes);
