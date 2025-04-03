const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2'); 
app.use(cors());

// Parse JSON request body
app.use(express.json());

require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('✅ Database connected');
    }
});

// Create users table
const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'guide') NOT NULL DEFAULT 'guide',
    bio TEXT,
    experience VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createUsersTableSQL, (err) => {
    if (err) {
        console.error('Failed to create users table:', err);
    } else {
        console.log('✅ Users table created or already exists');
        
        // Check if users table has all necessary fields
        db.query("SHOW COLUMNS FROM users", (err, columns) => {
            if (err) {
                console.error('Failed to check users table structure:', err);
            } else {
                // Get list of existing column names
                const existingColumns = columns.map(col => col.Field);
                
                // Check and add missing fields
                const missingColumns = [];
                
                if (!existingColumns.includes('role')) {
                    missingColumns.push("ADD COLUMN role ENUM('admin', 'guide') NOT NULL DEFAULT 'guide'");
                }
                
                if (!existingColumns.includes('bio')) {
                    missingColumns.push("ADD COLUMN bio TEXT");
                }
                
                if (!existingColumns.includes('experience')) {
                    missingColumns.push("ADD COLUMN experience VARCHAR(255)");
                }
                
                if (!existingColumns.includes('active')) {
                    missingColumns.push("ADD COLUMN active BOOLEAN DEFAULT TRUE");
                }
                
                // If there are missing fields, add them
                if (missingColumns.length > 0) {
                    const alterTableSQL = `ALTER TABLE users ${missingColumns.join(', ')}`;
                    
                    db.query(alterTableSQL, (err) => {
                        if (err) {
                            console.error('Failed to add missing fields:', err);
                        } else {
                            console.log('✅ All missing fields added to users table');
                        }
                        
                        // Continue to create schedules table and check admin
                        continueSetup();
                    });
                } else {
                    // No missing fields, continue to next step
                    continueSetup();
                }
            }
        });
        
        // Function to continue setup process
        function continueSetup() {
            // Create schedules table
            const createSchedulesTableSQL = `
            CREATE TABLE IF NOT EXISTS schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                guide_id INT,
                route_name VARCHAR(255) NOT NULL,
                date DATETIME NOT NULL,
                meeting_point VARCHAR(255) NOT NULL,
                visitors INT DEFAULT 0,
                duration FLOAT DEFAULT 1.0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guide_id) REFERENCES users(id)
            )`;
            
            db.query(createSchedulesTableSQL, (err) => {
                if (err) {
                    console.error('Failed to create schedules table:', err);
                } else {
                    console.log('✅ Schedules table created or already exists');
                    
                    // Check if there is an admin account, if not create a default admin
                    const checkAdminSQL = "SELECT * FROM users WHERE role = 'admin' LIMIT 1";
                    db.query(checkAdminSQL, (err, results) => {
                        if (err) {
                            console.error('Failed to check admin:', err);
                            return;
                        }
                        
                        if (results.length === 0) {
                            createDefaultAdmin();
                        } else {
                            console.log('✅ Admin account already exists');
                        }
                    });
                }
            });
        }
    }
});

// Create default admin account function
function createDefaultAdmin() {
    // Create default admin
    const createAdminSQL = `
    INSERT INTO users (username, email, password, role) 
    VALUES ('admin', 'admin@example.com', 'admin123', 'admin')`;
    
    db.query(createAdminSQL, (err) => {
        if (err) {
            console.error('Failed to create default admin:', err);
        } else {
            console.log('✅ Default admin created');
        }
    });
}

// Create API routes
app.get('/', (req, res) => {
    const sql = 'SELECT id, username, email, created_at FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Failed to get user list:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to get user list'
            });
        }
        
        res.json({
            success: true,
            users: results
        });
    });
});

app.get('/api', (req, res) => {
    res.json({ message: 'Park Guide System API' });
});

// User registration API - using MySQL
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Check if email is already registered
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
        
        // If email already exists
        if (results.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }
        
        // Insert new user
        const insertUserSql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(insertUserSql, [username, email, password], (err, result) => {
            if (err) {
                console.error('Insert user error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Registration failed, please try again later' 
                });
            }
            
            res.status(201).json({ 
                success: true, 
                message: 'Registration successful',
                userId: result.insertId
            });
        });
    });
});

// User login API - using MySQL validation
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    // Query user
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
        
        // Check if user exists
        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email or password incorrect' 
            });
        }
        
        const user = results[0];
        
        // Verify password match
        // Note: In a real application, you should use bcrypt to compare encrypted passwords
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email or password incorrect' 
            });
        }
        
        // Login successful, return user information (without password)
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    // Query admin user
    const sql = "SELECT * FROM users WHERE email = ? AND role = 'admin'";
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
        
        // Check if user exists
        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email or password incorrect' 
            });
        }
        
        const user = results[0];
        
        // Verify password match
        // Note: In a real application, you should use bcrypt to compare encrypted passwords
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email or password incorrect' 
            });
        }
        
        // Login successful, return user information (without password)
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: 'dummy-token-' + user.id, // In a real application, you should use JWT
                created_at: user.created_at
            }
        });
    });
});

