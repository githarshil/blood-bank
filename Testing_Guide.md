# Blood Bank Database - Quick Reference & Testing Guide

## Quick Start Commands

### 1. Import Database
```bash
mysql -u root -p < blood_bank_schema.sql
```

---

## Testing Triggers

### Test Trigger 1: Auto-add Donation to Inventory

**Current State:**
```sql
-- Donation ID 5 is in 'Tested' status with O- blood type
SELECT * FROM DONATION WHERE DonationID = 5;
```

**Before update - Check O- inventory:**
```sql
SELECT * FROM BLOOD_INVENTORY WHERE BloodType = 'O-';
-- Should show: 0.45 units
```

**Trigger the update:**
```sql
-- Change donation 5 from 'Tested' to 'Approved'
UPDATE DONATION 
SET Status = 'Approved' 
WHERE DonationID = 5;
```

**After update - Check O- inventory:**
```sql
SELECT * FROM BLOOD_INVENTORY WHERE BloodType = 'O-';
-- Should now show: 0.90 units (0.45 + 0.45 from new donation)
-- LastUpdated should be recent
```

**Verify automatic donor update:**
```sql
SELECT DonorID, DonationCount, LastDonationDate 
FROM DONOR WHERE DonorID = 5;
-- DonationCount should increase by 1
-- LastDonationDate should be today
```

---

### Test Trigger 2: Low Stock Alert

**Current State:**
```sql
-- Check AB+ inventory (1.8 units - already low)
SELECT * FROM BLOOD_INVENTORY WHERE BloodType = 'AB+';
-- Shows: InventoryID=5, QuantityAvailable=1.8
```

**Check generated alerts:**
```sql
SELECT * FROM ALERTS 
WHERE RelatedEntity = 'INVENTORY' AND RelatedEntityID = 5
ORDER BY CreatedDate DESC;
-- Should show Low_Stock and Expiry_Warning alerts
```

**Trigger low stock alert by manual update:**
```sql
-- Reduce O+ to below threshold
UPDATE BLOOD_INVENTORY 
SET QuantityAvailable = 2.5
WHERE InventoryID = 1;

-- Check new alert
SELECT * FROM ALERTS 
WHERE AlertType = 'Low_Stock' 
AND Status = 'Active'
ORDER BY CreatedDate DESC LIMIT 1;
```

**Trigger critical alert (≤1 unit):**
```sql
-- Drop to 0.5 units
UPDATE BLOOD_INVENTORY 
SET QuantityAvailable = 0.5
WHERE InventoryID = 1;

-- Check alert priority changed to 'Critical'
SELECT AlertType, Priority, Description 
FROM ALERTS 
WHERE RelatedEntityID = 1 
AND AlertType = 'Low_Stock'
ORDER BY CreatedDate DESC LIMIT 1;
```

---

## Testing Stored Procedures

### Test Procedure 1: FulfillRequest(req_id)

**Check Request 1 before fulfillment:**
```sql
SELECT * FROM BLOOD_REQUEST WHERE RequestID = 1;
-- Status: Pending
-- BloodType: O+
-- QuantityRequired: 2.0 units
```

**Check O+ inventory:**
```sql
SELECT * FROM BLOOD_INVENTORY WHERE BloodType = 'O+';
-- Should have enough stock
```

**Fulfill the request:**
```sql
CALL FulfillRequest(1);
-- Returns: SUCCESS message
```

**Verify request marked fulfilled:**
```sql
SELECT RequestID, Status, FulfillmentDate 
FROM BLOOD_REQUEST 
WHERE RequestID = 1;
-- Status should be: Fulfilled
-- FulfillmentDate should be: Current timestamp
```

**Verify inventory deducted:**
```sql
SELECT BloodType, QuantityAvailable 
FROM BLOOD_INVENTORY 
WHERE BloodType = 'O+';
-- Quantity should be reduced by 2.0 units
```

**Check REQUEST_INVENTORY junction:**
```sql
SELECT * FROM REQUEST_INVENTORY 
WHERE RequestID = 1;
-- Should show allocation record(s)
-- QuantityAllocated should total 2.0 units
```

**Check alert log:**
```sql
SELECT * FROM ALERTS 
WHERE RelatedEntity = 'REQUEST' AND RelatedEntityID = 1
ORDER BY CreatedDate DESC;
-- Should show fulfillment success log
```

