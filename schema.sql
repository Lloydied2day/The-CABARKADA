-- CABarkada Database Schema

CREATE DATABASE IF NOT EXISTS cabarkada_db;
USE cabarkada_db;

-- Users Table (Regular Members)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    barangay VARCHAR(50),
    role ENUM('member', 'guest') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins Table (SK, Barangay, Organizations)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    admin_type ENUM('SK', 'Barangay', 'Organization') NOT NULL,
    organization_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    organizer_id INT,
    organizer_type ENUM('SK', 'Barangay', 'Organization') NOT NULL,
    organizer_name VARCHAR(100) NOT NULL,
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status ENUM('Registered', 'Attended', 'No-show') DEFAULT 'Registered',
    UNIQUE KEY unique_registration (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Data for Admins
INSERT INTO admins (first_name, last_name, email, password, admin_type, organization_name) VALUES
('SK', 'Admin', 'sk@cabarkada.gov.ph', '$2b$10$YourHashedPasswordHere', 'SK', 'SK New Cabalan'),
('Brgy', 'Official', 'barangay@cabarkada.gov.ph', '$2b$10$YourHashedPasswordHere', 'Barangay', 'Barangay Council'),
('Youth', 'Org', 'youthorg@cabarkada.gov.ph', '$2b$10$YourHashedPasswordHere', 'Organization', 'Youth Volunteers Org');
