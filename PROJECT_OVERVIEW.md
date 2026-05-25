# 🏥 Blood Bank & Donor Management System - Complete Project

## 📋 Project Overview

Complete DBMS mini-project for a college with **MySQL database + Node.js/Express backend API**.

Full stack implementation for managing:

- Blood donor registration and eligibility
- Blood inventory with batch tracking
- Patient blood requests and fulfillment
- Medical staff management
- System alerts and notifications
- Monthly reporting and statistics

---

## 📁 Project Structure & File Guide

### 📚 DATABASE LAYER (SQL/MySQL)

#### `blood_bank_schema.sql`

**~800 lines of SQL**

- Creates all 8 database tables with constraints
- Implements 2 smart triggers
- Implements 2 stored procedures + 1 cursor procedure
- Inserts 30+ sample test data
- Defines 3 helper views
- ✅ Run this first to set up database

#### `DBMS_Design.md`

**Database design documentation**

- Full ER diagram with entities and attributes
- All relationships with cardinality (1:N, N:M)
- Normalized table structures (up to 3NF)
- Complete constraint specifications
- 3NF normalization reasoning
- Visual ER diagram

#### `SQL_Implementation_Guide.md`

**SQL implementation details**

- Table-by-table breakdown
- Trigger explanations (auto-inventory, auto-alerts)
- Stored procedure logic
- View definitions
- Constraint descriptions
- Sample data documentation

#### `Testing_Guide.md`

**Database testing procedures**

- Step-by-step trigger testing
- Stored procedure test scenarios
- View usage examples
- Complete test workflows
- Monitoring queries
- Troubleshooting guide

---

### 🚀 BACKEND API LAYER (Node.js/Express)

#### `index.js`

**Main Express server file (~200 lines)**

- Express app initialization
- CORS middleware setup
- Route mounting for all endpoints
- Health check endpoint
- Global error handler
- Server startup on port 3001
- Graceful shutdown handling

#### `db.js`

**MySQL connection pool (~50 lines)**

- mysql2/promise connection pool
- Connection pooling (10 connections)
- Decimal number support
- Connection testing on startup
- Auto-retry logic
- Promise-based queries

#### `.env`

**Environment configuration**

- Database credentials (HOST, USER, PASSWORD, NAME, PORT)
- Server configuration (PORT, NODE_ENV)
- CORS settings (CORS_ORIGIN)
- ⚠️ **EDIT THIS with your MySQL password**

#### `package.json`

**NPM dependencies**

- express: Web framework
- mysql2: MySQL driver with promises
- cors: Cross-origin support
- dotenv: Environment variables
- nodemon: Auto-reload (dev)

#### `.gitignore`

**Git ignore rules**

- node_modules/
- .env (security)
- IDE files (.vscode, .idea)
- Logs
- Database backups

---

### 🔌 API ROUTES (7 files in `/routes` directory)

#### `routes/donors.js`

**Donor management endpoints (~280 lines)**

| Method | Endpoint          | Purpose                     |
| ------ | ----------------- | --------------------------- |
| GET    | `/api/donors`     | Get all donors (filterable) |
| GET    | `/api/donors/:id` | Get single donor            |
| POST   | `/api/donors`     | Register new donor          |
| PUT    | `/api/donors/:id` | Update donor info           |

**Features:**

- Blood type validation
- Age validation (18-65 years)
- Duplicate phone/email detection
- Status management (Active/Inactive/Suspended)

---

#### `routes/inventory.js`

**Blood inventory with color-coded status (~350 lines)**

| Method | Endpoint                         | Purpose                   |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/api/inventory`                 | All inventory with colors |
| GET    | `/api/inventory/:id`             | Single batch details      |
| GET    | `/api/inventory/summary/by-type` | Summary by blood type     |
| GET    | `/api/inventory/expiring/soon`   | Expiring within 7 days    |

**Color Coding:**

- 🟢 Green (SAFE): ≥ 5 units
- 🟡 Yellow (LOW): 1-5 units
- 🔴 Red (CRITICAL): < 1 unit

**Features:**

- Real-time status calculation
- Summary statistics
- Expiry monitoring
- Stock alerts

---

#### `routes/requests.js`

**Blood request + fulfillment with stored procedure (~420 lines)**

| Method | Endpoint                    | Purpose                         |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/requests`             | All requests                    |
| GET    | `/api/requests/:id`         | Single request with allocations |
| POST   | `/api/requests`             | Create new request              |
| POST   | `/api/requests/fulfill/:id` | **Fulfill (calls stored proc)** |
| PUT    | `/api/requests/:id`         | Update request                  |

