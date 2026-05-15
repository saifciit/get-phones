using EasyPhones.Application.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace EasyPhones.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) => _config = config;

    public async Task SendVerificationLinkAsync(string email, string token)
    {
        var frontendUrl = _config["App:FrontendUrl"] ?? "http://localhost:3000";
        var link = $"{frontendUrl}/verify-email?token={token}";

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
              <h2 style="color:#333;text-align:center;">Welcome to EasyPhones!</h2>
              <p>Thank you for signing up. Please click the button below to verify your email address:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="{link}" style="background-color:#007bff;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                  Verify Email Address
                </a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size:12px;color:#007bff;word-break:break-all;">{link}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
              <p style="font-size:12px;color:#777;text-align:center;">&copy; 2026 EasyPhones. All rights reserved.</p>
            </div>
            """;

        await SendAsync(email, "Verify your EasyPhones account", html);
    }

    public async Task SendPasswordResetLinkAsync(string email, string token)
    {
        var frontendUrl = _config["App:FrontendUrl"] ?? "http://localhost:3000";
        var link = $"{frontendUrl}/reset-password?token={token}";

        var html = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
              <h2 style="color:#333;text-align:center;">Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="{link}" style="background-color:#dc3545;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                  Reset Password
                </a>
              </div>
              <p>This link is valid for 15 minutes. If you didn't request a reset, please ignore this email.</p>
              <p style="font-size:12px;color:#dc3545;word-break:break-all;">{link}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
              <p style="font-size:12px;color:#777;text-align:center;">&copy; 2026 EasyPhones. All rights reserved.</p>
            </div>
            """;

        await SendAsync(email, "Password Reset Request", html);
    }

    private async Task SendAsync(string to, string subject, string html)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Smtp:From"] ?? "noreply@easyphones.pk"));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = html };
        message.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        var port = int.Parse(_config["Smtp:Port"] ?? "587");
        var secureOption = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;

        await smtp.ConnectAsync(_config["Smtp:Host"], port, secureOption);
        await smtp.AuthenticateAsync(_config["Smtp:User"], _config["Smtp:Pass"]);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}
