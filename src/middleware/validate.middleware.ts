import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details: Record<string, string> = {};
    errors.array().forEach(e => {
      if (e.type === 'field') details[e.path] = e.msg;
    });
    res.status(422).json({
      error:   'validation_error',
      message: 'One or more fields failed validation.',
      details,
    });
    return;
  }
  next();
};
