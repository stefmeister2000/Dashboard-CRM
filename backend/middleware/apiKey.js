import { dbGet } from '../database.js';

// Middleware to authenticate API key (optional - allows public access if no key provided)
export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  // If no API key provided, allow public access (for backward compatibility)
  if (!apiKey) {
    req.apiKeyUser = null;
    return next();
  }

  // Verify API key
  dbGet('SELECT id, email, role FROM users WHERE api_key = ?', [apiKey])
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      req.apiKeyUser = user;
      next();
    })
    .catch(error => {
      console.error('API key verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
}

// Middleware that requires API key (strict)
export function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  dbGet('SELECT id, email, role FROM users WHERE api_key = ?', [apiKey])
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      req.apiKeyUser = user;
      next();
    })
    .catch(error => {
      console.error('API key verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
}

