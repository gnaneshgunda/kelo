import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Poll, PollOption } from '../types';

export const pollsRouter = Router();

// Helper to fetch complete poll with options
async function getFullPoll(pollId: string): Promise<Poll | null> {
  const pRes = await query('SELECT * FROM polls WHERE id = $1', [pollId]);
  if (pRes.rowCount === 0) return null;

  const pollRow = pRes.rows[0];
  const oRes = await query('SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id ASC', [pollId]);

  const options: PollOption[] = oRes.rows.map((r: any) => ({
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
pollsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.query.eventId as string | undefined;
    let sql = 'SELECT * FROM polls';
    const params: any[] = [];
    if (eventId) {
      sql += ' WHERE event_id = $1';
      params.push(eventId);
    }
    sql += ' ORDER BY created_at DESC';

    const pRes = await query(sql, params);
    const polls: Poll[] = [];

    for (const p of pRes.rows) {
      const full = await getFullPoll(p.id);
      if (full) polls.push(full);
    }

    res.json({ success: true, count: polls.length, data: polls });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve polls' });
  }
});

// GET /api/polls/:id (Public - View single poll results)
pollsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const poll = await getFullPoll(req.params.id);
    if (!poll) {
      res.status(404).json({ success: false, error: 'Poll not found' });
      return;
    }
    res.json({ success: true, data: poll });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve poll' });
  }
});

// ─── 2. Admin Endpoints & Strict Voting ─────────────────────

// POST /api/admin/polls (Admin Only - Create poll)
pollsRouter.post('/admin/create', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, eventId, isOpen, options } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, error: 'Poll title is required' });
      return;
    }

    const pollId = req.body.id || `poll_${Date.now()}`;
    const openStatus = isOpen !== false;

    await query(
      'INSERT INTO polls (id, event_id, title, description, is_open) VALUES ($1, $2, $3, $4, $5)',
      [pollId, eventId || null, title.trim(), description || '', openStatus]
    );

    if (Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const optText = typeof options[i] === 'string' ? options[i] : options[i]?.optionText;
        if (optText && optText.trim()) {
          const optId = `opt_${Date.now()}_${i}`;
          await query(
            'INSERT INTO poll_options (id, poll_id, option_text, votes) VALUES ($1, $2, $3, $4)',
            [optId, pollId, optText.trim(), 0]
          );
        }
      }
    }

    const fullPoll = await getFullPoll(pollId);
    res.status(201).json({ success: true, message: 'Poll created successfully', data: fullPoll });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create poll' });
  }
});

// PUT /api/admin/polls/:id (Admin Only - Update poll)
pollsRouter.put('/admin/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, isOpen, options } = req.body;

    const existing = await query('SELECT * FROM polls WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Poll not found' });
      return;
    }

    const cur = existing.rows[0];
    const newTitle = title !== undefined ? title : cur.title;
    const newDesc = description !== undefined ? description : cur.description;
    const newOpen = isOpen !== undefined ? Boolean(isOpen) : cur.is_open;

    await query(
      'UPDATE polls SET title = $1, description = $2, is_open = $3 WHERE id = $4',
      [newTitle, newDesc, newOpen, id]
    );

    // If options are provided, update/replace them
    if (Array.isArray(options)) {
      // Keep existing options if option.id exists, or insert new
      for (let i = 0; i < options.length; i++) {
        const item = options[i];
        if (typeof item === 'string' && item.trim()) {
          const optId = `opt_${Date.now()}_${i}`;
          await query(
            'INSERT INTO poll_options (id, poll_id, option_text, votes) VALUES ($1, $2, $3, 0)',
            [optId, id, item.trim()]
          );
        } else if (item && item.id && item.optionText) {
          await query(
            'UPDATE poll_options SET option_text = $1 WHERE id = $2 AND poll_id = $3',
            [item.optionText, item.id, id]
          );
        }
      }
    }

    const fullPoll = await getFullPoll(id);
    res.json({ success: true, message: 'Poll updated successfully', data: fullPoll });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update poll' });
  }
});

// DELETE /api/admin/polls/:id (Admin Only - Delete poll)
pollsRouter.delete('/admin/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM polls WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Poll not found' });
      return;
    }
    res.json({ success: true, message: 'Poll deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete poll' });
  }
});

// POST /api/admin/polls/:id/vote (CRITICAL: ADMIN ONLY VOTING)
// Normal visitors receive 401/403! Only authenticated admin can vote.
pollsRouter.post('/admin/:id/vote', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;

    if (!optionId || typeof optionId !== 'string') {
      res.status(400).json({ success: false, error: 'optionId is required to cast a vote' });
      return;
    }

    const pollRes = await query('SELECT * FROM polls WHERE id = $1', [id]);
    if (pollRes.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Poll not found' });
      return;
    }

    if (!pollRes.rows[0].is_open) {
      res.status(400).json({ success: false, error: 'Voting is closed for this poll' });
      return;
    }

    const voteRes = await query(
      'UPDATE poll_options SET votes = votes + 1 WHERE id = $1 AND poll_id = $2 RETURNING *',
      [optionId, id]
    );

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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to record vote' });
  }
});