// Guide login
app.post('/api/guide/login', (req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    // Get table structure to determine which fields can be returned
    db.query("SHOW COLUMNS FROM users", (err, columns) => {
        if (err) {
            console.error('Failed to check users table structure:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
        
        // Get list of existing column names
        const existingColumns = columns.map(col => col.Field);
        const hasRole = existingColumns.includes('role');
        
        // Build query SQL
        let sql;
        if (hasRole) {
            sql = "SELECT * FROM users WHERE email = ? AND role = 'guide'";
        } else {
            sql = "SELECT * FROM users WHERE email = ?";
        }
        
        // Query guide user
        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Server error' 
                });
            }
            
            // Check if user exists
            if (results.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email or password incorrect' 
                });
            }
            
            const user = results[0];
            
            // Verify password match
            if (password !== user.password) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email or password incorrect' 
                });
            }
            
            // Build user information object (without password)
            const userInfo = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: hasRole ? user.role : 'guide', // If table does not have role column, default to guide
                created_at: user.created_at,
                token: 'dummy-token-' + user.id // In a real application, you should use JWT
            };
            
            // Add optional fields
            if (existingColumns.includes('bio') && user.bio) userInfo.bio = user.bio;
            if (existingColumns.includes('experience') && user.experience) userInfo.experience = user.experience;
            
            // Login successful, return user information
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: userInfo
            });
        });
    });
});

// Admin register guide account
app.post('/api/admin/register-guide', (req, res) => {
    const { username, email, password, bio, experience } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username, email, and password are required' 
        });
    }
    
    // Check if email is already registered
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
        
        // If email already exists
        if (results.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }
        
        // Check table structure to determine which fields can be inserted
        db.query("SHOW COLUMNS FROM users", (err, columns) => {
            if (err) {
                console.error('Failed to check users table structure:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Server error' 
                });
            }
            
            // Get list of existing column names
            const existingColumns = columns.map(col => col.Field);
            
            // Prepare fields and values to be inserted
            const fields = ['username', 'email', 'password'];
            const values = [username, email, password];
            
            // Basic required fields
            if (existingColumns.includes('role')) {
                fields.push('role');
                values.push('guide');
            }
            
            // Optional fields
            if (existingColumns.includes('bio') && bio) {
                fields.push('bio');
                values.push(bio);
            }
            
            if (existingColumns.includes('experience') && experience) {
                fields.push('experience');
                values.push(experience);
            }
            
            // Build insert SQL
            const insertGuideSql = `INSERT INTO users (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
            
            db.query(insertGuideSql, values, (err, result) => {
                if (err) {
                    console.error('Insert guide error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Registration failed, please try again later' 
                    });
                }
                
                res.status(201).json({ 
                    success: true, 
                    message: 'Guide account created successfully',
                    userId: result.insertId
                });
            });
        });
    });
});

// Get all guides (admin interface)
app.get('/api/admin/guides', (req, res) => {
    // First, check users table columns, only select existing columns
    db.query("SHOW COLUMNS FROM users", (err, columns) => {
        if (err) {
            console.error('Failed to check users table structure:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to get guide list' 
            });
        }
        
        // Get list of existing column names
        const existingColumns = columns.map(col => col.Field);
        
        // Build query to select only existing fields
        const selectFields = ['id', 'username', 'email', 'created_at'];
        
        // Optional fields
        if (existingColumns.includes('bio')) selectFields.push('bio');
        if (existingColumns.includes('experience')) selectFields.push('experience');
        if (existingColumns.includes('active')) selectFields.push('active');
        
        const sql = `SELECT ${selectFields.join(', ')} FROM users WHERE role = 'guide'`;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Failed to get guide list:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to get guide list' 
                });
            }
            
            res.json({
                success: true,
                guides: results
            });
        });
    });
});

// Get guide schedule
app.get('/api/guide/schedules', (req, res) => {
    // In a real application, you should get guide ID from JWT token
    // Here for demonstration, we assume frontend will send guide ID
    const guideId = req.query.guideId || 1; // Default use ID 1 guide
    
    const sql = 'SELECT * FROM schedules WHERE guide_id = ? ORDER BY date';
    
    db.query(sql, [guideId], (err, results) => {
        if (err) {
            console.error('Failed to get schedule:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to get schedule' 
            });
        }
        
        res.json({
            success: true,
            schedules: results || []
        });
    });
});

// Add guide schedule (admin interface)
app.post('/api/admin/schedules', (req, res) => {
    const { guide_id, route_name, date, meeting_point, visitors, duration, description } = req.body;
    
    // Basic validation
    if (!guide_id || !route_name || !date || !meeting_point) {
        return res.status(400).json({ 
            success: false, 
            message: 'Guide ID, route name, date, and meeting point are required' 
        });
    }
    
    const sql = `INSERT INTO schedules 
                (guide_id, route_name, date, meeting_point, visitors, duration, description) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [guide_id, route_name, date, meeting_point, visitors || 0, duration || 1.0, description || null], (err, result) => {
        if (err) {
            console.error('Failed to add schedule:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to add schedule' 
            });
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Schedule added successfully',
            scheduleId: result.insertId
        });
    });
});

// Add logout API
app.post('/api/logout', (req, res) => {
    // In a real application, we should use JWT and invalidate token
    // Since now using frontend localStorage storage, actual logout logic is done in frontend
    // This API is just to provide complete backend interface
    
    res.json({ 
        success: true, 
        message: 'Logout successful'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
