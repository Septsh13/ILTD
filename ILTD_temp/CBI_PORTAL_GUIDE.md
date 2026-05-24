# 🔐 CBI Portal — Anonymous Complaint Investigation System

## Overview

The **CBI (Complaints Bureau of Investigation) Portal** is a secure investigation tool that allows authorized investigators to review and investigate complaints **without ever seeing the complainant's identity**. This implements the core security principle: **Anonymous complaints with controlled identity access**.

---

## 🎯 Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│  COMPLAINANT (Frontend) - Submits Complaint Anonym      │
│  ✓ Real name (John Doe)                                │
│  ✓ Real email (john@example.com)                       │
│  ✓ Complaint details                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓ POST /complaints
┌─────────────────────────────────────────────────────────┐
│  BACKEND - Encryption & Storage                        │
│  ✓ Encrypt: name, email, phone                         │
│  ✓ Store: encrypted_name in DB                        │
│  ✓ Send: encrypted email to Formspree                 │
│  ✓ Return: tracking_token to complainant             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
    CBI Portal                   Admin Portal
    (No Identity)                (Decrypt Access)
    
    GET /cbi/complaints          /admin/complaints/:id/decrypt
    ✓ See encrypted_name         ✓ Decrypt identity
    ✓ Investigate anonymously    ✓ View real name/email
    ✓ Update status              ✓ Full audit trail
    ✓ Add notes (CBI-only)
    ✗ Cannot decrypt
    ✗ Cannot see real name
```

---

## 📊 Database Schema Changes

### New CBI Role
```sql
CREATE TYPE user_role AS ENUM ('CHA_AGENT', 'GOVT_OFFICIAL', 'CBI', 'ADMIN');
```

### Updated Complaints Table
```sql
ALTER TABLE complaints ADD COLUMN (
  cbi_assigned_to UUID REFERENCES users(id),  -- CBI officer assigned
  cbi_message TEXT                            -- Investigation notes (hidden from CHA/public)
);
```

### New Test Users
```
CBI001 / Test@1234 → Vikram Singh (CBI Investigator)
CBI002 / Test@1234 → Anjali Verma (CBI Investigator)
```

---

## 🏛️ CBI Portal Features

### 1. Investigation Dashboard
**Route:** `GET /cbi` or `/cbi/complaints`

**What CBI Sees:**
✓ Subject of complaint
✓ Description/details
✓ Current status (OPEN, UNDER_REVIEW, RESOLVED, CLOSED)
✓ Investigation notes (CBI_MESSAGE)
✓ Filing date & updates
✓ Assignment status
✓ Stats card (open cases, assigned to me, etc.)

**What CBI Does NOT See:**
✗ Complainant name (encrypted)
✗ Complainant email (encrypted)
✗ Complainant phone (encrypted)
✗ Admin notes (not accessible)

### 2. Complaint Detail View
**Route:** `GET /cbi/complaints/:id`

**Features:**
- Read full complaint details anonymously
- Update investigation status
- Add/edit investigative notes
- Auto-assign to self if unassigned
- View assignment history

### 3. Investigation Controls
- **Filter by Status:** OPEN, UNDER_REVIEW, RESOLVED, CLOSED
- **Filter: Assigned to Me:** View only cases you're investigating
- **Update Status:** Move case through investigation pipeline
- **Add Notes:** Document findings (encrypted, CBI-only)
- **Dashboard Stats:** Quick overview of case workload

---

## 🔐 CBI API Endpoints

### Get All Complaints (CBI View)
```http
GET /cbi/complaints?status=OPEN&page=1&limit=20&assigned_to_me=false
Authentication: Bearer {jwt_token}
Role Required: CBI
```

**Response:**
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "complaints": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tracking_token": "abc123def456...",
      "subject": "Suspicious CHA Activity",
      "description": "Detailed complaint...",
      "status": "UNDER_REVIEW",
      "cbi_assigned_to": "550e8400-e29b-41d4-a716-446655440055",
      "assigned_to_name": "Vikram Singh",
      "assigned_to_emp_id": "CBI001",
      "cbi_message": "Investigating shipment records...",
      "created_at": "2026-04-03T10:00:00Z",
      "updated_at": "2026-04-03T14:30:00Z",
      // NOTE: encrypted_name NOT included
    }
  ]
}
```

