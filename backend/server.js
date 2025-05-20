const express = require('express'); // Import the Express framework
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ort = require('onnxruntime-node');
const sharp = require('sharp');

// Add nodemailer for OTP verification
const nodemailer = require('nodemailer');

const app = express(); // Create an instance of Express
const PORT = process.env.PORT || 3000; // Set the port

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads/materials');
// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB file size limit
});

// Middleware for serving uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081','http://172.17.2.9:8081','http://172.17.19.45:8081'],
  credentials: true
}));
app.use(bodyParser.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root', // Modify according to your actual configuration
  password: '', // Modify according to your actual configuration
  database: 'parkguide'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Define routes
app.get('/', (req, res) => {
  res.send('ParkGuide API Server');
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Database connection successful!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// OTP storage - in a production environment, this should be in a database
const otpStore = new Map(); // Map to store OTP codes: { email: { code: string, expiresAt: Date } }

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fyone0127@gmail.com', // Replace with your email
    pass: 'nemb pgkp crcv spbp'     // Replace with your app password or email password
  }
});

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP via email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: 'fyone0127@gmail.com', // Replace with your email
    to: email,
    subject: 'ParkGuide Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2ecc71;">ParkGuide Login Verification</h2>
        <p>Your verification code for login is:</p>
        <h1 style="font-size: 32px; letter-spacing: 2px; background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">This is an automated message, please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Login API - First stage: Email validation and OTP generation
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
    // Validate request data
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Query user from database
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        'SELECT userId, username, email, password, userRole FROM users WHERE email = ?',
        [email]
      );
      
      connection.release();
      
      // User does not exist
      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      const user = users[0];
      
      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      // Special accounts that bypass OTP verification
      const bypassOTPEmails = ['sarah@parkguide.com', 'admin@parkguide.com'];
      
      // If email is in the bypass list, skip OTP and log in directly
      if (bypassOTPEmails.includes(email.toLowerCase())) {
        // Generate user info (without password)
        const userInfo = {
          userId: user.userId,
          username: user.username,
          email: user.email,
          userRole: user.userRole
        };
        
        // Return success response for direct login
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: userInfo
        });
      }
      
      // For all other users, proceed with OTP verification
      // Password is valid, generate and send OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes
      
      // Store OTP in memory (in production, this should be in a database)
      otpStore.set(email, {
        code: otp,
        expiresAt,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          userRole: user.userRole
        }
      });
      
      // Send OTP via email
      const emailSent = await sendOTPEmail(email, otp);
      
      if (emailSent) {
        return res.status(200).json({
          success: true,
          message: 'Verification code sent to your email',
          requiresOTP: true,
          email: email
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification code. Please try again.'
        });
      }
    } catch (dbError) {
      connection.release();
      console.error('Database query error:', dbError);
      throw dbError;
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// OTP Verification API - Second stage of login
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }
    
    // Check if OTP exists for this email
    if (!otpStore.has(email)) {
      return res.status(400).json({
        success: false,
        message: 'No verification code requested for this email or code has expired'
      });
    }
    
    const otpData = otpStore.get(email);
    
    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }
    
    // Check if OTP is correct
    if (otpData.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // OTP is valid, complete login
    const userInfo = otpData.user;
    
    // Clean up OTP store
    otpStore.delete(email);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userInfo
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during verification'
    });
  }
});

