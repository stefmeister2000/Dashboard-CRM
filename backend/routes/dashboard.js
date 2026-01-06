import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll } from '../database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const { business_id } = req.query;
    const hasBusinessFilter = business_id && business_id !== 'null' && business_id !== 'undefined';
    const businessIdValue = hasBusinessFilter ? parseInt(business_id) : null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // New signups today
    const signupsTodayQuery = hasBusinessFilter
      ? `SELECT COUNT(*) as count FROM clients WHERE DATE(created_at) = DATE('now') AND business_id = ?`
      : `SELECT COUNT(*) as count FROM clients WHERE DATE(created_at) = DATE('now')`;
    const signupsToday = await dbGet(
      signupsTodayQuery,
      hasBusinessFilter ? [businessIdValue] : []
    );

    // New signups this week
    const signupsThisWeekQuery = hasBusinessFilter
      ? `SELECT COUNT(*) as count FROM clients WHERE business_id = ? AND created_at >= ?`
      : `SELECT COUNT(*) as count FROM clients WHERE created_at >= ?`;
    const signupsThisWeek = await dbGet(
      signupsThisWeekQuery,
      hasBusinessFilter ? [businessIdValue, weekAgo.toISOString()] : [weekAgo.toISOString()]
    );

    // New signups this month
    const signupsThisMonthQuery = hasBusinessFilter
      ? `SELECT COUNT(*) as count FROM clients WHERE business_id = ? AND created_at >= ?`
      : `SELECT COUNT(*) as count FROM clients WHERE created_at >= ?`;
    const signupsThisMonth = await dbGet(
      signupsThisMonthQuery,
      hasBusinessFilter ? [businessIdValue, monthAgo.toISOString()] : [monthAgo.toISOString()]
    );

    // Total clients
    const totalClientsQuery = hasBusinessFilter
      ? `SELECT COUNT(*) as count FROM clients WHERE business_id = ?`
      : `SELECT COUNT(*) as count FROM clients`;
    const totalClients = await dbGet(
      totalClientsQuery,
      hasBusinessFilter ? [businessIdValue] : []
    );

    // Clients by status
    const clientsByStatusQuery = hasBusinessFilter
      ? `SELECT status, COUNT(*) as count FROM clients WHERE business_id = ? GROUP BY status`
      : `SELECT status, COUNT(*) as count FROM clients GROUP BY status`;
    const clientsByStatus = await dbAll(
      clientsByStatusQuery,
      hasBusinessFilter ? [businessIdValue] : []
    );

    // Clients by source
    const clientsBySourceQuery = hasBusinessFilter
      ? `SELECT source, COUNT(*) as count FROM clients WHERE business_id = ? GROUP BY source`
      : `SELECT source, COUNT(*) as count FROM clients GROUP BY source`;
    const clientsBySource = await dbAll(
      clientsBySourceQuery,
      hasBusinessFilter ? [businessIdValue] : []
    );

    // Last 20 signups
    const lastSignupsQuery = hasBusinessFilter
      ? `SELECT id, full_name, email, phone, status, source, created_at FROM clients WHERE business_id = ? ORDER BY created_at DESC LIMIT 20`
      : `SELECT id, full_name, email, phone, status, source, created_at FROM clients ORDER BY created_at DESC LIMIT 20`;
    const lastSignups = await dbAll(
      lastSignupsQuery,
      hasBusinessFilter ? [businessIdValue] : []
    );

    // Parse tags for last signups
    const lastSignupsWithTags = lastSignups.map(client => ({
      ...client,
      tags: JSON.parse(client.tags || '[]')
    }));

    res.json({
      signupsToday: signupsToday?.count || 0,
      signupsThisWeek: signupsThisWeek?.count || 0,
      signupsThisMonth: signupsThisMonth?.count || 0,
      totalClients: totalClients?.count || 0,
      clientsByStatus: clientsByStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      clientsBySource: clientsBySource.reduce((acc, row) => {
        acc[row.source] = row.count;
        return acc;
      }, {}),
      lastSignups: lastSignupsWithTags || []
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get client timeline (events)
router.get('/client/:clientId/timeline', async (req, res) => {
  try {
    const events = await dbAll(
      `SELECT * FROM events WHERE client_id = ? ORDER BY created_at DESC`,
      [req.params.clientId]
    );

    const eventsWithParsedPayload = events.map(event => ({
      ...event,
      payload: JSON.parse(event.payload || '{}')
    }));

    res.json(eventsWithParsedPayload);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

