import { Router } from 'express';
import { body } from 'express-validator';
import { usersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// GET /users/:id — public profile
router.get('/:id', usersController.getPublicProfile);

// PUT /users/me — update name / phone
router.put(
  '/me',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('phone').optional().matches(/^\+?\d{10,15}$/).withMessage('Invalid phone format.'),
  ],
  validate,
  usersController.updateProfile
);

// PUT /users/me/avatar — multipart/form-data, field: "avatar"
router.put(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  usersController.updateAvatar
);

// PUT /users/me/password
router.put(
  '/me/password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('current_password is required.'),
    body('new_password').isLength({ min: 6 }).withMessage('new_password must be at least 6 characters.'),
    body('confirm_password').custom((val, { req }) => {
      if (val !== req.body.new_password) throw new Error('Passwords do not match.');
      return true;
    }),
  ],
  validate,
  usersController.changePassword
);

export default router;