// Create Certificate API
app.post('/api/createCertificates', async (req, res) => {
  try {
    const { 
      certificateName, 
      certificateType, 
      description, 
      requirements,
      userId  // ID of the user creating the certificate
    } = req.body;
    
    // Validate required fields
    if (!certificateName || !certificateType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate name and type are required' 
      });
    }
    
    // Generate a unique certificate code
    const certificateCode = 'CERT-' + Math.floor(1000 + Math.random() * 9000);
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Insert certificate into database
      const [result] = await connection.execute(
        `INSERT INTO certificates 
         (certificateCode, certificateName, certificateType, description, requirements, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [certificateCode, certificateName, certificateType, description, requirements, userId]
      );
      
      connection.release();
      
      // Return success response with the new certificate ID
      res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
        certificateId: result.insertId,
        certificateCode: certificateCode
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error creating certificate:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the certificate'
    });
  }
});

// Get All Certificates API
app.get('/api/certificates', async (req, res) => {
  try {
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query certificates
      const [certificates] = await connection.execute(
        `SELECT 
          c.certificateId,
          c.certificateCode as id,
          c.certificateName as title,
          c.certificateType as category,
          c.description,
          c.status,
          c.createdAt,
          u.username as createdBy
        FROM 
          certificates c
        LEFT JOIN 
          users u ON c.createdBy = u.userId
        ORDER BY 
          c.createdAt DESC`
      );
      
      connection.release();
      
      // Return certificates
      res.status(200).json({
        success: true,
        certificates: certificates
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching certificates:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching certificates'
    });
  }
});

// Get Single Certificate API
app.get('/api/fetchCertificates/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query certificate
      const [certificates] = await connection.execute(
        `SELECT 
          c.certificateId,
          c.certificateCode,
          c.certificateName,
          c.certificateType,
          c.description,
          c.requirements,
          c.status,
          c.createdAt,
          c.updatedAt,
          u.username as createdBy
        FROM 
          certificates c
        LEFT JOIN 
          users u ON c.createdBy = u.userId
        WHERE 
          c.certificateCode = ?`,
        [certificateId]
      );
      
      connection.release();
      
      // Certificate not found
      if (certificates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Return certificate
      res.status(200).json({
        success: true,
        certificate: certificates[0]
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching certificate:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the certificate'
    });
  }
});

// Update Certificate API
app.put('/api/updateCertificates/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    const { 
      certificateName, 
      certificateType, 
      description, 
      requirements,
      status,
      userId  // ID of the user updating the certificate
    } = req.body;
    
    // Validate required fields
    if (!certificateName || !certificateType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate name and type are required' 
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if certificate exists
      const [certificates] = await connection.execute(
        'SELECT certificateCode FROM certificates WHERE certificateCode = ?',
        [certificateId]
      );
      
      if (certificates.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Update certificate
      const [result] = await connection.execute(
        `UPDATE certificates 
         SET 
          certificateName = ?, 
          certificateType = ?, 
          description = ?, 
          requirements = ?,
          status = ?
         WHERE certificateCode = ?`,
        [certificateName, certificateType, description, requirements, status || 'Available', certificateId]
      );
      
      connection.release();
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Certificate updated successfully',
        affectedRows: result.affectedRows
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error updating certificate:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the certificate'
    });
  }
});

// Delete Certificate API
app.delete('/api/deleteCertificates/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if certificate exists
      const [certificates] = await connection.execute(
        'SELECT certificateCode FROM certificates WHERE certificateCode = ?',
        [certificateId]
      );
      
      if (certificates.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Delete certificate
      const [result] = await connection.execute(
        'DELETE FROM certificates WHERE certificateCode = ?',
        [certificateId]
      );
      
      connection.release();
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully',
        affectedRows: result.affectedRows
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error deleting certificate:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the certificate'
    });
  }
});

// Get Certificate Progress API for Park Guide
app.get('/api/certificates/:id/progress', async (req, res) => {
  try {
    const certificateId = req.params.id;
    const userId = req.query.userId; // Optional: if provided, will return user-specific progress
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // First, get the certificate details
      const [certificates] = await connection.execute(
        `SELECT 
          c.certificateId,
          c.certificateCode as id,
          c.certificateName as title,
          c.certificateType as type,
          c.description,
          c.requirements,
          c.status,
          c.createdAt,
          c.updatedAt,
          u.username as createdBy
        FROM 
          certificates c
        LEFT JOIN 
          users u ON c.createdBy = u.userId
        WHERE 
          c.certificateCode = ?`,
        [certificateId]
      );
      
      // Certificate not found
      if (certificates.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Get certificate topics
      const [topics] = await connection.execute(
        `SELECT 
          id,
          title,
          description,
          materials,
          questions
        FROM 
          certificate_topics
        WHERE 
          certificate_id = ?
        ORDER BY
          id ASC`,
        [certificateId]
      );
      
      // Get user's progress data if userId is provided
      let progress = {
        progress: 0,
        status: 'Not Started',
        topicsCompleted: 0,
        totalTopics: topics.length
      };
      
      if (userId) {
        const [progressData] = await connection.execute(
          `SELECT 
            status,
            progress_percent,
            approvalRegister_date,
            approvalCertified_date
          FROM 
            certificate_applications
          WHERE 
            user_id = ? AND certificate_id = ?`,
          [userId, certificateId]
        );
        
        if (progressData.length > 0) {
          progress = {
            progress: progressData[0].progress_percent || 0,
            status: progressData[0].status || 'Not Started',
            topicsCompleted: Math.floor((progressData[0].progress_percent / 100) * topics.length) || 0,
            totalTopics: topics.length
          };
        }
      }
      
      connection.release();
      
      // Format requirements as an array if it's a string
      let requirementsArray = certificates[0].requirements || [];
      if (typeof requirementsArray === 'string') {
        requirementsArray = certificates[0].requirements
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => line.replace(/^-\s*/, ''));
      }
      
      // Format dates
      const createdAt = certificates[0].createdAt 
        ? new Date(certificates[0].createdAt).toLocaleString()
        : new Date().toLocaleString();
        
      const updatedAt = certificates[0].updatedAt 
        ? new Date(certificates[0].updatedAt).toLocaleString()
        : createdAt;
      
      // Prepare the response object
      const response = {
        success: true,
        certificate: {
          id: certificates[0].id,
          title: certificates[0].title,
          type: certificates[0].type,
          description: certificates[0].description,
          requirements: requirementsArray,
          topics: topics,
          ...progress,
          createdBy: certificates[0].createdBy,
          createdAt: createdAt,
          updatedAt: updatedAt
        }
      };
      
      res.status(200).json(response);
      
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching certificate progress:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching certificate progress:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching certificate progress'
    });
  }
});

// Simple middleware for authentication
// In a production environment, you would use JWT or another token system
function authenticateToken(req, res, next) {
  // For development purposes, we're just allowing all requests
  // In production, you would verify a JWT token here
  
  
  // You can uncomment this to implement actual authentication later
  /*
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    req.user = user;
    next();
  });
  */
  
  // For now, just proceed
  next();
}
// API endpoint to create a topic
app.post('/api/certificates/:id/topics', authenticateToken, async (req, res) => {
  try {
    const certificateId = req.params.id;
    const { title, description } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Topic title is required'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Validate if certificate ID exists
      const [certificateResults] = await connection.execute(
        'SELECT * FROM certificates WHERE certificateCode = ?',
        [certificateId]
      );
      
      if (certificateResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Insert new topic
      const topicData = {
        certificate_id: certificateId,
        title: title,
        description: description || null,
        materials: 0,
        questions: 0
      };
      
      const [result] = await connection.execute(
        'INSERT INTO certificate_topics SET certificate_id = ?, title = ?, description = ?, materials = ?, questions = ?',
        [certificateId, title, description || null, 0, 0]
      );
      
      connection.release();
      
      // Get the ID of the newly inserted topic
      const topicId = result.insertId;
      
      // Return the created topic data
      const createdTopic = {
        id: topicId,
        certificateId: certificateId,
        title: title,
        description: description || '',
        materials: 0,
        questions: 0
      };
      
      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        topic: createdTopic
      });
    } catch (dbError) {
      connection.release();
      console.error('Error creating topic:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create topic'
    });
  }
});

// Get all topics of a certificate
app.get('/api/certificates/:id/topics', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get the list of topics
      const [results] = await connection.execute(
        'SELECT * FROM certificate_topics WHERE certificate_id = ? ORDER BY id',
        [certificateId]
      );
      
      connection.release();
      
      // Format the topic data
      const topics = results.map(topic => ({
        id: topic.id,
        certificateId: topic.certificate_id,
        title: topic.title,
        description: topic.description || '',
        materials: topic.materials,
        questions: topic.questions,
        createdAt: topic.created_at,
        updatedAt: topic.updated_at
      }));
      
      res.json({
        success: true,
        topics: topics
      });
    } catch (dbError) {
      connection.release();
      console.error('Error fetching topics:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics'
    });
  }
});

// Get a single topic by ID
app.get('/api/topics/:id', async (req, res) => {
  try {
    const topicId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get the topic details
      const [topicResults] = await connection.execute(
        `SELECT t.*, c.certificateName, c.certificateCode
         FROM certificate_topics t
         JOIN certificates c ON t.certificate_id = c.certificateCode
         WHERE t.id = ?`,
        [topicId]
      );
      
      if (topicResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }
      
      const topicData = topicResults[0];
      
      // Get the materials for this topic
      const [materialResults] = await connection.execute(
        'SELECT * FROM topic_materials WHERE topic_id = ? ORDER BY upload_date DESC',
        [topicId]
      );
      
      // Format the materials data if any exist
      const materials = materialResults.map(material => ({
        id: material.id,
        title: material.filename,
        size: material.filesize,
        type: material.filetype,
        uploadDate: material.upload_date
      }));
      
      // Get the quiz data
      const [quizResults] = await connection.execute(
        'SELECT * FROM quizzes WHERE topic_id = ?',
        [topicId]
      );
      
      let quiz = null;
      if (quizResults.length > 0) {
        quiz = {
          title: quizResults[0].title,
          questionCount: 0,
          passingScore: quizResults[0].passing_score + '%',
          timeLimit: quizResults[0].time_limit
        };
        
        // Get question count
        const [countResults] = await connection.execute(
          'SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?',
          [quizResults[0].id]
        );
        
        quiz.questionCount = countResults[0].count;
      }
      
      // Format the response
      const topic = {
        id: topicData.id,
        title: topicData.title,
        certification: topicData.certificateName,
        certificationLink: `/admin/certificate/${topicData.certificateCode}`,
        description: topicData.description || '',
        materials: materials.length > 0 ? materials : [],
        quiz: quiz
      };
      
      connection.release();
      
      // Return the topic data
      res.json({
        success: true,
        topic: topic
      });
    } catch (dbError) {
      connection.release();
      console.error('Error fetching topic:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topic'
    });
  }
});

// Upload materials for a topic
app.post('/api/topics/:id/materials', upload.single('file'), async (req, res) => {
  try {
    const topicId = req.params.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Get file details
    const filename = file.originalname;
    const filepath = file.path.replace(/\\/g, '/');
    const filesize = formatFileSize(file.size);
    const filetype = getFileType(file.originalname);
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Verify if topic exists
      const [topicResults] = await connection.execute(
        'SELECT * FROM certificate_topics WHERE id = ?',
        [topicId]
      );
      
      if (topicResults.length === 0) {
        connection.release();
        // Delete the uploaded file as topic doesn't exist
        fs.unlinkSync(file.path);
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }
      
      // Save material details to database
      const [result] = await connection.execute(
        'INSERT INTO topic_materials (topic_id, filename, filepath, filesize, filetype) VALUES (?, ?, ?, ?, ?)',
        [topicId, filename, filepath, filesize, filetype]
      );
      
      // Update materials count for the topic
      await connection.execute(
        'UPDATE certificate_topics SET materials = materials + 1 WHERE id = ?',
        [topicId]
      );
      
      connection.release();
      
      // Return success with material details
      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        material: {
          id: result.insertId,
          title: filename,
          size: filesize,
          type: filetype,
          uploadDate: new Date()
        }
      });
    } catch (dbError) {
      connection.release();
      // Delete the uploaded file as database operation failed
      fs.unlinkSync(file.path);
      console.error('Error saving material:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload material'
    });
  }
});

// Delete a topic material
app.delete('/api/materials/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get material details first to find file path
      const [materialResults] = await connection.execute(
        'SELECT * FROM topic_materials WHERE id = ?',
        [materialId]
      );
      
      if (materialResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }
      
      const material = materialResults[0];
      const topicId = material.topic_id;
      const filepath = material.filepath;
      
      // Delete the record from database
      await connection.execute(
        'DELETE FROM topic_materials WHERE id = ?',
        [materialId]
      );
      
      // Update materials count for the topic
      await connection.execute(
        'UPDATE certificate_topics SET materials = materials - 1 WHERE id = ?',
        [topicId]
      );
      
      connection.release();
      
      // Try to delete the physical file
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue execution even if file deletion fails
      }
      
      // Return success
      res.json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (dbError) {
      connection.release();
      console.error('Error deleting material:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material'
    });
  }
});

// Download a material file
app.get('/api/materials/:id/download', async (req, res) => {
  try {
    const materialId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get material details
      const [materialResults] = await connection.execute(
        'SELECT * FROM topic_materials WHERE id = ?',
        [materialId]
      );
      
      if (materialResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }
      
      const material = materialResults[0];
      const filename = material.filename;
      const filepath = material.filepath;
      
      connection.release();
      
      // Check if file exists
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file to client
      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (dbError) {
      connection.release();
      console.error('Error fetching material details:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download material'
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
}

// Helper function to determine file type
function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();
  
  if (['.pdf', '.doc', '.docx', '.txt'].includes(extension)) return 'pdf';
  else if (['.mp4', '.mov', '.avi', '.wmv'].includes(extension)) return 'video';
  else if (['.ppt', '.pptx'].includes(extension)) return 'presentation';
  else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) return 'image';
  else return 'other';
}

// Get the quiz data of a topic
app.get('/api/topics/:id/quiz', async (req, res) => {
  try {
    const topicId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get the quiz of the topic
      const [quizResults] = await connection.execute(
        'SELECT * FROM quizzes WHERE topic_id = ?',
        [topicId]
      );
      
      if (quizResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Quiz not found for this topic'
        });
      }
      
      const quiz = quizResults[0];
      
      // Get the questions of the quiz
      const [questionResults] = await connection.execute(
        'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num',
        [quiz.id]
      );
      
      // Get the options of each question
      const questions = [];
      for (const question of questionResults) {
        const [optionResults] = await connection.execute(
          'SELECT * FROM question_options WHERE question_id = ? ORDER BY option_id',
          [question.id]
        );
        
        const options = optionResults.map(option => ({
          id: option.option_id,
          text: option.text,
          isCorrect: option.is_correct === 1
        }));
        
        questions.push({
          id: question.id,
          text: question.text,
          type: question.type,
          options: options
        });
      }
      
      // Build the complete quiz data
      const quizData = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passing_score,
        timeLimit: quiz.time_limit,
        questions: questions
      };
      
      connection.release();
      
      // Return the quiz data
      res.json({
        success: true,
        quiz: quizData
      });
    } catch (dbError) {
      connection.release();
      console.error('Error fetching quiz data:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz data'
    });
  }
});

// Update the quiz data of a topic
app.put('/api/topics/:id/quiz', async (req, res) => {
  try {
    const topicId = req.params.id;
    const { id, title, description, passingScore, timeLimit, questions } = req.body;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Start a transaction
      await connection.beginTransaction();
      
      // Update the basic information of the quiz
      await connection.execute(
        'UPDATE quizzes SET title = ?, description = ?, passing_score = ?, time_limit = ? WHERE id = ? AND topic_id = ?',
        [title, description, passingScore, timeLimit, id, topicId]
      );
      
      // First delete all existing questions and options (cascade delete will delete options)
      await connection.execute(
        'DELETE FROM quiz_questions WHERE quiz_id = ?',
        [id]
      );
      
      // Add new questions and options
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Add the question
        const [questionResult] = await connection.execute(
          'INSERT INTO quiz_questions (quiz_id, text, type, order_num) VALUES (?, ?, ?, ?)',
          [id, question.text, question.type, i + 1]
        );
        
        const questionId = questionResult.insertId;
        
        // Add the options
        for (const option of question.options) {
          await connection.execute(
            'INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?)',
            [questionId, option.id, option.text, option.isCorrect ? 1 : 0]
          );
        }
      }
      
      // Commit the transaction
      await connection.commit();
      
      // Release the connection
      connection.release();
      
      // Return success
      res.json({
        success: true,
        message: 'Quiz updated successfully'
      });
    } catch (dbError) {
      // An error occurred, roll back the transaction
      await connection.rollback();
      connection.release();
      console.error('Error updating quiz:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz data'
    });
  }
});

// Only update the quiz settings
app.patch('/api/topics/:id/quiz/settings', async (req, res) => {
  try {
    const topicId = req.params.id;
    const { id, title, description, passingScore, timeLimit } = req.body;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if the quiz exists
      const [quizResults] = await connection.execute(
        'SELECT * FROM quizzes WHERE id = ? AND topic_id = ?',
        [id, topicId]
      );
      
      if (quizResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Quiz not found for this topic'
        });
      }
      
      // Update the basic information of the quiz
      await connection.execute(
        'UPDATE quizzes SET title = ?, description = ?, passing_score = ?, time_limit = ? WHERE id = ? AND topic_id = ?',
        [title, description, passingScore, timeLimit, id, topicId]
      );
      
      connection.release();
      
      // Return success
      res.json({
        success: true,
        message: 'Quiz settings updated successfully'
      });
    } catch (dbError) {
      connection.release();
      console.error('Error updating quiz settings:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating quiz settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz settings'
    });
  }
});

// Create a new quiz
app.post('/api/topics/:id/quiz', async (req, res) => {
  try {
    const topicId = req.params.id;
    const { title, description, passingScore, timeLimit } = req.body;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if the topic exists
      const [topicResults] = await connection.execute(
        'SELECT * FROM certificate_topics WHERE id = ?',
        [topicId]
      );
      
      if (topicResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }
      
      // Check if the topic already has a quiz
      const [quizResults] = await connection.execute(
        'SELECT * FROM quizzes WHERE topic_id = ?',
        [topicId]
      );
      
      if (quizResults.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'A quiz already exists for this topic'
        });
      }
      
      // Create a new quiz
      const [result] = await connection.execute(
        'INSERT INTO quizzes (topic_id, title, description, passing_score, time_limit) VALUES (?, ?, ?, ?, ?)',
        [topicId, title, description, passingScore, timeLimit]
      );
      
      // Get the ID of the newly created quiz
      const quizId = result.insertId;
      
      // Update the question count of the topic
      await connection.execute(
        'UPDATE certificate_topics SET questions = 0 WHERE id = ?',
        [topicId]
      );
      
      connection.release();
      
      // Return success and the new quiz data
      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        quiz: {
          id: quizId,
          title: title,
          description: description,
          passingScore: passingScore,
          timeLimit: timeLimit,
          questions: []
        }
      });
    } catch (dbError) {
      connection.release();
      console.error('Error creating quiz:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    });
  }
});

// Delete a quiz question
app.delete('/api/topics/:topicId/quiz/questions/:questionId', async (req, res) => {
  try {
    const { topicId, questionId } = req.params;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if the question exists
      const [questionResults] = await connection.execute(
        'SELECT q.* FROM quiz_questions q JOIN quizzes qz ON q.quiz_id = qz.id WHERE q.id = ? AND qz.topic_id = ?',
        [questionId, topicId]
      );
      
      if (questionResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      // Get the quiz id for this question
      const quizId = questionResults[0].quiz_id;
      
      // Delete the question (cascade will also delete options)
      await connection.execute(
        'DELETE FROM quiz_questions WHERE id = ?',
        [questionId]
      );
      
      // Update question count in topics table
      const [countResults] = await connection.execute(
        'SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?',
        [quizId]
      );
      
      const questionCount = countResults[0].count;
      
      await connection.execute(
        'UPDATE certificate_topics t JOIN quizzes q ON t.id = q.topic_id SET t.questions = ? WHERE q.id = ?',
        [questionCount, quizId]
      );
      
      connection.release();
      
      // Return success
      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (dbError) {
      connection.release();
      console.error('Error deleting question:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
});

// Edit a quiz question
app.patch('/api/topics/:topicId/quiz/questions/:questionId', async (req, res) => {
  try {
    const { topicId, questionId } = req.params;
    const { text, type, options } = req.body;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Check if the question exists
      const [questionResults] = await connection.execute(
        'SELECT q.* FROM quiz_questions q JOIN quizzes qz ON q.quiz_id = qz.id WHERE q.id = ? AND qz.topic_id = ?',
        [questionId, topicId]
      );
      
      if (questionResults.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      // Get the quiz id for this question
      const quizId = questionResults[0].quiz_id;
      const orderNum = questionResults[0].order_num;
      
      // Update the question
      await connection.execute(
        'UPDATE quiz_questions SET text = ?, type = ? WHERE id = ?',
        [text, type, questionId]
      );
      
      // Delete existing options for this question
      await connection.execute(
        'DELETE FROM question_options WHERE question_id = ?',
        [questionId]
      );
      
      // Add new options
      for (const option of options) {
        await connection.execute(
          'INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, option.id, option.text, option.isCorrect ? 1 : 0]
        );
      }
      
      // Commit the transaction
      await connection.commit();
      
      connection.release();
      
      // Return success with updated question data
      res.json({
        success: true,
        message: 'Question updated successfully',
        question: {
          id: parseInt(questionId),
          text,
          type,
          options
        }
      });
    } catch (dbError) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      console.error('Error updating question:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
});

// Add a new quiz question
app.post('/api/topics/:topicId/quiz/questions', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { quizId, text, type, options } = req.body;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Check if the quiz exists
      const [quizResults] = await connection.execute(
        'SELECT q.* FROM quizzes q WHERE q.id = ? AND q.topic_id = ?',
        [quizId, topicId]
      );
      
      if (quizResults.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }
      
      // Get the current max order number
      const [orderResults] = await connection.execute(
        'SELECT MAX(order_num) as maxOrder FROM quiz_questions WHERE quiz_id = ?',
        [quizId]
      );
      
      const orderNum = (orderResults[0].maxOrder || 0) + 1;
      
      // Add the new question
      const [questionResult] = await connection.execute(
        'INSERT INTO quiz_questions (quiz_id, text, type, order_num) VALUES (?, ?, ?, ?)',
        [quizId, text, type, orderNum]
      );
      
      const questionId = questionResult.insertId;
      
      // Add the options
      for (const option of options) {
        await connection.execute(
          'INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, option.id, option.text, option.isCorrect ? 1 : 0]
        );
      }
      
      // Update question count in topics table
      const [countResults] = await connection.execute(
        'SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?',
        [quizId]
      );
      
      const questionCount = countResults[0].count;
      
      await connection.execute(
        'UPDATE certificate_topics SET questions = ? WHERE id = ?',
        [questionCount, topicId]
      );
      
      // Commit the transaction
      await connection.commit();
      
      connection.release();
      
      // Return success with new question data
      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        question: {
          id: questionId,
          text,
          type,
          options
        }
      });
    } catch (dbError) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      console.error('Error adding question:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question'
    });
  }
});

// Get Available Certificates API
app.get('/api/certificates/available', async (req, res) => {
  try {
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query only available certificates
      const [certificates] = await connection.execute(
        `SELECT 
          c.certificateId,
          c.certificateCode as id,
          c.certificateName as title,
          c.certificateType as category,
          c.description,
          c.status,
          c.createdAt,
          u.username as createdBy,
          c.requirements
        FROM 
          certificates c
        LEFT JOIN 
          users u ON c.createdBy = u.userId
        WHERE
          c.status = 'Available'
        ORDER BY 
          c.createdAt DESC`
      );
      
      connection.release();
      
      // Transform data format to match frontend expectations
      const formattedCertificates = certificates.map(cert => ({
        id: cert.id,
        title: cert.title,
        type: cert.category,
        status: cert.status,
        description: cert.description,
        duration: '6 months', // Default value or could be calculated based on requirements
        difficulty: cert.requirements ? 'Advanced' : 'Basic' // Simplified difficulty determination
      }));
      
      // Return certificates
      res.status(200).json({
        success: true,
        certificates: formattedCertificates
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching available certificates:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching available certificates:', error);
    res.status(500).json({
      success: false,
      message: '获取可用证书时发生错误'
    });
  }
});

// Create Certificate Application API
app.post('/api/certificate-applications', async (req, res) => {
  try {
    const { userId, certificateId } = req.body;
    
    // Validate required fields
    if (!userId || !certificateId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Certificate ID are required'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if certificate exists
      const [certResults] = await connection.execute(
        'SELECT * FROM certificates WHERE certificateCode = ?',
        [certificateId]
      );
      
      if (certResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      // Check if user exists
      const [userResults] = await connection.execute(
        'SELECT * FROM users WHERE userId = ?',
        [userId]
      );
      
      if (userResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if application already exists
      const [appResults] = await connection.execute(
        'SELECT * FROM certificate_applications WHERE user_id = ? AND certificate_id = ? AND status != "Rejected"',
        [userId, certificateId]
      );
      
      if (appResults.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Application already exists for this certificate'
        });
      }
      
      // 检查是否有被拒绝的申请
      const [rejectedAppResults] = await connection.execute(
        'SELECT * FROM certificate_applications WHERE user_id = ? AND certificate_id = ? AND status = "Rejected"',
        [userId, certificateId]
      );
      
      if (rejectedAppResults.length > 0) {
        // 如果有被拒绝的申请，更新它的状态而不是创建新记录
        await connection.execute(
          'UPDATE certificate_applications SET status = "Pending for Registration", application_date = NOW() WHERE user_id = ? AND certificate_id = ?',
          [userId, certificateId]
        );
        
        connection.release();
        
        // 返回成功响应
        res.status(200).json({
          success: true,
          message: 'Application resubmitted successfully',
          applicationId: rejectedAppResults[0].application_id
        });
        return;
      }
      
      // Insert new application with status 'Pending for Registration'
      const [result] = await connection.execute(
        'INSERT INTO certificate_applications (user_id, certificate_id, status) VALUES (?, ?, ?)',
        [userId, certificateId, 'Pending for Registration']
      );
      
      connection.release();
      
      // Return success response with the new application ID
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        applicationId: result.insertId
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error creating application:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting the application'
    });
  }
});

// Get User's Pending Applications API
app.get('/api/users/:userId/certificate-applications', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Modify the default value to allow querying all types of applications, if not specified, then get all pending types
    const status = req.query.status || null; 
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Construct query conditions
      let whereClause = 'a.user_id = ?';
      let queryParams = [userId];
      
      if (status) {
        whereClause += ' AND a.status = ?';
        queryParams.push(status);
      } else {
        // If not specified, default to getting all pending types of applications
        whereClause += ' AND a.status IN ("Pending", "Pending for Registration", "Pending for Certified")';
      }
      
      // Query applications with certificate details
      const [applications] = await connection.execute(
        `SELECT 
          a.application_id,
          a.certificate_id as id,
          a.status,
          a.application_date,
          c.certificateName as title,
          c.certificateType as type,
          c.description
        FROM 
          certificate_applications a
        JOIN 
          certificates c ON a.certificate_id = c.certificateCode
        WHERE 
          ${whereClause}
        ORDER BY 
          a.application_date DESC`,
        queryParams
      );
      
      // Format the application data for frontend with individual progress calculation
      const formattedApplications = [];
      
      for (const app of applications) {
        const certificateId = app.id;
        
        // Get total topics for this certificate
        const [totalTopicsResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM certificate_topics WHERE certificate_id = ?',
          [certificateId]
        );
        
        // Get completed topics for this user and certificate
        const [completedTopicsResult] = await connection.execute(
          `SELECT COUNT(*) as completed 
           FROM quiz_attempts qa 
           JOIN certificate_topics ct ON qa.topic_id = ct.id
           WHERE qa.user_id = ? 
           AND ct.certificate_id = ? 
           AND qa.passed = 1`,
          [userId, certificateId]
        );
        
        const totalTopics = totalTopicsResult[0].total || 1; // Avoid dividing by zero
        const completedTopics = completedTopicsResult[0].completed || 0;
        
        // Calculate the progress percentage for this certificate
        const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        formattedApplications.push({
          id: app.id,
          title: app.title,
          type: app.type,
          description: app.description,
          status: app.status,
          progress: progressPercent,
          appliedOn: new Date(app.application_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          estimatedReviewTime: '3-5 business days'
        });
      }

      connection.release();
      
      // Return applications
      res.status(200).json({
        success: true,
        applications: formattedApplications
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching applications:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching applications'
    });
  }
});

// Get Certificate Applications API (For Admin)
app.get('/api/certificate-applications', async (req, res) => {
  try {
    const { status, statusCategory } = req.query;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Build query conditions
      let whereClause = '1=1'; // Default condition
      let params = [];
      
      if (status) {
        // Filter by specific status
        whereClause += ' AND ca.status = ?';
        params.push(status);
      } else if (statusCategory === 'pending') {
        // Get all applications of pending type
        whereClause += " AND ca.status LIKE 'Pending%'";
      }
      
      // Query applications with certificate details and user information
      const [applications] = await connection.execute(
        `SELECT 
          ca.application_id,
          ca.user_id,
          ca.certificate_id,
          ca.status,
          ca.application_date,
          ca.approvalRegister_date,
          ca.approvalCertified_date,
          ca.progress_percent,
          u.username,
          c.certificateName as title,
          c.certificateType as type,
          c.description
        FROM 
          certificate_applications ca
        JOIN 
          certificates c ON ca.certificate_id = c.certificateCode
        JOIN 
          users u ON ca.user_id = u.userId
        WHERE 
          ${whereClause}
        ORDER BY 
          ca.application_date DESC`,
        params
      );
      
      connection.release();
      
      // Format application data for frontend
      const formattedApplications = applications.map(app => ({
        application_id: app.application_id,
        user_id: app.user_id,
        certificate_id: app.certificate_id,
        status: app.status,
        progress: app.progress_percent,
        title: app.title,
        type: app.type,
        description: app.description,
        username: app.username,
        appliedOn: new Date(app.application_date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        approvedRegisterOn: app.approvalRegister_date ? 
          new Date(app.approvalRegister_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : null,
        approvedCertifiedOn: app.approvalCertified_date ? 
          new Date(app.approvalCertified_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : null
      }));
      
      // Return applications
      res.status(200).json({
        success: true,
        applications: formattedApplications
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching applications:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching applications'
    });
  }
});

// Update Certificate Application Status API (For Admin)
app.patch('/api/certificate-applications/:id/status', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Validate status value
    if (!['Pending', 'Pending for Registration', 'In Progress', 'Pending for Certified', 'Rejected', 'Certified'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if application exists
      const [appResults] = await connection.execute(
        'SELECT * FROM certificate_applications WHERE application_id = ?',
        [applicationId]
      );
      
      if (appResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      const currentApp = appResults[0];
      

      // console.log('Current application status:', currentApp.status);
      // console.log('New status:', status);
      // console.log('Status condition check:', 
      //            status === 'Certified' && 
      //            (currentApp.status === 'In Progress' || currentApp.status === 'Pending for Certified'));
      
      // Set appropriate date field based on new status
      let dateFields = {};
      

      function formatDateForMySQL(date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (status === 'In Progress' && 
         (currentApp.status === 'Pending' || currentApp.status === 'Pending for Registration')) {
        dateFields = { approvalRegister_date: formatDateForMySQL(new Date()) };
      } else if (status === 'Certified' && 
                (currentApp.status.toLowerCase() === 'in progress' || 
                 currentApp.status.toLowerCase() === 'pending for certified')) {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 1095 * 24 * 60 * 60 * 1000); // 3 years from now
        
        dateFields = { 
          approvalCertified_date: formatDateForMySQL(now),
          expiry_date: formatDateForMySQL(expiryDate)
        };
      }

      // console.log('Formatted approval date:', dateFields.approvalCertified_date);
      // console.log('Formatted expiry date:', dateFields.expiry_date);
      
      // Build SQL query dynamically based on which fields to update
      let setClause = 'status = ?';
      let params = [status];
      
      if (dateFields.approvalRegister_date) {
        setClause += ', approvalRegister_date = ?';
        params.push(dateFields.approvalRegister_date);
      }
      
      if (dateFields.approvalCertified_date) {
        setClause += ', approvalCertified_date = ?';
        params.push(dateFields.approvalCertified_date);
      }
      
      if (dateFields.expiry_date) {
        setClause += ', expiry_date = ?';
        params.push(dateFields.expiry_date);
      }
      
      params.push(applicationId);
      

      // console.log('SQL query:', `UPDATE certificate_applications SET ${setClause} WHERE application_id = ?`);
      // console.log('SQL parameters:', params);
      
      // Update application
      const [result] = await connection.execute(
        `UPDATE certificate_applications SET ${setClause} WHERE application_id = ?`,
        params
      );
      
      connection.release();
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Application status updated successfully',
        affectedRows: result.affectedRows
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error updating application status:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating application status'
    });
  }
});

// API to get user's quiz attempts for a topic
app.get('/api/users/:userId/topics/:topicId/quiz-attempts', async (req, res) => {
  try {
    const { userId, topicId } = req.params;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get the quiz attempts for this user and topic
      const [attemptResults] = await connection.execute(
        `SELECT 
          qa.id,
          qa.score,
          qa.passing_score,
          qa.passed,
          qa.time_spent,
          qa.attempt_time,
          qa.answers
        FROM 
          quiz_attempts qa
        WHERE 
          qa.user_id = ? AND qa.topic_id = ?
        ORDER BY 
          qa.attempt_time DESC`,
        [userId, topicId]
      );
      
      connection.release();
      
      res.json({
        success: true,
        attempts: attemptResults.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          passingScore: attempt.passing_score,
          passed: !!attempt.passed,
          timeSpent: attempt.time_spent,
          attemptDate: attempt.attempt_time,
          // Parse the answers JSON if it exists
          detailedResults: attempt.answers ? 
            JSON.parse(attempt.answers) : null
        }))
      });
      
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching quiz attempts:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching quiz attempts'
    });
  }
});


// Handle quiz attempt submission
app.post('/api/quiz-attempts', async (req, res) => {
  try {
    const { userId, topicId, answers, timeSpent } = req.body;
    
    // Validate required fields
    if (!userId || !topicId || !answers || timeSpent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Get quiz data for the topic
      const [quizResults] = await connection.execute(
        'SELECT * FROM quizzes WHERE topic_id = ?',
        [topicId]
      );
      
      if (quizResults.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Quiz not found for this topic'
        });
      }
      
      const quiz = quizResults[0];
      const passingScore = quiz.passing_score;
      
      // Get questions with correct answers
      const [questionResults] = await connection.execute(
        `SELECT q.id, q.text, q.type, 
          (SELECT GROUP_CONCAT(o.option_id) 
           FROM question_options o 
           WHERE o.question_id = q.id AND o.is_correct = 1) as correct_answers
        FROM quiz_questions q 
        WHERE q.quiz_id = ?`,
        [quiz.id]
      );
      
      // Calculate score
      let correctCount = 0;
      const detailedResults = [];
      
      for (const question of questionResults) {
        const questionId = question.id;
        const correctAnswers = question.correct_answers.split(',').map(id => parseInt(id));
        const userAnswer = answers.find(a => a.questionId === questionId);
        let isCorrect = false;
        let reason = "";
        
        const userAnswerIds = userAnswer ? userAnswer.answer.filter(a => a !== null) : [];
        
        // Get option texts for correct answers
        const [correctOptionsResult] = await connection.execute(
          `SELECT option_id, text FROM question_options 
           WHERE question_id = ? AND is_correct = 1`,
          [questionId]
        );
        
        const correctOptionsMap = {};
        correctOptionsResult.forEach(opt => {
          correctOptionsMap[opt.option_id] = opt.text;
        });
        
        // Get option texts for user answers
        const userAnswerTexts = [];
        if (userAnswerIds.length > 0) {
          const placeholders = userAnswerIds.map(() => '?').join(',');
          const [userOptionsResult] = await connection.execute(
            `SELECT option_id, text FROM question_options 
             WHERE question_id = ? AND option_id IN (${placeholders})`,
            [questionId, ...userAnswerIds]
          );
          
          userOptionsResult.forEach(opt => {
            userAnswerTexts.push(opt.text);
          });
        }
        
        // For single choice, only one correct answer
        if (question.type === 'single') {
          if (userAnswerIds.length === 1) {
            // 检查用户选择的答案是否与正确答案ID匹配
            if (correctAnswers.includes(userAnswerIds[0])) {
              correctCount++;
              isCorrect = true;
              reason = "Your answer is correct.";
            } else {
              // 检查用户选择的答案文本是否与正确答案文本匹配
              const userText = userAnswerTexts.length > 0 ? userAnswerTexts[0] : '';
              const correctText = Object.values(correctOptionsMap).length > 0 ? Object.values(correctOptionsMap)[0] : '';
              
              if (userText && correctText && userText.trim() === correctText.trim()) {
                correctCount++;
                isCorrect = true;
                reason = "Your answer is correct.";
              } else {
                reason = "Your answer is incorrect.";
              }
            }
          } else if (userAnswerIds.length === 0) {
            reason = "You did not provide an answer.";
          } else {
            reason = "Your answer is incorrect.";
          }
        } 
        // For multiple choice, all selected must be correct and all correct must be selected
        else if (question.type === 'multiple') {
          // 先检查ID是否完全匹配
          if (
            userAnswerIds.length === correctAnswers.length &&
            userAnswerIds.every(id => correctAnswers.includes(id))
          ) {
            correctCount++;
            isCorrect = true;
            reason = "Your answer is correct.";
          } 
          // 检查文本内容是否匹配
          else if (
            userAnswerTexts.length === Object.values(correctOptionsMap).length &&
            userAnswerTexts.every(text => 
              Object.values(correctOptionsMap).some(correctText => 
                correctText.trim() === text.trim()
              )
            )
          ) {
            correctCount++;
            isCorrect = true;
            reason = "Your answer is correct.";
          } else if (userAnswerIds.length === 0) {
            reason = "You did not provide an answer.";
          } else if (userAnswerIds.some(id => !correctAnswers.includes(id))) {
            reason = "You selected some incorrect options.";
          } else {
            reason = "You missed some correct options.";
          }
        }
        
        // Add to detailed results
        detailedResults.push({
          questionId: questionId,
          isCorrect: isCorrect,
          userAnswers: userAnswerIds,
          userAnswerTexts: userAnswerTexts,
          correctAnswers: correctAnswers,
          correctAnswerTexts: Object.values(correctOptionsMap),
          reason: reason
        });
      }
      
      const totalQuestions = questionResults.length;
      const score = totalQuestions > 0 
        ? Math.round((correctCount / totalQuestions) * 100) 
        : 0;
      
      const passed = score >= passingScore;
      
      // Check if user already has an attempt for this topic
      const [existingAttempts] = await connection.execute(
        'SELECT * FROM quiz_attempts WHERE user_id = ? AND topic_id = ?',
        [userId, topicId]
      );
      
      if (existingAttempts.length > 0) {
        const existingAttempt = existingAttempts[0];
        
        // Only update if previous attempt failed or this attempt passed
        if (!existingAttempt.passed || passed) {
          // Update existing record
          await connection.execute(
            `UPDATE quiz_attempts 
             SET score = ?, passing_score = ?, passed = ?, time_spent = ?, answers = ?
             WHERE user_id = ? AND topic_id = ?`,
            [
              score,
              passingScore,
              passed ? 1 : 0,
              timeSpent,
              JSON.stringify(answers),
              userId,
              topicId
            ]
          );
        }
      } else {
        // Insert new record
        await connection.execute(
          `INSERT INTO quiz_attempts 
           (user_id, topic_id, score, passing_score, passed, time_spent, answers)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            topicId,
            score,
            passingScore,
            passed ? 1 : 0,
            timeSpent,
            JSON.stringify(answers)
          ]
        );
      }
      
      // If passed, update user's progress in certificate
      if (passed) {
        // Get certificate ID for this topic
        const [topicResults] = await connection.execute(
          'SELECT certificate_id FROM certificate_topics WHERE id = ?',
          [topicId]
        );
        
        if (topicResults.length > 0) {
          const certificateId = topicResults[0].certificate_id;
          
          // Get total topics for this certificate
          const [totalTopicsResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM certificate_topics WHERE certificate_id = ?',
            [certificateId]
          );
          
          // Get completed topics for this user and certificate
          const [completedTopicsResult] = await connection.execute(
            `SELECT COUNT(*) as completed 
             FROM quiz_attempts qa 
             JOIN certificate_topics ct ON qa.topic_id = ct.id
             WHERE qa.user_id = ? 
             AND ct.certificate_id = ? 
             AND qa.passed = 1`,
            [userId, certificateId]
          );
          
          const totalTopics = totalTopicsResult[0].total;
          const completedTopics = completedTopicsResult[0].completed;
          
          // Calculate progress percentage
          const progressPercent = Math.round((completedTopics / totalTopics) * 100);
          
          // Update application progress
          await connection.execute(
            `UPDATE certificate_applications 
             SET progress_percent = ? 
             WHERE user_id = ? AND certificate_id = ?`,
            [progressPercent, userId, certificateId]
          );
        }
      }
      
      // Commit the transaction
      await connection.commit();
      
      connection.release();
      
      // Return results to client
      res.status(200).json({
        success: true,
        message: passed ? 'Quiz passed successfully!' : 'Quiz completed.',
        results: {
          passed,
          score,
          passingScore,
          correctCount,
          totalQuestions,
          timeSpent,
          correctPercentage: totalQuestions > 0 
            ? Math.round((correctCount / totalQuestions) * 100) 
            : 0,
          detailedResults: detailedResults
        }
      });
      
    } catch (dbError) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      console.error('Database error submitting quiz attempt:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your quiz attempt'
    });
  }
});

