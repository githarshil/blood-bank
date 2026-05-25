# Blood Bank Backend - Complete Setup Guide

## 📦 Project Files Created

```
blood-bank-backend/
├── index.js                    # Main Express server
├── db.js                       # MySQL connection pool
├── package.json                # NPM dependencies
├── .env                        # Environment configuration (EDIT THIS!)
├── .gitignore                  # Git ignore rules
└── routes/
    ├── donors.js               # Donor endpoints
    ├── inventory.js            # Inventory endpoints (color-coded)
    ├── requests.js             # Request endpoints + fulfill stored proc
    ├── reports.js              # Reports endpoints + monthly report stored proc
    └── alerts.js               # Alert endpoints
```

---

## 🚀 Step-by-Step Setup

### Step 1: Install Node.js

- Download from https://nodejs.org/ (LTS version recommended)
- Verify installation:

```bash
node --version
npm --version
```

### Step 2: Database Setup

- Ensure MySQL is running
- Database already created: `BloodBankDB`
- Verify sample data is populated

```bash
# Test database connection
mysql -u root -p -e "USE BloodBankDB; SELECT COUNT(*) FROM DONOR;"
```

### Step 3: Install Backend Dependencies

```bash
cd "c:\Users\harsh_aaghwa2\OneDrive\Desktop\dbms mini project"
npm install
```

This installs:

- `express` - Web framework
- `mysql2` - MySQL driver with promise support
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `nodemon` - Auto-reload for development

### Step 4: Configure Environment Variables

Edit `.env` file:

```bash
# Open with any text editor
```

Update with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=BloodBankDB
DB_PORT=3306
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Step 5: Start the Backend Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

### Expected Output

```
✅ MySQL Database Connected Successfully

╔════════════════════════════════════════════════════╗
║   Blood Bank Management System - Backend API       ║
║   Server started on port 3001                      ║
║   Environment: development                         ║
║   Database: BloodBankDB                            ║
╚════════════════════════════════════════════════════╝

Available Endpoints:
  GET  /health                    - Health check
  GET  /api/donors                - Get all donors
  POST /api/donors                - Add new donor
  ...
```

### Step 6: Test the API

In a new terminal:

```bash
# Test health check
curl http://localhost:3001/health

# Test get donors
curl http://localhost:3001/api/donors

# Get inventory with colors
curl http://localhost:3001/api/inventory
```

---

## 🔍 Verifying Setup

### Check Connection Success

Look for: `✅ MySQL Database Connected Successfully`

### Test Endpoints

```bash
# 1. Health
curl http://localhost:3001/health
# Expected: { "status": "OK", ... }

# 2. Donors
curl http://localhost:3001/api/donors
# Expected: { "success": true, "count": 5, "data": [...] }

# 3. Inventory
curl http://localhost:3001/api/inventory
# Expected: Includes color-coded status (green/yellow/red)

# 4. Requests
curl http://localhost:3001/api/requests
# Expected: Shows pending requests with urgency flags

# 5. Alerts
curl http://localhost:3001/api/alerts
# Expected: Shows active system alerts
```

---

## 📁 File Descriptions

### index.js - Main Server

- Express app initialization
- CORS setup
- Route mounting
- Error handling
- Server startup on port 3001

### db.js - Database Connection

- MySQL connection pool
- Connection pooling (10 connections)
- Promise-based queries
- Decimal number support

### routes/donors.js

- GET /api/donors - List all donors (filterable by blood type, status, city)
- GET /api/donors/:id - Get single donor
- POST /api/donors - Register new donor (validates age 18-65, blood type)
- PUT /api/donors/:id - Update donor information

**Key Features:**

- Age validation (18-65 years)
- Duplicate phone/email detection
- Status management

### routes/inventory.js

- GET /api/inventory - All inventory with color-coded status
- GET /api/inventory/:id - Single inventory details
- GET /api/inventory/summary/by-type - Summary by blood type
- GET /api/inventory/expiring/soon - Expiring within 7 days

**Color Coding:**

