# 🌟 GSN - Global Success Network

A modern member management and networking platform built with **React (Vite) + Node.js (Express) + PostgreSQL**.

## 📋 What is GSN?

GSN is a comprehensive platform designed to connect and manage members of the Global Success Network. It provides role-based access with three main user types:
- **Admin**: Full system access and oversight
- **Chapter President**: Chapter-level management
- **Normal User**: Member access and engagement

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher) - running on localhost:5432
- **npm** (comes with Node.js)

### Installation & Setup

#### 1. Clone and Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd "DP world"
npm install
cd ..
```

#### 2. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE gsn_network_db;"

# Initialize schema and seed data
psql -U postgres -d gsn_network_db -f models/schema.sql
psql -U postgres -d gsn_network_db -f models/seed.sql
```

#### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gsn_network_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_secret_key_here

# Server
PORT=3000
NODE_ENV=development
```

#### 4. Run the Project

**Option A: Development Mode (Two Terminals)**

Terminal 1 - Backend:
```bash
npm run backend
```

Terminal 2 - Frontend:
```bash
npm run frontend
```

Backend will run on: `http://localhost:3001`
Frontend will run on: `http://localhost:5173`

**Option B: Development Mode (Single Terminal)**
```bash
npm run dev
```

---

## 🔐 Authentication Flow

### Two-Step Authentication Process

1. **Step 1: Credentials**
   - User enters Employee ID and Password
   - Backend validates and generates a 6-digit OTP
   - OTP is displayed in dev mode (in production: sent via SMS/Email)

2. **Step 2: OTP Verification**
   - User enters the 6-digit OTP
   - Backend validates OTP
   - JWT token is issued and stored in localStorage
   - User is redirected to their role-specific dashboard

### Test Credentials

The database seed includes these test users:

```
ADMIN (ID: admin)
- Password: 123456

CHAPTER_PRESIDENT (ID: CP1)
- Password: 123456

NORMAL_USER (ID: user)
- Password: 123456
```

**Test OTP**: The backend generates a random OTP, but in dev mode, it's returned in the response for testing.

---

## 📁 Project Structure

```
GSN/
├── server.js                    # Express server entry point
├── start.js                     # Concurrent dev server runner
├── package.json                 # Backend dependencies
├── .env                        # Environment configuration
│
├── config/
│   ├── db.js                   # PostgreSQL connection pool
│   └── env.js                  # Environment variables
│
├── controllers/                # Request handlers
│   ├── authController.js       # Authentication logic
│   └── ...
│
├── routes/                     # API route definitions
│   ├── auth.js                # Auth endpoints
│   └── ...
│
├── middleware/                 # Express middleware
│   ├── auth.js                # JWT verification
│   ├── rbac.js                # Role-based access control
│   ├── auditLogger.js         # Activity logging
│   └── validate.js            # Input validation
│
├── models/
│   ├── schema.sql             # PostgreSQL schema
│   └── seed.sql               # Sample data
│
├── services/                  # Business logic
│   ├── authService.js         # OTP and JWT handling
│   └── ...
│
└── DP world/                   # React Frontend (Vite)
    ├── package.json           # Frontend dependencies
    ├── vite.config.js        # Vite configuration
    ├── index.html            # HTML entry point
    │
    ├── src/
    │   ├── main.jsx          # React entry point
    │   ├── App.jsx           # Main App component
    │   ├── index.css         # Global styles
    │   │
    │   ├── context/          # Context providers
    │   │   └── AuthContext.jsx
    │   │
    │   ├── components/       # Reusable components
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── LoginInputField.jsx
    │   │   └── ...
    │   │
    │   ├── pages/           # Page components
    │   │   ├── Login.jsx
    │   │   └── gsn/GsnDashboard.jsx
    │   │
    │   ├── services/        # API services
    │   │   └── api.js
    │   │
    │   ├── layouts/         # Layout components
    │   └── assets/          # Images, fonts, etc.
    │
    └── public/             # Static files
```

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Request OTP
- `POST /auth/verify-otp` - Verify OTP and get JWT

### Protected Routes
All dashboard routes require valid JWT token in `Authorization: Bearer <token>` header

---

## 🛠 Available Scripts

```bash
# Backend
npm run dev              # Run backend with auto-reload (nodemon)
npm run backend          # Same as above
npm start               # Run backend in production mode

# Frontend
npm run build           # Build React app for production

# Combined
npm run frontend        # Run frontend dev server
```

---

## 🧪 Testing the Login

1. Open browser and go to `http://localhost:5173`
2. Enter test credentials (see above)
3. Copy the OTP displayed in dev mode
4. Paste OTP in the verification screen
5. You'll be redirected to the appropriate dashboard

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ OTP-based 2-step verification
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all actions
- ✅ Input validation and sanitization
- ✅ CORS protection with Helmet

---

## 📚 Development Guidelines

### Adding New Routes
1. Create controller in `controllers/`
2. Add route in `routes/`
3. Register in `server.js`
4. Add middleware for auth if needed

### Database Changes
1. Update `models/schema.sql`
2. Run migrations
3. Update seed data if needed

### Frontend Components
1. Create in `DP world/src/components/`
2. Follow naming: `PascalCase.jsx`
3. Use Tailwind CSS for styling

---

## 🐛 Troubleshooting

### Login Issues
- **"Invalid credentials"** - Check test user exists in database
- **"Invalid OTP"** - OTP is 6-digit number shown in response (dev mode)
- **Redirects to login** - Check token is being saved in localStorage

### Database Connection
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

---

## 📦 Production Build

```bash
# Build frontend
npm run build

# This creates an optimized production build in DP world/dist/
```

---

## 📝 License

Proprietary - All Rights Reserved

---

## 👥 Support

For issues or questions, please check:
1. Environment variables are set correctly
2. PostgreSQL is running
3. Database exists and is initialized
4. Ports 3000 (backend) and 5173 (frontend) are available
