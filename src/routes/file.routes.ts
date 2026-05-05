import { Router } from 'express';
import { fileController } from '../controllers/file.controller';

const router = Router();

// Allow cross-origin <img> loads (same pattern as existing project)
router.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin',  '*');
  next();
});

// GET /api/files/:module/:filename
router.get('/:module/:filename', fileController.serve);

export default router;