- 🟢 Green (SAFE): ≥ 5 units
- 🟡 Yellow (LOW): 1-5 units
- 🔴 Red (CRITICAL): < 1 unit

### routes/requests.js

- GET /api/requests - All requests with urgency flags
- GET /api/requests/:id - Single request with allocations
- POST /api/requests - Create new request
- POST /api/requests/fulfill/:id - **Calls FulfillRequest stored procedure**
  - Verifies sufficient inventory
  - Deducts from inventory
  - Creates allocation records
  - Marks request as fulfilled
  - Full transaction support
- PUT /api/requests/:id - Update request status

### routes/reports.js

- GET /api/reports/monthly - **Calls MonthlyReport stored procedure**
  - Monthly donations by blood type
  - Test pass rates
  - Medical metrics (hemoglobin, BP, temp)
- GET /api/reports/donation-trends - Trends over months
- GET /api/reports/blood-usage - Combined statistics
- GET /api/reports/donor-statistics - Donor breakdown

### routes/alerts.js

- GET /api/alerts - All alerts (filterable)
- GET /api/alerts/:id - Single alert
- GET /api/alerts/critical/only - Only critical alerts
- GET /api/alerts/summary/dashboard - Dashboard overview
- PUT /api/alerts/:id - Update status
- POST /api/alerts/acknowledge/:id - Acknowledge alert
- DELETE /api/alerts/:id - Delete resolved alert

**Alert Features:**

- Priority color coding
- Age calculation (minutes/hours/days)
- Summary by type and priority
- System health status

---

## 🔌 Database Integration

### Connection Pool

```javascript
// Handles 10 concurrent connections
// Auto-releases connections after queries
// Connection limit: 10, Queue limit: unlimited
```

### Parameterized Queries

```javascript
// All queries use parameters (?) to prevent SQL injection
await connection.query("SELECT * FROM DONOR WHERE DonorID = ?", [id]);
```

### Stored Procedures Called

1. **FulfillRequest(req_id)**
   - Route: `POST /api/requests/fulfill/:id`
   - Handles transaction and inventory deduction

2. **MonthlyReport(month, year)**
   - Route: `GET /api/reports/monthly?month=X&year=Y`
   - Returns detailed statistics

3. **RemoveExpiredStock()**
   - Manual procedure (can be called separately)
   - Not exposed as API endpoint (run via MySQL directly)

---

## 🧪 Testing the Backend

### Using Postman (Recommended)

1. Import endpoints from `API_REFERENCE.md`
2. Test each endpoint
3. Check responses

### Using cURL

```bash
# Get all donors
curl -X GET http://localhost:3001/api/donors

# Add donor
curl -X POST http://localhost:3001/api/donors \
  -H "Content-Type: application/json" \
  -d '{"FirstName":"Test","LastName":"User","DateOfBirth":"1990-01-01","Gender":"M","BloodType":"O+","Phone":"9999999999","City":"Delhi"}'

# Get inventory
curl -X GET http://localhost:3001/api/inventory

# Create request
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{"PatientID":1,"StaffID":1,"BloodType":"O+","QuantityRequired":2,"RequiredByDate":"2026-05-26","Priority":"Emergency"}'

# Fulfill request
curl -X POST http://localhost:3001/api/requests/fulfill/1

# Get monthly report
curl -X GET "http://localhost:3001/api/reports/monthly?month=5&year=2026"

# Get alerts
curl -X GET http://localhost:3001/api/alerts
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module 'mysql2'"

**Solution:**

```bash
npm install
```

### Issue 2: "connect ECONNREFUSED"

**Solution:**

- Ensure MySQL is running
- Check credentials in `.env`

```bash
mysql -u root -p -e "SELECT 1"
```

### Issue 3: "Database not found"

**Solution:**

- Run `blood_bank_schema.sql` first:

```bash
mysql -u root -p < blood_bank_schema.sql
```

### Issue 4: CORS errors

**Solution:**

- Update `CORS_ORIGIN` in `.env` to match frontend URL
- Verify frontend is running on correct port

### Issue 5: "Port 3001 already in use"

**Solution:**

```bash
# Change PORT in .env to different value (e.g., 3002)
# Or kill process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3001
kill -9 <PID>
```

### Issue 6: Duplicate phone number error

**Solution:**

- Phone numbers must be unique per donor
- Use different phone number

### Issue 7: Request fulfillment fails - "Insufficient inventory"

**Solution:**

- Check inventory levels: `GET /api/inventory/summary/by-type`
- May need more donations or reduce quantity required

---

## 📊 Database & Backend Workflow

```
Frontend Request
    ↓
