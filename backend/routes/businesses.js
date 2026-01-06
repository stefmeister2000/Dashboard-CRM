import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await dbAll('SELECT * FROM businesses ORDER BY created_at DESC');
    res.json(businesses);
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single business
router.get('/:id', async (req, res) => {
  try {
    const business = await dbGet('SELECT * FROM businesses WHERE id = ?', [req.params.id]);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create business
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString(),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('zip_code').optional().isString(),
    body('country').optional().isString(),
    body('tax_id').optional().isString(),
    body('website').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        country,
        tax_id,
        website
      } = req.body;

      const result = await dbRun(
        `INSERT INTO businesses (name, email, phone, address, city, state, zip_code, country, tax_id, website, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [name, email || null, phone || null, address || null, city || null, state || null, zip_code || null, country || null, tax_id || null, website || null]
      );

      const newBusiness = await dbGet('SELECT * FROM businesses WHERE id = ?', [result.lastID]);
      res.status(201).json(newBusiness);
    } catch (error) {
      console.error('Create business error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update business
router.put('/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString(),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('zip_code').optional().isString(),
    body('country').optional().isString(),
    body('tax_id').optional().isString(),
    body('website').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        country,
        tax_id,
        website
      } = req.body;

      // Check if business exists
      const existing = await dbGet('SELECT * FROM businesses WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone);
      }
      if (address !== undefined) {
        updates.push('address = ?');
        params.push(address);
      }
      if (city !== undefined) {
        updates.push('city = ?');
        params.push(city);
      }
      if (state !== undefined) {
        updates.push('state = ?');
        params.push(state);
      }
      if (zip_code !== undefined) {
        updates.push('zip_code = ?');
        params.push(zip_code);
      }
      if (country !== undefined) {
        updates.push('country = ?');
        params.push(country);
      }
      if (tax_id !== undefined) {
        updates.push('tax_id = ?');
        params.push(tax_id);
      }
      if (website !== undefined) {
        updates.push('website = ?');
        params.push(website);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);

      await dbRun(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await dbGet('SELECT * FROM businesses WHERE id = ?', [req.params.id]);
      res.json(updated);
    } catch (error) {
      console.error('Update business error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete business
router.delete('/:id', async (req, res) => {
  try {
    // Check if business has clients
    const clientCount = await dbGet('SELECT COUNT(*) as count FROM clients WHERE business_id = ?', [req.params.id]);
    if (clientCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete business with assigned clients. Please reassign clients first.' });
    }

    const result = await dbRun('DELETE FROM businesses WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