// Apply for certified status (when user completes all topics)
app.post('/api/certificate-applications/certified', async (req, res) => {
  try {
    const { userId, certificateId } = req.body;
    
    if (!userId || !certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and certificateId are required'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Check if the application exists and is in "In Progress" status
      const [applications] = await connection.execute(
        `SELECT * FROM certificate_applications 
         WHERE user_id = ? AND certificate_id = ? AND status = 'In Progress'`,
        [userId, certificateId]
      );
      
      if (applications.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active application found or application is not in progress'
        });
      }
      
      // Check if progress is 100%
      if (applications[0].progress_percent < 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot apply for certification until all topics are completed'
        });
      }
      
      // Update application status to "Pending for Certified" instead of directly to "Certified"
      await connection.execute(
        `UPDATE certificate_applications 
         SET status = 'Pending for Certified'
         WHERE user_id = ? AND certificate_id = ?`,
        [userId, certificateId]
      );
      
      // Commit transaction
      await connection.commit();
      
      // Return success
      res.status(200).json({
        success: true,
        message: 'Certificate application submitted for review'
      });
      
    } catch (dbError) {
      // Rollback in case of error
      await connection.rollback();
      connection.release();
      console.error('Database error processing certification application:', dbError);
      throw dbError;
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('Error processing certification application:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your certification application'
    });
  }
});
// Add API endpoint - Renew expired certificates
app.post('/api/certificate-applications/:certificateId/renew', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { userId } = req.body;
    
    if (!userId || !certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and certificateId are required'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Check if certificate application exists and its status is "Expired"
      const [applications] = await connection.execute(
        `SELECT * FROM certificate_applications 
         WHERE user_id = ? AND certificate_id = ? AND status = 'Expired'`,
        [userId, certificateId]
      );
      
      if (applications.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'No expired certificate found'
        });
      }
      
      // Update application status to "Pending for Certified"
      await connection.execute(
        `UPDATE certificate_applications 
         SET status = 'Pending for Certified'
         WHERE user_id = ? AND certificate_id = ?`,
        [userId, certificateId]
      );
      
      // Commit transaction
      await connection.commit();
      
      // Return success
      res.status(200).json({
        success: true,
        message: 'Certificate renewal application submitted for review'
      });
      
    } catch (dbError) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      console.error('Database error processing certificate renewal:', dbError);
      throw dbError;
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('Error processing certificate renewal:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your certificate renewal'
    });
  }
});

