// JWT authentication middleware

import jwt from 'jsonwebtoken';

// Verify token from Authorization header "Bearer <token>"
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    // Attach user info to request for downstream handlers
    req.user = payload;
    next();
  });
};
