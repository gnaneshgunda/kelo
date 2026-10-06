import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { SiteSettings } from '../types';

export const settingsRouter = Router();

// GET /api/settings (Public - Fetch website content settings)
settingsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM site_settings');
    const settingsMap: Record<string, string> = {};
    for (const row of result.rows) {
      settingsMap[row.setting_key] = row.setting_value;
    }

    const data: SiteSettings = {
      announcementText: settingsMap['announcement_text'] || '✨ Handcrafted Gifts & Artisanal Crafts',
      announcementSubtext: settingsMap['announcement_subtext'] || 'Free Shipping on Orders Over ₹500',
      isAnnouncementActive: settingsMap['is_announcement_active'] !== 'false',
      contactEmail: settingsMap['contact_email'] || 'kelo.keylove.admin@gmail.com',
      contactPhone: settingsMap['contact_phone'] || '+91 9876543210',
      instagramHandle: settingsMap['instagram_handle'] || '@kelo.keylove',
      specialsTitle: settingsMap['specials_title'] || 'Hall Days & Festive Specials',
    };

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/admin/settings (Admin Only - Update website content)
settingsRouter.put('/admin', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      announcementText,
      announcementSubtext,
      isAnnouncementActive,
      contactEmail,
      contactPhone,
      instagramHandle,
      specialsTitle,
    } = req.body;

    const updates: [string, string][] = [];

    if (announcementText !== undefined) updates.push(['announcement_text', String(announcementText)]);
    if (announcementSubtext !== undefined) updates.push(['announcement_subtext', String(announcementSubtext)]);
    if (isAnnouncementActive !== undefined) updates.push(['is_announcement_active', String(isAnnouncementActive)]);
    if (contactEmail !== undefined) updates.push(['contact_email', String(contactEmail)]);
    if (contactPhone !== undefined) updates.push(['contact_phone', String(contactPhone)]);
    if (instagramHandle !== undefined) updates.push(['instagram_handle', String(instagramHandle)]);
    if (specialsTitle !== undefined) updates.push(['specials_title', String(specialsTitle)]);

    for (const [key, val] of updates) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) DO UPDATE
         SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, val]
      );
    }

    res.json({ success: true, message: 'Website content settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update site settings' });
  }
});
