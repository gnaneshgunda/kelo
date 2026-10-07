"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitionsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.competitionsRouter = (0, express_1.Router)();
function formatApplication(row) {
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
exports.competitionsRouter.post('/applications', async (req, res) => {
    try {
        const { eventId, fullName, email, phone, rollNumber, department, hall, paintingCategory, description, } = req.body;
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
        const targetEventId = eventId || 'evt_paint_comp_2026';
        // 1. Strict limit: Accept only the first 50 applications
        const countRes = await (0, db_1.query)('SELECT COUNT(*) as count FROM painting_applications WHERE event_id = $1', [targetEventId]);
        const currentCount = parseInt(countRes.rows[0]?.count || '0', 10);
        const MAX_PARTICIPANTS = 50;
        if (currentCount >= MAX_PARTICIPANTS) {
            res.status(400).json({
                success: false,
                error: `Registration closed. The maximum capacity of ${MAX_PARTICIPANTS} participants has been reached.`,
            });
            return;
        }
        const id = `app_${Date.now()}`;
        const insertSql = `
      INSERT INTO painting_applications (
        id, event_id, full_name, email, phone, roll_number,
        department, hall, painting_category, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
      RETURNING *
    `;
        const result = await (0, db_1.query)(insertSql, [
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
        const newApp = formatApplication(result.rows[0]);
        // 2. Automatically link participant to the event's Polling Contest
        try {
            let pollId;
            const pollCheck = await (0, db_1.query)('SELECT id FROM polls WHERE event_id = $1', [targetEventId]);
            if (pollCheck.rowCount === 0) {
                pollId = `poll_${targetEventId}`;
                await (0, db_1.query)(`INSERT INTO polls (id, event_id, title, description, is_open)
           VALUES ($1, $2, $3, $4, true)`, [
                    pollId,
                    targetEventId,
                    'Painting Competition 2026: Participant Voting',
                    'Official administrative polling on the 50 painting competition participants. Cast your vote for the best artist!',
                ]);
            }
            else {
                pollId = pollCheck.rows[0].id;
            }
            const optId = `opt_${id}`;
            const optText = `${fullName.trim()} (${rollNumber.trim()} • ${hall.trim()} - ${paintingCategory.trim()})`;
            await (0, db_1.query)(`INSERT INTO poll_options (id, poll_id, option_text, votes)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (id) DO NOTHING`, [optId, pollId, optText]);
        }
        catch (pollErr) {
            console.error('[Competitions Auto-Poll Option Error]', pollErr);
        }
        res.status(201).json({
            success: true,
            message: `Painting competition application submitted successfully! (${currentCount + 1}/${MAX_PARTICIPANTS} spots filled).`,
            data: newApp,
            spotsRemaining: Math.max(0, MAX_PARTICIPANTS - (currentCount + 1)),
        });
    }
    catch (err) {
        console.error('[Application Submission Error]', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to submit application' });
    }
});
// GET /api/competitions/status (Public - Get application count and capacity)
exports.competitionsRouter.get('/status', async (req, res) => {
    try {
        const eventId = req.query.eventId || 'evt_paint_comp_2026';
        const countRes = await (0, db_1.query)('SELECT COUNT(*) as count FROM painting_applications WHERE event_id = $1', [eventId]);
        const count = parseInt(countRes.rows[0]?.count || '0', 10);
        const maxCapacity = 50;
        const isFull = count >= maxCapacity;
        res.json({
            success: true,
            eventId,
            count,
            maxCapacity,
            spotsRemaining: Math.max(0, maxCapacity - count),
            isFull,
            isOpen: !isFull,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve competition status' });
    }
});
// GET /api/competitions/participants (Public - View first 50 participants for polling & showcase)
exports.competitionsRouter.get('/participants', async (req, res) => {
    try {
        const eventId = req.query.eventId || 'evt_paint_comp_2026';
        const result = await (0, db_1.query)('SELECT id, event_id, full_name, roll_number, department, hall, painting_category, description, status, created_at FROM painting_applications WHERE event_id = $1 ORDER BY created_at ASC LIMIT 50', [eventId]);
        const participants = result.rows.map((r) => ({
            id: r.id,
            eventId: r.event_id,
            fullName: r.full_name,
            rollNumber: r.roll_number,
            department: r.department,
            hall: r.hall,
            paintingCategory: r.painting_category,
            description: r.description,
            status: r.status,
            createdAt: r.created_at,
        }));
        res.json({ success: true, count: participants.length, maxCapacity: 50, data: participants });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve participants' });
    }
});
// GET /api/admin/competitions/applications (Admin Only - View all applications)
exports.competitionsRouter.get('/admin/applications', auth_1.authMiddleware, async (req, res) => {
    try {
        const { eventId, status } = req.query;
        let sql = 'SELECT * FROM painting_applications WHERE 1=1';
        const params = [];
        if (eventId) {
            params.push(eventId);
            sql += ` AND event_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }
        sql += ' ORDER BY created_at DESC';
        const result = await (0, db_1.query)(sql, params);
        const applications = result.rows.map(formatApplication);
        res.json({ success: true, count: applications.length, data: applications });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve applications' });
    }
});
// PATCH /api/admin/competitions/applications/:id (Admin Only - Update status to ACCEPTED, REJECTED, or PENDING)
exports.competitionsRouter.patch('/admin/applications/:id', auth_1.authMiddleware, async (req, res) => {
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
        const result = await (0, db_1.query)('UPDATE painting_applications SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Application not found' });
            return;
        }
        res.json({
            success: true,
            message: `Application marked as ${status}`,
            data: formatApplication(result.rows[0]),
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to update application status' });
    }
});
// POST /api/admin/competitions/sync-poll (Admin Only - Sync 50 participants into the official poll options)
exports.competitionsRouter.post('/admin/sync-poll', auth_1.authMiddleware, async (req, res) => {
    try {
        const eventId = req.body.eventId || 'evt_paint_comp_2026';
        let pollId;
        const pollCheck = await (0, db_1.query)('SELECT id FROM polls WHERE event_id = $1', [eventId]);
        if (pollCheck.rowCount === 0) {
            pollId = `poll_${eventId}`;
            await (0, db_1.query)(`INSERT INTO polls (id, event_id, title, description, is_open)
         VALUES ($1, $2, $3, $4, true)`, [
                pollId,
                eventId,
                'Painting Competition 2026: Participant Voting',
                'Official administrative polling on the 50 painting competition participants. Cast your vote for the best artist!',
            ]);
        }
        else {
            pollId = pollCheck.rows[0].id;
        }
        // Fetch the first 50 applications
        const appsRes = await (0, db_1.query)('SELECT * FROM painting_applications WHERE event_id = $1 ORDER BY created_at ASC LIMIT 50', [eventId]);
        let addedCount = 0;
        for (const app of appsRes.rows) {
            const optId = `opt_${app.id}`;
            const optText = `${app.full_name.trim()} (${app.roll_number.trim()} • ${app.hall.trim()} - ${app.painting_category.trim()})`;
            const existingOpt = await (0, db_1.query)('SELECT id FROM poll_options WHERE id = $1', [optId]);
            if (existingOpt.rowCount === 0) {
                await (0, db_1.query)('INSERT INTO poll_options (id, poll_id, option_text, votes) VALUES ($1, $2, $3, 0)', [optId, pollId, optText]);
                addedCount++;
            }
        }
        res.json({
            success: true,
            message: `Synchronized ${appsRes.rows.length} participants into poll options (${addedCount} newly added).`,
            pollId,
            totalParticipants: appsRes.rows.length,
        });
    }
    catch (err) {
        console.error('[Sync Poll Error]', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to sync poll options' });
    }
});
