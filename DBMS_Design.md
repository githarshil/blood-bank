# Blood Bank & Donor Management System - DBMS Design

## 1. ER DIAGRAM DESCRIPTION

### 1.1 Entities & Attributes

#### **DONOR**

- **Attributes:**
  - `DonorID` (PK)
  - `FirstName`
  - `LastName`
  - `DateOfBirth`
  - `Gender` (M/F/Other)
  - `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `Phone`
  - `Email`
  - `Address`
  - `City`
  - `State`
  - `PinCode`
  - `LastDonationDate`
  - `DonationCount`
  - `RegistrationDate`
  - `Status` (Active/Inactive/Suspended)

#### **PATIENT**

- **Attributes:**
  - `PatientID` (PK)
  - `FirstName`
  - `LastName`
  - `DateOfBirth`
  - `Gender` (M/F/Other)
  - `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `Phone`
  - `Email`
  - `Address`
  - `City`
  - `State`
  - `PinCode`
  - `RegistrationDate`
  - `Status` (Active/Discharged/Deceased)

#### **BLOOD_INVENTORY**

- **Attributes:**
  - `InventoryID` (PK)
  - `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `QuantityAvailable` (in units)
  - `ExpiryDate`
  - `StorageLocation`
  - `Temperature` (stored as float)
  - `LastUpdated`
  - `Status` (Available/Reserved/Expired/Discarded)

#### **DONATION**

- **Attributes:**
  - `DonationID` (PK)
  - `DonorID` (FK)
  - `DonationDate`
  - `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `QuantityCollected` (in units, typically 450 mL = 1 unit)
  - `Status` (Collected/Tested/Approved/Rejected)
  - `TestResults` (Passed/Failed)
  - `HemoglobinLevel`
  - `BloodPressure`
  - `BodyTemperature`
  - `Notes`

#### **BLOOD_REQUEST**

