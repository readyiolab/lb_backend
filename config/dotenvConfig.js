
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 6000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  dbHost: process.env.DB_HOST || 'localhost',
  dbUser: process.env.DB_USER || 'root',
  dbPass: process.env.DB_PASS || '',
  dbName: process.env.DB_NAME || 'db_lb_blog_both',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};