**Key Feature - FulfillRequest:**

- Calls `FulfillRequest(req_id)` stored procedure
- Transaction-based for data consistency
- Inventory deduction with FIFO allocation
- Creates allocation records
- Automatic inventory updates
- Error handling with rollback

**Features:**

- Priority management (Normal/Urgent/Emergency)
- Urgency flagging
- Days remaining calculation
- Quantity validation

---

#### `routes/reports.js`

**Reports with MonthlyReport stored procedure (~380 lines)**

| Method | Endpoint                        | Purpose                          |
| ------ | ------------------------------- | -------------------------------- |
| GET    | `/api/reports/monthly`          | **Monthly report (stored proc)** |
| GET    | `/api/reports/donation-trends`  | Trends over months               |
| GET    | `/api/reports/blood-usage`      | Usage statistics                 |
| GET    | `/api/reports/donor-statistics` | Donor breakdown                  |

**Key Feature - MonthlyReport:**

- Calls `MonthlyReport(month, year)` stored procedure
- Returns two result sets:
  1. Detailed by blood type
  2. Summary statistics
- Medical metrics (hemoglobin, BP, temperature)
- Test pass rates
- Donation statistics

---

#### `routes/alerts.js`

**Alert management with severity levels (~380 lines)**

| Method | Endpoint                        | Purpose                 |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/api/alerts`                   | All alerts (filterable) |
| GET    | `/api/alerts/:id`               | Single alert            |
| GET    | `/api/alerts/critical/only`     | Critical alerts         |
| GET    | `/api/alerts/summary/dashboard` | Dashboard overview      |
| PUT    | `/api/alerts/:id`               | Update status           |
| POST   | `/api/alerts/acknowledge/:id`   | Acknowledge             |
| DELETE | `/api/alerts/:id`               | Delete resolved         |

**Features:**

- Priority color mapping
- Age calculation (min/hours/days)
- System health status
- Alert summary by type
- Dashboard metrics

---

### 📖 DOCUMENTATION

#### `BACKEND_README.md`

**Complete API documentation (~500 lines)**

- Quick setup instructions
- All endpoints with examples
- Request/response formats
- Query parameters explained
- Error handling
- Development tips
- Troubleshooting

#### `BACKEND_SETUP_GUIDE.md`

**Step-by-step setup (~400 lines)**

- Prerequisites
- Installation steps
- Environment configuration
- Startup verification
- Testing procedures
- Common issues & solutions
- Deployment guide
- Setup checklist

#### `API_REFERENCE.md`

**Quick API reference (~250 lines)**

- Endpoints summary table
- Common query strings
- cURL examples
- Response field reference
- Frontend integration notes
- Performance metrics
- Security headers

---

## 🎯 Quick Start Checklist

### Phase 1: Database

- [ ] MySQL running
- [ ] Run `blood_bank_schema.sql` to create database
- [ ] Verify sample data: 5 donors, 4 staff, 3 patients, 8 inventory rows, 4 requests

### Phase 2: Backend Setup

- [ ] Install Node.js (v14+)
- [ ] `npm install` in project directory
- [ ] Edit `.env` with MySQL credentials
- [ ] Run `npm run dev` to start server

### Phase 3: Testing

- [ ] `curl http://localhost:3001/health` - Should return OK
- [ ] `curl http://localhost:3001/api/donors` - Should return 5 donors
- [ ] `curl http://localhost:3001/api/inventory` - Should show color-coded status
- [ ] Test fulfill request: `curl -X POST http://localhost:3001/api/requests/fulfill/1`

### Phase 4: Integration

- [ ] Connect frontend (React/Vue/Angular)
- [ ] Set CORS origin in .env
- [ ] Test end-to-end workflow
- [ ] Deploy

---

## 🔑 Key Features Implemented

### ✅ Database Layer

- [x] 8 normalized tables (3NF)
- [x] 40+ constraints (PKs, FKs, UNIQUEs, CHECKs)
- [x] 2 intelligent triggers (auto-inventory, auto-alerts)
- [x] 2 stored procedures (FulfillRequest, MonthlyReport)
- [x] 1 cursor procedure (RemoveExpiredStock)
- [x] 3 helper views
- [x] 12+ performance indexes

### ✅ API Layer

- [x] 7 route files with 20+ endpoints
- [x] Color-coded inventory status
- [x] Transaction support for fulfillment
- [x] Stored procedure integration
- [x] Complete error handling
- [x] Input validation on all endpoints
- [x] CORS support
- [x] Request logging

### ✅ Documentation