- **Attributes:**
  - `RequestID` (PK)
  - `PatientID` (FK)
  - `HospitalStaffID` (FK)
  - `BloodType` (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `QuantityRequired` (in units)
  - `RequestDate`
  - `RequiredByDate`
  - `Status` (Pending/Approved/Fulfilled/Rejected/Cancelled)
  - `Priority` (Normal/Urgent/Emergency)
  - `Reason` (Surgery/Accident/Treatment/Other)
  - `FulfillmentDate`

#### **HOSPITAL_STAFF**

- **Attributes:**
  - `StaffID` (PK)
  - `FirstName`
  - `LastName`
  - `Role` (Doctor/Nurse/Technician/Manager)
  - `Department` (Lab/Blood_Bank/ICU/ER/OT/etc)
  - `Phone`
  - `Email`
  - `EmployeeID`
  - `JoiningDate`
  - `Qualification`
  - `Status` (Active/Inactive/On_Leave)
  - `HospitalName`

#### **ALERTS**

- **Attributes:**
  - `AlertID` (PK)
  - `AlertType` (Low_Stock/Expiry_Warning/Request_Pending/Donor_Inactive/Blood_Shortage)
  - `Description`
  - `CreatedDate`
  - `ResolvedDate`
  - `Status` (Active/Resolved)
  - `Priority` (Low/Medium/High/Critical)
  - `RelatedEntity` (BloodType/InventoryID/RequestID/DonorID)
  - `RelatedEntityID`

---

### 1.2 Relationships & Cardinality

| **Relationship**  | **From Entity** | **To Entity**   | **Cardinality** | **Type**     | **Description**                                                         |
| ----------------- | --------------- | --------------- | --------------- | ------------ | ----------------------------------------------------------------------- |
| **DONATE**        | Donor           | Donation        | 1:N             | One-to-Many  | One donor can make multiple donations over time                         |
| **REQUEST_FOR**   | Patient         | Blood_Request   | 1:N             | One-to-Many  | One patient can request multiple blood units                            |
| **STAFF_MANAGES** | Hospital_Staff  | Blood_Request   | 1:N             | One-to-Many  | One staff member can manage multiple requests                           |
| **TRACKS**        | Blood_Request   | Blood_Inventory | N:M             | Many-to-Many | Many requests can draw from inventory; inventory supplies many requests |
| **STORES**        | Blood_Inventory | (entity itself) | N/A             | Self         | Inventory tracks different blood types separately                       |
| **TRIGGERS**      | Blood_Inventory | Alerts          | 1:N             | One-to-Many  | Inventory levels trigger alerts (low stock, expiry)                     |
| **TRIGGERS**      | Blood_Request   | Alerts          | 1:N             | One-to-Many  | Pending requests can trigger alerts                                     |
| **TRIGGERS**      | Donor           | Alerts          | 1:N             | One-to-Many  | Donor inactivity triggers alerts                                        |
| **FULFILL**       | Donation        | Blood_Inventory | N:1             | Many-to-One  | Approved donations add to inventory                                     |

---

### 1.3 ER Diagram (Text Representation)

```
┌─────────────┐
│   DONOR     │
├─────────────┤
│ DonorID(PK) │
│ FirstName   │
│ LastName    │
│ DOB         │
│ Gender      │
│ BloodType   │
│ Phone       │
│ Email       │
│ Address     │
│ City        │
│ State       │
│ PinCode     │
│ LastDonDate │
│ DonCount    │
│ RegDate     │
│ Status      │
└────────┬────┘
         │
         │ 1:N (DONATE)
         │
         ▼
┌─────────────────┐
│   DONATION      │
├─────────────────┤
│ DonationID(PK)  │
│ DonorID(FK)     │
│ DonationDate    │
│ BloodType       │
│ QtyCollected    │
│ Status          │
│ TestResults     │
│ HemoglobinLevel │
│ BloodPressure   │
│ BodyTemp        │
│ Notes           │
└────────┬────────┘
         │
         │ N:1 (FULFILL)
         │
         ▼
   ┌──────────────────────┐
   │  BLOOD_INVENTORY     │
   ├──────────────────────┤
   │ InventoryID(PK)      │
   │ BloodType            │
   │ QuantityAvailable    │
   │ ExpiryDate           │
   │ StorageLocation      │
   │ Temperature          │
   │ LastUpdated          │
   │ Status               │
   └──────────┬───────────┘
              │
              │ 1:N (TRIGGERS)
              │
              ▼
         ┌──────────┐
         │  ALERTS  │
         ├──────────┤
         │AlertID(PK)│
         │AlertType │
         │Description│
         │CreatedDate│
         │ResolvedDate│
         │Status     │
         │Priority   │
         │RelEntity  │
         │RelEntityID│
         └──────────┘

┌─────────────┐
│   PATIENT   │
├─────────────┤
│PatientID(PK)│
│FirstName    │
│LastName     │
│DOB          │
│Gender       │
│BloodType    │
│Phone        │
│Email        │
│Address      │
│City         │
│State        │
│PinCode      │
│RegDate      │
│Status       │
└────────┬────┘
         │
         │ 1:N (REQUEST_FOR)
         │
         ▼
   ┌─────────────────┐
   │ BLOOD_REQUEST   │
   ├─────────────────┤
   │ RequestID(PK)   │
   │ PatientID(FK)   │
   │ StaffID(FK)     │
   │ BloodType       │
   │ QtyRequired     │
   │ RequestDate     │
   │ RequiredByDate  │
   │ Status          │
   │ Priority        │
   │ Reason          │
   │ FulfillmentDate │
   └────────┬────────┘
            │
            │ 1:N (STAFF_MANAGES)
            │◄─ N:1
            │
┌───────────┴──────────┐
│  HOSPITAL_STAFF      │
├──────────────────────┤
│ StaffID(PK)          │
│ FirstName            │
│ LastName             │
│ Role                 │
│ Department           │
│ Phone                │
│ Email                │
│ EmployeeID           │
│ JoiningDate          │
│ Qualification        │
│ Status               │
│ HospitalName         │
└──────────────────────┘
```

---

## 2. NORMALIZED TABLE STRUCTURES (Up to 3NF)

### 2.1 DONOR Table

```sql
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
    INDEX idx_city (City)
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic; no repeating groups. Phone and Email are unique to ensure single contact methods per donor.
- **2NF:** No partial dependencies. All non-key attributes depend on the entire PK (DonorID).
- **3NF:** No transitive dependencies. No non-key attribute depends on another non-key attribute. City, State, PinCode could theoretically depend on each other, but we keep them for simplicity and flexibility (not all cities in a state have the same pin code pattern).

---

### 2.2 PATIENT Table

```sql
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
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic.
- **2NF:** No partial dependencies; all attributes depend on PatientID.
- **3NF:** No transitive dependencies; minimal derivable attributes.

---

### 2.3 HOSPITAL_STAFF Table

```sql
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
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic; no repeating groups.
- **2NF:** No partial dependencies.
- **3NF:** No transitive dependencies; HospitalName is included as context (could be in separate hospital table if multi-hospital system exists).

---

### 2.4 DONATION Table

```sql
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
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic; BloodType duplicated from DONOR for denormalization purposes (query optimization).
- **2NF:** No partial dependencies; all attributes depend on DonationID.
- **3NF:** No transitive dependencies; medical test attributes (HemoglobinLevel, BloodPressure, BodyTemperature) directly relate to the donation event.

---

### 2.5 BLOOD_INVENTORY Table

```sql
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
    INDEX idx_expiry (ExpiryDate)
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic; each inventory record represents a specific batch of blood.
- **2NF:** No partial dependencies.
- **3NF:** No transitive dependencies; QuantityAvailable, ExpiryDate, and StorageLocation are independent attributes related to the inventory batch.
- **Unique Constraint:** Ensures we don't have duplicate inventory for the same blood type, expiry date, and location.

---

### 2.6 BLOOD_REQUEST Table

```sql
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
    INDEX idx_required_date (RequiredByDate)
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic.
- **2NF:** No partial dependencies; all attributes depend on RequestID.
- **3NF:** No transitive dependencies; attributes (Priority, Status, Reason) are independent and directly relate to the request event.

---

### 2.7 REQUEST_INVENTORY Junction Table (For N:M Relationship)

```sql
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
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic.
- **2NF:** Proper junction table for N:M relationship; composite PK avoids duplicates.
- **3NF:** No transitive dependencies; QuantityAllocated is directly related to the junction entity.

---

### 2.8 ALERTS Table

```sql
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
    INDEX idx_related (RelatedEntity, RelatedEntityID)
);
```

**Normalization Rationale:**

- **1NF:** All attributes are atomic.
- **2NF:** No partial dependencies.
- **3NF:** No transitive dependencies; alert attributes are independent and describe the alert event.
- **Flexible Design:** RelatedEntity and RelatedEntityID allow for polymorphic relationships without explicit foreign keys (avoiding over-normalization for different alert types).

---

## 3. PRIMARY KEYS, FOREIGN KEYS & CONSTRAINTS

### 3.1 Primary Keys (PK)

| **Table**         | **Primary Key**          | **Type**      | **Auto-Increment** |
| ----------------- | ------------------------ | ------------- | ------------------ |
| DONOR             | DonorID                  | INT           | Yes                |
| PATIENT           | PatientID                | INT           | Yes                |
| HOSPITAL_STAFF    | StaffID                  | INT           | Yes                |
| DONATION          | DonationID               | INT           | Yes                |
| BLOOD_INVENTORY   | InventoryID              | INT           | Yes                |
| BLOOD_REQUEST     | RequestID                | INT           | Yes                |
| REQUEST_INVENTORY | (RequestID, InventoryID) | Composite INT | No                 |
| ALERTS            | AlertID                  | INT           | Yes                |

---

### 3.2 Foreign Keys (FK)

| **Table**         | **Foreign Key** | **References**               | **ON DELETE** | **ON UPDATE** |
| ----------------- | --------------- | ---------------------------- | ------------- | ------------- |
| DONATION          | DonorID         | DONOR(DonorID)               | RESTRICT      | CASCADE       |
| BLOOD_REQUEST     | PatientID       | PATIENT(PatientID)           | RESTRICT      | CASCADE       |
| BLOOD_REQUEST     | StaffID         | HOSPITAL_STAFF(StaffID)      | RESTRICT      | CASCADE       |
| REQUEST_INVENTORY | RequestID       | BLOOD_REQUEST(RequestID)     | CASCADE       | CASCADE       |
| REQUEST_INVENTORY | InventoryID     | BLOOD_INVENTORY(InventoryID) | RESTRICT      | CASCADE       |

---

### 3.3 Unique Constraints

| **Table**       | **Constraint**        | **Columns**                              | **Purpose**                               |
| --------------- | --------------------- | ---------------------------------------- | ----------------------------------------- |
| DONOR           | UNIQUE                | Phone                                    | Prevent duplicate contact                 |
| DONOR           | UNIQUE                | Email                                    | Prevent duplicate contact                 |
| PATIENT         | (No UNIQUE except PK) | -                                        | Phone not unique (shared family contacts) |
| HOSPITAL_STAFF  | UNIQUE                | Phone                                    | Prevent duplicate contact                 |
| HOSPITAL_STAFF  | UNIQUE                | Email                                    | Prevent duplicate contact                 |
| HOSPITAL_STAFF  | UNIQUE                | EmployeeID                               | Ensure unique employee ID                 |
| BLOOD_INVENTORY | UNIQUE                | (BloodType, ExpiryDate, StorageLocation) | Prevent duplicate batches                 |

---

### 3.4 Check Constraints

| **Table**         | **Column(s)**     | **Constraint**          | **Purpose**           |
| ----------------- | ----------------- | ----------------------- | --------------------- |
| DONOR             | DateOfBirth       | Age between 18-65 years | Donor eligibility     |
| DONATION          | QuantityCollected | > 0                     | Valid donation amount |
| BLOOD_INVENTORY   | QuantityAvailable | >= 0                    | Non-negative stock    |
| BLOOD_INVENTORY   | ExpiryDate        | > CURDATE()             | Prevent expired stock |
| BLOOD_REQUEST     | QuantityRequired  | > 0                     | Valid request amount  |
| BLOOD_REQUEST     | RequiredByDate    | > RequestDate           | Logical date ordering |
| REQUEST_INVENTORY | QuantityAllocated | > 0                     | Valid allocation      |

---

### 3.5 Default Constraints

| **Table**         | **Column**        | **Default Value**           | **Purpose**              |
| ----------------- | ----------------- | --------------------------- | ------------------------ |
| DONOR             | DonationCount     | 0                           | Initialize count         |
| DONOR             | RegistrationDate  | CURRENT_TIMESTAMP           | Track registration time  |
| DONOR             | Status            | 'Active'                    | Default status           |
| PATIENT           | RegistrationDate  | CURRENT_TIMESTAMP           | Track registration time  |
| PATIENT           | Status            | 'Active'                    | Default status           |
| DONATION          | DonationDate      | CURRENT_TIMESTAMP           | Track donation time      |
| DONATION          | Status            | 'Collected'                 | Initial status           |
| DONATION          | TestResults       | 'Pending'                   | Initial test status      |
| BLOOD_INVENTORY   | QuantityAvailable | 0                           | Initialize stock         |
| BLOOD_INVENTORY   | Status            | 'Available'                 | Initial inventory status |
| BLOOD_INVENTORY   | LastUpdated       | CURRENT_TIMESTAMP ON UPDATE | Track modifications      |
| BLOOD_REQUEST     | RequestDate       | CURRENT_TIMESTAMP           | Track request time       |
| BLOOD_REQUEST     | Status            | 'Pending'                   | Initial request status   |
| BLOOD_REQUEST     | Priority          | 'Normal'                    | Default priority         |
| REQUEST_INVENTORY | AllocationDate    | CURRENT_TIMESTAMP           | Track allocation time    |
| ALERTS            | CreatedDate       | CURRENT_TIMESTAMP           | Track creation time      |
| ALERTS            | Status            | 'Active'                    | Initial alert status     |
| ALERTS            | Priority          | 'Medium'                    | Default priority         |

---

### 3.6 NOT NULL Constraints

| **Table**         | **Columns**                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| DONOR             | FirstName, LastName, DateOfBirth, Gender, BloodType, Phone, RegistrationDate        |
| PATIENT           | FirstName, LastName, DateOfBirth, Gender, BloodType, Phone, RegistrationDate        |
| HOSPITAL_STAFF    | FirstName, LastName, Role, Department, Phone, EmployeeID, JoiningDate, HospitalName |
| DONATION          | DonorID, BloodType, QuantityCollected, DonationDate                                 |
| BLOOD_INVENTORY   | BloodType, QuantityAvailable, ExpiryDate                                            |
| BLOOD_REQUEST     | PatientID, StaffID, BloodType, QuantityRequired, RequestDate, RequiredByDate        |
| REQUEST_INVENTORY | RequestID, InventoryID, QuantityAllocated                                           |
| ALERTS            | AlertType, Description, CreatedDate                                                 |

---

## 4. ADDITIONAL IMPLEMENTATION CONSIDERATIONS

### 4.1 Indexes for Performance

```sql
-- Additional indexes for frequently queried fields
CREATE INDEX idx_donor_blood_active ON DONOR(BloodType, Status);
CREATE INDEX idx_inventory_blood_available ON BLOOD_INVENTORY(BloodType, Status);
CREATE INDEX idx_request_status_date ON BLOOD_REQUEST(Status, RequestDate);
CREATE INDEX idx_donation_approved ON DONATION(Status, DonationDate);
CREATE INDEX idx_alert_active_priority ON ALERTS(Status, Priority);
```

### 4.2 Views for Common Queries

```sql
-- View: Available Blood Stock by Type
CREATE VIEW vw_blood_stock_summary AS
SELECT BloodType, SUM(QuantityAvailable) as TotalQuantity, COUNT(*) as BatchCount
FROM BLOOD_INVENTORY
WHERE Status = 'Available' AND ExpiryDate > CURDATE()
GROUP BY BloodType;

