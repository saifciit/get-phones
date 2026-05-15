using EasyPhones.Application.Services;
using EasyPhones.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EasyPhones.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IFileService, FileService>();
        return services;
    }
}