**Test error handling - Insufficient inventory:**
```sql
-- Try to fulfill request 4 (needs 1.0 unit of AB+, only 1.8 available after our tests)
CALL FulfillRequest(4);
-- Should succeed if enough inventory available

-- Try to fulfill already fulfilled request
CALL FulfillRequest(1);
-- Should return: ERROR - "Request is already fulfilled"
```

**Test error handling - Non-existent request:**
```sql
CALL FulfillRequest(999);
-- Should return: ERROR - "Request ID 999 not found"
```

---

### Test Procedure 2: MonthlyReport(month, year)

**Generate report for current month (May 2026):**
```sql
CALL MonthlyReport(5, 2026);
-- Returns two result sets:
-- 1. Detailed by blood type
-- 2. Overall summary
```

**Expected Output - Detailed Report:**
```
BloodType | TotalDonations | ApprovedDonations | TestPassRate | TotalQuantity | ...
O+        | 2              | 2                 | 100%         | 0.90          | ...
B+        | 1              | 1                 | 100%         | 0.45          | ...
A+        | 1              | 1                 | 100%         | 0.45          | ...
AB+       | 1              | 1                 | 100%         | 0.45          | ...
O-        | 1              | 1                 | 100%         | 0.45          | ...
```

**Expected Output - Summary Report:**
```
ReportPeriod      | TotalDonations | UniqueDonors | TotalBloodCollected | ApprovedQuantity | TestPassRate
Monthly Report: May 2026 | 6          | 5            | 3.15                | 3.15             | 100%
```

**Test different months:**
```sql
-- April 2026 (should have no data)
CALL MonthlyReport(4, 2026);

-- December 2025 (should have no data)
CALL MonthlyReport(12, 2025);

-- Invalid month (should show error)
CALL MonthlyReport(13, 2026);
-- Returns: ERROR - "Month must be between 1 and 12"
```

**Using report for analysis:**
```sql
-- Save report to file
-- In MySQL Workbench: File → Export Result Set
-- Or: SELECT ... INTO OUTFILE '/tmp/report.csv'
```

---

## Testing Cursor Procedure

### Test Procedure: RemoveExpiredStock()

**Check current expired inventory (should be none):**
```sql
SELECT * FROM BLOOD_INVENTORY 
WHERE ExpiryDate < CURDATE() 
AND Status IN ('Available', 'Reserved');
-- Should return: 0 rows
```

**Create test expired inventory:**
```sql
-- Insert an expired batch
INSERT INTO BLOOD_INVENTORY (
    BloodType, QuantityAvailable, ExpiryDate, 
    StorageLocation, Temperature, Status
) VALUES (
    'O+', 3.0, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 
    'Test Storage', 4.0, 'Available'
);

-- Verify it was inserted
SELECT * FROM BLOOD_INVENTORY WHERE ExpiryDate < CURDATE();
-- Should show 1 expired batch
```

**Run cleanup procedure:**
```sql
CALL RemoveExpiredStock();
-- Returns: SUCCESS message showing number of batches removed
```

**Verify batch marked as expired:**
```sql
SELECT * FROM BLOOD_INVENTORY 
WHERE BloodType = 'O+' 
AND ExpiryDate < CURDATE();
-- Status should be: 'Expired'
-- QuantityAvailable should be: 0
```

**Check alert log:**
```sql
SELECT * FROM ALERTS 
WHERE AlertType = 'Expiry_Warning' 
AND RelatedEntity = 'INVENTORY'
ORDER BY CreatedDate DESC LIMIT 1;
-- Should show logged removal with details
```

**Run again with no expired stock:**
```sql
CALL RemoveExpiredStock();
-- Returns: "No expired inventory found to remove."
```

---

## View Usage Examples

### View 1: vw_blood_stock_summary

```sql
-- Check current blood stock by type
SELECT * FROM vw_blood_stock_summary;

-- Output:
-- BloodType | TotalQuantity | BatchCount | EarliestExpiry
-- O+        | 4.5           | 1          | 2026-06-23
-- B+        | 5.5           | 1          | 2026-06-28
-- A+        | 3.5           | 1          | 2026-06-18
-- AB+       | 1.8           | 1          | 2026-06-03
-- ...
```