Express Middleware (logging, parsing)
    ↓
Route Handler (validation, business logic)
    ↓
MySQL Query/Stored Procedure
    ↓
Connection Pool (with pooling)
    ↓
Database Response
    ↓
JSON Response to Frontend
```

---

## 🔐 Security Features

1. **SQL Injection Protection**
   - All queries use parameterized statements
   - User input never directly in SQL

2. **CORS Protection**
   - Restricted to configured origin
   - Prevents cross-site requests

3. **Input Validation**
   - Type checking on all fields
   - Business logic validation (age, blood type, dates)
   - Error messages for invalid input

4. **Connection Security**
   - Credentials via .env file
   - Not hardcoded in source
   - Connection pooling prevents exhaustion

5. **Error Handling**
   - Detailed errors in development only
   - Generic errors in production
   - No sensitive data in error messages

---

## 📈 Performance Optimization

### Database Indexes

- Blood type: Frequently filtered
- Status: Common query filter
- Composite indexes: (BloodType, Status)

### Connection Pool

- 10 connections for concurrent requests
- Auto-cleanup after queries
- Queue management

### Query Optimization

- Specific field selection
- Proper JOIN usage
- Indexed filtering

---

## 🔄 Development Workflow

```bash
# 1. Start backend (auto-reload with nodemon)
npm run dev

# 2. In another terminal, test endpoints
curl http://localhost:3001/api/donors

# 3. Edit files - server auto-restarts
# 4. Check console for logs
```

---

## 📝 Logging

### Console Output

- Request method and path
- Database connection status
- Errors with timestamps
- Startup/shutdown messages

### Example Logs

```
2026-05-24T14:30:00 GET /api/donors
2026-05-24T14:30:01 POST /api/requests
✅ MySQL Database Connected Successfully
```

---

## 🚀 Production Deployment

### Before Deploying

1. **Change NODE_ENV**

```env
NODE_ENV=production
```

2. **Use Strong Database Password**

```env
DB_PASSWORD=strong_secure_password_here
```

3. **Update CORS Origin**

```env
CORS_ORIGIN=https://yourdomain.com
```

4. **Start Production Server**

```bash
npm start
```

5. **Use Process Manager (PM2)**

```bash
npm install -g pm2
pm2 start index.js --name "blood-bank-api"
```

---

## 📞 Support & Documentation

### Files to Reference

- `BACKEND_README.md` - Full API documentation
- `API_REFERENCE.md` - Quick API reference
- `blood_bank_schema.sql` - Database schema
- `Testing_Guide.md` - Database testing

### Quick Help

```bash
# Check Node version
node --version

# Check installed packages
npm list

# Check running processes
npm list -g

# View .env file
cat .env
```

---

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] MySQL running with BloodBankDB created
- [ ] Dependencies installed: `npm install`
- [ ] .env file configured with correct credentials
- [ ] Backend started: `npm run dev` or `npm start`
- [ ] Health check passes: `curl http://localhost:3001/health`
- [ ] Donors endpoint returns data: `curl http://localhost:3001/api/donors`
- [ ] Inventory has color coding
- [ ] Alerts endpoint works
- [ ] Monthly report works: `curl http://localhost:3001/api/reports/monthly?month=5&year=2026`
- [ ] No database connection errors
- [ ] CORS configured for frontend

---

**Backend Setup Complete!** ✅

Your Blood Bank Backend API is ready to serve requests.  
Next: Connect frontend and test end-to-end workflow.
