-- Create the parkguide database
CREATE DATABASE IF NOT EXISTS parkguide;

-- Use the parkguide database
USE parkguide;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    userRole VARCHAR(20) NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_username CHECK (LENGTH(username) >= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
-- CREATE INDEX idx_email ON users(email);  -- 已存在，注释掉
-- CREATE INDEX idx_username ON users(username);  -- 如果已存在，也注释掉
-- CREATE INDEX idx_role ON users(userRole);  -- 如果已存在，也注释掉

-- Insert test users with different roles (with INSERT IGNORE to skip duplicates)
INSERT IGNORE INTO users (username, email, password, userRole) VALUES
('john_user', 'john@example.com', 'password123', 'user'),
('sarah_guide', 'sarah@parkguide.com', 'password123', 'guide'),
('admin_user', 'admin@parkguide.com', 'password123', 'admin');

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    certificateId INT AUTO_INCREMENT PRIMARY KEY,
    certificateCode VARCHAR(20) NOT NULL UNIQUE,
    certificateName VARCHAR(100) NOT NULL,
    certificateType VARCHAR(50) NOT NULL,
    description TEXT,
    requirements TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    createdBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(userId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
DROP INDEX IF EXISTS idx_certificate_name ON certificates;
CREATE INDEX idx_certificate_name ON certificates(certificateName);
DROP INDEX IF EXISTS idx_certificate_type ON certificates;
CREATE INDEX idx_certificate_type ON certificates(certificateType);
DROP INDEX IF EXISTS idx_certificate_status ON certificates;
CREATE INDEX idx_certificate_status ON certificates(status);

-- Check if the certificate_topics table exists, if not, create it
CREATE TABLE IF NOT EXISTS certificate_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    materials INT DEFAULT 0,
    questions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (certificate_id) REFERENCES certificates(certificateCode) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score INT NOT NULL DEFAULT 70,
    time_limit INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES certificate_topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    text TEXT NOT NULL,
    type ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
    order_num INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create question options table
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_id CHAR(1) NOT NULL,
    text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_option (question_id, option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance (只创建不存在的索引)
-- 索引idx_quiz_topic已经由外键约束自动创建，不需要删除
ALTER TABLE quizzes ADD INDEX IF NOT EXISTS idx_quiz_topic (topic_id);
ALTER TABLE quiz_questions ADD INDEX IF NOT EXISTS idx_question_quiz (quiz_id);
ALTER TABLE question_options ADD INDEX IF NOT EXISTS idx_option_question (question_id);

-- Insert default quiz data
-- For demonstration purposes, we'll assume topic_id = 1
-- First, insert the quiz
INSERT INTO certificates (certificateCode, certificateName, certificateType, status) VALUES
('PARK001', 'Park Management', 'Professional', 'Available')
ON DUPLICATE KEY UPDATE certificateName = certificateName;

-- Then, insert the topic
INSERT INTO certificate_topics (id, certificate_id, title, description, materials, questions) VALUES
(1, 'PARK001', 'Basic Park Management', 'Introduction to park management principles and practices', 3, 3)
ON DUPLICATE KEY UPDATE title = title;

-- Now, insert the quiz
INSERT INTO quizzes (topic_id, title, description, passing_score, time_limit) VALUES
(1, 'Park Management Fundamentals', 'Test your knowledge of basic park management principles and practices.', 70, 30);

-- Get the last inserted quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert question 1
INSERT INTO quiz_questions (quiz_id, text, type, order_num) VALUES
(@quiz_id, 'What is the primary responsibility of a park manager?', 'single', 1);

SET @question1_id = LAST_INSERT_ID();

-- Insert options for question 1
INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES
(@question1_id, 'A', 'Collecting entrance fees', 0),
(@question1_id, 'B', 'Managing park resources and visitor experiences', 1),
(@question1_id, 'C', 'Organizing guided tours', 0),
(@question1_id, 'D', 'Maintaining park vehicles', 0);

-- Insert question 2
INSERT INTO quiz_questions (quiz_id, text, type, order_num) VALUES
(@quiz_id, 'Which of the following is NOT typically a component of park management?', 'single', 2);

SET @question2_id = LAST_INSERT_ID();

-- Insert options for question 2
INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES
(@question2_id, 'A', 'Resource conservation', 0),
(@question2_id, 'B', 'Visitor services', 0),
(@question2_id, 'C', 'Stock market investment', 1),
(@question2_id, 'D', 'Staff supervision', 0);

-- Insert question 3
INSERT INTO quiz_questions (quiz_id, text, type, order_num) VALUES
(@quiz_id, 'Select all the factors that contribute to effective park management:', 'multiple', 3);

SET @question3_id = LAST_INSERT_ID();

-- Insert options for question 3
INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES
(@question3_id, 'A', 'Community engagement', 1),
(@question3_id, 'B', 'Environmental monitoring', 1),
(@question3_id, 'C', 'Ignoring visitor feedback', 0),
(@question3_id, 'D', 'Staff training and development', 1);

-- Sample query to get available certificates
-- SELECT * FROM certificates WHERE status = 'Available';

-- Create certificate applications table
CREATE TABLE IF NOT EXISTS certificate_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    certificate_id VARCHAR(20) NOT NULL,
    status ENUM('Pending for Registration', 'In Progress', 'Pending for Certified', 'Rejected', 'Certified') NOT NULL DEFAULT 'Pending for Registration',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approvalRegister_date TIMESTAMP NULL,  -- Recorded when status changes from Pending to In Progress
    approvalCertified_date TIMESTAMP NULL, -- Recorded when status changes from In Progress to Certified
    progress_percent DECIMAL(5,2) DEFAULT 0,
    expiry_date TIMESTAMP NULL,            -- Certificate expiration date
    FOREIGN KEY (user_id) REFERENCES users(userId),
    FOREIGN KEY (certificate_id) REFERENCES certificates(certificateCode),
    UNIQUE KEY unique_user_cert (user_id, certificate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_application_status ON certificate_applications(status);
CREATE INDEX IF NOT EXISTS idx_application_date ON certificate_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_expiry_date ON certificate_applications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_user_applications ON certificate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_applications ON certificate_applications(certificate_id);

-- Create topic materials table
CREATE TABLE IF NOT EXISTS topic_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    filesize VARCHAR(20) NOT NULL,
    filetype VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES certificate_topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for topic materials
ALTER TABLE topic_materials ADD INDEX IF NOT EXISTS idx_topic_materials (topic_id);

-- Insert sample materials for the first topic
INSERT INTO topic_materials (topic_id, filename, filepath, filesize, filetype, upload_date) VALUES
(1, 'Park Management Basics.pdf', '/uploads/materials/park_management_basics.pdf', '2.4 MB', 'pdf', '2023-06-15'),
(1, 'Introduction Video.mp4', '/uploads/materials/intro_video.mp4', '45 MB', 'video', '2023-06-16'),
(1, 'Park Systems Overview.pptx', '/uploads/materials/park_systems_overview.pptx', '8.7 MB', 'presentation', '2023-06-18');

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  score FLOAT NOT NULL,
  passing_score FLOAT NOT NULL,
  passed BOOLEAN NOT NULL,
  time_spent INT NOT NULL,
  answers JSON,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY user_topic (user_id, topic_id),
  FOREIGN KEY (user_id) REFERENCES users(userId),
  FOREIGN KEY (topic_id) REFERENCES certificate_topics(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT,
    to_user_id INT NOT NULL,
    type ENUM('sent', 'unread', 'read') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(userId) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(userId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX idx_notification_from_user ON notifications(from_user_id);
CREATE INDEX idx_notification_to_user ON notifications(to_user_id);
CREATE INDEX idx_notification_type ON notifications(type);
CREATE INDEX idx_notification_read ON notifications(is_read);
CREATE INDEX idx_notification_date ON notifications(date);

-- Insert sample notification data
INSERT INTO notifications (from_user_id, to_user_id, type, title, message, date, is_read) VALUES
(3, 2, 'unread', 'Certification application approved', 'Your "Wildlife Guide Certification" application has been approved. You can now start studying the related materials.', '2023-12-18 09:30:00', FALSE),
(3, 2, 'read', 'New policy released', 'The park management department has released a new guide safety guide. All guides are requested to read and comply.', '2023-12-17 14:45:00', TRUE),
(3, 2, 'unread', 'Certification materials updated', 'The study materials for the "First Aid and Safety" certification have been updated. Please check the latest content.', '2023-12-15 10:15:00', FALSE),
(3, 2, 'unread', 'Certification about to expire', 'Your "Advanced Guide Skills" certification will expire in 30 days. Please renew it in time.', '2023-12-14 16:20:00', FALSE),
(3, 2, 'read', 'Certification application status updated', 'Your "Ecological Conservation" certification application is under review. Please be patient.', '2023-12-10 11:05:00', TRUE),
(3, 2, 'read', 'Certification test passed', 'Congratulations! You have passed the test for the "Wildlife Identification" topic.', '2023-12-08 15:30:00', TRUE),
(3, 2, 'read', 'New certification course released', 'The new "Night Tour Guide Skills" certification course is now available. Welcome to apply.', '2023-12-05 09:45:00', TRUE),
(1, 3, 'sent', 'Application for Wildlife Guide Certificate', 'John has submitted an application for the Wildlife Guide Certificate.', '2023-12-01 11:30:00', TRUE);

CREATE TABLE IF NOT EXISTS sensor_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME,
        temperature FLOAT,
        humidity FLOAT,
        motion BOOLEAN,
        rain BOOLEAN,
        soil_moisture INT,
        raw_data TEXT
    )