# 🚀 ClearPath — Logistics Transparency Platform

ClearPath is a robust logistics transparency and tracking platform built with **React (Vite) + Node.js (Express) + PostgreSQL**. 

Its core mission is to digitize and secure the interactions between Custom House Agents (CHAs) and Government Officials, ensuring total accountability, reducing bureaucratic bottlenecks, and providing a safe, encrypted avenue for whistleblowers to report corruption.

---

## 🌊 How the System Works

The platform operates around distinct role-based portals:

1. **Shipment Creation (CHA Agent)**
   * A CHA logs in and creates a `Shipment` record (origin, destination, weight, etc.).
   * The CHA uploads `Documents` and assigns them to specific Government Officials for review.
   * *If an agent notices anomalies, they can flag their own shipment as `SUSPICIOUS`.*

2. **Document Review (Government Official)**
   * A Government Official logs into a review panel that shows a queue of documents specifically assigned to them.
   * They review the document and can either **Approve** or **Reject** it.
   * *Crucially, if rejecting, they cannot simply say "No". They must select from a strict list of predefined database constraints (e.g., `MISSING_SIGNATURE`, `FRAUDULENT_CLAIM`).*

3. **Communication Logging**
   * If the CHA and the Official need to talk, the CHA logs an `Interaction` tying the message to the Shipment and the Official. All communications are tracked in the database to prevent off-the-books transactions.

4. **Whistleblower Complaints (Public)**
   * Anyone can submit an anonymous complaint. Their identity is immediately **AES-256 Encrypted** before hitting the database. They receive a unique `Tracking Token` to check the status later without logging in.

5. **Oversight (Admin)**
   * Admins have a global dashboard.
   * They can view **Audit Logs** to see exactly *who* did *what* at what time via a system-wide middleware.
   * Admins review complaints and have the power to `Flag` corrupt or problematic user accounts which instantly disables their access.

---

## 🚀 How to Run the Project Locally

Because the project is split into a **Node.js/Express Backend** and a **React/Vite Frontend**, you will need to run two terminal windows to start both servers.

### Prerequisites
1. **Node.js** installed on your system.
2. **PostgreSQL** installed and running on your device (default port 5432).

### Step 1: Database Setup
You must initialize the PostgreSQL database and tables locally. Open your terminal and run:
```bash
psql -U postgres -c "CREATE DATABASE clearpath_db;"
psql -U postgres -d clearpath_db -f "models/schema.sql"
```

### Step 2: Configure Environment Variables
In the root directory (`clear path/`), you will find a `.env` file. Ensure it contains the correct database password and security keys:
```env
# Backend .env configuration
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/clearpath_db
JWT_SECRET=super_secret_jwt_key
ENCRYPTION_KEY=12345678901234567890123456789012   # Must be exactly 32 chars
```

### Step 3: Run the Backend API (Terminal 1)
Open a terminal in the root `clear path/` folder and run:
```bash
npm install
npm run dev    # Or node server.js
```
*The backend will now be actively listening on `http://localhost:3000`.*

### Step 4: Run the React Frontend (Terminal 2)
Open a **new** terminal window. You need to navigate inside the `DP world` folder where the Vite frontend lives:
```bash
cd "DP world"
npm install
npm run dev
```
*The Vite frontend will now be actively listening on `http://localhost:5173`. The Vite config will automatically proxy API requests to your backend at port 3000.*

---

## 🔑 Default Login Credentials
To test the features on `http://localhost:5173`, use the following Employee IDs (any password will work during local development, and you will be provided a Dev-Mode OTP directly on the screen):

* **Admin Role**: `ADMIN001`
* **Custom House Agent (CHA) Role**: `CHA001` , `CHA002`, `CHA003` 
* **Government Official Role**: `GOVT001` , `GOVT002`, `GOVT003`
