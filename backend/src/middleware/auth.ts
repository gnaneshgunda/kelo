import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check HttpOnly cookie first, then Authorization header as fallback
  let token = req.cookies?.[config.cookieName];

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No valid administrator session found.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden. Administrator privileges required.',
      });
      return;
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired administrator session.',
    });
  }
}
