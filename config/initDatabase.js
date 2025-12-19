const mysql = require('mysql2');

// Database connection config
const host = 'localhost';
const username = 'root';
const password = '';
const database = 'db_lb_blog_both';

// Create connection
const conn = mysql.createConnection({
  host,
  user: username,
  password,
  database,
});

// SQL to create contact tables
const contactTablesSql = `
-- Create contact table for LB Services
CREATE TABLE IF NOT EXISTS tbl_contact_lb_services (
  contact_id INT PRIMARY KEY AUTO_INCREMENT,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  contact_service VARCHAR(255),
  contact_location VARCHAR(255),
  contact_message TEXT,
  contact_ip VARCHAR(45),
  contact_status ENUM('new', 'contacted', 'resolved', 'closed') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (contact_status),
  INDEX idx_created (created_at)
);

-- Create contact table for LB Interiors
CREATE TABLE IF NOT EXISTS tbl_contact_lb_interiors (
  contact_id INT PRIMARY KEY AUTO_INCREMENT,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  contact_project_details TEXT NOT NULL,
  contact_location VARCHAR(255),
  contact_ip VARCHAR(45),
  contact_status ENUM('new', 'contacted', 'resolved', 'closed') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (contact_status),
  INDEX idx_created (created_at)
);
`;

function initDatabase() {
  conn.connect((err) => {
    if (err) {
      console.error('Database Connection Error:', err);
      process.exit(1);
    }
    console.log('Connected to database for initialization');

    // Execute the SQL to create tables
    const statements = contactTablesSql.split(';').filter(sql => sql.trim());
    
    let completed = 0;
    statements.forEach((sql, index) => {
      if (sql.trim()) {
        conn.query(sql, (err) => {
          if (err) {
            console.error(`Error executing statement ${index + 1}:`, err);
          } else {
            console.log(`✓ Statement ${index + 1} completed successfully`);
          }
          
          completed++;
          if (completed === statements.length) {
            console.log('\n✅ Database initialization complete!');
            conn.end();
            process.exit(0);
          }
        });
      }
    });
  });
}

// Run initialization
initDatabase();