// Get User's Certified Certificates API
app.get('/api/users/:userId/certified-certificates', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query applications with certificate details that are in Certified status
      const [applications] = await connection.execute(
        `SELECT 
          a.application_id,
          a.certificate_id as id,
          a.status,
          a.application_date,
          a.approvalCertified_date,
          a.expiry_date,
          c.certificateName as title,
          c.certificateType as type,
          c.description
        FROM 
          certificate_applications a
        JOIN 
          certificates c ON a.certificate_id = c.certificateCode
        WHERE 
          a.user_id = ? AND (a.status = 'Certified' OR a.status = 'Expired')
        ORDER BY 
          a.approvalCertified_date DESC`,
        [userId]
      );
      
      // 添加检查过期证书的逻辑
      const currentDate = new Date();
      const updatedApplications = [];
      const expiredApplicationIds = [];
      
      // 检查每一个证书是否过期
      for (const app of applications) {
        if (app.expiry_date && app.status === 'Certified') {
          const expiryDate = new Date(app.expiry_date);
          
          // 如果证书已过期，标记为过期状态
          if (expiryDate < currentDate) {
            app.status = 'Expired';
            expiredApplicationIds.push(app.application_id);
          }
        }
        updatedApplications.push(app);
      }
      
      // 如果有已过期的证书，更新数据库状态
      if (expiredApplicationIds.length > 0) {
        // 使用IN子句一次更新多个证书
        const placeholders = expiredApplicationIds.map(() => '?').join(',');
        await connection.execute(
          `UPDATE certificate_applications SET status = 'Expired' WHERE application_id IN (${placeholders})`,
          [...expiredApplicationIds]
        );
      }
      
      // Format the certificate data for frontend
      const formattedCertificates = updatedApplications.map(app => ({
        id: app.id,
        title: app.title,
        type: app.type,
        description: app.description,
        status: app.status === 'Certified' ? 'Active' : app.status, // 保持与前端一致，Certified显示为Active
        issuedOn: app.approvalCertified_date ? 
          new Date(app.approvalCertified_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : null,
        validUntil: app.expiry_date ? 
          new Date(app.expiry_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : null
      }));

      connection.release();
      
      // Return certificates
      res.status(200).json({
        success: true,
        certificates: formattedCertificates
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching certified certificates:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching certified certificates:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching certified certificates'
    });
  }
});

