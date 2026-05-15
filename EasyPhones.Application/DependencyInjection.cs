using EasyPhones.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EasyPhones.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<AdsService>();
        services.AddScoped<UsersService>();
        return services;
    }
}
