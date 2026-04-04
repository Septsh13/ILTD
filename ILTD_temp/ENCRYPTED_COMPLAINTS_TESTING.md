# 🚀 Encrypted Complaints — Quick Start Testing Guide

## What's New?

✅ When a complaint is submitted:
- Complainant identity (name, email, phone) is **encrypted** using AES-256
- Encrypted data is sent to **Formspree** email
- Only **ADMIN** can decrypt using `/admin/complaints/:id/decrypt`
- All decryption attempts are **audited**

---

## 🧪 Test Workflow (Step-by-Step)

### Step 1: Start the Servers

**Terminal 1 (Backend):**
```bash
npm run backend
```

**Terminal 2 (Frontend):**
```bash
npm run frontend
```

Wait for both to show "ready" messages.

---

### Step 2: Submit a Test Complaint

1. Open browser: `http://localhost:5173`
2. Login as CHA agent:
   - ID: `CHA001`
   - Password: `Test@1234`
3. Click **"File Complaint"** in sidebar
4. Fill form:
   ```
   Subject: "Test encrypted complaint"
   Description: "This is a test to verify encryption"
   Name: "John Test User"
   Email: "john.test@example.com"
   Phone: "+1-555-1234"
   ```
5. Click **"Submit Complaint"**
6. **Copy and save** the tracking token shown

Expected output:
```
✅ Complaint submitted successfully
✅ Tracking token: abc123def456...
```

---

### Step 3: Verify Encrypted Storage in Database

Open database client (psql, DBeaver, etc.):

```sql
-- Connect to clearpath_db database

-- Find your complaint ID
SELECT id, tracking_token, subject FROM complaints
ORDER BY created_at DESC LIMIT 1;
```

Note the `id` (UUID).

```sql
-- Check encrypted identity is stored
SELECT encrypted_name, encrypted_email, encrypted_phone, iv
FROM complaint_identity
WHERE complaint_id = 'YOUR_COMPLAINT_ID';
```

You should see:
- `encrypted_name`: Long hex string (unreadable) ✅
- `encrypted_email`: Long hex string (unreadable) ✅
- `encrypted_phone`: Long hex string (unreadable) ✅
- `iv`: JSON object with IVs ✅

**Example:**
```
encrypted_name:  "7f9e8d1c2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b"
encrypted_email: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d"
encrypted_phone: "k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d"
iv:              "{\"name\":\"abc123...\",\"email\":\"def456...\",\"phone\":\"ghi789...\"}"
```

✅ **Success!** Identity is encrypted in database.

---

### Step 4: Check Formspree Email

1. Open email inbox (check spam folder!)
2. You should have received an email from Formspree with:
   ```
   To: admin@clearpath.gov
   Subject: [ClearPath] New Complaint Submitted
   
   Body contains:
   encrypted_name: 7f9e8d1c2a3b...
   tracking_token: abc123def456...
   subject: Test encrypted complaint
   complaint_description: This is a test...
   submitted_at: 2026-04-03T...
   ```

✅ **Success!** Encrypted email sent to Formspree.

---

### Step 5: Admin Decrypts Complaint

1. Open browser: `http://localhost:5173`
2. Login as ADMIN:
   - ID: `ADMIN001`
   - Password: `Admin@123`
3. Go to **Admin Dashboard**
4. Click **Audit Logs** or **Complaints** section

**Option A: Using API (curl)**
```bash
# Get your complaint ID from database or previous step
COMPLAINT_ID="550e8400-e29b-41d4-a716-446655440001"
JWT_TOKEN="your_admin_jwt_token_here"

curl -X GET "http://localhost:3001/admin/complaints/${COMPLAINT_ID}/decrypt" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "tracking_token": "abc123def456...",
  "subject": "Test encrypted complaint",
  "status": "OPEN",
  "admin_notes": null,
  "created_at": "2026-04-03T10:00:00Z",
  "updated_at": "2026-04-03T10:00:00Z",
  "decrypted_identity": {
    "name": "John Test User",
    "email": "john.test@example.com",
    "phone": "+1-555-1234"
  },
  "_security_note": "🔐 This data has been decrypted. Log this access for audit purposes."
}
```

✅ **Success!** Admin can decrypt complaint.

---

### Step 6: Verify Audit Log

```sql
-- Check if decryption was logged
SELECT user_id, action, status_code, metadata, created_at
FROM audit_logs
WHERE action LIKE '%decrypt%'
ORDER BY created_at DESC LIMIT 5;
```

