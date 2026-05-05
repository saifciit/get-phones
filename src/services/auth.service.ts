import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool, { query, queryOne, execute } from '../config/db';
import env from '../config/env';
import { formatUser } from '../utils/formatAd';

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
  );
}

function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
  );
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Persist a new refresh token and return the raw JWT string. */
async function issueRefreshToken(userId: string): Promise<string> {
  const rawToken = signRefreshToken(userId);
  const hash     = hashToken(rawToken);
  const id       = uuidv4();

  // Expiry: parse env string (e.g. "30d") to ms
  const days  = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace(/\D/g, ''), 10) || 30;
  const expAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await execute(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, hash, expAt, new Date()]
  );

  return rawToken;
}

// ─── Service ─────────────────────────────────────────────────────────────────

import { emailService } from './email.service';

// ... (existing signAccessToken, signRefreshToken, hashToken, issueRefreshToken remain unchanged)

export const authService = {
  // ── Register ────────────────────────────────────────────────────────────────
  async register(name: string, email: string, phone: string, password: string) {
    const emailExists = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (emailExists) throw Object.assign(new Error('An account with this email already exists.'), { status: 409, code: 'email_taken' });

    const phoneExists = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
    if (phoneExists) throw Object.assign(new Error('This phone number is already registered.'), { status: 409, code: 'phone_taken' });

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const now = new Date();
    await execute(
      `INSERT INTO users (id, name, email, phone, password_hash, verification_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), email.toLowerCase(), phone, hash, verificationToken, now, now]
    );

    // Send verification link
    emailService.sendVerificationLink(email.toLowerCase(), verificationToken).catch(console.error);

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);

    const accessToken  = signAccessToken(id, email.toLowerCase());
    const refreshToken = await issueRefreshToken(id);

    return { user: formatUser(user), access_token: accessToken, refresh_token: refreshToken };
  },

  // ── Verify Email ─────────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (!user) throw Object.assign(new Error('Invalid or expired verification token.'), { status: 400, code: 'invalid_token' });

    if (user.is_verified) return { message: 'Email already verified.' };

    await execute('UPDATE users SET is_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?', [new Date(), user.id]);
    return { message: 'Email verified successfully.' };
  },

  // ── Login ────────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) throw Object.assign(new Error('Incorrect email or password.'), { status: 401, code: 'invalid_credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Incorrect email or password.'), { status: 401, code: 'invalid_credentials' });

    // Check if verified
    if (!user.is_verified) {
      throw Object.assign(new Error('Please verify your email address before logging in.'), { status: 403, code: 'not_verified' });
    }

    const accessToken  = signAccessToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);

    return { user: formatUser(user), access_token: accessToken, refresh_token: refreshToken };
  },

  // ── Forgot Password ──────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) throw Object.assign(new Error('No account found with this email.'), { status: 404, code: 'not_found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await execute(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ?, updated_at = ? WHERE id = ?',
      [token, expires, new Date(), user.id]
    );

    await emailService.sendPasswordResetLink(email.toLowerCase(), token);
    return { message: 'Password reset link sent to your email.' };
  },

  // ── Reset Password ───────────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE reset_password_token = ?', [token]);
    if (!user) throw Object.assign(new Error('Invalid or expired reset token.'), { status: 400, code: 'invalid_token' });

    if (new Date(user.reset_password_expires) < new Date()) {
      throw Object.assign(new Error('Reset link has expired.'), { status: 400, code: 'expired_token' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await execute(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL, updated_at = ? WHERE id = ?',
      [hash, new Date(), user.id]
    );

    return { message: 'Password has been reset successfully.' };
  },

  // ── Refresh ──────────────────────────────────────────────────────────────────
  async refresh(rawRefreshToken: string) {
    // ... (logic remains same)
    // Verify JWT signature first
    let payload: any;
    try {
      payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token.'), { status: 401, code: 'token_invalid' });
    }

    const hash = hashToken(rawRefreshToken);
    const stored = await queryOne<any>(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0',
      [hash]
    );

    if (!stored || new Date(stored.expires_at) < new Date()) {
      throw Object.assign(new Error('Refresh token is invalid or has been revoked.'), { status: 401, code: 'token_invalid' });
    }

    // Revoke old token (rotation)
    await execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [hash]);

    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [payload.sub]);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 401, code: 'not_authenticated' });

    const newAccessToken  = signAccessToken(user.id, user.email);
    const newRefreshToken = await issueRefreshToken(user.id);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  },

  // ── Logout ───────────────────────────────────────────────────────────────────
  async logout(rawRefreshToken: string) {
    const hash = hashToken(rawRefreshToken);
    await execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [hash]);
  },

  // ── Get current user ─────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 404, code: 'not_found' });
    return formatUser(user);
  },
};
