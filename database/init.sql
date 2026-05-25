-- Blood Bank Management System — Production schema (matches backend API)
-- Run this on your cloud MySQL database before deploying the API.

CREATE DATABASE IF NOT EXISTS bloodbankdb;
USE bloodbankdb;

CREATE TABLE IF NOT EXISTS donor (
  donor_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(100),
  address TEXT,
  last_donation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donation (
  donation_id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units INT DEFAULT 1,
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donor(donor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  inventory_id INT AUTO_INCREMENT PRIMARY KEY,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units_available INT DEFAULT 0,
  expiry_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_request (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units_required INT NOT NULL,
  status ENUM('Pending','Fulfilled','Rejected') DEFAULT 'Pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample inventory (optional — remove if you prefer empty DB)
INSERT INTO blood_inventory (blood_group, units_available, expiry_date) VALUES
('A+', 5, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('A-', 3, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('B+', 4, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('B-', 2, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('AB+', 2, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('AB-', 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('O+', 6, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('O-', 3, DATE_ADD(CURDATE(), INTERVAL 30 DAY));

INSERT INTO alerts (blood_group, message) VALUES
('O-', 'Critical shortage: O- blood stock is low'),
('AB+', 'Low stock alert for AB+');
