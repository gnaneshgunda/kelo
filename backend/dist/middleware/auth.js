"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function authMiddleware(req, res, next) {
    // Check HttpOnly cookie first, then Authorization header as fallback
    let token = req.cookies?.[config_1.config.cookieName];
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
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        if (decoded.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Forbidden. Administrator privileges required.',
            });
            return;
        }
        req.admin = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired administrator session.',
        });
    }
}