-- View: Pending Requests
CREATE VIEW vw_pending_requests AS
SELECT r.RequestID, p.FirstName, p.LastName, r.BloodType, r.QuantityRequired,
       r.Priority, r.RequiredByDate, s.FirstName as StaffName
FROM BLOOD_REQUEST r
JOIN PATIENT p ON r.PatientID = p.PatientID
JOIN HOSPITAL_STAFF s ON r.StaffID = s.StaffID
WHERE r.Status = 'Pending'
ORDER BY r.Priority DESC, r.RequiredByDate ASC;

-- View: Donor Eligibility Status
CREATE VIEW vw_donor_eligibility AS
SELECT DonorID, FirstName, LastName, BloodType,
       DATEDIFF(CURDATE(), LastDonationDate) as DaysSinceLastDonation,
       CASE
           WHEN LastDonationDate IS NULL THEN 'Eligible - Never Donated'
           WHEN DATEDIFF(CURDATE(), LastDonationDate) >= 56 THEN 'Eligible - 56 Days Passed'
           ELSE 'Not Eligible'
       END as DonationEligibility
FROM DONOR
WHERE Status = 'Active';
```

### 4.3 Sample Triggers

```sql
-- Trigger: Update LastDonationDate in DONOR after approved donation
DELIMITER //
CREATE TRIGGER trg_update_donor_after_donation
AFTER UPDATE ON DONATION
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Approved' AND OLD.Status != 'Approved' THEN
        UPDATE DONOR
        SET LastDonationDate = CURDATE(),
            DonationCount = DonationCount + 1
        WHERE DonorID = NEW.DonorID;
    END IF;