//get user profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const connection = await pool.getConnection();
    const [user] = await connection.execute(
      'SELECT * FROM users WHERE userId = ?',
      [userId]
    );
    connection.release();
    res.status(200).json({
      success: true,
      user: user[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user profile'
    });
  }
});

//update user profile
app.put('/api/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { username, email, phoneNumber, fullName, bio, experience } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE users SET username = ?, email = ?, phoneNumber = ?, fullName = ?, bio = ?, experience = ? WHERE userId = ?',
      [username, email, phoneNumber, fullName, bio, experience, userId]
    );
    connection.release();
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating user profile'
    });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Verify that the requesting user is an admin
    if (req.user && req.user.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        'SELECT userId, username, email, userRole, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
      );

      connection.release();

      // Transform dates to readable format and format the data for frontend
      const formattedUsers = users.map(user => {
        const createdDate = new Date(user.createdAt);
        return {
          id: user.userId,
          name: user.username,
          email: user.email,
          role: user.userRole,
          status: 'Active', // Default status, could be stored in DB in future
          registeredDate: createdDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          certificates: 0 // This will be populated with actual data in a more advanced version
        };
      });

      res.status(200).json(formattedUsers);
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching users:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Add new user (admin only)
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Verify that the requesting user is an admin
    if (req.user && req.user.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { username, email, password, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if username or email already exists
      const [existingUsers] = await connection.execute(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.username === username) {
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'Username already exists'
          });
        }
        if (existingUser.email === email) {
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Hash the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user with hashed password
      const userRole = role || 'user'; // Default to 'user' if role not provided
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password, userRole) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, userRole]
      );

      connection.release();

      // Return success response with the new user ID
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: result.insertId,
        user: {
          id: result.insertId,
          name: username,
          email: email,
          role: userRole,
          status: 'Active',
          registeredDate: new Date().toISOString().split('T')[0]
        }
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error creating user:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the user'
    });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Verify that the requesting user is an admin
    if (req.user && req.user.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const userId = req.params.id;
    const { username, email, role, status, password } = req.body;
    
    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const [userResults] = await connection.execute(
        'SELECT * FROM users WHERE userId = ?',
        [userId]
      );

      if (userResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if username or email already exists for other users
      const [existingUsers] = await connection.execute(
        'SELECT username, email FROM users WHERE (username = ? OR email = ?) AND userId != ?',
        [username, email, userId]
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.username === username) {
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'Username already exists'
          });
        }
        if (existingUser.email === email) {
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update user
      const userRole = role || userResults[0].userRole; // Keep current role if not provided
      
      // Build query based on whether password is being updated
      let query, params;
      if (password) {
        // Hash the password before storing it
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        query = 'UPDATE users SET username = ?, email = ?, userRole = ?, password = ? WHERE userId = ?';
        params = [username, email, userRole, hashedPassword, userId];
      } else {
        query = 'UPDATE users SET username = ?, email = ?, userRole = ? WHERE userId = ?';
        params = [username, email, userRole, userId];
      }

      const [result] = await connection.execute(query, params);

      connection.release();

      // Return success response
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: parseInt(userId),
          name: username,
          email: email,
          role: userRole,
          status: status || 'Active'
        }
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error updating user:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the user'
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Verify that the requesting user is an admin
    if (req.user && req.user.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const userId = req.params.id;

    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const [userResults] = await connection.execute(
        'SELECT * FROM users WHERE userId = ?',
        [userId]
      );

      if (userResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete user
      const [result] = await connection.execute(
        'DELETE FROM users WHERE userId = ?',
        [userId]
      );

      connection.release();

      // Return success response
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error deleting user:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the user'
    });
  }
});

