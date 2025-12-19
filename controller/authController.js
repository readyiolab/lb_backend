const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { jwtSecret, jwtExpire } = require('../config/dotenvConfig');

// Signup
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { admin_name, admin_email, admin_password, admin_role } = req.body;

    // Check if admin already exists
    const existingAdmin = await db.select(
      'tbl_admin',
      '*',
      'admin_email = ?',
      [admin_email]
    );

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin_password, salt);

    // Insert admin
    const result = await db.insert('tbl_admin', {
      admin_name,
      admin_email,
      admin_password: hashedPassword,
      admin_role: admin_role || 'admin',
      admin_status: 'active'
    });

    if (result.status) {
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        admin_id: result.insert_id
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { admin_email, admin_password } = req.body;

    // Check if admin exists
    const admin = await db.select(
      'tbl_admin',
      '*',
      'admin_email = ?',
      [admin_email]
    );

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if admin is active
    if (admin.admin_status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(admin_password, admin.admin_password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create token
    const token = jwt.sign(
      { admin_id: admin.admin_id, admin_email: admin.admin_email },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        admin_id: admin.admin_id,
        admin_name: admin.admin_name,
        admin_email: admin.admin_email,
        admin_role: admin.admin_role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const admin = await db.select(
      'tbl_admin',
      'admin_id, admin_name, admin_email, admin_role, admin_status, created_at',
      'admin_id = ?',
      [req.admin.admin_id]
    );

    res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { signup, login, getProfile };