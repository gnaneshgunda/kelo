import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';
import { JwtPayload } from '../types';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Password is required' });
      return;
    }

    const adminRes = await query('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', ['admin']);
    if (adminRes.rowCount === 0) {
      res.status(500).json({ success: false, error: 'Admin account not configured in database' });
      return;
    }

    const admin = adminRes.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid administrator password' });
      return;
    }

    const payload: JwtPayload = { role: 'admin', username: admin.username };
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    // Set secure HttpOnly cookie
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: '/',
    });

    res.json({
      success: true,
      message: 'Authenticated successfully as administrator',
      user: { username: admin.username },
      token, // Also return token for header authorization if cookie is cross-origin
    });
  } catch (err: any) {
    console.error('[Auth Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Verify current session
authRouter.get('/me', authMiddleware, (req: Request, res: Response): void => {
  res.json({
    success: true,
    authenticated: true,
    user: { username: req.admin?.username },
  });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }

    const adminRes = await query('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', ['admin']);
    if (adminRes.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Admin account not found' });
      return;
    }

    const admin = adminRes.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Incorrect current password' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query('UPDATE admin_users SET password_hash = $1 WHERE username = $2', [newHash, 'admin']);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: unknown) {
    console.error('[Change Password Error]', err);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});