// Notifications API endpoints

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Get notifications where user is the recipient (to_user_id)
      // or the sender (from_user_id and type='sent')
      const [notifications] = await connection.execute(
        `SELECT 
          id, 
          from_user_id, 
          to_user_id, 
          type, 
          title, 
          message, 
          date, 
          is_read, 
          created_at 
        FROM 
          notifications 
        WHERE 
          (to_user_id = ? AND (type = 'unread' OR type = 'read'))
          OR
          (from_user_id = ? AND type = 'sent')
        ORDER BY 
          date DESC`,
        [userId, userId]
      );
      console.log(userId);
      
      connection.release();
      
      res.status(200).json(notifications);
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching notifications:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching notifications'
    });
  }
});

// Mark a notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Validate notification ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid notification ID is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // First check if the notification exists and is unread
      const [notifications] = await connection.execute(
        `SELECT id, type FROM notifications WHERE id = ? AND to_user_id = ?`,
        [id, userId]
      );
      
      if (notifications.length === 0) {
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
      
      const notification = notifications[0];
      
      // Only proceed if it's an unread notification
      if (notification.type !== 'unread') {
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Only unread notifications can be marked as read' 
        });
      }
      
      // Update notification to mark it as read
      // Also update the type from 'unread' to 'read'
      const [result] = await connection.execute(
        `UPDATE notifications 
         SET is_read = true, type = 'read' 
         WHERE id = ? AND to_user_id = ? AND type = 'unread'`,
        [id, userId]
      );
      
      connection.release();
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found or already read' 
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error marking notification as read:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while marking notification as read'
    });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/markAllRead', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Update all unread notifications to read
      const [result] = await connection.execute(
        `UPDATE notifications 
         SET is_read = true, type = 'read' 
         WHERE to_user_id = ? AND type = 'unread'`,
        [userId]
      );
      
      connection.release();
      
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        count: result.affectedRows
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error marking all notifications as read:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while marking all notifications as read'
    });
  }
});

