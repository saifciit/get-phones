import { Router } from 'express';
import { body } from 'express-validator';
import { adsController } from '../controllers/ads.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// GET /ads — public
router.get('/', adsController.list);

// GET /ads/my — must come BEFORE /:id
router.get('/my', authenticate, adsController.myAds);

// GET /ads/:id — public
router.get('/:id', adsController.getById);

// POST /ads — multipart/form-data, field "photos" (1–5 images)
router.post(
  '/',
  authenticate,
  upload.array('photos', 5),
  [
    body('title').trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters.'),
    body('brand').notEmpty().withMessage('Brand is required.'),
    body('model').trim().isLength({ min: 1, max: 80 }).withMessage('Model must be 1–80 characters.'),
    body('price').isFloat({ min: 0.01, max: 9999999 }).withMessage('Price must be positive, max 9,999,999.'),
    body('condition').isIn(['brandNew', 'likeNew', 'good', 'fair']).withMessage('Invalid condition.'),
    body('city').notEmpty().withMessage('City is required.'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 chars.'),
    body('contact_number').matches(/^\+?\d{10,15}$/).withMessage('Contact number: +92XXXXXXXXXX.'),
  ],
  validate,
  adsController.create
);

// PUT /ads/:id — multipart/form-data, optional field "photos" to replace images
router.put(
  '/:id',
  authenticate,
  upload.array('photos', 5),
  [
    body('title').optional().trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters.'),
    body('price').optional().isFloat({ min: 0.01, max: 9999999 }).withMessage('Invalid price.'),
    body('condition').optional().isIn(['brandNew', 'likeNew', 'good', 'fair']).withMessage('Invalid condition.'),
  ],
  validate,
  adsController.update
);

// DELETE /ads/:id
router.delete('/:id', authenticate, adsController.softDelete);

export default router;
