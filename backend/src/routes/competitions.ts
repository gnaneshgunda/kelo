import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { PaintingApplication } from '../types';

export const competitionsRouter = Router();

function formatApplication(row: any): PaintingApplication {
  return {
    id: row.id,
    eventId: row.event_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    rollNumber: row.roll_number,
    department: row.department,
    hall: row.hall,
    paintingCategory: row.painting_category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

// POST /api/competitions/applications (Public - Submit participant details)
competitionsRouter.post('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      eventId,
      fullName,
      email,
      phone,
      rollNumber,
      department,
      hall,
      paintingCategory,
      description,
    } = req.body;

    // Validate required participant fields (NO artwork upload)
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      res.status(400).json({ success: false, error: 'Full name is required' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid email address is required' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }
    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      res.status(400).json({ success: false, error: 'Roll number / Participant ID is required' });
      return;
    }
    if (!department || typeof department !== 'string' || !department.trim()) {
      res.status(400).json({ success: false, error: 'Department is required' });
      return;
    }
    if (!hall || typeof hall !== 'string' || !hall.trim()) {
      res.status(400).json({ success: false, error: 'Hall of residence is required' });
      return;
    }
    if (!paintingCategory || typeof paintingCategory !== 'string' || !paintingCategory.trim()) {
      res.status(400).json({ success: false, error: 'Painting category is required' });
      return;
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ success: false, error: 'Concept / Artwork description is required' });
      return;
    }

    const id = `app_${Date.now()}`;
    const targetEventId = eventId || 'evt_paint_comp_2026';

    const insertSql = `
      INSERT INTO painting_applications (
        id, event_id, full_name, email, phone, roll_number,
        department, hall, painting_category, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
      RETURNING *
    `;

    const result = await query(insertSql, [
      id,
      targetEventId,
      fullName.trim(),
      email.trim(),
      phone.trim(),
      rollNumber.trim(),
      department.trim(),
      hall.trim(),
      paintingCategory.trim(),
      description.trim(),
    ]);

    res.status(201).json({
      success: true,
      message: 'Painting competition application submitted successfully! Our team will review your entry.',
      data: formatApplication(result.rows[0]),
    });
  } catch (err: any) {
    console.error('[Application Submission Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit application' });
  }
});

// GET /api/admin/competitions/applications (Admin Only - View all applications)
competitionsRouter.get('/admin/applications', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, status } = req.query;
    let sql = 'SELECT * FROM painting_applications WHERE 1=1';
    const params: any[] = [];

    if (eventId) {
      params.push(eventId);
      sql += ` AND event_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const applications = result.rows.map(formatApplication);
    res.json({ success: true, count: applications.length, data: applications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve applications' });
  }
});

// PATCH /api/admin/competitions/applications/:id (Admin Only - Update status to ACCEPTED, REJECTED, or PENDING)
competitionsRouter.patch('/admin/applications/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const result = await query(
      'UPDATE painting_applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    res.json({
      success: true,
      message: `Application marked as ${status}`,
      data: formatApplication(result.rows[0]),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update application status' });
  }
});
