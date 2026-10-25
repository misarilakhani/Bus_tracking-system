-- create database
CREATE DATABASE IF NOT EXISTS college_bus_db;
USE college_bus_db;

-- create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'driver', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create buses table
CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    route_name VARCHAR(150) NOT NULL,
    driver_id INT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- create bus locations table
CREATE TABLE IF NOT EXISTS bus_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- create tracking history table
CREATE TABLE IF NOT EXISTS tracking_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bus_id INT NOT NULL,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- sample users
INSERT INTO users (name, email, password, role) VALUES
('Campus Admin', 'a@nirmauni.ac.in', '$2a$10$WCbAHzTYLwyW5CY5tPMvIO75fXu6gAcsmGMQoxdBWnmfFOG64SI2O', 'admin'),
('Ramesh Patel (Driver)', 'd@nirmauni.ac.in', '$2a$10$bAC6UcLU/pvbe6JwZFX4ZevMPvkJU3h8e5CFPe5tGuML3MMUT79W.', 'driver'),
('Aarav Shah (Student)', 's@nirmauni.ac.in', '$2a$10$Elp/aPiqsIaFJdBwHKPp5OIGGQrLRnU9Av/6WTVAODwsLZPJkSucq', 'student'),
('Rahul Sharma', 'rahul@nirmauni.ac.in', '$2a$10$Elp/aPiqsIaFJdBwHKPp5OIGGQrLRnU9Av/6WTVAODwsLZPJkSucq', 'student'),
('Priya Patel', 'priya@nirmauni.ac.in', '$2a$10$Elp/aPiqsIaFJdBwHKPp5OIGGQrLRnU9Av/6WTVAODwsLZPJkSucq', 'student'),
('Aman Shah', 'aman@nirmauni.ac.in', '$2a$10$Elp/aPiqsIaFJdBwHKPp5OIGGQrLRnU9Av/6WTVAODwsLZPJkSucq', 'student')
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- sample buses
INSERT INTO buses (id, bus_number, route_name, driver_id, status) VALUES
(1, 'Bus 101', 'Route 1: SG Highway - Vaishno Devi - Nirma Campus', 2, 'active'),
(2, 'Bus 102', 'Route 2: Gandhinagar Infocity - Kudasan - Nirma Campus', NULL, 'active'),
(3, 'Bus 103', 'Route 3: Paldi - Ashram Road - Nirma Campus', NULL, 'inactive')
ON DUPLICATE KEY UPDATE bus_number=bus_number;

-- initial bus locations
INSERT INTO bus_locations (bus_id, latitude, longitude) VALUES
(1, 23.12870000, 72.54510000),
(2, 23.18150000, 72.63220000),
(3, 23.01200000, 72.56200000)
ON DUPLICATE KEY UPDATE latitude=VALUES(latitude), longitude=VALUES(longitude);
