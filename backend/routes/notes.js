import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get notes for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const notes = await dbAll(
      `SELECT n.*, u.email as created_by_email
       FROM notes n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.client_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.clientId]
    );
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create note
router.post('/',
  [
    body('client_id').isInt(),
    body('note_text').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { client_id, note_text } = req.body;

      // Verify client exists
      const client = await dbGet('SELECT * FROM clients WHERE id = ?', [client_id]);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const result = await dbRun(
        `INSERT INTO notes (client_id, note_text, created_by, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [client_id, note_text, req.user.id]
      );

      // Create event
      await dbRun(
        `INSERT INTO events (client_id, event_type, payload, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [client_id, 'note_added', JSON.stringify({ note_id: result.lastID })]
      );

      const note = await dbGet(
        `SELECT n.*, u.email as created_by_email
         FROM notes n
         LEFT JOIN users u ON n.created_by = u.id
         WHERE n.id = ?`,
        [result.lastID]
      );

      res.status(201).json(note);
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update note
router.put('/:id',
  [
    body('note_text').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = await dbGet('SELECT * FROM notes WHERE id = ?', [req.params.id]);
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Only allow creator or admin to update
      if (note.created_by !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }

      await dbRun(
        'UPDATE notes SET note_text = ? WHERE id = ?',
        [req.body.note_text, req.params.id]
      );

      const updated = await dbGet(
        `SELECT n.*, u.email as created_by_email
         FROM notes n
         LEFT JOIN users u ON n.created_by = u.id
         WHERE n.id = ?`,
        [req.params.id]
      );

      res.json(updated);
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Only allow creator or admin to delete
    if (note.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await dbRun('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