### Get One Complaint (CBI View)
```http
GET /cbi/complaints/{complaint_id}
Authentication: Bearer {jwt_token}
Role Required: CBI
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "tracking_token": "abc123def456...",
  "subject": "Suspicious CHA Activity",
  "description": "Details...",
  "status": "UNDER_REVIEW",
  "cbi_assigned_to": "550e8400-e29b-41d4-a716-446655440055",
  "cbi_message": "Investigation notes...",
  "created_at": "2026-04-03T10:00:00Z",
  "updated_at": "2026-04-03T14:30:00Z",
  "_permissions": {
    "can_edit": true,
    "can_change_status": true,
    "can_see_identity": false  // ← ALWAYS FALSE for CBI
  }
}
```

### Update Complaint (CBI Investigation)
```http
PUT /cbi/complaints/{complaint_id}
Authentication: Bearer {jwt_token}
Role Required: CBI

Body:
{
  "status": "RESOLVED",
  "cbi_message": "After reviewing shipment #12345, found discrepancies in documentation..."
}
```

**Response:**
```json
{
  "message": "Complaint updated successfully.",
  "complaint": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "RESOLVED",
    "cbi_message": "After reviewing shipment #12345...",
    "cbi_assigned_to": "550e8400-e29b-41d4-a716-446655440055",
    "updated_at": "2026-04-03T15:00:00Z"
  }
}
```

### Get Investigation Stats (Dashboard)
```http
GET /cbi/stats
Authentication: Bearer {jwt_token}
Role Required: CBI
```

**Response:**
```json
{
  "by_status": {
    "OPEN": 5,
    "UNDER_REVIEW": 12,
    "RESOLVED": 8,
    "CLOSED": 2
  },
  "assigned_to_me": 3
}
```

---

## 🛡️ Security Architecture

### CBI Can:
✅ View complaints anonymously (no identity shown)
✅ Update investigation status
✅ Add investigative notes (CBI_MESSAGE)
✅ Auto-assign cases to self
✅ See all case metadata (except identity)

### CBI Cannot:
❌ Decrypt identity (no access to encrypted_name)
❌ See complainant name/email/phone
❌ Access admin notes
❌ Access Formspree emails
❌ See encryption keys

### Only ADMIN Can:
✅ Decrypt complainant identity via `/admin/complaints/:id/decrypt`
✅ See real name, email, phone (when necessary)
✅ Override any CBI findings

### Role-Based Access Control:
```javascript
// middleware/rbac.js
router.use(authenticate, requireRole('CBI'), auditLogger);
// Only CBI role allowed
// Other roles: 403 Forbidden
```

---

## 🧪 Testing CBI Portal

### Step 1: Update Database Schema
```bash
psql -U postgres -d clearpath_db -f models/schema.sql
# This adds: CBI role, cbi_assigned_to, cbi_message fields
```

### Step 2: Seed CBI Users
```bash
psql -U postgres -d clearpath_db -f models/seed.sql
# Creates: CBI001 (Vikram Singh), CBI002 (Anjali Verma)
```

### Step 3: Start Servers
```bash
npm run backend    # Terminal 1
npm run frontend   # Terminal 2
```

### Step 4: Test CBI Login
1. Open browser: `http://localhost:5173`
2. Login as: `CBI001 / Test@1234`
3. Should see: CBI Investigation Dashboard
4. Sidebar shows: "Investigation Dashboard" + "Active Cases"

### Step 5: Test Complaint Investigation
1. **Submit complaint as CHA** (if not already filed):
   - Login as `CHA001 / Test@1234`
   - Go to "File Complaint"
   - Submit complaint
   - Remember tracking token

2. **Investigate as CBI**:
   - Logout, login as `CBI001 / Test@1234`
   - Dashboard should list new complaint
   - Click "Review" to view details
   - Update status → UNDER_REVIEW
   - Add notes: "Investigating this case..."
   - Click "Save Changes"