END//
DELIMITER ;

-- Trigger: Alert when blood stock falls below threshold
DELIMITER //
CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE ON BLOOD_INVENTORY
FOR EACH ROW
BEGIN
    IF NEW.QuantityAvailable < 5 AND NEW.Status = 'Available' THEN
        INSERT INTO ALERTS (AlertType, Description, Priority, RelatedEntity, RelatedEntityID, Status)
        VALUES ('Low_Stock', CONCAT('Low stock alert for ', NEW.BloodType), 'High', 'INVENTORY', NEW.InventoryID, 'Active');
    END IF;
END//
DELIMITER ;

-- Trigger: Alert when blood expires soon
DELIMITER //
CREATE TRIGGER trg_expiry_warning_alert
AFTER UPDATE ON BLOOD_INVENTORY
FOR EACH ROW
BEGIN
    IF DATEDIFF(NEW.ExpiryDate, CURDATE()) <= 7 AND NEW.Status = 'Available' THEN
        INSERT INTO ALERTS (AlertType, Description, Priority, RelatedEntity, RelatedEntityID, Status)
        VALUES ('Expiry_Warning', CONCAT('Blood expires in 7 days: ', NEW.BloodType), 'Medium', 'INVENTORY', NEW.InventoryID, 'Active');
    END IF;
