using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Repositories;
using EasyPhones.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EasyPhones.Persistence.Repositories;

public class FileRepository : IFileRepository
{
    private readonly AppDbContext _db;
    public FileRepository(AppDbContext db) => _db = db;

    public Task<FileRecord?> GetByPathAsync(string path, CancellationToken ct)
        => _db.Files.FirstOrDefaultAsync(f => f.Path == path, ct);

    public async Task AddAsync(FileRecord file, CancellationToken ct)
    {
        _db.Files.Add(file);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteByPathAsync(string path, CancellationToken ct)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Path == path, ct);
        if (file is not null)
        {
            _db.Files.Remove(file);
            await _db.SaveChangesAsync(ct);
        }
    }
}

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _db;
    public RefreshTokenRepository(AppDbContext db) => _db = db;

    public Task<RefreshToken?> GetByHashAsync(string hash, CancellationToken ct)
        => _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Revoked, ct);

    public async Task AddAsync(RefreshToken token, CancellationToken ct)
    {
        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync(ct);
    }

    public async Task RevokeByHashAsync(string hash, CancellationToken ct)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is not null)
        {
            token.Revoked = true;
            await _db.SaveChangesAsync(ct);
        }
    }
}