3. **Verify CBI Cannot See Identity**:
   - In browser DevTools → Network
   - Check `/cbi/complaints` response
   - Should NOT include: encrypted_name
   - Should include: subject, description, status only

### Step 6: Verify Admin Can Decrypt
1. Logout, login as `ADMIN001 / Admin@123`
2. Go to Admin dashboard
3. Click "Complaints Management"  
4. Find the complaint you investigated
5. Click "Decrypt" or similar action
6. Should see: Real name, email, phone

---

## 📋 Data Flow Example

### Scenario: Complaint About Suspicious CHA Activity

```
1. CHA SUBMITS COMPLAINT (10:00 AM)
   ├─ Input: name="Jane Smith", email="jane@cha.gov", description="..."
   ├─ Backend encrypts name/email/phone
   ├─ Stores encrypted in database
   ├─ Returns: tracking_token = "abc123xyz789..."
   └─ Sends encrypted email to admin

2. CBI INVESTIGATES (10:15 AM)
   ├─ Login: CBI001 / Test@1234
   ├─ View dashboard: Lists all complaints
   ├─ Click complaint: Sees details (NOT name)
   ├─ Read: Subject, description, related_user_id
   ├─ Cannot See: encrypted_name (shows as encrypted hex string if visible)
   ├─ Updates: status = UNDER_REVIEW
   ├─ Adds notes: "Checking shipment records for accuracy..."
   ├─ Click Save: Auto-assigns to CBI001
   └─ Audit log: Records this update

3. ADMIN REVIEWS (11:00 AM)
   ├─ Login: ADMIN001 / Admin@123
   ├─ Go to Complaints Management
   ├─ Click "Decrypt" on complaint:
   │  ├─ Backend retrieves encrypted_name
   │  ├─ Uses ENCRYPTION_KEY to decrypt
   │  ├─ Returns: name="Jane Smith"
   │  └─ Logs: Action=decrypt, user=ADMIN001, time=11:00 AM
   ├─ If needed, takes action on named person
   └─ CBI updates never expose actual identity to CBI

4. COMPLAINANT CHECKS STATUS (Later)
   ├─ Uses tracking_token: "abc123xyz789..."
   ├─ Calls: GET /complaints/status?tracking_token=...
   ├─ Sees: status=UNDER_REVIEW, cbi_message NOT shown
   ├─ Cannot see: CBI's investigative notes (those are internal)
   └─ Privacy preserved: CBI never knew complainant's real name
```

---

## 🔄 Workflow Diagram

```
Complaint Filed
       │
       ├─ Created with:
       │  ├─ tracking_token (public identifier)
       │  ├─ encrypted_name (secure)
       │  ├─ description (public)
       │  └─ status = OPEN
       │
       ↓
CBI Dashboard Shows Complaint
       │
       ├─ CBI001 views in /cbi
       ├─ Sees: subject, description, status
       ├─ Does NOT see: real name (encrypted)
       ├─ Can read: description of allegations
       │
       ↓
CBI Investigates & Updates
       │
       ├─ Changes: status → UNDER_REVIEW
       ├─ Adds: cbi_message = "Investigation findings..."
       ├─ System: auto-assigns to CBI001
       ├─ Audit: logs this update
       │
       ↓
ADMIN Reviews (If Needed)
       │
       ├─ Calls: /admin/complaints/:id/decrypt
       ├─ Sees: Real identity (Jane Smith)
       ├─ Audit: Records this decryption
       ├─ Can: Take action on named person if warranted
       │
       ↓
Complainant Checks Status
       │
       ├─ Uses: tracking_token
       ├─ Sees: Case status updated to UNDER_REVIEW
       ├─ Does NOT see: CBI's investigation notes
       ├─ Does NOT see: Who investigated them
       ├─ Privacy intact: CBI never knew their name
       │
       ↓
Case Resolved
       └─ Status: RESOLVED or CLOSED
```

---

## 🔑 Key Security Principles

