const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token not found',
        });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token not found',
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET não configurado.');
        return res.status(500).json({
            success: false,
            message: 'JWT configuration error',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || decoded.role !== 'admin' || !decoded.id) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        req.user = decoded;
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('JWT validation error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

module.exports = authMiddleware;
