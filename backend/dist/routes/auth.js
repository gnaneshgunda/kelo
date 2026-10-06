"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
// POST /api/auth/login
exports.authRouter.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || typeof password !== 'string') {
            res.status(400).json({ success: false, error: 'Password is required' });
            return;
        }
        const adminRes = await (0, db_1.query)('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', ['admin']);
        if (adminRes.rowCount === 0) {
            res.status(500).json({ success: false, error: 'Admin account not configured in database' });
            return;
        }
        const admin = adminRes.rows[0];
        const isMatch = await bcryptjs_1.default.compare(password, admin.password_hash);
        if (!isMatch) {
            res.status(401).json({ success: false, error: 'Invalid administrator password' });
            return;
        }
        const payload = { role: 'admin', username: admin.username };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        // Set secure HttpOnly cookie
        res.cookie(config_1.config.cookieName, token, {
            httpOnly: true,
            secure: config_1.config.isProd,
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
    }
    catch (err) {
        console.error('[Auth Error]', err);
        res.status(500).json({ success: false, error: 'Internal server error during login' });
    }
});
// POST /api/auth/logout
exports.authRouter.post('/logout', (_req, res) => {
    res.clearCookie(config_1.config.cookieName, {
        httpOnly: true,
        secure: config_1.config.isProd,
        sameSite: 'lax',
        path: '/',
    });
    res.json({ success: true, message: 'Logged out successfully' });
});
// GET /api/auth/me - Verify current session
exports.authRouter.get('/me', auth_1.authMiddleware, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        user: { username: req.admin?.username },
    });
});
// POST /api/auth/change-password
exports.authRouter.post('/change-password', auth_1.authMiddleware, async (req, res) => {
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
        const adminRes = await (0, db_1.query)('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', ['admin']);
        if (adminRes.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Admin account not found' });
            return;
        }
        const admin = adminRes.rows[0];
        const isMatch = await bcryptjs_1.default.compare(currentPassword, admin.password_hash);
        if (!isMatch) {
            res.status(401).json({ success: false, error: 'Incorrect current password' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const newHash = await bcryptjs_1.default.hash(newPassword, salt);
        await (0, db_1.query)('UPDATE admin_users SET password_hash = $1 WHERE username = $2', [newHash, 'admin']);
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (err) {
        console.error('[Change Password Error]', err);
        res.status(500).json({ success: false, error: 'Failed to update password' });
    }
});
