/**
 * EasyPhones — Database Migration
 * Run: ts-node src/db/migrate.ts
 */
import pool from '../config/db';

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄  Running migrations...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            VARCHAR(36)   NOT NULL PRIMARY KEY,
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(255)  NOT NULL UNIQUE,
        phone         VARCHAR(20)   NOT NULL UNIQUE,
        password_hash VARCHAR(255)  NOT NULL,
        avatar_url    VARCHAR(500)  NULL DEFAULT NULL,   -- kept for backwards compat / external URLs
        avatar_path   VARCHAR(500)  NULL DEFAULT NULL,   -- path into files table (e.g. users/1234_photo.jpg)
        is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
        verification_token     VARCHAR(255) NULL DEFAULT NULL,
        reset_password_token   VARCHAR(255) NULL DEFAULT NULL,
        reset_password_expires DATETIME     NULL DEFAULT NULL,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔  users');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id    VARCHAR(36)  NOT NULL,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME     NOT NULL,
        revoked    TINYINT(1)   NOT NULL DEFAULT 0,
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔  refresh_tokens');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS files (
        id            VARCHAR(36)   NOT NULL PRIMARY KEY,
        original_name VARCHAR(255)  NOT NULL,
        mime_type     VARCHAR(100)  NOT NULL,
        size          INT           NOT NULL,
        path          VARCHAR(500)  NOT NULL UNIQUE,
        data          LONGBLOB      NOT NULL,
        uploaded_by   VARCHAR(36)   NULL DEFAULT NULL,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_file_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_files_uploader (uploaded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔  files');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS phone_ads (
        id             VARCHAR(36)      NOT NULL PRIMARY KEY,
        title          VARCHAR(120)     NOT NULL,
        brand          VARCHAR(80)      NOT NULL,
        model          VARCHAR(80)      NOT NULL,
        price          DECIMAL(10,2)    NOT NULL,
        condition_val  ENUM('brandNew','likeNew','good','fair') NOT NULL,
        city           VARCHAR(80)      NOT NULL,
        description    TEXT             NOT NULL,
        contact_number VARCHAR(20)      NOT NULL,
        photo_urls     JSON             NOT NULL,
        user_id        VARCHAR(36)      NOT NULL,
        seller_name    VARCHAR(100)     NOT NULL,
        is_active      TINYINT(1)       NOT NULL DEFAULT 1,
        created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ad_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ads_active   (is_active),
        INDEX idx_ads_brand    (brand),
        INDEX idx_ads_city     (city),
        INDEX idx_ads_price    (price),
        INDEX idx_ads_user     (user_id),
        FULLTEXT INDEX ft_ads_search (title, brand, model, city)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✔  phone_ads');

    console.log('\n✅  All migrations completed.');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
