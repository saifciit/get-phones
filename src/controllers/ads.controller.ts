import { Request, Response } from 'express';
import { adsService } from '../services/ads.service';
import { AuthRequest } from '../types';

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

export const adsController = {
  async list(req: Request, res: Response) {
    try {
      const result = await adsService.list({
        page:      req.query.page      ? parseInt(req.query.page as string, 10)    : 1,
        limit:     req.query.limit     ? parseInt(req.query.limit as string, 10)   : 20,
        q:         req.query.q         as string | undefined,
        brand:     req.query.brand     as string | undefined,
        condition: req.query.condition as string | undefined,
        city:      req.query.city      as string | undefined,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        sort:      req.query.sort      as any,
      }, baseUrl(req));
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await adsService.getById(req.params.id, baseUrl(req));
      res.json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(422).json({ error: 'validation_error', message: 'At least 1 photo is required.' });
        return;
      }
      const data = await adsService.create(req.user!.id, req.user!.name, {
        ...req.body,
        price:      parseFloat(req.body.price),
        photoFiles: files,
      }, baseUrl(req));
      res.status(201).json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const newPhotoFiles = (req.files as Express.Multer.File[]) || [];
      const data = await adsService.update(req.params.id, req.user!.id, {
        ...req.body,
        ...(req.body.price !== undefined && { price: parseFloat(req.body.price) }),
        ...(newPhotoFiles.length > 0 && { newPhotoFiles }),
      }, baseUrl(req));
      res.json({ data });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async softDelete(req: AuthRequest, res: Response) {
    try {
      await adsService.softDelete(req.params.id, req.user!.id);
      res.json({ message: 'Ad deleted successfully.' });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },

  async myAds(req: AuthRequest, res: Response) {
    try {
      const result = await adsService.myAds(req.user!.id, baseUrl(req));
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },
};
