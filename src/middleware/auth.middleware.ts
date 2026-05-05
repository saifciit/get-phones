import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { queryOne } from '../config/db';
import { AuthRequest } from '../types';

interface AccessPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'not_authenticated', message: 'No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    const user = await queryOne<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id = ?',
      [decoded.sub]
    );

    if (!user) {
      res.status(401).json({ error: 'not_authenticated', message: 'User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'token_expired', message: 'Access token has expired.' });
    } else {
      res.status(401).json({ error: 'token_invalid', message: 'Invalid or malformed token.' });
    }
  }
};
