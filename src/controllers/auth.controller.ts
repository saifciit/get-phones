import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export class AuthController {
  static signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name, phone, avatarUrl } = req.body;

    if (!email || !password || !name || !phone) {
      return next(new AppError("Email, password, name, and phone are required", 400));
    }

    const user = await AuthService.signup(email, password, name, phone, avatarUrl);
    
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatarUrl,
        created_at: user.createdAt
      },
      message: "Verification email sent. Please check your inbox."
    });
  });

  static verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;

    if (!token) {
      return next(new AppError("Verification token is missing", 400));
    }

    const result = await AuthService.verifyEmail(token as string);
    res.status(200).json({ success: true, ...result });
  });

  static login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const data = await AuthService.login(email, password);
    res.status(200).json({ success: true, data });
  });

  static refresh = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    const data = await AuthService.refresh(refreshToken);
    res.status(200).json({ success: true, data });
  });

  static logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });

  static forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const result = await AuthService.forgotPassword(email);
    res.status(200).json({ success: true, ...result });
  });

  static resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return next(new AppError("Token and new password are required", 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters long", 400));
    }

    const result = await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ success: true, ...result });
  });

  static getProfile = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const profile = await AuthService.getProfile(userId);
    
    res.status(200).json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatarUrl,
        created_at: profile.createdAt
      }
    });
  });
}


