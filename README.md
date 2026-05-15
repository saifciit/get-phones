# EasyPhones API — .NET 9

Phone marketplace REST API converted from Node.js/Express/TypeScript to .NET 9 Clean Architecture.

## Architecture

```
EasyPhones.Domain          — Entities, repository interfaces, enums (no dependencies)
EasyPhones.Application     — Services, DTOs, exceptions, constants (depends on Domain)
EasyPhones.Persistence     — EF Core DbContext + repository implementations (depends on Domain)
EasyPhones.Infrastructure  — Email (MailKit) + File services (depends on Application)
EasyPhones.WebAPI          — Controllers, middleware, DI wiring (depends on all)
```

## Tech Stack

| Node.js (original)       | .NET 9 (this project)                        |
|--------------------------|----------------------------------------------|
| Express                  | ASP.NET Core 9 Web API                       |
| mysql2                   | EF Core 9 + Pomelo MySQL provider            |
| bcryptjs                 | BCrypt.Net-Next                              |
| jsonwebtoken             | System.IdentityModel.Tokens.Jwt              |
| nodemailer               | MailKit / MimeKit                            |
| multer (memory storage)  | IFormFile → byte[] stored as LONGBLOB        |
| express-validator        | Data Annotations + ModelState                |
| helmet / cors            | Built-in ASP.NET Core middleware             |
| express-rate-limit       | AspNetCoreRateLimit (add if needed)          |

## Endpoints

### Auth  `/api/auth`
| Method | Path                     | Auth | Description                          |
|--------|--------------------------|------|--------------------------------------|
| POST   | /register                | —    | Register (sends verification email)  |
| POST   | /login                   | —    | Login → access + refresh tokens      |
| POST   | /refresh                 | —    | Rotate refresh token                 |
| POST   | /logout                  | ✓    | Revoke refresh token                 |
| GET    | /verify-email?token=...  | —    | Verify email address                 |
| POST   | /forgot-password         | —    | Send password reset email            |
| POST   | /reset-password          | —    | Reset password via token             |
| GET    | /me                      | ✓    | Get current user                     |

### Ads  `/api/ads`
| Method | Path    | Auth | Description                                  |
|--------|---------|------|----------------------------------------------|
| GET    | /       | —    | List ads (filter, sort, paginate)            |
| GET    | /my     | ✓    | Current user's ads                           |
| GET    | /:id    | —    | Single ad                                    |
| POST   | /       | ✓    | Create ad (multipart, field `photos`)        |
| PUT    | /:id    | ✓    | Update ad (multipart, optional `photos`)     |
| DELETE | /:id    | ✓    | Soft-delete ad                               |

### Users  `/api/users`
| Method | Path           | Auth | Description               |
|--------|----------------|------|---------------------------|
| GET    | /:id           | —    | Public profile + ad count |
| PUT    | /me            | ✓    | Update name / phone       |
| PUT    | /me/avatar     | ✓    | Upload avatar image       |
| PUT    | /me/password   | ✓    | Change password           |

### Files  `/api/files`
| Method | Path                     | Auth | Description        |
|--------|--------------------------|------|--------------------|
| GET    | /:module/:filename       | —    | Serve stored blob  |

### Meta  `/api/meta`
| Method | Path | Auth | Description                            |
|--------|------|------|----------------------------------------|
| GET    | /    | —    | Allowed brands, cities, conditions     |

## Query Params — GET /api/ads
| Param      | Type   | Default | Description                                     |
|------------|--------|---------|-------------------------------------------------|
| page       | int    | 1       | Page number                                     |
| limit      | int    | 20      | Items per page (max 50)                         |
| q          | string | —       | Text search (title, brand, model, city)         |
| brand      | string | —       | Filter by brand                                 |
| condition  | string | —       | brandNew \| likeNew \| good \| fair             |
| city       | string | —       | Filter by city                                  |
| min_price  | decimal| —       | Minimum price                                   |
| max_price  | decimal| —       | Maximum price                                   |
| sort       | string | newest  | newest \| oldest \| price_asc \| price_desc     |

## Setup

### 1. Prerequisites
- .NET 9 SDK
- MySQL 8+

### 2. Configure `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=easyphones;User=root;Password=yourpassword;"
  },
  "JwtOptions": {
    "SecretKey": "your-32-char-access-secret-key-here",
    "RefreshSecretKey": "your-32-char-refresh-secret-key-here",
    "Issuer": "EasyPhones",
    "Audience": "EasyPhonesApp",
    "AccessExpiresIn": "15m",
    "RefreshExpiresIn": "30d"
  },
  "App": {
    "FrontendUrl": "http://localhost:3000",
    "AllowedOrigins": "http://localhost:3000"
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": "587",
    "User": "user@example.com",
    "Pass": "password",
    "From": "EasyPhones <noreply@easyphones.pk>"
  }
}
```

### 3. Run
```bash
cd EasyPhones.WebAPI
dotnet run
```
The database tables are created automatically via `EnsureCreated()` on startup.

### 4. Swagger
Open http://localhost:5000/swagger in development.

## Notes
- Files are stored as `LONGBLOB` in MySQL (same as original Node backend).
- JWT uses symmetric HMAC-SHA256 (HS256) — same as the original.
- Refresh tokens are rotated on every use (stored as SHA-256 hashes).
- Photos are stored in the `files` table; photo paths are serialized as JSON in `phone_ads.photo_urls`.
- The `condition_val` column uses a MySQL ENUM matching the original schema values.
