import { Request, Response } from 'express';
import { ALLOWED_BRANDS, ALLOWED_CITIES, CONDITIONS } from '../utils/constants';

export const metaController = {
  getMeta(_req: Request, res: Response) {
    res.json({
      brands:     ALLOWED_BRANDS,
      cities:     ALLOWED_CITIES,
      conditions: CONDITIONS,
    });
  },
};