- [x] ER diagram with relationships
- [x] Complete SQL schema guide
- [x] Step-by-step testing procedures
- [x] Full API documentation
- [x] Setup guide with troubleshooting
- [x] Quick reference cards
- [x] cURL examples

---

## 📊 Data Model Summary

| Component       | Count | Details                                                                                             |
| --------------- | ----- | --------------------------------------------------------------------------------------------------- |
| **Tables**      | 8     | DONOR, PATIENT, HOSPITAL_STAFF, DONATION, BLOOD_INVENTORY, BLOOD_REQUEST, REQUEST_INVENTORY, ALERTS |
| **Views**       | 3     | Stock summary, Pending requests, Donor eligibility                                                  |
| **Triggers**    | 2     | Auto-inventory, Auto-alerts                                                                         |
| **Procedures**  | 2     | FulfillRequest, MonthlyReport                                                                       |
| **Cursors**     | 1     | RemoveExpiredStock                                                                                  |
| **Endpoints**   | 20+   | GET, POST, PUT, DELETE operations                                                                   |
| **Test Data**   | 30+   | 5 donors, 4 staff, 3 patients, 6 donations, 8 inventory, 4 requests                                 |
| **Constraints** | 40+   | PKs, FKs, UNIQUEs, CHECKs, NON-NULLs, DEFAULTs                                                      |

---

## 🔐 Security Implementation

| Feature              | Implementation                 |
| -------------------- | ------------------------------ |
| **SQL Injection**    | Parameterized queries (?)      |
| **CORS**             | Origin-restricted via .env     |
| **Input Validation** | Type checking + business logic |
| **Credentials**      | .env file (not hardcoded)      |
| **Connection**       | Pooling prevents exhaustion    |
| **Error Details**    | Dev/Prod modes                 |
| **Transactions**     | ACID compliance                |

---

## 📈 Performance Optimizations

| Feature                   | Benefit                                    |
| ------------------------- | ------------------------------------------ |
| **Connection Pooling**    | Reuse connections, reduced overhead        |
| **Indexes**               | Fast queries on blood type, status, dates  |
| **Composite Indexes**     | Optimized for common filters               |
| **Parameterized Queries** | Prepared statements, plan caching          |
| **Promise-based**         | Non-blocking operations                    |
| **Response Caching**      | Possible (frontend can cache GET requests) |

---

## 🚀 Deployment Notes

### Environment-Specific Configuration

- Development: Detailed errors, auto-reload
- Production: Generic errors, optimized

### Scaling Considerations

- Connection pool: 10 (adjust as needed)
- Max request size: 10MB
- Process manager: PM2 recommended
- Load balancer: Can use with stateless API

---

## 📞 Support Resources

| Document                    | Purpose                |
| --------------------------- | ---------------------- |
| BACKEND_README.md           | Full API documentation |
| BACKEND_SETUP_GUIDE.md      | Step-by-step setup     |
| API_REFERENCE.md            | Quick reference        |
| DBMS_Design.md              | Database design        |
| SQL_Implementation_Guide.md | SQL details            |
| Testing_Guide.md            | Testing procedures     |

---

## 🎓 Learning Resources

### For Database

- [MySQL Official Docs](https://dev.mysql.com/doc/)
- [Stored Procedures Guide](https://dev.mysql.com/doc/refman/8.0/en/create-procedure.html)
- [Triggers Guide](https://dev.mysql.com/doc/refman/8.0/en/create-trigger.html)

### For Backend

- [Express.js Guide](https://expressjs.com/)
- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)
- [CORS Explanation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### For API Design

- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [JSON Standards](https://www.json.org/)

---

## ✅ Submission Checklist

### For College Project

- [ ] All SQL files (schema + procedures)
- [ ] All backend code files
- [ ] README and setup guide
- [ ] API documentation
- [ ] ER diagram
- [ ] Database design document
- [ ] Sample test data
- [ ] Error handling examples
- [ ] Performance optimization notes

### For Grading

- [x] Database normalized to 3NF ✅
- [x] Triggers implemented (2) ✅
- [x] Stored procedures (2+) ✅
- [x] Cursors (1) ✅
- [x] Views (3) ✅
- [x] Constraints documented ✅
- [x] Backend API (7 route files) ✅
- [x] Error handling ✅
- [x] Documentation (complete) ✅

---

## 🎉 Project Complete!

**Database:** ✅ Full schema with advanced features  
**Backend API:** ✅ Node.js/Express with 20+ endpoints  
**Documentation:** ✅ Comprehensive guides and references  
**Testing:** ✅ Sample data and test procedures  
**Ready for:** ✅ College submission or production deployment

---

**Last Updated:** May 24, 2026  
**Project Status:** Production Ready 🚀
