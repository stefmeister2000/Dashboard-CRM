import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dbAll } from '../database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Export clients as CSV
router.get('/clients.csv', async (req, res) => {
  try {
    const { status, source, tag } = req.query;

    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    query += ' ORDER BY created_at DESC';

    const clients = await dbAll(query, params);

    // Convert to CSV
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Status', 'Source', 'Tags', 'Created At', 'Updated At'];
    const rows = clients.map(client => {
      const tags = JSON.parse(client.tags || '[]').join('; ');
      return [
        client.id,
        `"${client.full_name || ''}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        client.status,
        client.source,
        `"${tags}"`,
        client.created_at,
        client.updated_at
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