You should see:
```
user_id:    550e8400-e29b-41d4-a716-446655440099  (Admin user)
action:     "GET /admin/complaints/550e8400-e29b-41d4-a716-446655440001/decrypt"
status_code: 200
metadata:   {"complaint_id": "550e8400-e29b-41d4-a716-446655440001", ...}
created_at: 2026-04-03 10:00:00+00
```

✅ **Success!** Decryption attempts are audited.

---

### Step 7: Test Non-Admin Cannot Decrypt

1. Login as CHA agent: `CHA001/Test@1234`
2. Try to access: `http://localhost:3001/admin/complaints/{COMPLAINT_ID}/decrypt`

Expected error:
```json
{
  "error": "Insufficient permissions for this action"
}
```

HTTP Status: `403 Forbidden` ✅

---

## 🔍 What Happened Behind the Scenes?

### Encryption Flow:
```
1. Complaint submitted via POST /complaints
2. Backend received: name="John Test User", email="john.test@example.com"
3. Generated unique IV: "abc123...def456..."
4. Used ENCRYPTION_KEY from .env to encrypt
5. Stored encrypted blob in database
6. Sent encrypted data to Formspree (async, non-blocking)
7. Frontend received tracking token
```

### Decryption Flow:
```
1. Admin requests GET /admin/complaints/{id}/decrypt
2. JWT verified ✓ Token is valid
3. Role checked ✓ User is ADMIN
4. Request logged to audit_logs ✓ Decryption attempt recorded
5. Complaint fetched from database
6. Encrypted identity fetched
7. ENCRYPTION_KEY + IV used to decrypt
8. Plain identity returned to admin dashboard
9. Never logged, never cached, never sent to frontend
```

---

## 🛡️ Security Verification Checklist

- [ ] ✅ Encrypted data in database (Step 3)
- [ ] ✅ Encrypted email sent to Formspree (Step 4)
- [ ] ✅ Admin can decrypt (Step 5)
- [ ] ✅ Decryption logged (Step 6)
- [ ] ✅ Non-admin blocked from decryption (Step 7)
- [ ] ✅ ENCRYPTION_KEY not visible in code (Check .env)
- [ ] ✅ ENCRYPTION_KEY not logged to console
- [ ] ✅ Frontend never sees plain identity (Check Network tab)

---

## 📊 Files Changed

| Component | Change |
|-----------|--------|
| `controllers/complaintController.js` | ✅ Added Formspree integration |
| `controllers/adminController.js` | ✅ Added decrypt function |
| `routes/admin.js` | ✅ Added decrypt endpoint |
| `services/encryptionService.js` | ✅ Already had encryption utils |
| `.env` | ✅ Already has ENCRYPTION_KEY |
| `models/schema.sql` | ✅ Already has encrypted tables |

---

## 🐛 Troubleshooting

### Issue: "ENCRYPTION_KEY is not set"
Check `.env` file has: `ENCRYPTION_KEY="ClearPath@EncKey#2026!!_32chars!"`

### Issue: Encrypted data shows garbage
Means decryption worked but data was encrypted ✅ (that's expected)

### Issue: Formspree email not received
1. Check browser DevTools Network tab
2. Search for requests to `formspree.io`
3. May be going to spam folder
4. Check server console for errors

### Issue: "Insufficient permissions" when downloading as admin
1. Verify login is ADMIN, not CHA
2. Check JWT token in Authorization header
3. Verify user.role in database is 'ADMIN'

### Issue: Port 3001 already in use
Change `.env`: `PORT=3002` and update vite.config.js proxy

---

## 📞 API Reference

### Submit Complaint (Public)
```
POST /complaints
Body: {
  subject: string,
  description: string,
  complainant_name: string,
  complainant_email: string,
  complainant_phone?: string,
  related_user_id?: UUID
}
```

### Get Complaint Status (Public)
```
GET /complaints/status?tracking_token=abc123...
```

### Admin: Decrypt Complaint (Admin-Only)
```
GET /admin/complaints/{complaint_id}/decrypt
Authentication: JWT Bearer token
Authorization: ADMIN role required
```

---

## 🎉 You're Done!

All tests passed? Great! Your encrypted complaint system is working correctly.

**Next Steps:**
1. Deploy to staging environment
2. Test with real complaint submissions
3. Monitor Formspree delivery
4. Set up audit log alerts
5. Document key rotation procedure

---

**See [ENCRYPTED_COMPLAINTS_SECURITY.md](ENCRYPTED_COMPLAINTS_SECURITY.md) for technical details.**
