-- ===============================================
-- BLOOD BANK & DONOR MANAGEMENT SYSTEM
-- Complete MySQL Database Schema & Procedures
-- ===============================================

-- Drop database if exists (for fresh start)
DROP DATABASE IF EXISTS BloodBankDB;
CREATE DATABASE BloodBankDB;
USE BloodBankDB;

-- ===============================================
-- 1. CREATE TABLE STATEMENTS WITH ALL CONSTRAINTS
-- ===============================================

-- Table: DONOR
-- Stores information about blood donors
CREATE TABLE DONOR (
    DonorID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender ENUM('M', 'F', 'Other') NOT NULL,
    BloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Email VARCHAR(100) UNIQUE,
    Address VARCHAR(255),
    City VARCHAR(50),
    State VARCHAR(50),
    PinCode VARCHAR(10),
    LastDonationDate DATE,
    DonationCount INT DEFAULT 0,
    RegistrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    CHECK (YEAR(CURDATE()) - YEAR(DateOfBirth) >= 18 AND YEAR(CURDATE()) - YEAR(DateOfBirth) <= 65),
    INDEX idx_blood_type (BloodType),
    INDEX idx_status (Status),
    INDEX idx_city (City),
    INDEX idx_donor_blood_active (BloodType, Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PATIENT
-- Stores information about patients requiring blood transfusion
CREATE TABLE PATIENT (
    PatientID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender ENUM('M', 'F', 'Other') NOT NULL,
    BloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255),
    City VARCHAR(50),
    State VARCHAR(50),
    PinCode VARCHAR(10),
    RegistrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Discharged', 'Deceased') DEFAULT 'Active',
    INDEX idx_blood_type (BloodType),
    INDEX idx_status (Status),
    INDEX idx_phone (Phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: HOSPITAL_STAFF
-- Stores hospital staff information (doctors, nurses, technicians, managers)
CREATE TABLE HOSPITAL_STAFF (
    StaffID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Role ENUM('Doctor', 'Nurse', 'Technician', 'Manager', 'Administrator') NOT NULL,
    Department VARCHAR(50) NOT NULL,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Email VARCHAR(100) UNIQUE,
    EmployeeID VARCHAR(20) NOT NULL UNIQUE,
    JoiningDate DATE NOT NULL,
    Qualification VARCHAR(100),
    Status ENUM('Active', 'Inactive', 'On_Leave') DEFAULT 'Active',
    HospitalName VARCHAR(100) NOT NULL,
    INDEX idx_role (Role),
    INDEX idx_department (Department),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DONATION
-- Records all blood donations from donors
-- Links: DONOR (1:N relationship)
CREATE TABLE DONATION (
    DonationID INT PRIMARY KEY AUTO_INCREMENT,
    DonorID INT NOT NULL,
    DonationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    BloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    QuantityCollected DECIMAL(5, 2) NOT NULL,
    Status ENUM('Collected', 'Tested', 'Approved', 'Rejected') DEFAULT 'Collected',
    TestResults ENUM('Passed', 'Failed', 'Pending') DEFAULT 'Pending',
    HemoglobinLevel DECIMAL(5, 2),
    BloodPressure VARCHAR(10),
    BodyTemperature DECIMAL(4, 1),
    Notes TEXT,
    FOREIGN KEY (DonorID) REFERENCES DONOR(DonorID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (QuantityCollected > 0),
    INDEX idx_donor (DonorID),
    INDEX idx_blood_type (BloodType),
    INDEX idx_status (Status),
    INDEX idx_date (DonationDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BLOOD_INVENTORY
-- Maintains blood stock with batch tracking and expiry management
CREATE TABLE BLOOD_INVENTORY (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT,
    BloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    QuantityAvailable DECIMAL(8, 2) NOT NULL DEFAULT 0,
    ExpiryDate DATE NOT NULL,
    StorageLocation VARCHAR(100),
    Temperature DECIMAL(5, 2),
    LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Status ENUM('Available', 'Reserved', 'Expired', 'Discarded') DEFAULT 'Available',
    UNIQUE KEY unique_blood_inventory (BloodType, ExpiryDate, StorageLocation),
    CHECK (QuantityAvailable >= 0),
    CHECK (ExpiryDate > CURDATE()),
    INDEX idx_blood_type (BloodType),
    INDEX idx_status (Status),
    INDEX idx_expiry (ExpiryDate),
    INDEX idx_inventory_blood_available (BloodType, Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BLOOD_REQUEST
-- Records blood requests from patients through hospital staff
-- Links: PATIENT (1:N), HOSPITAL_STAFF (N:1)
CREATE TABLE BLOOD_REQUEST (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    PatientID INT NOT NULL,
    StaffID INT NOT NULL,
    BloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    QuantityRequired DECIMAL(5, 2) NOT NULL,
    RequestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    RequiredByDate DATETIME NOT NULL,
    Status ENUM('Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    Priority ENUM('Normal', 'Urgent', 'Emergency') DEFAULT 'Normal',
    Reason VARCHAR(100),
    FulfillmentDate DATETIME,
    FOREIGN KEY (PatientID) REFERENCES PATIENT(PatientID) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (StaffID) REFERENCES HOSPITAL_STAFF(StaffID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (QuantityRequired > 0),
    CHECK (RequiredByDate > RequestDate),
    INDEX idx_patient (PatientID),
    INDEX idx_staff (StaffID),
    INDEX idx_status (Status),
    INDEX idx_priority (Priority),
    INDEX idx_request_date (RequestDate),
    INDEX idx_required_date (RequiredByDate),
    INDEX idx_request_status_date (Status, RequestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: REQUEST_INVENTORY (Junction Table)
-- Maps blood requests to inventory batches (N:M relationship)
-- Tracks allocation of inventory to specific requests
CREATE TABLE REQUEST_INVENTORY (
    RequestID INT NOT NULL,
    InventoryID INT NOT NULL,
    QuantityAllocated DECIMAL(5, 2) NOT NULL,
    AllocationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (RequestID, InventoryID),
    FOREIGN KEY (RequestID) REFERENCES BLOOD_REQUEST(RequestID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (InventoryID) REFERENCES BLOOD_INVENTORY(InventoryID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (QuantityAllocated > 0),
    INDEX idx_inventory (InventoryID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ALERTS
-- System alerts for critical events (low stock, expiry warnings, pending requests)
CREATE TABLE ALERTS (
    AlertID INT PRIMARY KEY AUTO_INCREMENT,
    AlertType ENUM('Low_Stock', 'Expiry_Warning', 'Request_Pending', 'Donor_Inactive', 'Blood_Shortage', 'High_Demand') NOT NULL,
    Description TEXT NOT NULL,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ResolvedDate DATETIME,
    Status ENUM('Active', 'Resolved', 'Acknowledged') DEFAULT 'Active',
    Priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    RelatedEntity VARCHAR(50),
    RelatedEntityID INT,
    INDEX idx_alert_type (AlertType),
    INDEX idx_status (Status),
    INDEX idx_priority (Priority),
    INDEX idx_created_date (CreatedDate),
    INDEX idx_related (RelatedEntity, RelatedEntityID),
    INDEX idx_alert_active_priority (Status, Priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 2. HELPER VIEWS FOR COMMON QUERIES
-- ===============================================

-- View: Blood Stock Summary by Type
CREATE VIEW vw_blood_stock_summary AS
SELECT 
    BloodType, 
    SUM(QuantityAvailable) as TotalQuantity, 
    COUNT(*) as BatchCount,
    MIN(ExpiryDate) as EarliestExpiry
FROM BLOOD_INVENTORY
WHERE Status = 'Available' AND ExpiryDate > CURDATE()
GROUP BY BloodType;

-- View: Pending Blood Requests with Patient Details
CREATE VIEW vw_pending_requests AS
SELECT 
    r.RequestID, 
    CONCAT(p.FirstName, ' ', p.LastName) as PatientName,
    r.BloodType, 
    r.QuantityRequired, 
    r.Priority, 
    r.RequiredByDate, 
    CONCAT(s.FirstName, ' ', s.LastName) as StaffName,
    DATEDIFF(r.RequiredByDate, CURDATE()) as DaysRemaining
FROM BLOOD_REQUEST r
JOIN PATIENT p ON r.PatientID = p.PatientID
JOIN HOSPITAL_STAFF s ON r.StaffID = s.StaffID
WHERE r.Status IN ('Pending', 'Approved')
ORDER BY r.Priority DESC, r.RequiredByDate ASC;

-- View: Donor Eligibility Status
CREATE VIEW vw_donor_eligibility AS
SELECT 
    DonorID, 
    CONCAT(FirstName, ' ', LastName) as DonorName,
    BloodType, 
    LastDonationDate,
    COALESCE(DATEDIFF(CURDATE(), LastDonationDate), 9999) as DaysSinceLastDonation,
    CASE 
        WHEN LastDonationDate IS NULL THEN 'Eligible - Never Donated'
        WHEN DATEDIFF(CURDATE(), LastDonationDate) >= 56 THEN 'Eligible - 56 Days Passed'
        WHEN DATEDIFF(CURDATE(), LastDonationDate) >= 42 THEN 'Eligible - 42 Days Passed'
        ELSE CONCAT('Not Eligible - ', 56 - DATEDIFF(CURDATE(), LastDonationDate), ' days left')
    END as DonationEligibility,
    DonationCount
FROM DONOR
WHERE Status = 'Active'
ORDER BY DonationEligibility;

-- ===============================================
-- 3. TRIGGER 1: Auto-Update Blood_Inventory After Donation
-- ===============================================
-- When a donation is marked as 'Approved', automatically add it to inventory
-- This ensures inventory is always up-to-date with approved donations

DELIMITER //

CREATE TRIGGER trg_add_donation_to_inventory
AFTER UPDATE ON DONATION
FOR EACH ROW
BEGIN
    -- Check if donation status changed to 'Approved'
    IF NEW.Status = 'Approved' AND (OLD.Status != 'Approved' OR OLD.Status IS NULL) THEN
        -- Find or create inventory record for this blood type (add 45 days expiry from donation)
        INSERT INTO BLOOD_INVENTORY (BloodType, QuantityAvailable, ExpiryDate, StorageLocation, Status)
        VALUES (
            NEW.BloodType, 
            NEW.QuantityCollected,
            DATE_ADD(NEW.DonationDate, INTERVAL 45 DAY),  -- Blood shelf life typically 45 days
            'Main Storage',
            'Available'
        )
        ON DUPLICATE KEY UPDATE 
            QuantityAvailable = QuantityAvailable + NEW.QuantityCollected,
            LastUpdated = CURRENT_TIMESTAMP;
    END IF;
END //

DELIMITER ;

-- ===============================================
-- 4. TRIGGER 2: Insert Alert When Inventory Falls Below 3 Units
-- ===============================================
-- Monitors blood inventory and creates alerts for low stock conditions
-- Prevents blood shortage emergencies

DELIMITER //

CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE ON BLOOD_INVENTORY
FOR EACH ROW
BEGIN
    DECLARE alert_exists INT;
    
    -- Check if inventory dropped below 3 units and status is Available
    IF NEW.QuantityAvailable < 3 AND NEW.Status = 'Available' THEN
        -- Check if active alert already exists for this inventory
        SELECT COUNT(*) INTO alert_exists
        FROM ALERTS
        WHERE RelatedEntity = 'INVENTORY' 
            AND RelatedEntityID = NEW.InventoryID 
            AND Status = 'Active'
            AND AlertType = 'Low_Stock';
        
        -- Only insert if no existing active alert
        IF alert_exists = 0 THEN
            INSERT INTO ALERTS (
                AlertType, 
                Description, 
                Priority, 
                RelatedEntity, 
                RelatedEntityID, 
                Status
            )
            VALUES (
                'Low_Stock',
                CONCAT('CRITICAL: Blood type ', NEW.BloodType, ' stock is at ', NEW.QuantityAvailable, ' units (threshold: 3)'),
                IF(NEW.QuantityAvailable <= 1, 'Critical', 'High'),
                'INVENTORY',
                NEW.InventoryID,
                'Active'
            );
        END IF;
    END IF;
    
    -- Check for expiry warning (7 days before expiry)
    IF DATEDIFF(NEW.ExpiryDate, CURDATE()) <= 7 
        AND DATEDIFF(NEW.ExpiryDate, CURDATE()) > 0 
        AND NEW.Status = 'Available' THEN
        
        -- Check if active alert already exists
        SELECT COUNT(*) INTO alert_exists
        FROM ALERTS
        WHERE RelatedEntity = 'INVENTORY' 
            AND RelatedEntityID = NEW.InventoryID 
            AND Status = 'Active'
            AND AlertType = 'Expiry_Warning';
        
        IF alert_exists = 0 THEN
            INSERT INTO ALERTS (
                AlertType,
                Description,
                Priority,
                RelatedEntity,
                RelatedEntityID,
                Status
            )
            VALUES (
                'Expiry_Warning',
                CONCAT('Blood type ', NEW.BloodType, ' expires on ', NEW.ExpiryDate, ' (', DATEDIFF(NEW.ExpiryDate, CURDATE()), ' days remaining)'),
                'Medium',
                'INVENTORY',
                NEW.InventoryID,
                'Active'
            );
        END IF;
    END IF;
END //

DELIMITER ;

-- ===============================================
-- 5. STORED PROCEDURE 1: FulfillRequest
-- ===============================================
-- Fulfills a blood request by:
-- 1. Checking inventory availability
-- 2. Deducting from inventory
-- 3. Marking request as fulfilled
-- Uses transaction for data consistency

DELIMITER //

CREATE PROCEDURE FulfillRequest(
    IN p_request_id INT
)
BEGIN
    DECLARE v_quantity_required DECIMAL(5, 2);
    DECLARE v_quantity_available DECIMAL(5, 2);
    DECLARE v_blood_type VARCHAR(10);
    DECLARE v_patient_id INT;
    DECLARE v_quantity_allocated DECIMAL(5, 2) DEFAULT 0;
    DECLARE v_inventory_id INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_error_message VARCHAR(255);
    
    -- Declare cursor for available inventory matching blood type
    DECLARE inv_cursor CURSOR FOR
        SELECT InventoryID, QuantityAvailable 
        FROM BLOOD_INVENTORY
        WHERE BloodType = v_blood_type 
            AND Status = 'Available' 
            AND ExpiryDate > CURDATE()
        ORDER BY ExpiryDate ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET v_error_message = 'Error occurred during request fulfillment. Transaction rolled back.';
        SELECT v_error_message AS error_status;
    END;
    
    -- START TRANSACTION
    START TRANSACTION;
    
    -- Fetch request details
    SELECT br.QuantityRequired, br.BloodType, br.PatientID, br.Status
    INTO v_quantity_required, v_blood_type, v_patient_id, @current_status
    FROM BLOOD_REQUEST br
    WHERE br.RequestID = p_request_id;
    
    -- Validate request exists and status is appropriate
    IF v_quantity_required IS NULL THEN
        SET v_error_message = CONCAT('Request ID ', p_request_id, ' not found.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;
    
    IF @current_status = 'Fulfilled' THEN
        SET v_error_message = 'Request is already fulfilled.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;
    
    -- Check total available inventory for blood type
    SELECT COALESCE(SUM(QuantityAvailable), 0)
    INTO v_quantity_available
    FROM BLOOD_INVENTORY
    WHERE BloodType = v_blood_type 
        AND Status = 'Available' 
        AND ExpiryDate > CURDATE();
    
    IF v_quantity_available < v_quantity_required THEN
        SET v_error_message = CONCAT('Insufficient inventory. Required: ', v_quantity_required, 
                                      ' units, Available: ', v_quantity_available, ' units.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;
    
    -- Allocate inventory to request
    OPEN inv_cursor;
    
    allocate_loop: LOOP
        FETCH inv_cursor INTO v_inventory_id, v_quantity_available;
        
        IF v_done THEN
            LEAVE allocate_loop;
        END IF;
        
        IF v_quantity_allocated < v_quantity_required THEN
            IF v_quantity_available >= (v_quantity_required - v_quantity_allocated) THEN
                -- This inventory batch has enough
                INSERT INTO REQUEST_INVENTORY (RequestID, InventoryID, QuantityAllocated)
                VALUES (p_request_id, v_inventory_id, v_quantity_required - v_quantity_allocated);
                
                UPDATE BLOOD_INVENTORY
                SET QuantityAvailable = QuantityAvailable - (v_quantity_required - v_quantity_allocated)
                WHERE InventoryID = v_inventory_id;
                
                SET v_quantity_allocated = v_quantity_required;
            ELSE
                -- Use partial amount from this batch
                INSERT INTO REQUEST_INVENTORY (RequestID, InventoryID, QuantityAllocated)
                VALUES (p_request_id, v_inventory_id, v_quantity_available);
                
                UPDATE BLOOD_INVENTORY
                SET QuantityAvailable = 0
                WHERE InventoryID = v_inventory_id;
                
                SET v_quantity_allocated = v_quantity_allocated + v_quantity_available;
            END IF;
        END IF;
    END LOOP;
    
    CLOSE inv_cursor;
    
    -- Update request status to fulfilled
    UPDATE BLOOD_REQUEST
    SET Status = 'Fulfilled',
        FulfillmentDate = CURRENT_TIMESTAMP
    WHERE RequestID = p_request_id;
    
    -- Insert success audit log as alert
    INSERT INTO ALERTS (
        AlertType,
        Description,
        Priority,
        RelatedEntity,
        RelatedEntityID,
        Status
    )
    VALUES (
        'Request_Pending',
        CONCAT('Request ID ', p_request_id, ' successfully fulfilled with ', v_quantity_allocated, ' units of ', v_blood_type),
        'Low',
        'REQUEST',
        p_request_id,
        'Resolved'
    );
    
    COMMIT;
    SELECT CONCAT('SUCCESS: Request ', p_request_id, ' fulfilled. ', v_quantity_allocated, ' units allocated.') AS fulfillment_status;
    
END //

DELIMITER ;

-- ===============================================
-- 6. STORED PROCEDURE 2: MonthlyReport
-- ===============================================
-- Generates donation summary for a specific month
-- Groups donations by blood type with statistics

DELIMITER //

CREATE PROCEDURE MonthlyReport(
    IN p_month INT,
    IN p_year INT
)
BEGIN
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    
    -- Validate month and year
    IF p_month < 1 OR p_month > 12 THEN
        SELECT 'ERROR: Month must be between 1 and 12' AS error_message;
        LEAVE;
    END IF;
    
    -- Calculate date range for the month
    SET v_start_date = STR_TO_DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'), '%Y-%m-%d');
    SET v_end_date = LAST_DAY(v_start_date);
    
    -- SELECT monthly donation statistics
    SELECT 
        d.BloodType,
        COUNT(d.DonationID) as TotalDonations,
        SUM(CASE WHEN d.Status = 'Approved' THEN 1 ELSE 0 END) as ApprovedDonations,
        SUM(CASE WHEN d.Status = 'Rejected' THEN 1 ELSE 0 END) as RejectedDonations,
        SUM(CASE WHEN d.TestResults = 'Passed' THEN 1 ELSE 0 END) as PassedTests,
        SUM(CASE WHEN d.TestResults = 'Failed' THEN 1 ELSE 0 END) as FailedTests,
        ROUND(SUM(d.QuantityCollected), 2) as TotalQuantityCollected,
        ROUND(AVG(d.HemoglobinLevel), 2) as AvgHemoglobinLevel,
        ROUND(AVG(CAST(SUBSTRING_INDEX(d.BloodPressure, '/', 1) AS DECIMAL)), 1) as AvgSystolicBP,
        ROUND(AVG(d.BodyTemperature), 2) as AvgBodyTemp,
        MAX(d.DonationDate) as LastDonationDate
    FROM DONATION d
    WHERE MONTH(d.DonationDate) = p_month 
        AND YEAR(d.DonationDate) = p_year
    GROUP BY d.BloodType
    ORDER BY d.BloodType ASC;
    
    -- Summary statistics
    SELECT 
        CONCAT('Monthly Report: ', MONTHNAME(v_start_date), ' ', p_year) as ReportPeriod,
        COUNT(DISTINCT d.DonationID) as TotalDonationsMonth,
        COUNT(DISTINCT d.DonorID) as UniqueDonors,
        ROUND(SUM(d.QuantityCollected), 2) as TotalBloodCollected,
        ROUND(SUM(CASE WHEN d.Status = 'Approved' THEN d.QuantityCollected ELSE 0 END), 2) as ApprovedQuantity,
        ROUND(SUM(CASE WHEN d.Status = 'Rejected' THEN d.QuantityCollected ELSE 0 END), 2) as RejectedQuantity,
        CONCAT(ROUND(COUNT(CASE WHEN d.TestResults = 'Passed' THEN 1 END) / 
                     COUNT(d.DonationID) * 100, 2), '%') as TestPassRate
    FROM DONATION d
    WHERE MONTH(d.DonationDate) = p_month 
        AND YEAR(d.DonationDate) = p_year;
    
END //

DELIMITER ;

-- ===============================================
-- 7. CURSOR: RemoveExpiredStock
-- ===============================================
-- Loops through expired inventory records
-- Deletes expired stock and logs to alerts
-- Called periodically to maintain inventory cleanliness

DELIMITER //

CREATE PROCEDURE RemoveExpiredStock()
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_inventory_id INT;
    DECLARE v_blood_type VARCHAR(10);
    DECLARE v_quantity_expired DECIMAL(8, 2);
    DECLARE v_expiry_date DATE;
    DECLARE v_total_removed INT DEFAULT 0;
    DECLARE v_total_quantity_removed DECIMAL(8, 2) DEFAULT 0;
    
    -- Declare cursor for expired inventory
    DECLARE expired_cursor CURSOR FOR
        SELECT InventoryID, BloodType, QuantityAvailable, ExpiryDate
        FROM BLOOD_INVENTORY
        WHERE ExpiryDate < CURDATE() 
            AND Status IN ('Available', 'Reserved');
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT CONCAT('ERROR: Transaction rolled back after removing ', v_total_removed, ' batches.') AS error_status;
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    OPEN expired_cursor;
    
    expire_loop: LOOP
        FETCH expired_cursor INTO v_inventory_id, v_blood_type, v_quantity_expired, v_expiry_date;
        
        IF v_done THEN
            LEAVE expire_loop;
        END IF;
        
        -- Log expired batch to alerts before deletion
        INSERT INTO ALERTS (
            AlertType,
            Description,
            Priority,
            RelatedEntity,
            RelatedEntityID,
            Status
        )
        VALUES (
            'Expiry_Warning',
            CONCAT('EXPIRED STOCK REMOVED: Blood type ', v_blood_type, 
                   ' - Quantity: ', v_quantity_expired, ' units - Expired on: ', v_expiry_date),
            'High',
            'INVENTORY',
            v_inventory_id,
            'Resolved'
        );
        
        -- Update inventory status to Expired
        UPDATE BLOOD_INVENTORY
        SET Status = 'Expired',
            QuantityAvailable = 0,
            LastUpdated = CURRENT_TIMESTAMP
        WHERE InventoryID = v_inventory_id;
        
        -- Track statistics
        SET v_total_removed = v_total_removed + 1;
        SET v_total_quantity_removed = v_total_quantity_removed + v_quantity_expired;
        
    END LOOP;
    
    CLOSE expired_cursor;
    
    COMMIT;
    
    -- Report results
    IF v_total_removed > 0 THEN
        SELECT CONCAT('SUCCESS: ', v_total_removed, ' expired batches removed. Total quantity removed: ', 
                     ROUND(v_total_quantity_removed, 2), ' units.') AS removal_status;
    ELSE
        SELECT 'No expired inventory found to remove.' AS removal_status;
    END IF;
    
END //

DELIMITER ;

-- ===============================================
-- 8. SAMPLE INSERT DATA FOR TESTING
-- ===============================================

-- Insert Donors (5 donors)
INSERT INTO DONOR (FirstName, LastName, DateOfBirth, Gender, BloodType, Phone, Email, Address, City, State, PinCode, Status)
VALUES
('Rajesh', 'Kumar', '1985-05-15', 'M', 'O+', '9876543210', 'rajesh.kumar@email.com', '123 Main St', 'Delhi', 'Delhi', '110001', 'Active'),
('Priya', 'Singh', '1990-08-22', 'F', 'B+', '9876543211', 'priya.singh@email.com', '456 Oak Ave', 'Mumbai', 'Maharashtra', '400001', 'Active'),
('Amit', 'Patel', '1988-03-10', 'M', 'A+', '9876543212', 'amit.patel@email.com', '789 Pine Rd', 'Bangalore', 'Karnataka', '560001', 'Active'),
('Neha', 'Gupta', '1992-11-05', 'F', 'AB+', '9876543213', 'neha.gupta@email.com', '321 Elm St', 'Hyderabad', 'Telangana', '500001', 'Active'),
('Vikram', 'Sharma', '1987-07-18', 'M', 'O-', '9876543214', 'vikram.sharma@email.com', '654 Maple Ln', 'Pune', 'Maharashtra', '411001', 'Active');

-- Insert Hospital Staff (4 staff members)
INSERT INTO HOSPITAL_STAFF (FirstName, LastName, Role, Department, Phone, Email, EmployeeID, JoiningDate, Qualification, Status, HospitalName)
VALUES
('Dr. Arun', 'Bhat', 'Doctor', 'Blood_Bank', '7654321098', 'arun.bhat@hospital.com', 'EMP001', '2020-01-15', 'MD', 'Active', 'City General Hospital'),
('Kavya', 'Reddy', 'Technician', 'Lab', '7654321099', 'kavya.reddy@hospital.com', 'EMP002', '2019-06-20', 'BSc MLT', 'Active', 'City General Hospital'),
('Deepak', 'Yadav', 'Nurse', 'ER', '7654321100', 'deepak.yadav@hospital.com', 'EMP003', '2021-03-10', 'RN', 'Active', 'City General Hospital'),
('Dr. Sunita', 'Verma', 'Manager', 'Blood_Bank', '7654321101', 'sunita.verma@hospital.com', 'EMP004', '2018-11-25', 'MD, DMLT', 'Active', 'City General Hospital');

-- Insert Patients (3 patients for requests)
INSERT INTO PATIENT (FirstName, LastName, DateOfBirth, Gender, BloodType, Phone, Email, Address, City, State, PinCode, Status)
VALUES
('Suresh', 'Rao', '1965-04-12', 'M', 'O+', '8765432100', 'suresh.rao@email.com', '111 Hospital Rd', 'Delhi', 'Delhi', '110002', 'Active'),
('Anjali', 'Desai', '1975-09-28', 'F', 'B+', '8765432101', 'anjali.desai@email.com', '222 Health St', 'Mumbai', 'Maharashtra', '400002', 'Active'),
('Karan', 'Chopra', '1980-01-14', 'M', 'A+', '8765432102', 'karan.chopra@email.com', '333 Care Ave', 'Bangalore', 'Karnataka', 'Active', '560002');

-- Insert Blood Donations (approved donations to build inventory)
INSERT INTO DONATION (DonorID, DonationDate, BloodType, QuantityCollected, Status, TestResults, HemoglobinLevel, BloodPressure, BodyTemperature, Notes)
VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'O+', 0.45, 'Approved', 'Passed', 14.5, '120/80', 36.8, 'Routine donation'),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'B+', 0.45, 'Approved', 'Passed', 13.2, '118/76', 36.6, 'Regular donor'),
(3, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'A+', 0.45, 'Approved', 'Passed', 14.0, '122/82', 36.7, 'Routine donation'),
(4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'AB+', 0.45, 'Approved', 'Passed', 12.8, '116/74', 36.5, 'Regular donor'),
(5, CURDATE(), 'O-', 0.45, 'Tested', 'Pending', 14.2, '119/79', 36.9, 'Just completed testing'),
(1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'O+', 0.45, 'Approved', 'Passed', 14.6, '121/81', 36.8, 'Previous donation');

-- Insert Blood Inventory (8 inventory batches with varying stock levels)
INSERT INTO BLOOD_INVENTORY (BloodType, QuantityAvailable, ExpiryDate, StorageLocation, Temperature, Status)
VALUES
('O+', 4.5, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Cold Storage A', 4.0, 'Available'),
('O+', 2.0, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Cold Storage B', 4.0, 'Available'),  -- LOW STOCK ALERT
('B+', 5.5, DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'Cold Storage A', 4.0, 'Available'),
('A+', 3.5, DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'Cold Storage C', 4.0, 'Available'),
('AB+', 1.8, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Cold Storage B', 4.0, 'Available'),  -- LOW STOCK & NEAR EXPIRY
('O-', 0.45, DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'Rare Blood Storage', 4.0, 'Available'),
('B-', 2.3, DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'Cold Storage D', 4.0, 'Available'),
('A-', 6.0, DATE_ADD(CURDATE(), INTERVAL 38 DAY), 'Cold Storage A', 4.0, 'Available');

-- Insert Blood Requests (4 requests)
INSERT INTO BLOOD_REQUEST (PatientID, StaffID, BloodType, QuantityRequired, RequestDate, RequiredByDate, Status, Priority, Reason)
VALUES
(1, 1, 'O+', 2.0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Pending', 'Emergency', 'Accident victim - urgent transfusion'),
(2, 2, 'B+', 1.5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Approved', 'Urgent', 'Pre-surgery requirement'),
(3, 3, 'A+', 2.5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Pending', 'Normal', 'Post-surgery recovery'),
(1, 1, 'AB+', 1.0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Pending', 'Emergency', 'Rare blood type - critical condition');

-- ===============================================
-- 9. VERIFICATION QUERIES (Run after inserting data)
-- ===============================================

-- View current donor status
-- SELECT * FROM vw_donor_eligibility;

-- View pending blood requests
-- SELECT * FROM vw_pending_requests;

-- View blood stock summary
-- SELECT * FROM vw_blood_stock_summary;

-- Check alerts generated
-- SELECT * FROM ALERTS WHERE Status = 'Active' ORDER BY Priority DESC, CreatedDate DESC;

-- ===============================================
-- END OF BLOOD BANK DATABASE SCHEMA
-- ===============================================
