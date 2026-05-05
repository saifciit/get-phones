import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, phone, password } = req.body;
      const result = await authService.register(name, email, phone, password);
      res.status(201).json({
        message: 'Email sent, please verify your email to proceed.',
        ...result
      });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ message: 'Login successful', ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        res.status(400).json({ error: 'validation_error', message: 'refresh_token is required.' });
        return;
      }
      const result = await authService.refresh(refresh_token);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async logout(req: AuthRequest, res: Response) {
    try {
      const { refresh_token } = req.body;
      if (refresh_token) {
        await authService.logout(refresh_token);
      }
      res.json({ message: 'Logged out successfully.' });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token) throw Object.assign(new Error('Token is required.'), { status: 400, code: 'validation_error' });
      const result = await authService.verifyEmail(token as string);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) throw Object.assign(new Error('Token and password are required.'), { status: 400, code: 'validation_error' });
      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getMe(req.user!.id);
      res.json(user);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },
};
