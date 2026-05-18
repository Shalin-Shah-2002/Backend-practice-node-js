// JWT authentication middleware

import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  return jwtSecret || null;
};

// Verify token from Authorization header "Bearer <token>"
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  jwt.verify(token, jwtSecret, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    // Attach user info to request for downstream handlers
    req.user = payload;
    next();
  });
};
