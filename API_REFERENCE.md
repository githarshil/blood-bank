# Blood Bank Backend API - Quick Reference

## Base URL

```
http://localhost:3001
```

---

## 🔗 All Endpoints Summary

### HEALTH & INFO

| Method | Endpoint  | Purpose          |
| ------ | --------- | ---------------- |
| GET    | `/health` | Check API status |

### DONORS

| Method | Endpoint          | Purpose                     |
| ------ | ----------------- | --------------------------- |
| GET    | `/api/donors`     | Get all donors (filterable) |
| GET    | `/api/donors/:id` | Get single donor            |
| POST   | `/api/donors`     | Register new donor          |
| PUT    | `/api/donors/:id` | Update donor info           |

### INVENTORY

| Method | Endpoint                         | Purpose                          |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/api/inventory`                 | Get all inventory (color-coded)  |
| GET    | `/api/inventory/:id`             | Get single inventory batch       |
| GET    | `/api/inventory/summary/by-type` | Summary by blood type            |
| GET    | `/api/inventory/expiring/soon`   | Inventory expiring within 7 days |

### REQUESTS

| Method | Endpoint                    | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/api/requests`             | Get all requests (filterable)            |
| GET    | `/api/requests/:id`         | Get single request with allocations      |
| POST   | `/api/requests`             | Create new blood request                 |
| POST   | `/api/requests/fulfill/:id` | Fulfill request (calls stored procedure) |
| PUT    | `/api/requests/:id`         | Update request status/priority           |

### REPORTS

| Method | Endpoint                        | Purpose                        |
| ------ | ------------------------------- | ------------------------------ |
| GET    | `/api/reports/monthly`          | Monthly donation report        |
| GET    | `/api/reports/donation-trends`  | Donation trends over months    |
| GET    | `/api/reports/blood-usage`      | Blood usage statistics         |
| GET    | `/api/reports/donor-statistics` | Donor statistics by blood type |

### ALERTS

| Method | Endpoint                        | Purpose                     |
| ------ | ------------------------------- | --------------------------- |
| GET    | `/api/alerts`                   | Get all alerts (filterable) |
| GET    | `/api/alerts/:id`               | Get single alert            |
| GET    | `/api/alerts/critical/only`     | Get only critical alerts    |
| GET    | `/api/alerts/summary/dashboard` | Dashboard summary           |
| PUT    | `/api/alerts/:id`               | Update alert status         |
| POST   | `/api/alerts/acknowledge/:id`   | Acknowledge alert           |
| DELETE | `/api/alerts/:id`               | Delete resolved alert       |

---

## 📋 Common Query Strings

### Get Active O+ Donors

```
GET /api/donors?bloodType=O%2B&status=Active
```

### Get Pending Emergency Requests

```
GET /api/requests?status=Pending&priority=Emergency
```

### Get Low Stock Alerts

```
GET /api/alerts?priority=High&alertType=Low_Stock&status=Active
```

### Get May 2026 Monthly Report

```
GET /api/reports/monthly?month=5&year=2026
```

### Get Last 3 Months Trends

```
GET /api/reports/donation-trends?months=3
```

---

## 🧪 Testing with cURL

### Test Health

```bash
curl http://localhost:3001/health
```

### Get All Donors

```bash
curl http://localhost:3001/api/donors
```

### Add New Donor

```bash
curl -X POST http://localhost:3001/api/donors \
  -H "Content-Type: application/json" \
  -d '{
    "FirstName": "Test",
    "LastName": "Donor",
    "DateOfBirth": "1990-01-01",
    "Gender": "M",
    "BloodType": "O+",
    "Phone": "9876543299",
    "City": "TestCity"
  }'
```

### Get Inventory with Summary

```bash
curl http://localhost:3001/api/inventory
```

### Create Blood Request

