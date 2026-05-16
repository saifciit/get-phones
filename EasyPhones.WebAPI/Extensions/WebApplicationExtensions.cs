namespace EasyPhones.WebAPI.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigurePipelines(this WebApplication app, IConfiguration configuration)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "EasyPhones API v1"));

        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }
}
