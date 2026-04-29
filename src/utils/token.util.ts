import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt";

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY as any,
  });
};


export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET) as TokenPayload;
};