// Create a new notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { 
      from_user_id, 
      to_user_id, 
      type, 
      title, 
      message 
    } = req.body;
    
    // Validate required fields
    if (!to_user_id || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Validate notification type
    if (!['sent', 'unread', 'read'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid notification type' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Insert notification into database
      const [result] = await connection.execute(
        `INSERT INTO notifications 
         (from_user_id, to_user_id, type, title, message, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [from_user_id, to_user_id, type, title, message, type === 'read' || type === 'sent']
      );
      
      connection.release();
      
      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        notificationId: result.insertId
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error creating notification:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating notification'
    });
  }
});

// Send message API (create a sent notification)
app.post('/api/messages/send', async (req, res) => {
  try {
    const { 
      from_user_id, 
      to_user_id, 
      title, 
      message 
    } = req.body;
    
    // Validate required fields
    if (!from_user_id || !to_user_id || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Start a transaction
      await connection.beginTransaction();
      
      // 1. Create 'sent' notification for the sender
      const [sentResult] = await connection.execute(
        `INSERT INTO notifications 
         (from_user_id, to_user_id, type, title, message, is_read) 
         VALUES (?, ?, 'sent', ?, ?, true)`,
        [from_user_id, to_user_id, title, message]
      );
      
      // 2. Create 'unread' notification for the recipient
      const [unreadResult] = await connection.execute(
        `INSERT INTO notifications 
         (from_user_id, to_user_id, type, title, message, is_read) 
         VALUES (?, ?, 'unread', ?, ?, false)`,
        [from_user_id, to_user_id, title, message]
      );
      
      // Commit the transaction
      await connection.commit();
      
      connection.release();
      
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        sentNotificationId: sentResult.insertId,
        unreadNotificationId: unreadResult.insertId
      });
    } catch (dbError) {
      // Rollback in case of error
      await connection.rollback();
      connection.release();
      console.error('Database error sending message:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending message'
    });
  }
});

// Helper function to get users list (for message recipients)
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Get all users except the requesting user
      const [users] = await connection.execute(
        `SELECT 
          userId, 
          username,
          email,
          userRole
        FROM 
          users
        WHERE 
          userId != ?
        ORDER BY 
          username ASC`,
        [req.query.currentUserId || 0]
      );
      
      connection.release();
      
      res.status(200).json({
        success: true,
        users
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching users:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users'
    });
  }
});

const upload2 = multer({ dest: 'uploads/' });

// Read orchid descriptions
const orchidDescriptions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'models/orchid_descriptions.json'), 'utf8')
);

// Read orchid labels
const orchidLabels = fs.readFileSync(
  path.join(__dirname, 'models/orchids52_metadata-en.txt'), 'utf8'
).split('\n').filter(line => line.trim().length > 0);

// Preprocess image
async function preprocessImage(imagePath) {
  // Resize image to model input size (e.g. 224x224)
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224)
    .toFormat('png')
    .toBuffer();
  
  // Convert to RGB (remove alpha channel) and normalize to [0,1]
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Create Float32Array to store normalized pixel values
  const tensorData = new Float32Array(3 * info.width * info.height);
  
  // Normalize and convert to CHW format (required by onnxruntime)
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < info.height; h++) {
      for (let w = 0; w < info.width; w++) {
        const idx = c * info.height * info.width + h * info.width + w;
        const srcIdx = (h * info.width + w) * 3 + c;
        tensorData[idx] = data[srcIdx] / 255.0;
      }
    }
  }
  
  return tensorData;
}

// API - Identify orchid
app.post('/api/identify-orchid', (req, res, next) => {
  console.log('Received orchid identification request');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Continue to multer middleware
  upload2.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error', message: err.message });
    }
    
    // Check if file was uploaded
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    // Continue with processing
    processOrchidImage(req, res);
  });
});

// Process the orchid image
async function processOrchidImage(req, res) {
  try {
    console.log(`Processing uploaded image: ${req.file.path}`);
    
    // Preprocess image
    const inputTensor = await preprocessImage(req.file.path);
    
    // Load ONNX model
    const modelPath = path.join(__dirname, 'models/orchid_species_model.onnx');
    const session = await ort.InferenceSession.create(modelPath);
    
    // Prepare input data
    const inputDims = [1, 3, 224, 224]; // Batch size 1, 3 channels, 224x224 image
    const inputTensorOrt = new ort.Tensor('float32', inputTensor, inputDims);
    
    // Run inference
    const feeds = { input: inputTensorOrt };
    const results = await session.run(feeds);
    
    // Get output tensor
    const outputTensor = results.output;
    const outputData = outputTensor.data;
    
    // Find the class with the highest confidence
    let maxProb = -Infinity;
    let maxIdx = 0;
    for (let i = 0; i < outputData.length; i++) {
      if (outputData[i] > maxProb) {
        maxProb = outputData[i];
        maxIdx = i;
      }
    }
    
    // Get the identification result
    const orchidId = `n${maxIdx.toString().padStart(4, '0')}`;
    const orchidLabel = orchidLabels[maxIdx];
    const orchidInfo = orchidDescriptions[orchidId] || {
      description: 'No detailed information available.',
      habitat: 'Information not available.',
      care: 'Information not available.'
    };
    
    // Try to delete temporary file, but continue if it fails
    try {
      fs.unlinkSync(req.file.path);
    } catch (deleteError) {
      console.warn(`Warning: Could not delete temporary file ${req.file.path}:`, deleteError.message);
      // Continue processing without failing the request
    }
    
    // Return the identification result
    res.json({
      success: true,
      orchid: {
        id: orchidId,
        label: orchidLabel,
        confidence: maxProb,
        info: orchidInfo
      }
    });
    
  } catch (error) {
    console.error('Error identifying orchid:', error);
    res.status(500).json({ error: 'Error processing image', message: error.message });
  }
}

// API - Get latest sensor readings
app.get('/api/sensor-data/latest', async (req, res) => {
  try {
    // Query database for latest sensor readings - using direct query instead of view
    const [results] = await pool.query('SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1');
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No sensor data available' });
    }
    
    // Format the response
    const latestReading = results[0];
    const formattedData = {
      timestamp: latestReading.timestamp,
      temperature: parseFloat(latestReading.temperature),
      humidity: parseFloat(latestReading.humidity),
      motion: latestReading.motion ? 'YES' : 'NO', // Convert boolean to YES/NO
      rain: latestReading.rain ? 'YES' : 'NO', // Convert boolean to YES/NO
      soilMoisture: latestReading.soil_moisture
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data', message: error.message });
  }
});

// API - Get historical sensor readings
app.get('/api/sensor-data/history', async (req, res) => {
  try {
    let query;
    let params = [];
    
    // Check if date range is provided
    if (req.query.startDate && req.query.endDate) {
      // Use direct query instead of stored procedure
      query = 'SELECT * FROM sensor_readings WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC';
      params = [new Date(req.query.startDate), new Date(req.query.endDate)];
    } else {
      // Default to last 24 hours if no date range is specified
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
      // console.log(startDate, endDate);
      query = 'SELECT * FROM sensor_readings WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC';
      params = [startDate, endDate];
    }
    
    // Execute query
    const [results] = await pool.query(query, params);
    
    // Format the response
    const formattedData = results.map(reading => ({
      id: reading.id,
      timestamp: reading.timestamp,
      temperature: parseFloat(reading.temperature),
      humidity: parseFloat(reading.humidity),
      motion: reading.motion ? 'YES' : 'NO', 
      rain: reading.rain ? 'YES' : 'NO', 
      soilMoisture: reading.soil_moisture
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching historical sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch historical sensor data', message: error.message });
  }
});

// API - Save sensor reading
app.post('/api/sensor-data', async (req, res) => {
  try {
    const { temperature, humidity, motion, rain, soilMoisture } = req.body;
    
    // Validate input
    if (temperature === undefined || humidity === undefined || 
        motion === undefined || rain === undefined || soilMoisture === undefined) {
      return res.status(400).json({ error: 'Missing required sensor data fields' });
    }
    
    // Use direct query instead of stored procedure
    const query = `
      INSERT INTO sensor_readings 
        (timestamp, temperature, humidity, motion, rain, soil_moisture) 
      VALUES
        (NOW(), ?, ?, ?, ?, ?)
    `;
    
    const params = [
      temperature, 
      humidity, 
      motion === 'YES' || motion === true ? 1 : 0, // Handle both string and boolean
      rain === 'YES' || rain === true ? 1 : 0, // Handle both string and boolean
      soilMoisture
    ];
    
    await pool.query(query, params);
    
    // Log the saved data
    console.log(`Stored sensor readings in database:
  Temperature: ${temperature}°C
  Humidity: ${humidity}%
  Motion: ${motion === 'YES' || motion === true ? 'YES' : 'NO'}
  Rain: ${rain === 'YES' || rain === true ? 'YES' : 'NO'}
  Soil Moisture: ${soilMoisture}`);
    
    res.json({ success: true, message: 'Sensor data saved successfully' });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: 'Failed to save sensor data', message: error.message });
  }
});



process.on('uncaughtException', (error) => {
  console.error('error:', error);
  
});

// Get certificate details API
app.get('/api/certificates/:certificateId/details', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.query.userId;
    
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Get certificate basic information
      const [certificateResults] = await connection.execute(
        `SELECT 
          c.certificateCode, 
          c.certificateName, 
          c.certificateType, 
          c.description, 
          c.requirements
        FROM 
          certificates c
        WHERE 
          c.certificateCode = ?`,
        [certificateId]
      );
      
      if (certificateResults.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      
      const certificate = certificateResults[0];
      
      // Get user-specific certificate information if userId provided
      let userCertificate = null;
      if (userId) {
        const [userCertResults] = await connection.execute(
          `SELECT 
            a.status,
            a.application_date,
            a.approvalRegister_date,
            a.approvalCertified_date,
            a.expiry_date,
            a.progress_percent
          FROM 
            certificate_applications a
          WHERE 
            a.certificate_id = ? AND a.user_id = ?`,
          [certificateId, userId]
        );
        
        if (userCertResults.length > 0) {
          userCertificate = userCertResults[0];
        }
      }
      
      // Get certificate topics
      const [topicResults] = await connection.execute(
        `SELECT 
          id,
          title,
          description
        FROM 
          certificate_topics
        WHERE 
          certificate_id = ?
        ORDER BY
          id ASC`,
        [certificateId]
      );
      
      // Parse requirements if stored as string
      let requirementsList = [];
      if (certificate.requirements) {
        if (typeof certificate.requirements === 'string') {
          requirementsList = certificate.requirements
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => line.replace(/^-\s*/, '').trim());
        } else {
          requirementsList = [certificate.requirements];
        }
      }
      
      // Format the topics for display
      const formattedTopics = topicResults.map((topic, index) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        duration: index === 2 ? '2 weeks' : '1 week' // Example: make topic 3 longer
      }));
      
      // Build the complete certificate details object
      const certificateDetails = {
        id: certificate.certificateCode,
        name: certificate.certificateName,
        type: certificate.certificateType,
        description: certificate.description,
        requirements: requirementsList.length > 0 ? requirementsList : [
          'Minimum 2 years of experience in park services',
          'First aid and CPR certification',
          'Knowledge of local flora and fauna',
          'Completion of park ranger training program'
        ],
        topics: formattedTopics.length > 0 ? formattedTopics : [
          { title: 'Introduction to Park Management', description: 'Overview of park management principles and practices.', duration: '1 week' },
          { title: 'Visitor Safety Protocols', description: 'Learn essential visitor safety protocols and emergency procedures.', duration: '1 week' },
          { title: 'Environmental Conservation', description: 'Study of environmental conservation techniques and best practices.', duration: '2 weeks' },
          { title: 'Wildlife Management', description: 'Understanding wildlife behavior and management strategies.', duration: '1 week' },
          { title: 'Park Regulations and Enforcement', description: 'Overview of park regulations and enforcement procedures.', duration: '1 week' }
        ],
        completionRequirements: 'Minimum 80% score on all assessments and completion of all course materials',
        duration: '6 weeks',
        validity: '3 years',
        issuer: 'National Park Service',
        user: userCertificate ? {
          status: userCertificate.status,
          applicationDate: userCertificate.application_date,
          approvalDate: userCertificate.approvalCertified_date,
          expiryDate: userCertificate.expiry_date,
          progress: userCertificate.progress_percent
        } : null
      };
      
      connection.release();
      
      // Return certificate details
      res.status(200).json({
        success: true,
        certificate: certificateDetails
      });
      
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching certificate details:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching certificate details'
    });
  }
});

// Feedback API endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, guide_name, rating, guide_experience, semenggoh_experience } = req.body;
    
    // Validate required fields
    if (!name || !email || !guide_name || !rating || !semenggoh_experience) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }
    
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate rating (should be between 1 and 5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating should be between 1 and 5'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Insert feedback into database
      const [result] = await connection.execute(
        `INSERT INTO feedback (name, email, guide_name, rating, guide_experience, semenggoh_experience)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, guide_name, rating, guide_experience || null, semenggoh_experience]
      );
      
      connection.release();
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: result.insertId
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error saving feedback:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting feedback'
    });
  }
});


