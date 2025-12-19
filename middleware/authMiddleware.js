const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/dotenvConfig');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if admin exists
    const admin = await db.select(
      'tbl_admin',
      '*',
      'admin_id = ? AND admin_status = ?',
      [decoded.admin_id, 'active']
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    // Add admin to request
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = authMiddleware;