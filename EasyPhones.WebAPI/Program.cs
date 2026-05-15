using EasyPhones.Application;
using EasyPhones.Infrastructure;
using EasyPhones.Persistence;
using EasyPhones.WebAPI;
using EasyPhones.WebAPI.Extensions;
using EasyPhones.WebAPI.Middlewares;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    Log.Information("Starting EasyPhones API...");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services
        .AddPersistence(builder.Configuration)
        .AddInfrastructure(builder.Configuration)
        .AddApplication(builder.Configuration)
        .AddPresentation(builder.Configuration);

    var app = builder.Build();

    // Auto-migrate on startup (optional: remove for production)
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<EasyPhones.Persistence.Data.AppDbContext>();
        db.Database.EnsureCreated();
    }

    app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

    app.UseMiddleware<ErrorHandlerMiddleware>();
    app.ConfigurePipelines(builder.Configuration);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "EasyPhones API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
