using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Repositories;
using EasyPhones.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace EasyPhones.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(string id, CancellationToken ct)
        => _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct)
        => _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> GetByPhoneAsync(string phone, CancellationToken ct)
        => _db.Users.FirstOrDefaultAsync(u => u.Phone == phone, ct);

    public Task<User?> GetByVerificationTokenAsync(string token, CancellationToken ct)
        => _db.Users.FirstOrDefaultAsync(u => u.VerificationToken == token, ct);

    public Task<User?> GetByResetTokenAsync(string token, CancellationToken ct)
        => _db.Users.FirstOrDefaultAsync(u => u.ResetPasswordToken == token, ct);

    public async Task AddAsync(User user, CancellationToken ct)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }
}