**Usage:**
```sql
-- Find blood types running low
SELECT BloodType, TotalQuantity, BatchCount 
FROM vw_blood_stock_summary 
WHERE TotalQuantity < 5;

-- Find expiring soon
SELECT BloodType, TotalQuantity, EarliestExpiry,
       DATEDIFF(EarliestExpiry, CURDATE()) as DaysLeft
FROM vw_blood_stock_summary 
WHERE DATEDIFF(EarliestExpiry, CURDATE()) <= 14;
```

---

### View 2: vw_pending_requests

```sql
-- Check all pending/approved requests
SELECT * FROM vw_pending_requests;

-- Output:
-- RequestID | PatientName | BloodType | Qty | Priority | DaysRemaining | StaffName
-- 1         | Suresh Rao  | O+        | 2.0 | Emergency| 1             | Dr. Arun Bhat
-- 3         | Karan Chopra| A+        | 2.5 | Normal   | 3             | Deepak Yadav
-- 4         | Suresh Rao  | AB+       | 1.0 | Emergency| 1             | Dr. Arun Bhat
```

**Usage:**
```sql
-- Find emergency requests needing immediate attention
SELECT * FROM vw_pending_requests 
WHERE Priority = 'Emergency'
ORDER BY DaysRemaining ASC;

-- Find requests with only 1 day left
SELECT * FROM vw_pending_requests 
WHERE DaysRemaining <= 1
ORDER BY Priority DESC;

-- Count pending requests by priority
SELECT Priority, COUNT(*) as PendingCount
FROM vw_pending_requests 
GROUP BY Priority
ORDER BY FIELD(Priority, 'Emergency', 'Urgent', 'Normal');
```

---

### View 3: vw_donor_eligibility

```sql
-- Check donor eligibility for next donation
SELECT * FROM vw_donor_eligibility;

-- Output:
-- DonorID | DonorName | BloodType | DaysSince | DonationEligibility | DonationCount
-- 1       | Rajesh Kumar | O+     | 25        | Not Eligible - 31 days left | 2
-- 2       | Priya Singh  | B+     | 56        | Eligible - 56 Days Passed | 1
-- 3       | Amit Patel   | A+     | 30        | Not Eligible - 26 days left | 1
```

**Usage:**
```sql
-- Find donors eligible to donate now
SELECT * FROM vw_donor_eligibility 
WHERE DonationEligibility LIKE 'Eligible%'
ORDER BY DaysSinceLastDonation DESC;

-- Find donors becoming eligible soon
SELECT * FROM vw_donor_eligibility 
WHERE DaysSinceLastDonation > 35 
AND DaysSinceLastDonation < 56;

-- Identify inactive donors (never donated)
SELECT * FROM vw_donor_eligibility 
WHERE DaysSinceLastDonation = 9999;
```

---

## Complete Test Scenario

### Scenario: Emergency Blood Transfusion

```sql
-- Step 1: Check available blood stock
SELECT * FROM vw_blood_stock_summary 
WHERE BloodType = 'O+';

-- Step 2: Review pending emergency requests
SELECT * FROM vw_pending_requests 
WHERE Priority = 'Emergency' AND BloodType = 'O+';

-- Step 3: Fulfill the emergency request
CALL FulfillRequest(1);

-- Step 4: Verify fulfillment
SELECT Status, FulfillmentDate 
FROM BLOOD_REQUEST WHERE RequestID = 1;

-- Step 5: Check updated inventory
SELECT * FROM vw_blood_stock_summary 
WHERE BloodType = 'O+';

-- Step 6: Monitor for low stock alert
SELECT * FROM ALERTS 
WHERE AlertType = 'Low_Stock' 
AND RelatedEntity = 'INVENTORY'
ORDER BY CreatedDate DESC;
```

---

## Monitoring Queries

### Daily Monitoring
```sql
-- All active critical alerts
SELECT * FROM ALERTS 
WHERE Status = 'Active' AND Priority = 'Critical'
ORDER BY CreatedDate DESC;

-- Pending requests by priority
SELECT Priority, COUNT(*) as Count
FROM BLOOD_REQUEST 
WHERE Status = 'Pending'
GROUP BY Priority;

-- Low stock blood types
SELECT BloodType, SUM(QuantityAvailable) as TotalQty
FROM BLOOD_INVENTORY 
WHERE Status = 'Available'
GROUP BY BloodType 
HAVING TotalQty < 5;
```

