const express = require('express');
const { body } = require('express-validator');
const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog
} = require('../controller/blogController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create Blog (Protected)
router.post(
  '/',
  authMiddleware,
  [
    body('blog_title').trim().notEmpty().withMessage('Title is required'),
    body('blog_content').trim().notEmpty().withMessage('Content is required'),
    body('blog_author').trim().notEmpty().withMessage('Author is required'),
    body('blog_site')
      .isIn(['lb_services', 'lb_interiors'])
      .withMessage('Invalid site, must be lb_services or lb_interiors'),
    body('blog_status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Invalid status')
  ],
  createBlog
);

// Get All Blogs (Public)
router.get('/', getAllBlogs);

// Get Single Blog by Slug (Public)
router.get('/:blog_slug', getBlogBySlug);

// Update Blog (Protected)
router.put('/:blog_id', authMiddleware, updateBlog);

// Delete Blog (Protected)
router.delete('/:blog_id', authMiddleware, deleteBlog);

module.exports = router;