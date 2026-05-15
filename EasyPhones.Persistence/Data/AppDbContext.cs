using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EasyPhones.Persistence.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<PhoneAd> PhoneAds => Set<PhoneAd>();
    public DbSet<FileRecord> Files => Set<FileRecord>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── users ─────────────────────────────────────────────────────────────
        builder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
            e.Property(x => x.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            e.Property(x => x.Email).HasColumnName("email").IsRequired().HasMaxLength(255);
            e.Property(x => x.Phone).HasColumnName("phone").IsRequired().HasMaxLength(20);
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired().HasMaxLength(255);
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            e.Property(x => x.AvatarPath).HasColumnName("avatar_path").HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.IsVerified).HasColumnName("is_verified");
            e.Property(x => x.ResetPasswordExpires).HasColumnName("reset_password_expires");
            e.Property(x => x.VerificationToken).HasColumnName("verification_token").HasMaxLength(255);
            e.Property(x => x.ResetPasswordToken).HasColumnName("reset_password_token").HasMaxLength(255);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Phone).IsUnique();
        });

        // ── phone_ads ─────────────────────────────────────────────────────────
        var conditionConverter = new ValueConverter<ConditionValue, string>(
            v => v == ConditionValue.BrandNew ? "brandNew"
               : v == ConditionValue.LikeNew  ? "likeNew"
               : v == ConditionValue.Good      ? "good"
               :                                 "fair",
            v => v == "brandNew" ? ConditionValue.BrandNew
               : v == "likeNew"  ? ConditionValue.LikeNew
               : v == "good"     ? ConditionValue.Good
               :                   ConditionValue.Fair);

        builder.Entity<PhoneAd>(e =>
        {
            e.ToTable("phone_ads");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
            e.Property(x => x.Title).HasColumnName("title").IsRequired().HasMaxLength(120);
            e.Property(x => x.Brand).HasColumnName("brand").IsRequired().HasMaxLength(80);
            e.Property(x => x.Model).HasColumnName("model").IsRequired().HasMaxLength(80);
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("decimal(10,2)");
            e.Property(x => x.Condition)
                .HasColumnName("condition_val")
                .IsRequired()
                .HasConversion(conditionConverter)
                .HasColumnType("enum('brandNew','likeNew','good','fair')");
            e.Property(x => x.City).HasColumnName("city").IsRequired().HasMaxLength(80);
            e.Property(x => x.Description).HasColumnName("description").IsRequired().HasColumnType("text");
            e.Property(x => x.ContactNumber).HasColumnName("contact_number").IsRequired().HasMaxLength(20);
            e.Property(x => x.PhotoUrlsJson).HasColumnName("photo_urls").IsRequired().HasColumnType("json");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired().HasMaxLength(36);
            e.Property(x => x.SellerName).HasColumnName("seller_name").IsRequired().HasMaxLength(100);
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.IsActive).HasDatabaseName("idx_ads_active");
            e.HasIndex(x => x.Brand).HasDatabaseName("idx_ads_brand");
            e.HasIndex(x => x.City).HasDatabaseName("idx_ads_city");
            e.HasIndex(x => x.Price).HasDatabaseName("idx_ads_price");
            e.HasIndex(x => x.UserId).HasDatabaseName("idx_ads_user");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── files ─────────────────────────────────────────────────────────────
        builder.Entity<FileRecord>(e =>
        {
            e.ToTable("files");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
            e.Property(x => x.OriginalName).HasColumnName("original_name").IsRequired().HasMaxLength(255);
            e.Property(x => x.MimeType).HasColumnName("mime_type").IsRequired().HasMaxLength(100);
            e.Property(x => x.Size).HasColumnName("size");
            e.Property(x => x.Path).HasColumnName("path").IsRequired().HasMaxLength(500);
            e.Property(x => x.Data).HasColumnName("data").IsRequired().HasColumnType("longblob");
            e.Property(x => x.UploadedBy).HasColumnName("uploaded_by").HasMaxLength(36);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Ignore(x => x.UpdatedAt); // files table has no updated_at
            e.HasIndex(x => x.Path).IsUnique();
            e.HasIndex(x => x.UploadedBy).HasDatabaseName("idx_files_uploader");
        });

        // ── refresh_tokens ────────────────────────────────────────────────────
        builder.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasMaxLength(36);
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired().HasMaxLength(36);
            e.Property(x => x.TokenHash).HasColumnName("token_hash").IsRequired().HasMaxLength(255);
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.Revoked).HasColumnName("revoked");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Ignore(x => x.UpdatedAt); // refresh_tokens table has no updated_at
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).HasConstraintName("fk_rt_user").OnDelete(DeleteBehavior.Cascade);
        });
    }
}
