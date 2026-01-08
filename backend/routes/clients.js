import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKey.js';
import { dbGet, dbAll, dbRun } from '../database.js';

const router = express.Router();

// Create client (public API endpoint for website signups - must be before auth middleware)
// Supports optional API key authentication and business_id assignment
router.post('/',
  authenticateApiKey,
  [
    body('full_name').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString(),
    body('source').optional().isString(),
    body('status').optional().isIn(['new', 'contacted', 'active', 'inactive']),
    body('business_id').optional().isInt()
  ],
  async (req, res) => {
    // Log incoming request for debugging
    console.log('=== Webhook Request Received ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('IP:', req.ip || req.connection.remoteAddress);
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        full_name,
        email,
        phone,
        source = 'website',
        status = 'new',
        tags = [],
        business_id,
        utm_source,
        utm_medium,
        utm_campaign,
        referrer,
        signup_page
      } = req.body;

      // If API key user provided, use their default business if business_id not specified
      let finalBusinessId = business_id;
      if (!finalBusinessId && req.apiKeyUser) {
        // Try to get user's default business (first business they created)
        const userBusiness = await dbGet(
          'SELECT id FROM businesses WHERE id IN (SELECT business_id FROM clients WHERE business_id IS NOT NULL) LIMIT 1'
        );
        if (userBusiness) {
          finalBusinessId = userBusiness.id;
        }
      }

      // Validate business_id exists if provided
      if (finalBusinessId) {
        const business = await dbGet('SELECT id FROM businesses WHERE id = ?', [finalBusinessId]);
        if (!business) {
          return res.status(400).json({ error: 'Invalid business_id' });
        }
      }

      const result = await dbRun(
        `INSERT INTO clients (full_name, email, phone, status, source, tags, business_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [full_name, email || null, phone || null, status, source, JSON.stringify(tags), finalBusinessId || null]
      );

      const clientId = result.lastID;

      // Create signup event
      await dbRun(
        `INSERT INTO events (client_id, event_type, payload, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientId,
          'signup',
          JSON.stringify({
            utm_source,
            utm_medium,
            utm_campaign,
            referrer,
            signup_page,
            api_key_used: !!req.apiKeyUser
          })
        ]
      );

      const newClient = await dbGet(
        `SELECT c.*, b.name as business_name 
         FROM clients c 
         LEFT JOIN businesses b ON c.business_id = b.id 
         WHERE c.id = ?`,
        [clientId]
      );
      newClient.tags = JSON.parse(newClient.tags || '[]');

      console.log('✅ Lead created successfully:', {
        id: newClient.id,
        name: newClient.full_name,
        email: newClient.email
      });

      res.status(201).json({
        success: true,
        client: newClient,
        message: 'Lead created successfully'
      });
    } catch (error) {
      console.error('❌ Create client error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
);

// All other routes require authentication
router.use(authenticateToken);

// Get all clients with search and filters
router.get('/',
  [
    query('search').optional().isString(),
    query('status').optional().isIn(['new', 'contacted', 'active', 'inactive']),
    query('source').optional().isString(),
    query('tag').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { search, status, source, tag, business_id, limit = 100, offset = 0 } = req.query;

      let query = `SELECT c.*, b.name as business_name 
                   FROM clients c 
                   LEFT JOIN businesses b ON c.business_id = b.id 
                   WHERE 1=1`;
      const params = [];

      if (search) {
        query += ' AND (c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        query += ' AND c.status = ?';
        params.push(status);
      }

      if (source) {
        query += ' AND c.source = ?';
        params.push(source);
      }

      if (tag) {
        query += ' AND c.tags LIKE ?';
        params.push(`%"${tag}"%`);
      }

      if (business_id) {
        query += ' AND c.business_id = ?';
        params.push(business_id);
      }

      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const clients = await dbAll(query, params);

      // Parse tags JSON
      const clientsWithParsedTags = clients.map(client => ({
        ...client,
        tags: JSON.parse(client.tags || '[]')
      }));

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM clients WHERE 1=1';
      const countParams = [];
      if (search) {
        countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      if (source) {
        countQuery += ' AND source = ?';
        countParams.push(source);
      }
      if (tag) {
        countQuery += ' AND tags LIKE ?';
        countParams.push(`%"${tag}"%`);
      }
      if (business_id) {
        countQuery += ' AND business_id = ?';
        countParams.push(business_id);
      }

      const countResult = await dbGet(countQuery, countParams);

      res.json({
        clients: clientsWithParsedTags,
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const client = await dbGet(
      `SELECT c.*, b.name as business_name, b.id as business_id 
       FROM clients c 
       LEFT JOIN businesses b ON c.business_id = b.id 
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    client.tags = JSON.parse(client.tags || '[]');
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id',
  [
    body('full_name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString(),
    body('status').optional().isIn(['new', 'contacted', 'active', 'inactive']),
    body('source').optional().isString(),
    body('tags').optional().isArray(),
    body('business_id').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty values
      }
      return Number.isInteger(Number(value)); // Check if it's a valid integer
    }).withMessage('business_id must be an integer or null')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { full_name, email, phone, status, source, tags, business_id } = req.body;
      
      // Debug logging
      console.log('=== Update Client Request ===');
      console.log('Client ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('business_id value:', business_id, 'type:', typeof business_id);

      // Validate business_id exists if provided
      if (business_id !== undefined && business_id !== null) {
        const business = await dbGet('SELECT id FROM businesses WHERE id = ?', [business_id]);
        if (!business) {
          return res.status(400).json({ error: 'Invalid business_id' });
        }
      }

      // Check if client exists
      const existing = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];

      if (full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(full_name);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (source !== undefined) {
        updates.push('source = ?');
        params.push(source);
      }
      if (tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(tags));
      }
      if (business_id !== undefined) {
        updates.push('business_id = ?');
        // Convert empty string to null, keep integer as is
        const finalBusinessId = business_id === '' || business_id === null ? null : parseInt(business_id);
        params.push(finalBusinessId);
        console.log('Setting business_id to:', finalBusinessId);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);

      console.log('Update query:', `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`);
      console.log('Update params:', params);

      await dbRun(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      console.log('✅ Client updated successfully');

      // Create update event
      await dbRun(
        `INSERT INTO events (client_id, event_type, payload, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.params.id, 'updated', JSON.stringify({ updated_fields: Object.keys(req.body) })]
      );

      const updated = await dbGet(
        `SELECT c.*, b.name as business_name 
         FROM clients c 
         LEFT JOIN businesses b ON c.business_id = b.id 
         WHERE c.id = ?`,
        [req.params.id]
      );
      updated.tags = JSON.parse(updated.tags || '[]');

      res.json(updated);
    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

