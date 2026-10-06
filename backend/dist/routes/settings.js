"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.settingsRouter = (0, express_1.Router)();
// GET /api/settings (Public - Fetch website content settings)
exports.settingsRouter.get('/', async (_req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM site_settings');
        const settingsMap = {};
        for (const row of result.rows) {
            settingsMap[row.setting_key] = row.setting_value;
        }
        const data = {
            announcementText: settingsMap['announcement_text'] || '✨ Handcrafted Gifts & Artisanal Crafts',
            announcementSubtext: settingsMap['announcement_subtext'] || 'Free Shipping on Orders Over ₹500',
            isAnnouncementActive: settingsMap['is_announcement_active'] !== 'false',
            contactEmail: settingsMap['contact_email'] || 'kelo.keylove.admin@gmail.com',
            contactPhone: settingsMap['contact_phone'] || '+91 9876543210',
            instagramHandle: settingsMap['instagram_handle'] || '@kelo.keylove',
            specialsTitle: settingsMap['specials_title'] || 'Hall Days & Festive Specials',
        };
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});
// PUT /api/admin/settings (Admin Only - Update website content)
exports.settingsRouter.put('/admin', auth_1.authMiddleware, async (req, res) => {
    try {
        const { announcementText, announcementSubtext, isAnnouncementActive, contactEmail, contactPhone, instagramHandle, specialsTitle, } = req.body;
        const updates = [];
        if (announcementText !== undefined)
            updates.push(['announcement_text', String(announcementText)]);
        if (announcementSubtext !== undefined)
            updates.push(['announcement_subtext', String(announcementSubtext)]);
        if (isAnnouncementActive !== undefined)
            updates.push(['is_announcement_active', String(isAnnouncementActive)]);
        if (contactEmail !== undefined)
            updates.push(['contact_email', String(contactEmail)]);
        if (contactPhone !== undefined)
            updates.push(['contact_phone', String(contactPhone)]);
        if (instagramHandle !== undefined)
            updates.push(['instagram_handle', String(instagramHandle)]);
        if (specialsTitle !== undefined)
            updates.push(['specials_title', String(specialsTitle)]);
        for (const [key, val] of updates) {
            await (0, db_1.query)(`INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) DO UPDATE
         SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`, [key, val]);
        }
        res.json({ success: true, message: 'Website content settings updated successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to update site settings' });
    }
});
