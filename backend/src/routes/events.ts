import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { KeloEvent } from '../types';

export const eventsRouter = Router();

function formatEvent(row: any): KeloEvent {
  const images: string[] = typeof row.images === 'string'
    ? JSON.parse(row.images)
    : (Array.isArray(row.images) ? row.images : (row.banner_url ? [row.banner_url] : []));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dateTime: row.date_time,
    location: row.location,
    bannerUrl: row.banner_url || (images.length > 0 ? images[0] : undefined),
    images,
    eventType: row.event_type,
    isPublished: row.is_published === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/events (Public - published only)
eventsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const typeFilter = req.query.type as string | undefined;
    let sql = 'SELECT * FROM events WHERE is_published = TRUE';
    const params: any[] = [];

    if (typeFilter) {
      sql += ' AND event_type = $1';
      params.push(typeFilter);
    }
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const events = result.rows.map(formatEvent);
    res.json({ success: true, count: events.length, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve events' });
  }
});

// GET /api/events/:id (Public)
eventsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: formatEvent(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve event' });
  }
});

// GET /api/admin/events (Admin Only - all events including drafts)
eventsRouter.get('/admin/list', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM events ORDER BY created_at DESC');
    const events = result.rows.map(formatEvent);
    res.json({ success: true, count: events.length, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve admin events' });
  }
});

// POST /api/admin/events (Admin Only)
eventsRouter.post('/admin/create', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, dateTime, location, bannerUrl, images, eventType, isPublished } = req.body;
    if (!title || !description || !dateTime || !location) {
      res.status(400).json({ success: false, error: 'Title, description, dateTime, and location are required' });
      return;
    }

    const id = req.body.id || `evt_${Date.now()}`;
    const type = eventType || 'general';
    const published = isPublished === true;
    const imgList = Array.isArray(images) && images.length > 0 ? images : (bannerUrl ? [bannerUrl] : []);
    const primaryBanner = imgList.length > 0 ? imgList[0] : (bannerUrl || null);

    const insertSql = `
      INSERT INTO events (id, title, description, date_time, location, banner_url, images, event_type, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await query(insertSql, [id, title, description, dateTime, location, primaryBanner, JSON.stringify(imgList), type, published]);
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: formatEvent(result.rows[0]),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create event' });
  }
});

// PUT /api/admin/events/:id (Admin Only)
eventsRouter.put('/admin/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    const cur = existing.rows[0];
    const b = req.body;

    const title = b.title !== undefined ? b.title : cur.title;
    const description = b.description !== undefined ? b.description : cur.description;
    const dateTime = b.dateTime !== undefined ? b.dateTime : cur.date_time;
    const location = b.location !== undefined ? b.location : cur.location;
    const imgList = b.images !== undefined ? b.images : (typeof cur.images === 'string' ? JSON.parse(cur.images) : (cur.images || (cur.banner_url ? [cur.banner_url] : [])));
    const bannerUrl = b.bannerUrl !== undefined ? b.bannerUrl : (imgList.length > 0 ? imgList[0] : cur.banner_url);
    const eventType = b.eventType !== undefined ? b.eventType : cur.event_type;
    const isPublished = b.isPublished !== undefined ? Boolean(b.isPublished) : cur.is_published;

    const updateSql = `
      UPDATE events SET
        title = $1, description = $2, date_time = $3, location = $4,
        banner_url = $5, images = $6, event_type = $7, is_published = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await query(updateSql, [title, description, dateTime, location, bannerUrl, JSON.stringify(imgList), eventType, isPublished, id]);
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: formatEvent(result.rows[0]),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update event' });
  }
});

// DELETE /api/admin/events/:id (Admin Only)
eventsRouter.delete('/admin/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    res.json({ success: true, message: 'Event deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});
