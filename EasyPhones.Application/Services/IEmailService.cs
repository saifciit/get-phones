namespace EasyPhones.Application.Services;

public interface IEmailService
{
    Task SendVerificationLinkAsync(string email, string token);
    Task SendPasswordResetLinkAsync(string email, string token);
}
