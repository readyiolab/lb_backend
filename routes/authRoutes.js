const express = require('express');
const { body } = require('express-validator');
const { signup, login, getProfile } = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Signup Route
router.post(
  '/signup',
  [
    body('admin_name').trim().notEmpty().withMessage('Name is required'),
    body('admin_email').isEmail().withMessage('Valid email is required'),
    body('admin_password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('admin_role').optional().isIn(['super_admin', 'admin']).withMessage('Invalid role')
  ],
  signup
);

// Login Route
router.post(
  '/login',
  [
    body('admin_email').isEmail().withMessage('Valid email is required'),
    body('admin_password').notEmpty().withMessage('Password is required')
  ],
  login
);

// Get Profile (Protected)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;