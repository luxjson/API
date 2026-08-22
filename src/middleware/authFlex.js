const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function getBearerToken(req) {
  const header = req.headers?.authorization;

  if (typeof header !== 'string') return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

module.exports = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    req.authUser = null;
    req.user = null;
    return next();
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'JWT_SECRET não configurado',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      req.authUser = null;
      req.user = null;
      return next();
    }

    if (decoded.role === 'user' || decoded.role === 'admin') {
      req.authUser = decoded;
      req.user = decoded;
      return next();
    }

    const admin = await Admin.findById(decoded.id);

    req.authUser = admin
      ? {
          id: admin.id,
          username: admin.username,
          role: 'admin',
        }
      : null;
    req.user = req.authUser;

    return next();
  } catch (error) {
    req.authUser = null;
    req.user = null;

    if (process.env.NODE_ENV !== 'production') {
      console.error('[CommunityAuth] JWT verification failed:', {
        name: error?.name,
        message: error?.message,
      });
    }

    return next();
  }
};
