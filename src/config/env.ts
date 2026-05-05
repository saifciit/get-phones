import dotenv from 'dotenv';
dotenv.config();

const env = {
  NODE_ENV:               process.env.NODE_ENV || 'development',
  PORT:                   parseInt(process.env.PORT || '5000', 10),

  // MySQL
  DB_HOST:                process.env.DB_HOST || 'localhost',
  DB_PORT:                parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER:                process.env.DB_USER || 'root',
  DB_PASSWORD:            process.env.DB_PASSWORD || '',
  DB_NAME:                process.env.DB_NAME || 'easyphones',

  // JWT
  JWT_ACCESS_SECRET:      process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN:  process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // CORS
  FRONTEND_URL:           process.env.FRONTEND_URL || 'http://localhost:3000',

  // File uploads (DB blob — no external storage)
  MAX_FILE_SIZE_MB:       parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // SMTP
  SMTP_HOST:              process.env.SMTP_HOST || '',
  SMTP_PORT:              parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER:              process.env.SMTP_USER || '',
  SMTP_PASS:              process.env.SMTP_PASS || '',
  SMTP_FROM:              process.env.SMTP_FROM || 'EasyPhones <noreply@easyphones.pk>',
};

export default env;
