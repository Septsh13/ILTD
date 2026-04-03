# 📡 Encrypted Complaints API Reference

## Public Endpoints (No Authentication)

### 1. Submit Complaint with Encrypted Identity

```http
POST /complaints
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Suspicious shipment activity",
  "description": "Detailed complaint text here...",
  "complainant_name": "Jane Smith",
  "complainant_email": "jane@example.com",
  "complainant_phone": "+1-555-0123",
  "related_user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created):**
```json
{
  "message": "Complaint submitted successfully. Save your tracking token — it cannot be recovered.",
  "tracking_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6789abcdef0123456789abcdef",
  "status": "OPEN",
  "submitted_at": "2026-04-03T10:00:00.000Z"
}
```

**What Happens Behind the Scenes:**
```
1. Backend receives complaint
2. Encrypts: name, email, phone using AES-256-CBC
3. Stores encrypted data in complaint_identity table
4. Generates unique tracking_token
5. Stores complaint metadata in complaints table
6. ASYNC (non-blocking): Posts encrypted data to Formspree
7. Returns tracking_token to user
```

**Field Details:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `subject` | string | ✅ | Complaint subject (max 255 chars) |
| `description` | string | ✅ | Full complaint details |
| `complainant_name` | string | ✅ | Complainant name (will be encrypted) |
| `complainant_email` | string | ✅ | Email address (will be encrypted) |
| `complainant_phone` | string | ❌ | Optional phone (will be encrypted if provided) |
| `related_user_id` | UUID | ❌ | If complaint is about specific user |

**Encryption Details:**
```
Name:  AES-256-CBC encrypted → stored as hex
Email: AES-256-CBC encrypted → stored as hex  
Phone: AES-256-CBC encrypted → stored as hex
IV:    JSON object {name: "...", email: "...", phone: "..."}
```

---

### 2. Check Complaint Status (By Tracking Token)

```http
GET /complaints/status?tracking_token=abc123def456...
```

**Query Parameters:**
```
tracking_token (required): The token returned when complaint was filed
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "subject": "Suspicious shipment activity",
  "status": "UNDER_REVIEW",
  "admin_notes": "Investigating reported CHA activity",
  "submitted_at": "2026-04-03T10:00:00.000Z",
  "updated_at": "2026-04-03T14:30:00.000Z"
}
```

**Status Values:**
- `OPEN` — Newly filed, not yet reviewed
- `UNDER_REVIEW` — Admin is investigating
- `RESOLVED` — Investigation complete, action taken
- `CLOSED` — Complaint archived

**Note:** Public endpoint doesn't show complainant identity (only admin can see via decrypt endpoint)

---

## Protected Endpoints (Admin Only)

### 3. Decrypt Complaint Identity (Admin-Only)

```http
GET /admin/complaints/{complaint_id}/decrypt
Authorization: Bearer {jwt_token}
```

**Required Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**URL Parameters:**
```
complaint_id (required): UUID of the complaint
```

**Access Control:**
```
✅ Role: ADMIN only
❌ Role: CHA_AGENT → 403 Forbidden
❌ Role: GOVT_OFFICIAL → 403 Forbidden
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "tracking_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6789abcdef",
  "subject": "Suspicious shipment activity",
  "status": "UNDER_REVIEW",
  "admin_notes": "Investigating reported CHA activity",
  "created_at": "2026-04-03T10:00:00.000Z",
  "updated_at": "2026-04-03T14:30:00.000Z",
  "decrypted_identity": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-0123"
  },
  "_security_note": "🔐 This data has been decrypted. Log this access for audit purposes."
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "error": "Complaint not found."
}
```

**403 Forbidden (Non-Admin):**
```json
{
  "error": "Insufficient permissions for this action"
}
```

**400 Bad Request (Invalid UUID):**
```json
{
  "error": "id must be a valid complaint UUID."
}
```

**Decryption Details:**
```
1. Retrieves encrypted_name from database
2. Retrieves IV for name from database
3. Uses ENCRYPTION_KEY from .env
4. Decrypts: encrypted_name + IV → plain "Jane Smith"
5. Returns plain text (NEVER cached or logged)
6. Action logged to audit_logs table with:
   - Admin user_id
   - Complaint_id accessed  
   - Timestamp
   - IP address
```

---

## Testing with curl

### Test 1: Submit Complaint
```bash
curl -X POST http://localhost:3001/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test complaint",
    "description": "This is a test",
    "complainant_name": "John Test",
    "complainant_email": "john@test.com",
    "complainant_phone": "+1-555-0000"
  }'
```

### Test 2: Check Status
```bash
curl -X GET "http://localhost:3001/complaints/status?tracking_token=YOUR_TOKEN_HERE"
```

### Test 3: Admin Decrypt (with JWT token)
```bash
curl -X GET http://localhost:3001/admin/complaints/YOUR_COMPLAINT_ID/decrypt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Error Handling

### All Responses Include:

**Success:**
```json
{
  "message": "...",
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Human-readable error message"
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Server Error |

### Common Errors:

**Missing Required Field:**
```json
{
  "error": "subject and description are required"
}
```

**Invalid UUID:**
```json
{
  "error": "complaint_id must be a valid UUID"
}
```

**Non-Admin Accessing Decrypt:**
```json
{
  "error": "Insufficient permissions for this action"
}
```

**Complaint Not Found:**
```json
{
  "error": "Complaint not found."
}
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    PUBLIC ENDPOINTS                            │
│ No authentication required                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /complaints                                              │
│  ├─ Input: Plain identity (name, email, phone)               │
│  ├─ Process: Encrypt using AES-256                            │
│  ├─ Storage: encrypted_name, encrypted_email in DB            │
│  ├─ Email: Send encrypted data to Formspree (async)           │
│  └─ Output: tracking_token (safe to share)                    │
│                                                                 │
│  GET /complaints/status?tracking_token=XXX                    │
│  ├─ Input: Tracking token (public)                            │
│  ├─ Lookup: Find complaint by token                           │
│  ├─ Return: Status, subject (NOT complainant data)            │
│  └─ Security: No decryption, no PII exposed                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                   PROTECTED ENDPOINTS                          │
│ Admin role required + JWT authentication                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /admin/complaints/:id/decrypt                            │
│  ├─ Auth: Verify JWT token                                     │
│  ├─ RBAC: Check role = ADMIN                                   │
│  ├─ Audit: Log decryption attempt                              │
│  ├─ Decrypt: Decrypt identity using ENCRYPTION_KEY            │
│  ├─ Return: Plain identity (name, email, phone)               │
│  └─ Security: Never cached, never logged to console           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Encryption/Decryption Details

### Encryption Process (On Complaint Submission)

```
Input:
  plaintext_name = "Jane Smith"

1. Generate random IV (16 bytes)
   iv = randomBytes(16)

2. Create cipher using AES-256-CBC
   cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)

3. Encrypt plaintext
   encrypted = cipher.update(plaintext_name, 'utf8', 'hex')
   encrypted += cipher.final('hex')

4. Store in database
   INSERT INTO complaint_identity VALUES (
     complaint_id,
     encrypted,        // <- hex string "7f9e8d1c2a3b4c5d..."
     iv.toString('hex') // <- hex string "abc123def456ghi789..."
   )

Output:
  encrypted_name = "7f9e8d1c2a3b4c5d6e7f8a9b0c1d2e3f"
  iv = "abc123def456ghi789jkl012mno34567"
```

### Decryption Process (On Admin Request)

```
Input from database:
  encrypted_name = "7f9e8d1c2a3b4c5d6e7f8a9b0c1d2e3f"
  iv = "abc123def456ghi789jkl012mno34567"

1. Convert IV back to buffer
   iv_buffer = Buffer.from(iv, 'hex')

2. Create decipher using AES-256-CBC
   decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv_buffer)

3. Decrypt ciphertext
   plaintext = decipher.update(encrypted_name, 'hex', 'utf8')
   plaintext += decipher.final('utf8')

4. Return plaintext
   plaintext = "Jane Smith"

Output:
  name = "Jane Smith" ✓✓
```

---

## Security Guarantees

✅ **Encryption Key Security:**
- ENCRYPTION_KEY stored in .env (NOT in code)
- Never transmitted to frontend
- Backend-only access

✅ **Data In Transit:**
- Formspree receives encrypted payload
- Encrypted name unreadable in email

✅ **Data At Rest:**
- PostgreSQL stores encrypted hex strings
- Database admins cannot read identities
- Only way to read: via decrypt endpoint

✅ **Access Control:**
- /admin/complaints/:id/decrypt requires:
  - ✅ Valid JWT token
  - ✅ ADMIN role
  - ✅ Valid complaint UUID
  - ✅ Logs access to audit table

✅ **Audit Trail:**
- Every decrypt attempt logged
- Who decrypted (user_id)
- When (timestamp)
- What (complaint_id)
- Where (IP address)

---

## Rate Limiting (Recommended)

For production, implement rate limiting:

```javascript
// Limit decrypt attempts to prevent brute-force
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window per IP
});

router.get(
  '/complaints/:id/decrypt',
  rateLimiter,
  getComplaintDecrypted
);
```

---

## Monitoring & Alerting

**Alert Conditions:**
1. Multiple failed decrypt attempts (3+) in 5 minutes
2. Same complaint decrypted 5+ times in 24 hours
3. Decrypt attempt outside business hours
4. Failed Formspree delivery (3+ consecutive)

**Dashboard Metrics:**
- Total complaints submitted
- Complaints decrypted by admin
- Formspree delivery success rate
- Average time to decrypt access

---

## FAQ

**Q: Why is the phone encrypted?**
A: Phone is PII. Treat same as name/email for privacy.

**Q: Can non-admins see encrypted data?**
A: No. All encrypted fields stored as unreadable hex. Only admins can decrypt.

**Q: What if Formspree is down?**
A: Complaint still saves to DB. Email fails gracefully (non-blocking).

**Q: How long is the tracking token?**
A: 64 hex string (256 bits). Cryptographically secure random.

**Q: Can tracking tokens be guessed?**
A: No. 2^256 possible tokens. Brute-force infeasible.

**Q: What if someone captures encrypted email?**
A: Captured ciphertext is worthless without ENCRYPTION_KEY.

**Q: How often should I rotate ENCRYPTION_KEY?**
A: Annually. Or immediately if compromised.

---

## Getting JWT Token for Testing

**Login as Admin:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "ADMIN001",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440099",
    "employee_id": "ADMIN001",
    "full_name": "System Administrator",
    "role": "ADMIN"
  }
}
```

Use `token` value in Authorization header:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**See [ENCRYPTED_COMPLAINTS_TESTING.md](ENCRYPTED_COMPLAINTS_TESTING.md) for step-by-step testing guide.**
