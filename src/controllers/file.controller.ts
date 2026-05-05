import { Request, Response } from 'express';
import { fileService } from '../services/file.service';

export const fileController = {
  async serve(req: Request, res: Response) {
    const { module, filename } = req.params;
    const path = `${module}/${filename}`;

    try {
      const file = await fileService.getByPath(path);

      res.setHeader('Content-Type',        file.mime_type);
      res.setHeader('Content-Length',      file.size);
      res.setHeader('Cache-Control',       'public, max-age=31536000, immutable');
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

      res.send(file.data);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
    }
  },
};