1. **Anonymous by Default**
   - Complaints stored with encrypted identity
   - CBI investigators DON'T know real identity
   - Prevents bias or retaliation

2. **Controlled Decryption**
   - Only ADMIN can decrypt
   - Every decryption logged
   - Alerts if suspicious patterns

3. **Encrypted Storage**
   - AES-256-CBC encryption
   - Encryption keys in backend .env
   - Database stores only ciphertext

4. **Audit Trail**
   - All CBI updates logged
   - All admin decryptions logged
   - IP addresses recorded
   - Timestamps recorded

5. **Zero-Knowledge**
   - Frontend never sees keys
   - Frontend never sees encrypted_name
   - Frontend never decrypts anything

---

## 🚨 Authorization Errors

### CBI Tries to Access Admin Routes
```json
GET /admin/complaints/...

❌ 403 Forbidden
{
  "error": "Insufficient permissions for this action",
  "required": ["ADMIN"],
  "yourRole": "CBI"
}
```

### Non-CBI Tries to Access CBI Routes
```json
GET /cbi/complaints

❌ 403 Forbidden
{
  "error": "Access denied.",
  "required": ["CBI"],
  "yourRole": "CHA_AGENT"
}
```

### CBI Tries to Decrypt
```javascript
// Frontend attempts to call decrypt endpoint as CBI
GET /admin/complaints/550e8400.../decrypt

❌ 403 Forbidden
// Only ADMIN role allowed
```

---

## 📊 Implementation Checklist

- ✅ CBI role added to schema (user_role ENUM)
- ✅ Complaints table updated (cbi_assigned_to, cbi_message)
- ✅ CBI controller created (`controllers/cbiController.js`)
- ✅ CBI routes registered (`routes/cbi.js`)
- ✅ CBI portal frontend pages built
- ✅ Dashboard created with stats/pagination
- ✅ Complaint detail page for investigation
- ✅ Role-based access control implemented
- ✅ Database migrations ready
- ✅ Test users seeded (CBI001, CBI002)

---

## 🎯 Features by Role

### CHA Agent
- File complaints anonymously
- Track complaint status via tracking token
- Cannot see other complaints
- Cannot see CBI investigations

### CBI Investigator
- View all complaints (anonymously)
- Investigate case details
- Update investigation status
- Add investigation notes
- Cannot decrypt identity
- Cannot see real name/email

### ADMIN
- View all complaints (with identity if needed)
- Decrypt complainant identity (with audit)
- Override any case status
- See admin notes
- Full system access

### Complainant
- File complaint with identity
- Check status with tracking token
- See public updates
- Privacy guarantee: CBI doesn't know them

---

## 🔗 API Summary

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/cbi/complaints` | GET | ✓ | CBI | List all complaints |
| `/cbi/complaints/:id` | GET | ✓ | CBI | View complaint detail |
| `/cbi/complaints/:id` | PUT | ✓ | CBI | Update investigation |
| `/cbi/stats` | GET | ✓ | CBI | Dashboard stats |
| `/admin/complaints/:id/decrypt` | GET | ✓ | ADMIN | Decrypt identity |

---

## ✨ Result

**A secure, anonymous complaint investigation system where:**
- Complainants can file anonymously
- CBI can investigate without bias
- Identity stays protected until authorized
- Full audit trail for accountability
- Nobody can bypass the system

**Privacy + Security + Accountability = ✅ SOLVED**

---

## 📞 Troubleshooting

**Q: CBI sees "No complaints found"**
A: Submit a complaint as CHA first (file complaint)

**Q: CBI cannot update complaint**
A: Ensure you're logged in as CBI role (check token)

**Q: Frontend shows encrypted hex instead of complaint**
A: Database migration not run. Run `schema.sql` again.

**Q: Admin cannot see decrypt button**
A: Go to `/admin/complaints` → find complaint → click decrypt

**Q: ENCRYPTION_KEY error**
A: Ensure `.env` has `ENCRYPTION_KEY="..."` (32 characters)

---

**Implementation complete! CBI portal is ready for secure investigations.** 🔐
