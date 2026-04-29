import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.util";
import { AppError } from "../utils/AppError";
import { EmailService } from "../utils/email.util";
import crypto from "crypto";

export class AuthService {
  static async signup(email: string, password: string, name: string, phone: string, avatarUrl?: string) {
    const existingEmail = await AuthRepository.findUserByEmail(email);
    if (existingEmail) {
      throw new AppError("User already exists with this email", 400);
    }

    const existingPhone = await AuthRepository.findUserByPhone(phone);
    if (existingPhone) {
      throw new AppError("User already exists with this phone number", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await AuthRepository.createUser({
      email,
      passwordHash: hashedPassword,
      name,
      phone,
      avatarUrl,
      verificationToken,
    });

    if (!user) {
      throw new AppError("User creation failed", 500);
    }

    // Send verification email
    await EmailService.sendVerificationEmail(user.email, user.name, verificationToken);

    return user;
  }

  static async verifyEmail(token: string) {
    const user = await AuthRepository.findUserByVerificationToken(token);
    if (!user) {
      throw new AppError("Invalid or expired verification token", 400);
    }

    await AuthRepository.verifyUser(user.id);
    return { message: "Email verified successfully. You can now login." };
  }

  static async login(email: string, password: string) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isVerified) {
      throw new AppError("Please verify your email before logging in", 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token with 30 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await AuthRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    // 1. Verify token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      throw new AppError("Invalid refresh token", 401);
    }

    // 2. Find token in DB
    const storedToken = await AuthRepository.findRefreshToken(token);

    // 3. Check if token exists and is not revoked
    if (!storedToken || storedToken.isRevoked) {
      if (storedToken) {
        await AuthRepository.revokeAllUserTokens(storedToken.userId);
      }
      throw new AppError("Token revoked or reused", 401);
    }

    // 4. Check expiration
    if (new Date() > storedToken.expiresAt) {
      throw new AppError("Refresh token expired", 401);
    }

    // 5. ROTATION: Invalidate old token and issue new ones
    await AuthRepository.revokeRefreshToken(storedToken.id);

    const user = storedToken.user;
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    await AuthRepository.createRefreshToken(user.id, newRefreshToken, newExpiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(token: string) {
    const storedToken = await AuthRepository.findRefreshToken(token);
    if (storedToken) {
      await AuthRepository.revokeRefreshToken(storedToken.id);
    }
  }

  static async forgotPassword(email: string) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists. Just say email sent if valid.
      return { message: "If an account with that email exists, we have sent a reset link." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date();
    resetExpires.setMinutes(resetExpires.getMinutes() + 15); // Token valid for 1 hour

    await AuthRepository.updateResetToken(user.id, resetToken, resetExpires);

    await EmailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return { message: "If an account with that email exists, we have sent a reset link." };
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await AuthRepository.findUserByResetToken(token);
    if (!user) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await AuthRepository.updatePassword(user.id, hashedPassword);

    return { message: "Password updated successfully. You can now login with your new password." };
  }

  static async getProfile(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Don't send sensitive info
    const { passwordHash, verificationToken, resetPasswordToken, resetPasswordExpires, ...profile } = user;
    return profile;
  }
}




