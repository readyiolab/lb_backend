const { validationResult } = require('express-validator');
const db = require('../config/database');

// Get table name based on site
const getTableName = (site) => {
  return site === 'lb_services' ? 'tbl_contact_lb_services' : 'tbl_contact_lb_interiors';
};

// Submit Contact Form - LB Services
const submitContactServices = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      contact_name,
      contact_phone,
      contact_email,
      contact_service,
      contact_location,
      contact_message
    } = req.body;

    // Get IP address
    const contact_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Insert contact
    const result = await db.insert('tbl_contact_lb_services', {
      contact_name,
      contact_phone,
      contact_email: contact_email || null,
      contact_service,
      contact_location: contact_location || null,
      contact_message: contact_message || null,
      contact_ip,
      contact_status: 'new'
    });

    if (result.status) {
      res.status(201).json({
        success: true,
        message: 'Thank you! We have received your message and will contact you soon.',
        contact_id: result.insert_id
      });
    }
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting contact form'
    });
  }
};

// Submit Contact Form - LB Interiors
const submitContactInteriors = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      contact_name,
      contact_phone,
      contact_project_details
    } = req.body;

    // Get IP address
    const contact_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Insert contact
    const result = await db.insert('tbl_contact_lb_interiors', {
      contact_name,
      contact_phone,
      contact_project_details,
      contact_ip,
      contact_status: 'new'
    });

    if (result.status) {
      res.status(201).json({
        success: true,
        message: 'Thank you for your interest! Our team will contact you soon to discuss your project.',
        contact_id: result.insert_id
      });
    }
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting consultation request'
    });
  }
};

// Get All Contacts (Protected - Admin Only)
const getAllContacts = async (req, res) => {
  try {
    const { contact_site, contact_status, page = 1, limit = 20 } = req.query;

    if (!contact_site) {
      return res.status(400).json({
        success: false,
        message: 'contact_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(contact_site);
    
    let where = '';
    let params = [];

    if (contact_status) {
      where = 'contact_status = ?';
      params.push(contact_status);
    }

    const offset = (page - 1) * limit;
    const orderby = `ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const contacts = await db.selectAll(tableName, '*', where, params, orderby);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${where ? `WHERE ${where}` : ''}`;
    const countResult = await db.query(countQuery, params);

    res.json({
      success: true,
      contacts,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: countResult?.total || 0,
        total_pages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    });
  }
};

// Get Single Contact (Protected - Admin Only)
const getContactById = async (req, res) => {
  try {
    const { contact_id } = req.params;
    const { contact_site } = req.query;

    if (!contact_site) {
      return res.status(400).json({
        success: false,
        message: 'contact_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(contact_site);

    const contact = await db.select(
      tableName,
      '*',
      'contact_id = ?',
      [contact_id]
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact'
    });
  }
};

// Update Contact Status (Protected - Admin Only)
const updateContactStatus = async (req, res) => {
  try {
    const { contact_id } = req.params;
    const { contact_site, contact_status } = req.body;

    if (!contact_site) {
      return res.status(400).json({
        success: false,
        message: 'contact_site is required'
      });
    }

    if (!contact_status || !['new', 'in_progress', 'completed', 'closed'].includes(contact_status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid contact_status is required (new, in_progress, completed, closed)'
      });
    }

    const tableName = getTableName(contact_site);

    // Check if contact exists
    const existingContact = await db.select(
      tableName,
      '*',
      'contact_id = ?',
      [contact_id]
    );

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update status
    const result = await db.update(
      tableName,
      { contact_status },
      'contact_id = ?',
      [contact_id]
    );

    if (result.status) {
      res.json({
        success: true,
        message: 'Contact status updated successfully'
      });
    }
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact status'
    });
  }
};

// Delete Contact (Protected - Admin Only)
const deleteContact = async (req, res) => {
  try {
    const { contact_id } = req.params;
    const { contact_site } = req.query;

    if (!contact_site) {
      return res.status(400).json({
        success: false,
        message: 'contact_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(contact_site);

    // Check if contact exists
    const existingContact = await db.select(
      tableName,
      '*',
      'contact_id = ?',
      [contact_id]
    );

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Delete contact
    const result = await db.delete(
      tableName,
      'contact_id = ?',
      [contact_id]
    );

    if (result.status) {
      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    }
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting contact'
    });
  }
};

// Get Contact Statistics (Protected - Admin Only)
const getContactStats = async (req, res) => {
  try {
    const { contact_site } = req.query;

    if (!contact_site) {
      return res.status(400).json({
        success: false,
        message: 'contact_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(contact_site);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN contact_status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN contact_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN contact_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN contact_status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count,
        SUM(CASE WHEN WEEK(created_at) = WEEK(CURDATE()) THEN 1 ELSE 0 END) as this_week_count,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as this_month_count
      FROM ${tableName}
    `;

    const stats = await db.query(statsQuery);

    res.json({
      success: true,
      stats: stats || {
        total: 0,
        new_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        closed_count: 0,
        today_count: 0,
        this_week_count: 0,
        this_month_count: 0
      }
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

module.exports = {
  submitContactServices,
  submitContactInteriors,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
};