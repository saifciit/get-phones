import pool from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { User, RefreshToken } from "../types/db.types";
import crypto from "crypto";

export class AuthRepository {
  private static mapUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      passwordHash: row.password_hash,
      avatarUrl: row.avatar_url,
      isVerified: row.is_verified === 1 || row.is_verified === true,
      verificationToken: row.verification_token,
      resetPasswordToken: row.reset_password_token,
      resetPasswordExpires: row.reset_password_expires,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRefreshToken(row: any): RefreshToken {
    return {
      id: row.id,
      token: row.token,
      userId: row.user_id,
      isRevoked: row.is_revoked === 1 || row.is_revoked === true,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  static async findUserByPhone(phone: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  static async findUserById(id: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  static async createUser(data: {
    email: string;
    phone: string;
    passwordHash: string;
    name: string;
    avatarUrl?: string;
    verificationToken: string;
  }) {
    const id = crypto.randomUUID();
    await pool.execute(
      "INSERT INTO users (id, name, email, phone, password_hash, avatar_url, updated_at, verification_token) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
      [id, data.name, data.email, data.phone, data.passwordHash, data.avatarUrl || null, data.verificationToken]
    );
    return this.findUserById(id);
  }

  static async findUserByVerificationToken(token: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE verification_token = ?",
      [token]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  static async verifyUser(userId: string) {
    await pool.execute(
      "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?",
      [userId]
    );
  }

  static async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    const id = crypto.randomUUID();
    await pool.execute(
      "INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)",
      [id, token, userId, expiresAt]
    );
    return { id, token, userId, expiresAt };
  }

  static async findRefreshToken(token: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT rt.*, u.id as user_id, u.name as u_name, u.email as u_email, u.phone as u_phone, 
              u.password_hash as u_password_hash, u.avatar_url as u_avatar_url, u.created_at as u_created_at 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ?`,
      [token]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...this.mapRefreshToken(row),
      user: {
        id: row.user_id,
        name: row.u_name,
        email: row.u_email,
        phone: row.u_phone,
        passwordHash: row.u_password_hash,
        avatarUrl: row.u_avatar_url,
        createdAt: row.u_created_at,
      }
    };
  }

  static async revokeRefreshToken(tokenId: string) {
    await pool.execute(
      "UPDATE refresh_tokens SET is_revoked = true WHERE id = ?",
      [tokenId]
    );
  }

  static async revokeAllUserTokens(userId: string) {
    await pool.execute(
      "UPDATE refresh_tokens SET is_revoked = true WHERE user_id = ?",
      [userId]
    );
  }

  static async updateResetToken(userId: string, token: string, expiresAt: Date) {
    await pool.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [token, expiresAt, userId]
    );
  }

  static async findUserByResetToken(token: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  static async updatePassword(userId: string, passwordHash: string) {
    await pool.execute(
      "UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [passwordHash, userId]
    );
  }
}