// Get feedback by ID
app.get('/api/feedback/:id', async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query feedback by ID
      const [feedback] = await connection.execute(
        `SELECT * FROM feedback WHERE id = ?`,
        [feedbackId]
      );
      
      connection.release();
      
      if (feedback.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }
      
      // Return feedback
      res.status(200).json({
        success: true,
        feedback: feedback[0]
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching feedback:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching feedback'
    });
  }
});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// API endpoint to get all park guides
app.get('/api/guides', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT userId as id, username as name FROM users WHERE userRole = "guide" ORDER BY username';
    const [rows] = await connection.execute(query);
    connection.release();
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ message: 'Error fetching guides', error: error.message });
  }
});

// API - Summarize Feedback
app.post('/api/feedback/summarize', async (req, res) => {
  try {
    const { feedbackData, guideFilter } = req.body;
    
    if (!feedbackData || !Array.isArray(feedbackData) || feedbackData.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty feedback data' });
    }
    
    // Initial data analysis
    const totalFeedback = feedbackData.length;
    const averageRating = feedbackData.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;
    
    // Count ratings
    const ratingsCount = {
      5: feedbackData.filter(item => item.rating === 5).length,
      4: feedbackData.filter(item => item.rating === 4).length,
      3: feedbackData.filter(item => item.rating === 3).length,
      2: feedbackData.filter(item => item.rating === 2).length,
      1: feedbackData.filter(item => item.rating === 1).length,
    };
    
    // Combine all feedback text for analysis
    const allGuideExperiences = feedbackData
      .filter(item => item.guide_experience && item.guide_experience.trim() !== '')
      .map(item => item.guide_experience.trim());
      
    const allSemenggohExperiences = feedbackData
      .filter(item => item.semenggoh_experience && item.semenggoh_experience.trim() !== '')
      .map(item => item.semenggoh_experience.trim());
    
    // Extract common themes (simplified version)
    const extractThemes = (textArray) => {
      // In a real implementation, this would use NLP techniques
      // For now, we'll just do some simple keyword extraction
      
      // Common positive keywords
      const positiveKeywords = ['helpful', 'friendly', 'knowledgeable', 'professional', 'excellent', 
                               'amazing', 'great', 'good', 'wonderful', 'fantastic', 'enjoyed'];
      
      // Common negative keywords
      const negativeKeywords = ['poor', 'bad', 'unprofessional', 'unhelpful', 'rude', 
                               'disappointing', 'disappointed', 'issue', 'problem', 'terrible'];
      
      // Count occurrences
      const keywordCounts = {};
      
      textArray.forEach(text => {
        const lowerText = text.toLowerCase();
        
        [...positiveKeywords, ...negativeKeywords].forEach(keyword => {
          if (lowerText.includes(keyword.toLowerCase())) {
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
          }
        });
      });
      
      // Sort by frequency
      return Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({
          keyword,
          count,
          percentage: Math.round((count / textArray.length) * 100)
        }));
    };
    
    const guideThemes = extractThemes(allGuideExperiences);
    const parkThemes = extractThemes(allSemenggohExperiences);
    
    // Generate insights based on collected data
    const generateSummary = () => {
      let summary = '';
      
      // Introduction
      if (guideFilter === 'all guides') {
        summary += `Summary of ${totalFeedback} feedback entries for all guides:\n\n`;
      } else {
        summary += `Summary of ${totalFeedback} feedback entries for guide "${guideFilter}":\n\n`;
      }
      
      // Overall rating summary
      summary += `Overall rating: ${averageRating.toFixed(1)} out of 5 stars.\n`;
      summary += `Rating distribution: `;
      for (let i = 5; i >= 1; i--) {
        const percentage = Math.round((ratingsCount[i] / totalFeedback) * 100);
        summary += `${i} stars (${percentage}%), `;
      }
      summary = summary.slice(0, -2) + '.\n\n';
      
      // Key themes from guide experiences
      if (guideThemes.length > 0) {
        summary += 'Key themes from guide experiences:\n';
        guideThemes.forEach(({ keyword, percentage }) => {
          summary += `- "${keyword}" mentioned in ${percentage}% of feedback.\n`;
        });
        summary += '\n';
      }
      
      // Key themes from park experiences
      if (parkThemes.length > 0) {
        summary += 'Key themes from Semenggoh experiences:\n';
        parkThemes.forEach(({ keyword, percentage }) => {
          summary += `- "${keyword}" mentioned in ${percentage}% of feedback.\n`;
        });
        summary += '\n';
      }
      
      // Generate recommendations based on ratings
      summary += 'Recommendations:\n';
      
      if (averageRating >= 4.5) {
        summary += '- Continue maintaining the excellent service quality.\n';
      } else if (averageRating >= 4.0) {
        summary += '- Consider addressing minor concerns to achieve excellence.\n';
      } else if (averageRating >= 3.0) {
        summary += '- Focus on improving specific aspects of the guide service.\n';
      } else {
        summary += '- Urgent attention needed to address service quality issues.\n';
      }
      
      // Add recommendations based on themes
      const negativeThemesGuide = guideThemes.filter(({ keyword }) => 
        ['poor', 'bad', 'unprofessional', 'unhelpful', 'rude', 'disappointing', 'disappointed', 'issue', 'problem', 'terrible'].includes(keyword.toLowerCase())
      );
      
      if (negativeThemesGuide.length > 0) {
        summary += '- Consider addressing feedback related to: ' + 
                   negativeThemesGuide.map(t => t.keyword).join(', ') + '.\n';
      }
      
      // Conclusion
      summary += '\nThis summary is based on automated analysis of feedback data and should be reviewed by management for final decisions.';
      
      return summary;
    };
    
    // Generate the final summary
    const summary = generateSummary();
    
    // Send the response
    res.json({
      success: true,
      summary,
      stats: {
        totalFeedback,
        averageRating,
        ratingsCount
      }
    });
    
  } catch (error) {
    console.error('Error generating feedback summary:', error);
    res.status(500).json({ error: 'Failed to generate summary', message: error.message });
  }
});

// Get all feedback
app.get('/api/feedback', async (req, res) => {
  try {
    // Get database connection
    const connection = await pool.getConnection();
    
    try {
      // Query all feedback
      const [feedback] = await connection.execute(
        `SELECT * FROM feedback ORDER BY created_at DESC`
      );
      
      connection.release();
      
      // Return all feedback
      res.status(200).json(feedback);
    } catch (dbError) {
      connection.release();
      console.error('Database error fetching all feedback:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching feedback'
    });
  }
});

// User Registration API
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email, passwordLength: password?.length });
    
    // Validate request data
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email and password are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Get database connection
    const connection = await pool.getConnection();
    try {
      // Check if username exists
      const [userRows] = await connection.execute(
        'SELECT userId FROM users WHERE username = ?',
        [username]
      );
      if (userRows.length > 0) {
        connection.release();
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      // Check if email exists
      const [emailRows] = await connection.execute(
        'SELECT userId FROM users WHERE email = ?',
        [email]
      );
      if (emailRows.length > 0) {
        connection.release();
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Hash the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user with hashed password
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password, userRole) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user']
      );
      connection.release();
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        userId: result.insertId
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error during registration:', dbError);
      res.status(500).json({
        success: false,
        message: 'An error occurred during registration, please try again later'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration, please try again later'
    });
  }
});
