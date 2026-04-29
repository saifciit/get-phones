import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.util";
import { AuthService } from "../services/auth.service";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    // If access token is expired, try to refresh using the refresh token
    if (error.name === "TokenExpiredError") {
      const refreshToken = req.headers["x-refresh-token"] as string;

      if (!refreshToken) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: Access token expired and no refresh token provided" 
        });
      }

      try {
        const result = await AuthService.refresh(refreshToken);
        
        // Set new tokens in response headers so frontend can update its storage
        res.setHeader("x-access-token", result.accessToken);
        res.setHeader("x-refresh-token", result.refreshToken);
        
        // Decode the new access token and proceed
        const decoded = verifyAccessToken(result.accessToken);
        req.user = decoded;
        return next();
      } catch (refreshError: any) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: Session expired, please login again",
          error: refreshError.message 
        });
      }
    }

    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

