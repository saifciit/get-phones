import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { AuthRequest } from '../types';

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

export const usersController = {
  async getPublicProfile(req: Request, res: Response) {
    try {
      const data = await usersService.getPublicProfile(req.params.id, baseUrl(req));
      res.json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const data = await usersService.updateProfile(
        req.user!.id,
        { name: req.body.name, phone: req.body.phone },
        baseUrl(req)
      );
      res.json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  /** PUT /users/me/avatar — multipart/form-data, field name: "avatar" */
  async updateAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'validation_error', message: 'avatar file is required.' });
        return;
      }
      const data = await usersService.updateAvatar(req.user!.id, req.file, baseUrl(req));
      res.json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { current_password, new_password } = req.body;
      await usersService.changePassword(req.user!.id, current_password, new_password);
      res.json({ message: 'Password changed successfully.' });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },
};
