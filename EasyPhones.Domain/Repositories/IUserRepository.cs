using EasyPhones.Domain.Entities;

namespace EasyPhones.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByPhoneAsync(string phone, CancellationToken ct = default);
    Task<User?> GetByVerificationTokenAsync(string token, CancellationToken ct = default);
    Task<User?> GetByResetTokenAsync(string token, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    Task UpdateAsync(User user, CancellationToken ct = default);
}