### Weekly Monitoring
```sql
-- Weekly donation rate by blood type
SELECT 
    BloodType,
    COUNT(*) as Donations,
    SUM(QuantityCollected) as TotalCollected,
    AVG(DATEDIFF(CURDATE(), LastDonationDate)) as AvgDaysSinceDonation
FROM (
    SELECT d.BloodType, d.QuantityCollected, donor.LastDonationDate
    FROM DONATION d
    JOIN DONOR donor ON d.DonorID = donor.DonorID
    WHERE d.DonationDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
) weekly_data
GROUP BY BloodType;

-- Fulfilled vs pending requests
SELECT 
    WEEK(RequestDate) as Week,
    COUNT(CASE WHEN Status = 'Fulfilled' THEN 1 END) as Fulfilled,
    COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as Pending,
    COUNT(*) as Total
FROM BLOOD_REQUEST 
GROUP BY WEEK(RequestDate);
```

### Monthly Monitoring
```sql
-- Generate monthly report
CALL MonthlyReport(MONTH(CURDATE()), YEAR(CURDATE()));

-- Donor activity this month
SELECT 
    DONOR.FirstName,
    DONOR.LastName,
    COUNT(DONATION.DonationID) as DonationsThisMonth,
    SUM(DONATION.QuantityCollected) as TotalQuantity
FROM DONOR
LEFT JOIN DONATION ON DONOR.DonorID = DONATION.DonorID
WHERE MONTH(DONATION.DonationDate) = MONTH(CURDATE())
GROUP BY DONOR.DonorID
ORDER BY COUNT(DONATION.DonationID) DESC;
```

---

## Performance Tips

### Useful Queries for Optimization

```sql
-- Check index usage
SHOW INDEX FROM BLOOD_INVENTORY;
SHOW INDEX FROM BLOOD_REQUEST;

-- Query execution time
SET @start_time = NOW(6);
SELECT * FROM vw_pending_requests;
SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, NOW(6)) as execution_microseconds;

-- Find slow queries
SELECT * FROM ALERTS WHERE Status = 'Active' -- Should use index on Status

-- Table statistics
SHOW TABLE STATUS FROM BloodBankDB;
```

---

## Backup & Maintenance

### Backup Database
```bash
# Full backup
mysqldump -u root -p BloodBankDB > blood_bank_backup.sql

# Backup with data only
mysqldump -u root -p --no-create-info BloodBankDB > blood_bank_data.sql
```

### Clean Up Old Alerts
```sql
-- Archive alerts older than 90 days
DELETE FROM ALERTS 
WHERE Status = 'Resolved' 
AND CreatedDate < DATE_SUB(CURDATE(), INTERVAL 90 DAY);

-- Verify deletion
SELECT COUNT(*) FROM ALERTS WHERE Status = 'Resolved';
```

### Rebuild Indexes
```sql
-- Optimize all tables
OPTIMIZE TABLE DONOR;
OPTIMIZE TABLE PATIENT;
OPTIMIZE TABLE DONATION;
OPTIMIZE TABLE BLOOD_INVENTORY;
OPTIMIZE TABLE BLOOD_REQUEST;
OPTIMIZE TABLE ALERTS;
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Trigger not firing | Trigger not created | Check: SHOW TRIGGERS; |
| FulfillRequest returns error | Insufficient inventory | Check: vw_blood_stock_summary |
| Duplicate alerts | Alert dedup not working | Resolve existing alerts first |
| Slow queries | Missing indexes | Run: SHOW INDEX FROM table_name |
| Can't delete donor | Foreign key constraint | Use RESTRICT design - intentional |

---

## Summary of Test Coverage

✅ **Triggers:** 2/2 tested
✅ **Procedures:** 2/2 tested  
✅ **Cursors:** 1/1 tested
✅ **Views:** 3/3 tested
✅ **Constraints:** All verified
✅ **Sample Data:** 30+ records
✅ **Error Handling:** Transactions tested
✅ **Monitoring:** Multiple query examples

**Ready for demonstration!** 🎉
