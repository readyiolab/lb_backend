const { validationResult } = require('express-validator');
const db = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinaryConfig');

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get table name based on site
const getTableName = (site) => {
  return site === 'lb_services' ? 'tbl_blog_lb_services' : 'tbl_blog_lb_interiors';
};

// Create Blog
const createBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      blog_title,
      blog_excerpt,
      blog_description,
      blog_content,
      blog_tags,
      blog_author,
      blog_site,
      blog_status
    } = req.body;

    // Generate slug
    let blog_slug = generateSlug(blog_title);
    
    // Get table name
    const tableName = getTableName(blog_site);

    // Check if slug already exists
    const existingBlog = await db.select(
      tableName,
      '*',
      'blog_slug = ?',
      [blog_slug]
    );

    if (existingBlog) {
      blog_slug = `${blog_slug}-${Date.now()}`;
    }

    let blog_image = null;
    let blog_image_public_id = null;

    // Upload image to Cloudinary
    if (req.files && req.files.blog_image) {
      const folder = blog_site === 'lb_services' ? 'lb-services-blog' : 'lb-interiors-blog';
      const uploadResult = await uploadToCloudinary(req.files.blog_image, folder);
      
      if (uploadResult.success) {
        blog_image = uploadResult.url;
        blog_image_public_id = uploadResult.public_id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Image upload failed',
          error: uploadResult.error
        });
      }
    }

    // Insert blog
    const result = await db.insert(tableName, {
      blog_title,
      blog_slug,
      blog_excerpt,
      blog_description,
      blog_content,
      blog_image,
      blog_image_public_id,
      blog_tags,
      blog_author,
      blog_status: blog_status || 'draft',
      created_by: req.admin.admin_id
    });

    if (result.status) {
      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        blog_id: result.insert_id,
        blog_slug
      });
    }
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating blog'
    });
  }
};

// Get All Blogs
const getAllBlogs = async (req, res) => {
  try {
    const { blog_site, blog_status, page = 1, limit = 10 } = req.query;

    if (!blog_site) {
      return res.status(400).json({
        success: false,
        message: 'blog_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(blog_site);
    
    let where = '';
    let params = [];

    if (blog_status) {
      where = 'blog_status = ?';
      params.push(blog_status);
    }

    const offset = (page - 1) * limit;
    const orderby = `ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const blogs = await db.selectAll(tableName, '*', where, params, orderby);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${where ? `WHERE ${where}` : ''}`;
    const countResult = await db.query(countQuery, params);

    res.json({
      success: true,
      blogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: countResult?.total || 0,
        total_pages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
};

// Get Single Blog
const getBlogBySlug = async (req, res) => {
  try {
    const { blog_slug } = req.params;
    const { blog_site } = req.query;

    if (!blog_site) {
      return res.status(400).json({
        success: false,
        message: 'blog_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(blog_site);

    const blog = await db.select(
      tableName,
      '*',
      'blog_slug = ?',
      [blog_slug]
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    await db.update(
      tableName,
      { blog_views: blog.blog_views + 1 },
      'blog_id = ?',
      [blog.blog_id]
    );

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
};

// Update Blog
const updateBlog = async (req, res) => {
  try {
    const { blog_id } = req.params;
    const { blog_site } = req.query;

    if (!blog_site) {
      return res.status(400).json({
        success: false,
        message: 'blog_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(blog_site);

    const {
      blog_title,
      blog_excerpt,
      blog_description,
      blog_content,
      blog_tags,
      blog_author,
      blog_status
    } = req.body;

    // Check if blog exists
    const existingBlog = await db.select(
      tableName,
      '*',
      'blog_id = ?',
      [blog_id]
    );

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const updateData = {};

    if (blog_title) {
      updateData.blog_title = blog_title;
      updateData.blog_slug = generateSlug(blog_title);
    }
    if (blog_excerpt) updateData.blog_excerpt = blog_excerpt;
    if (blog_description) updateData.blog_description = blog_description;
    if (blog_content) updateData.blog_content = blog_content;
    if (blog_tags) updateData.blog_tags = blog_tags;
    if (blog_author) updateData.blog_author = blog_author;
    if (blog_status) updateData.blog_status = blog_status;

    // Handle image update
    if (req.files && req.files.blog_image) {
      // Delete old image from Cloudinary
      if (existingBlog.blog_image_public_id) {
        await deleteFromCloudinary(existingBlog.blog_image_public_id);
      }

      // Upload new image
      const folder = blog_site === 'lb_services' ? 'lb-services-blog' : 'lb-interiors-blog';
      const uploadResult = await uploadToCloudinary(req.files.blog_image, folder);
      
      if (uploadResult.success) {
        updateData.blog_image = uploadResult.url;
        updateData.blog_image_public_id = uploadResult.public_id;
      }
    }

    // Update blog
    const result = await db.update(
      tableName,
      updateData,
      'blog_id = ?',
      [blog_id]
    );

    if (result.status) {
      res.json({
        success: true,
        message: 'Blog updated successfully'
      });
    }
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating blog'
    });
  }
};

// Delete Blog
const deleteBlog = async (req, res) => {
  try {
    const { blog_id } = req.params;
    const { blog_site } = req.query;

    if (!blog_site) {
      return res.status(400).json({
        success: false,
        message: 'blog_site parameter is required (lb_services or lb_interiors)'
      });
    }

    const tableName = getTableName(blog_site);

    // Check if blog exists
    const existingBlog = await db.select(
      tableName,
      '*',
      'blog_id = ?',
      [blog_id]
    );

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete image from Cloudinary
    if (existingBlog.blog_image_public_id) {
      await deleteFromCloudinary(existingBlog.blog_image_public_id);
    }

    // Delete blog
    const result = await db.delete(
      tableName,
      'blog_id = ?',
      [blog_id]
    );

    if (result.status) {
      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    }
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting blog'
    });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog
};