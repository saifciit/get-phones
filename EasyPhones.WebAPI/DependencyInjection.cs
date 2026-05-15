using System.Reflection;
using System.Text;
using EasyPhones.Persistence.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace EasyPhones.WebAPI;

public static class DependencyInjection
{
    public static IServiceCollection AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<UserContextService>();

        services.AddControllers()
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
                o.JsonSerializerOptions.DefaultIgnoreCondition =
                    System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
            });

        services.AddEndpointsApiExplorer();

        services.AddCors(opts =>
        {
            opts.AddDefaultPolicy(policy =>
            {
                var origins = configuration["App:AllowedOrigins"]?.Split(',') ?? ["*"];
                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
                // Flutter mobile needs '*' — can't combine with AllowCredentials;
                // when origins is '*' we fall back to allowing any origin without credentials.
            });
        });

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(jwt =>
            {
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["JwtOptions:SecretKey"]!)),
                    ValidateIssuer   = true,
                    ValidIssuer      = configuration["JwtOptions:Issuer"],
                    ValidateAudience = true,
                    ValidAudience    = configuration["JwtOptions:Audience"],
                    ClockSkew        = TimeSpan.Zero
                };
            });

        services.AddAuthorization();

        services.AddSwaggerGen(c =>
        {
            c.EnableAnnotations();
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "EasyPhones API", Version = "v1" });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header. Enter: Bearer {token}",
                Name        = "Authorization",
                In          = ParameterLocation.Header,
                Type        = SecuritySchemeType.ApiKey,
                Scheme      = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
        });

        return services;
    }
}
