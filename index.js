const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { port } = require('./config/dotenvConfig');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:8081',  // lb_Services (production-like port)
  'http://localhost:5173',  // LB_INTERIOR (Vite dev server)
  'http://localhost:5175',  // Alternative dev server
  'https://lbservicesgorakhpur.com',
  'https://www.lbservicesgorakhpur.com',
  'https://lbinterior.in',
  'https://www.lbinterior.in'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LB Blog & Contact API is running',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (Protected)'
      },
      blog: {
        create: 'POST /api/blog (Protected)',
        getAll: 'GET /api/blog?blog_site=lb_services',
        getBySlug: 'GET /api/blog/:slug?blog_site=lb_services',
        update: 'PUT /api/blog/:id?blog_site=lb_services (Protected)',
        delete: 'DELETE /api/blog/:id?blog_site=lb_services (Protected)'
      },
      contact: {
        submitServices: 'POST /api/contact/services (Public)',
        submitInteriors: 'POST /api/contact/interiors (Public)',
        getAll: 'GET /api/contact?contact_site=lb_services (Protected)',
        getStats: 'GET /api/contact/stats?contact_site=lb_services (Protected)',
        getById: 'GET /api/contact/:id?contact_site=lb_services (Protected)',
        updateStatus: 'PUT /api/contact/:id/status (Protected)',
        delete: 'DELETE /api/contact/:id?contact_site=lb_services (Protected)'
      }
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});