END//
DELIMITER ;
```

---

## 5. SUMMARY TABLE

| **Aspect**               | **Details**                        |
| ------------------------ | ---------------------------------- |
| **Total Entities**       | 7 main entities + 1 junction table |
| **Total Relationships**  | 9 relationships (1:N, N:M)         |
| **Normalization Level**  | 3NF (Third Normal Form)            |
| **Primary Keys**         | 8 (7 simple + 1 composite)         |
| **Foreign Keys**         | 5                                  |
| **Unique Constraints**   | 7                                  |
| **Check Constraints**    | 7                                  |
| **Default Constraints**  | 17                                 |
| **NOT NULL Constraints** | 47                                 |

---

## 6. ENTITY-RELATIONSHIP DIAGRAM (Mermaid Format)

```mermaid
erDiagram
    DONOR ||--o{ DONATION : makes
    DONOR ||--o{ ALERTS : triggers
    PATIENT ||--o{ BLOOD_REQUEST : requests
    HOSPITAL_STAFF ||--o{ BLOOD_REQUEST : manages
    BLOOD_REQUEST ||--o{ REQUEST_INVENTORY : contains
    BLOOD_INVENTORY ||--o{ REQUEST_INVENTORY : fulfilled_by
    BLOOD_INVENTORY ||--o{ ALERTS : triggers
    BLOOD_REQUEST ||--o{ ALERTS : triggers

    DONOR {
        int DonorID PK
        string FirstName
        string LastName
        date DateOfBirth
        enum Gender
        enum BloodType
        string Phone UK
        string Email UK
        string Address
        string City
        string State
        string PinCode
        date LastDonationDate
        int DonationCount
        datetime RegistrationDate
        enum Status
    }

    PATIENT {
        int PatientID PK
        string FirstName
        string LastName
        date DateOfBirth
        enum Gender
        enum BloodType
        string Phone
        string Email
        string Address
        string City
        string State
        string PinCode
        datetime RegistrationDate
        enum Status
    }

    HOSPITAL_STAFF {
        int StaffID PK
        string FirstName
        string LastName
        enum Role
        string Department
        string Phone UK
        string Email UK
        string EmployeeID UK
        date JoiningDate
        string Qualification
        enum Status
        string HospitalName
    }

    DONATION {
        int DonationID PK
        int DonorID FK
        datetime DonationDate
        enum BloodType
        decimal QuantityCollected
        enum Status
        enum TestResults
        decimal HemoglobinLevel
        string BloodPressure
        decimal BodyTemperature
        text Notes
    }

    BLOOD_INVENTORY {
        int InventoryID PK
        enum BloodType
        decimal QuantityAvailable
        date ExpiryDate
        string StorageLocation
        decimal Temperature
        datetime LastUpdated
        enum Status
    }

    BLOOD_REQUEST {
        int RequestID PK
        int PatientID FK
        int StaffID FK
        enum BloodType
        decimal QuantityRequired
        datetime RequestDate
        datetime RequiredByDate
        enum Status
        enum Priority
        string Reason
        datetime FulfillmentDate
    }

    REQUEST_INVENTORY {
        int RequestID FK PK
        int InventoryID FK PK
        decimal QuantityAllocated
        datetime AllocationDate
    }

    ALERTS {
        int AlertID PK
        enum AlertType
        text Description
        datetime CreatedDate
        datetime ResolvedDate
        enum Status
        enum Priority
        string RelatedEntity
        int RelatedEntityID
    }
```
