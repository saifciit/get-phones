import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import env from '../config/env';

/**
 * Memory storage — file buffer lives in memory, passed to
 * fileService.save() which writes it to the DB as a LONGBLOB.
 * Nothing hits disk.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only image files are allowed (jpeg, png, webp, gif).'), { status: 422 }));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});
