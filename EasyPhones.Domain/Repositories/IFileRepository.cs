using EasyPhones.Domain.Entities;

namespace EasyPhones.Domain.Repositories;

public interface IFileRepository
{
    Task<FileRecord?> GetByPathAsync(string path, CancellationToken ct = default);
    Task AddAsync(FileRecord file, CancellationToken ct = default);
    Task DeleteByPathAsync(string path, CancellationToken ct = default);
}

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string hash, CancellationToken ct = default);
    Task AddAsync(RefreshToken token, CancellationToken ct = default);
    Task RevokeByHashAsync(string hash, CancellationToken ct = default);
}
