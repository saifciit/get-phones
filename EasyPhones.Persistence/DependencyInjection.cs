using EasyPhones.Domain.Repositories;
using EasyPhones.Persistence.Data;
using EasyPhones.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EasyPhones.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                new MySqlServerVersion(new Version(8, 0, 0))));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAdRepository, AdRepository>();
        services.AddScoped<IFileRepository, FileRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        return services;
    }
}
