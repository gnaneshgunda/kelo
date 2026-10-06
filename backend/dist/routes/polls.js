"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.pollsRouter = (0, express_1.Router)();
// Helper to fetch complete poll with options
async function getFullPoll(pollId) {
    const pRes = await (0, db_1.query)('SELECT * FROM polls WHERE id = $1', [pollId]);
    if (pRes.rowCount === 0)
        return null;
    const pollRow = pRes.rows[0];
    const oRes = await (0, db_1.query)('SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC', [pollId]);
    const options = oRes.rows.map((r) => ({
        id: r.id,
        pollId: r.poll_id,
        optionText: r.option_text,
        votes: Number(r.votes) || 0,
    }));
    const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
    return {
        id: pollRow.id,
        eventId: pollRow.event_id,
        title: pollRow.title,
        description: pollRow.description,
        isOpen: pollRow.is_open === true,
        options,
        totalVotes,
        createdAt: pollRow.created_at,
    };
}
// ─── 1. Public Endpoints (Read-Only Results) ───────────────
// GET /api/polls (Public - View results only)
exports.pollsRouter.get('/', async (_req, res) => {
    try {
        const pRes = await (0, db_1.query)('SELECT * FROM polls ORDER BY created_at DESC');
        const polls = [];
        for (const p of pRes.rows) {
            const full = await getFullPoll(p.id);
            if (full)
                polls.push(full);
        }
        res.json({ success: true, count: polls.length, data: polls });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve polls' });
    }
});
// GET /api/polls/:id (Public - View single poll results)
exports.pollsRouter.get('/:id', async (req, res) => {
    try {
        const poll = await getFullPoll(req.params.id);
        if (!poll) {
            res.status(404).json({ success: false, error: 'Poll not found' });
            return;
        }
        res.json({ success: true, data: poll });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve poll' });
    }
});
// ─── 2. Admin Endpoints & Strict Voting ─────────────────────
// POST /api/admin/polls (Admin Only - Create poll)
exports.pollsRouter.post('/admin/create', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title, description, eventId, isOpen, options } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            res.status(400).json({ success: false, error: 'Poll title is required' });
            return;
        }
        const pollId = req.body.id || `poll_${Date.now()}`;
        const openStatus = isOpen !== false;
        await (0, db_1.query)('INSERT INTO polls (id, event_id, title, description, is_open) VALUES ($1, $2, $3, $4, $5)', [pollId, eventId || null, title.trim(), description || '', openStatus]);
        if (Array.isArray(options)) {
            for (let i = 0; i < options.length; i++) {
                const optText = typeof options[i] === 'string' ? options[i] : options[i]?.optionText;
                if (optText && optText.trim()) {
                    const optId = `opt_${Date.now()}_${i}`;
                    await (0, db_1.query)('INSERT INTO poll_options (id, poll_id, option_text, votes) VALUES ($1, $2, $3, $4)', [optId, pollId, optText.trim(), 0]);
                }
            }
        }
        const fullPoll = await getFullPoll(pollId);
        res.status(201).json({ success: true, message: 'Poll created successfully', data: fullPoll });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to create poll' });
    }
});
// PUT /api/admin/polls/:id (Admin Only - Update poll)
exports.pollsRouter.put('/admin/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isOpen, options } = req.body;
        const existing = await (0, db_1.query)('SELECT * FROM polls WHERE id = $1', [id]);
        if (existing.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Poll not found' });
            return;
        }
        const cur = existing.rows[0];
        const newTitle = title !== undefined ? title : cur.title;
        const newDesc = description !== undefined ? description : cur.description;
        const newOpen = isOpen !== undefined ? Boolean(isOpen) : cur.is_open;
        await (0, db_1.query)('UPDATE polls SET title = $1, description = $2, is_open = $3 WHERE id = $4', [newTitle, newDesc, newOpen, id]);
        // If options are provided, update/replace them
        if (Array.isArray(options)) {
            // Keep existing options if option.id exists, or insert new
            for (let i = 0; i < options.length; i++) {
                const item = options[i];
                if (typeof item === 'string' && item.trim()) {
                    const optId = `opt_${Date.now()}_${i}`;
                    await (0, db_1.query)('INSERT INTO poll_options (id, poll_id, option_text, votes) VALUES ($1, $2, $3, 0)', [optId, id, item.trim()]);
                }
                else if (item && item.id && item.optionText) {
                    await (0, db_1.query)('UPDATE poll_options SET option_text = $1 WHERE id = $2 AND poll_id = $3', [item.optionText, item.id, id]);
                }
            }
        }
        const fullPoll = await getFullPoll(id);
        res.json({ success: true, message: 'Poll updated successfully', data: fullPoll });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to update poll' });
    }
});
// DELETE /api/admin/polls/:id (Admin Only - Delete poll)
exports.pollsRouter.delete('/admin/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, db_1.query)('DELETE FROM polls WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Poll not found' });
            return;
        }
        res.json({ success: true, message: 'Poll deleted successfully', id });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete poll' });
    }
});
// POST /api/admin/polls/:id/vote (CRITICAL: ADMIN ONLY VOTING)
// Normal visitors receive 401/403! Only authenticated admin can vote.
exports.pollsRouter.post('/admin/:id/vote', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;
        if (!optionId || typeof optionId !== 'string') {
            res.status(400).json({ success: false, error: 'optionId is required to cast a vote' });
            return;
        }
        const pollRes = await (0, db_1.query)('SELECT * FROM polls WHERE id = $1', [id]);
        if (pollRes.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Poll not found' });
            return;
        }
        if (!pollRes.rows[0].is_open) {
            res.status(400).json({ success: false, error: 'Voting is closed for this poll' });
            return;
        }
        const voteRes = await (0, db_1.query)('UPDATE poll_options SET votes = votes + 1 WHERE id = $1 AND poll_id = $2 RETURNING *', [optionId, id]);
        if (voteRes.rowCount === 0) {
            res.status(404).json({ success: false, error: 'Option not found in this poll' });
            return;
        }
        const fullPoll = await getFullPoll(id);
        res.json({
            success: true,
            message: 'Vote recorded successfully by administrator',
            data: fullPoll,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Failed to record vote' });
    }
});