```bash
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "PatientID": 1,
    "StaffID": 1,
    "BloodType": "O+",
    "QuantityRequired": 2,
    "RequiredByDate": "2026-05-26T10:00:00Z",
    "Priority": "Emergency"
  }'
```

### Fulfill Request

```bash
curl -X POST http://localhost:3001/api/requests/fulfill/1
```

### Get Monthly Report

```bash
curl http://localhost:3001/api/reports/monthly?month=5&year=2026
```

### Get Active Alerts

```bash
curl http://localhost:3001/api/alerts?status=Active
```

### Acknowledge Alert

```bash
curl -X POST http://localhost:3001/api/alerts/acknowledge/1
```

---

## 💾 Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "data": {},
  "count": 0,
  "summary": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": "Additional info"
}
```

---

## 🎯 Color-Coded Inventory Status

| Units | Color     | Status   |
| ----- | --------- | -------- |
| ≥ 5   | 🟢 Green  | SAFE     |
| 1-5   | 🟡 Yellow | LOW      |
| < 1   | 🔴 Red    | CRITICAL |

---

## 📊 Response Fields Reference

### Donor Object

```javascript
{
  DonorID: 1,
  FirstName: "John",
  LastName: "Doe",
  DateOfBirth: "1990-01-15",
  Gender: "M",
  BloodType: "O+",
  Phone: "9876543210",
  Email: "john@example.com",
  City: "Delhi",
  DonationCount: 3,
  LastDonationDate: "2026-05-20",
  Status: "Active"
}
```

### Inventory Object (with color)

```javascript
{
  InventoryID: 1,
  BloodType: "O+",
  QuantityAvailable: 4.5,
  ExpiryDate: "2026-06-23",
  StorageLocation: "Cold Storage A",
  Status: "Available",
  statusColor: { color: "yellow", level: "LOW" }
}
```

### Request Object

```javascript
{
  RequestID: 1,
  PatientID: 1,
  PatientName: "Suresh Rao",
  BloodType: "O+",
  QuantityRequired: 2.0,
  RequestDate: "2026-05-24T10:30:00Z",
  RequiredByDate: "2026-05-26T10:00:00Z",
  Status: "Pending",
  Priority: "Emergency",
  DaysRemaining: 1,
  isUrgent: true
}
```

### Alert Object

```javascript
{
  AlertID: 1,
  AlertType: "Low_Stock",
  Description: "CRITICAL: Blood type O+ stock is at 2 units",
  Priority: "High",
  Status: "Active",
  CreatedDate: "2026-05-24T14:30:00Z",
  priorityColor: "orange",
  ageString: "30m ago"
}
```

---

## 🔗 Frontend Integration Notes

### CORS Setup

- Frontend: `http://localhost:3000` (configurable in `.env`)
- Backend: `http://localhost:3001`
- Credentials: Enabled

### Headers Required

```
Content-Type: application/json
```

### Example Frontend Call (Fetch)

```javascript
// Get all donors
const response = await fetch("http://localhost:3001/api/donors", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
});
const data = await response.json();
```

---

## 🚀 Performance Metrics

- **Connection Pool:** 10 connections
- **Query Timeout:** Default MySQL timeout
- **Max Request Size:** 10MB JSON

---

## 🔐 Security Headers

- **CORS:** Restricted to frontend origin
- **Body Parsing:** Limited to 10MB
- **Input Validation:** All fields validated
- **SQL Injection:** Protected via parameterized queries

---

## 📞 Quick Troubleshooting

| Issue            | Solution                                            |
| ---------------- | --------------------------------------------------- |
| 404 Not Found    | Check endpoint URL and method (GET/POST/PUT/DELETE) |
| 400 Bad Request  | Validate JSON format and required fields            |
| 500 Server Error | Check database connection and MySQL running         |
| CORS Error       | Ensure CORS_ORIGIN in .env matches frontend         |
| Duplicate Entry  | Phone number already exists for that entity         |

---

**Last Updated:** May 24, 2026  
**API Version:** 1.0.0
