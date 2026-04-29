import { Request, Response, NextFunction } from "express";
import { MetaRepository } from "../repositories/meta.repository";

export class MetaController {
  static async getMetaData(req: Request, res: Response, next: NextFunction) {
    try {
      const [brands, cities] = await Promise.all([
        MetaRepository.getBrands(),
        MetaRepository.getCities()
      ]);

      res.status(200).json({
        success: true,
        data: {
          brands,
          cities
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
