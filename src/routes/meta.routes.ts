import { Router } from 'express';
import { metaController } from '../controllers/meta.controller';

const router = Router();

// GET /meta — public
router.get('/', metaController.getMeta);

export default router;
