# Blood Bank & Donor Management System - Backend API

## 🚀 Quick Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Blood Bank database already created (from `blood_bank_schema.sql`)

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Edit `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=harshil456
DB_NAME=BloodBankDB
DB_PORT=3306
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. **Start the server**

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Server will start on `http://localhost:3001`

---

## 📋 Project Structure

```
.
├── index.js                 # Main Express application
├── db.js                    # MySQL connection pool
├── package.json             # Dependencies
├── .env                     # Environment variables
└── routes/
    ├── donors.js            # Donor management endpoints
    ├── inventory.js         # Blood inventory endpoints
    ├── requests.js          # Blood request endpoints
    ├── reports.js           # Reporting endpoints
    └── alerts.js            # Alert management endpoints
```

---

## 🔌 API Endpoints

### Health Check

```
GET /health
```

Check if API is running.

---

### Donors Endpoints

#### Get All Donors

```
GET /api/donors
Query Parameters:
  - bloodType: string (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - status: string (Active, Inactive, Suspended)
  - city: string
```

**Example:**

```bash
curl "http://localhost:3001/api/donors?bloodType=O%2B&status=Active"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "DonorID": 1,
      "FirstName": "Rajesh",
      "LastName": "Kumar",
      "DateOfBirth": "1985-05-15",
      "Gender": "M",
      "BloodType": "O+",
      "Phone": "9876543210",
      "Email": "rajesh.kumar@email.com",
      "City": "Delhi",
      "Status": "Active",
      "DonationCount": 2,
      "LastDonationDate": "2026-05-20"
    }
  ]
}
```

#### Get Single Donor

```
GET /api/donors/:id
```

#### Add New Donor

```
POST /api/donors
Content-Type: application/json

{
  "FirstName": "John",
  "LastName": "Doe",
  "DateOfBirth": "1990-01-15",
  "Gender": "M",
  "BloodType": "O+",
  "Phone": "9876543215",
  "Email": "john@example.com",
  "Address": "123 Main St",
  "City": "Delhi",
  "State": "Delhi",
  "PinCode": "110001"
}
```

#### Update Donor

```
PUT /api/donors/:id
Content-Type: application/json

{
  "Status": "Inactive",
  "Email": "newemail@example.com"
}
```

---

### Blood Inventory Endpoints

#### Get All Inventory (with Color-Coded Status)

```
GET /api/inventory
Query Parameters:
  - bloodType: string
  - status: string (Available, Reserved, Expired, Discarded)
```

**Response includes:**

- `statusColor`: Green (≥5 units), Yellow (1-5 units), Red (<1 unit)
- `level`: SAFE, LOW, or CRITICAL
- Summary with critical/low stock blood types

#### Get Inventory by Blood Type Summary

```
GET /api/inventory/summary/by-type
```

Returns aggregated stock by blood type with color coding.

#### Get Expiring Soon

```
GET /api/inventory/expiring/soon
```

Returns inventory expiring within 7 days.

---

### Blood Request Endpoints

#### Get All Requests

```
GET /api/requests
Query Parameters:
  - status: string (Pending, Approved, Fulfilled, Rejected, Cancelled)
  - priority: string (Normal, Urgent, Emergency)
  - bloodType: string
```

**Response includes:**

- Patient and staff names
- Days remaining for fulfillment
- Summary counts (pending, approved, fulfilled, urgent)

#### Get Single Request

```
GET /api/requests/:id
```

Includes allocation details and allocated quantities.

#### Create New Request

```
POST /api/requests
Content-Type: application/json

{
  "PatientID": 1,
  "StaffID": 1,
  "BloodType": "O+",
  "QuantityRequired": 2.0,
  "RequiredByDate": "2026-05-26T10:00:00Z",
  "Priority": "Emergency",
  "Reason": "Surgery"
}
```

#### Fulfill Request

```
POST /api/requests/fulfill/:id
```

Calls the `FulfillRequest` stored procedure to:

- Verify sufficient inventory
- Deduct from inventory
- Create allocation records
- Mark request as fulfilled

**Example:**

```bash
curl -X POST "http://localhost:3001/api/requests/fulfill/1"
```

**Response:**

```json
{
  "success": true,
  "message": "Request fulfilled successfully",
  "details": "SUCCESS: Request 1 fulfilled. 2 units allocated.",
  "requestID": 1
}
```

#### Update Request

```
PUT /api/requests/:id
Content-Type: application/json

{
  "Status": "Approved",
  "Priority": "Urgent"
}
```

---

### Reports Endpoints

#### Get Monthly Donation Report

```
GET /api/reports/monthly?month=5&year=2026
```

Calls `MonthlyReport` stored procedure.

**Response:**

```json
{
  "success": true,
  "period": {
    "month": 5,
    "year": 2026,
    "monthName": "May"
  },
  "detailedReport": [
    {
      "bloodType": "O+",
      "totalDonations": 2,
      "approvedDonations": 2,
      "passedTests": 2,
      "totalQuantityCollected": 0.9,
      "averageHemoglobin": 14.55,
      "testPassRate": "100%"
    }
  ],
  "summary": {
    "reportPeriod": "Monthly Report: May 2026",
    "totalDonationsMonth": 6,
    "uniqueDonors": 5,
    "totalBloodCollected": 3.15,
    "testPassRate": "100%"
  }
}
```

