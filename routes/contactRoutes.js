const express = require('express');
const { body } = require('express-validator');
const {
  submitContactServices,
  submitContactInteriors,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
} = require('../controller/contactController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public Routes - Contact Form Submission

// Submit Contact Form - LB Services (Public)
router.post(
  '/services',
  [
    body('contact_name').trim().notEmpty().withMessage('Name is required'),
    body('contact_phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid phone number format'),
    body('contact_email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('contact_service')
      .trim()
      .notEmpty()
      .withMessage('Service is required')
      .isIn([
        'AC Repair & Installation',
        'Electrician',
        'Plumber',
        'Carpenter',
        'Home Painter',
        'Gardening Services',
        'Home Cleaning',
        'Home Deep Cleaning',
        'Kitchen Cleaning',
        'Sofa Cleaning',
        'Mattress Cleaning',
        'Carpet Cleaning',
        'Pest Control',
        'Sanitization Service',
        'Glass Cleaning',
        'Car Washing',
        'Car Detailing',
        'Car Cleaning',
        'Makeup Artist',
        'Bridal Makeup',
        'Mehndi Artist',
        'Local Shifting',
        'Domestic Shifting',
        'Packing Materials',
        'Labour Services',
        'Physiotherapy at Home',
        'Event Management',
        'Marriage Planning',
        'Birthday Party',
        'Marriage Hall',
        'Flower Decoration',
        'Catering Services',
        'Bhajan Mandali for Events',
        'Kirtan Party Booking',
        'Dholak & Tabla Players',
        'Geet/Bhakti Singer Booking',
        'Shiv Charcha Group Booking',
        'Satyanarayan Katha & Puja-Paath Pandit',
        'Choreographer',
        'Photographer',
        'Interior Designing',
        '3D Design',
        '2D Design',
        'Other'
      ])
      .withMessage('Invalid service selected'),
    body('contact_location').optional().trim(),
    body('contact_message').optional().trim()
  ],
  submitContactServices
);

// Submit Contact Form - LB Interiors (Public)
router.post(
  '/interiors',
  [
    body('contact_name').trim().notEmpty().withMessage('Name is required'),
    body('contact_phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid phone number format'),
    body('contact_project_details')
      .trim()
      .notEmpty()
      .withMessage('Project details are required')
      .isLength({ min: 10 })
      .withMessage('Please provide more details about your project (minimum 10 characters)')
  ],
  submitContactInteriors
);

// Protected Routes - Admin Only

// Get All Contacts (Admin)
router.get('/', authMiddleware, getAllContacts);

// Get Contact Statistics (Admin)
router.get('/stats', authMiddleware, getContactStats);

// Get Single Contact (Admin)
router.get('/:contact_id', authMiddleware, getContactById);

// Update Contact Status (Admin)
router.put('/:contact_id/status', authMiddleware, updateContactStatus);

// Delete Contact (Admin)
router.delete('/:contact_id', authMiddleware, deleteContact);

module.exports = router;