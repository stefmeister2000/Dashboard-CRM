import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { dbGet, dbRun } from '../database.js';

const router = express.Router();

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Register (admin only, can be called after first login)
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'support', 'sales'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role = 'admin' } = req.body;

      // Check if user already exists
      const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await dbRun(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, role]
      );

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: result.lastID,
          email,
          role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
);

// Change password (requires authentication)
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dbRun(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