#### Get Donation Trends

```
GET /api/reports/donation-trends?months=6
```

Trends over the specified number of months.

#### Get Blood Usage

```
GET /api/reports/blood-usage
```

Combines inventory, request, and donation statistics.

#### Get Donor Statistics

```
GET /api/reports/donor-statistics
```

Statistics grouped by blood type.

---

### Alerts Endpoints

#### Get All Alerts

```
GET /api/alerts
Query Parameters:
  - status: string (Active, Acknowledged, Resolved)
  - priority: string (Critical, High, Medium, Low)
  - alertType: string (Low_Stock, Expiry_Warning, Request_Pending, etc.)
  - resolved: boolean (default: false - shows active alerts)
```

**Response includes:**

- Alert priority color
- Age (minutes, hours, days)
- Summary with counts by priority and type

#### Get Critical Alerts Only

```
GET /api/alerts/critical/only
```

#### Get Alert Dashboard Summary

```
GET /api/alerts/summary/dashboard
```

Quick overview of system health and recent alerts.

#### Get Single Alert

```
GET /api/alerts/:id
```

#### Update Alert Status

```
PUT /api/alerts/:id
Content-Type: application/json

{
  "Status": "Acknowledged"
}
```

Allowed values: Active, Acknowledged, Resolved

#### Acknowledge Alert

```
POST /api/alerts/acknowledge/:id
```

#### Delete Alert

```
DELETE /api/alerts/:id
```

Only resolved alerts can be deleted.

---

## 📊 Data Relationships

```
DONOR ──1──→ DONATION ──N──→ BLOOD_INVENTORY
                                    ↓
                             REQUEST_INVENTORY ←── BLOOD_REQUEST ──← PATIENT
                                    ↓
                             HOSPITAL_STAFF
```

---

## 🔐 Error Handling

All endpoints return structured error responses:

**Client Error (400-404):**

```json
{
  "success": false,
  "error": "Description of error",
  "statusCode": 400
}
```

**Server Error (500):**

```json
{
  "success": false,
  "error": "Internal Server Error",
  "statusCode": 500,
  "details": "Error details (development only)"
}
```

---

## 📝 Request Examples

### Example 1: Add a Donor and Create Request

```bash
# 1. Add new donor
curl -X POST http://localhost:3001/api/donors \
  -H "Content-Type: application/json" \
  -d '{
    "FirstName": "Priya",
    "LastName": "Sharma",
    "DateOfBirth": "1992-03-10",
    "Gender": "F",
    "BloodType": "B+",
    "Phone": "9876543216",
    "City": "Mumbai"
  }'

# 2. Get all active O+ donors
curl "http://localhost:3001/api/donors?bloodType=O%2B&status=Active"

# 3. Get inventory summary
curl "http://localhost:3001/api/inventory/summary/by-type"

# 4. Create blood request for patient
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "PatientID": 1,
    "StaffID": 1,
    "BloodType": "O+",
    "QuantityRequired": 2.0,
    "RequiredByDate": "2026-05-26",
    "Priority": "Emergency"
  }'

# 5. Fulfill the request
curl -X POST http://localhost:3001/api/requests/fulfill/1

# 6. Check alerts
curl "http://localhost:3001/api/alerts?status=Active"
```

### Example 2: Generate Monthly Report

```bash
curl "http://localhost:3001/api/reports/monthly?month=5&year=2026"
```

---

## 🛠️ Development

### Enable Auto-Reload

```bash
npm run dev
```

Uses `nodemon` to restart server on file changes.

### Database Connection Debugging

Enable query logging in `db.js`:

```javascript
// Add after pool creation
pool.on("connection", (connection) => {
  console.log("MySQL Connection established");
});
```

---

## 🔒 Security Considerations

1. **SQL Injection Prevention:** All queries use parameterized statements
2. **CORS Protection:** Configured via environment variables
3. **Input Validation:** Type checking and constraint validation on all inputs
4. **Error Details:** Detailed errors only in development mode
5. **Connection Pooling:** Prevents connection exhaustion

---

## 📈 Performance Tips

1. **Indexes:** Database uses optimized indexes for common queries
2. **Pooling:** Connection pool (default 10 connections) for concurrent requests
3. **Query Optimization:** Use specific fields instead of SELECT \*
4. **Caching:** Consider adding Redis for frequent queries

---

## 🐛 Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:** Ensure MySQL is running and credentials in `.env` are correct.

### Duplicate Entry Error

```
error: Duplicate entry 'phone_number' for key 'Phone'
```

**Solution:** Phone number already exists. Use a different phone number.

### Request Fulfillment Fails

```
Insufficient inventory. Required: 2 units, Available: 1 units.
```

**Solution:** Check inventory with `GET /api/inventory`. May need more donations or request cancellation.

---

## 📚 Database Stored Procedures Used

1. **FulfillRequest(req_id)** - Fulfills blood request with transaction support
2. **MonthlyReport(month, year)** - Generates monthly donation statistics
3. **RemoveExpiredStock()** - Removes and logs expired inventory

---

## 📞 Support

For issues or questions, check:

1. Database schema in `blood_bank_schema.sql`
2. Testing guide in `Testing_Guide.md`
3. Server logs in console output

---

**Ready to integrate with frontend!** 🎉
