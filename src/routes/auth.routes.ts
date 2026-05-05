import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('phone').matches(/^\+?\d{10,15}$/).withMessage('Phone must be +? followed by 10–15 digits.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('confirm_password').custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),
  ],
  validate,
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

// POST /auth/refresh
router.post('/refresh', authController.refresh);

// POST /auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /auth/verify-email?token=...
router.get('/verify-email', authController.verifyEmail);

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
  ],
  validate,
  authController.forgotPassword
);

// POST /auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  authController.resetPassword
);

// GET /auth/me
router.get('/me', authenticate, authController.me);

export default router;
