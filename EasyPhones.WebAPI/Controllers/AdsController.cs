using EasyPhones.Application.Dtos.AdsDtos;
using EasyPhones.Application.Services;
using EasyPhones.Application.Wrappers;
using EasyPhones.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyPhones.WebAPI.Controllers;

[ApiController]
[Route("api/ads")]
public class AdsController : ControllerBase
{
    private readonly AdsService _ads;
    private readonly UserContextService _ctx;
    private readonly IUserRepository _users;

    public AdsController(AdsService ads, UserContextService ctx, IUserRepository users)
    {
        _ads = ads;
        _ctx = ctx;
        _users = users;
    }

    private string BaseUrl() => $"{Request.Scheme}://{Request.Host}";

    /// <summary>List phone ads with optional filters and pagination.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse>> List([FromQuery] AdListRequestDto req, CancellationToken ct)
    {
        var result = await _ads.ListAsync(req, BaseUrl(), ct);
        return Ok(result);
    }

    /// <summary>Get the authenticated user's ads.</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> MyAds(CancellationToken ct)
    {
        var result = await _ads.MyAdsAsync(_ctx.UserId, BaseUrl(), ct);
        return Ok(result);
    }

    /// <summary>Get a single ad by ID.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse>> GetById(string id, CancellationToken ct)
    {
        var ad = await _ads.GetByIdAsync(id, BaseUrl(), ct);
        return Ok(ApiResponse.Success(ad));
    }

    /// <summary>Create a new phone ad (multipart/form-data, field "photos", 1–5 images).</summary>
    [HttpPost]
    [Authorize]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse>> Create([FromForm] CreateAdDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var photos = await ReadPhotosAsync(Request.Form.Files);

        var user = await GetCurrentUserNameAsync(ct);
        var ad = await _ads.CreateAsync(_ctx.UserId, user, dto, photos, BaseUrl(), ct);
        return StatusCode(201, ApiResponse.Success(ad));
    }

    /// <summary>Update an existing ad (multipart/form-data; optional "photos" replaces all images).</summary>
    [HttpPut("{id}")]
    [Authorize]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse>> Update(string id, [FromForm] UpdateAdDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var photos = await ReadPhotosAsync(Request.Form.Files);
        var ad = await _ads.UpdateAsync(id, _ctx.UserId, dto, photos, BaseUrl(), ct);
        return Ok(ApiResponse.Success(ad));
    }

    /// <summary>Soft-delete (deactivate) an ad.</summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Delete(string id, CancellationToken ct)
    {
        await _ads.SoftDeleteAsync(id, _ctx.UserId, ct);
        return Ok(ApiResponse.Success(message: "Ad deleted successfully."));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static async Task<List<IFormFileProxy>> ReadPhotosAsync(IFormFileCollection files)
    {
        var allowed = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif" };
        var result = new List<IFormFileProxy>();

        foreach (var file in files)
        {
            if (!allowed.Contains(file.ContentType))
                throw Application.Exceptions.ApiException.Validation(
                    "Only image files are allowed (jpeg, png, webp, gif).");

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            result.Add(new IFormFileProxy(file.FileName, file.ContentType, file.Length, ms.ToArray()));
        }

        return result;
    }

    private async Task<string> GetCurrentUserNameAsync(CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(_ctx.UserId, ct);
        return user?.Name ?? string.Empty;
    }
}
