# ClearPath — Full Stack Setup Guide

This project combines the **ClearPath Backend** (Express API) and **ClearPath Frontend** (React + Vite) into a single integrated application.

## Project Structure

```
clear path/
├── server.js                    # Backend entry point
├── package.json                 # Root package (backend deps + scripts)
├── .env                         # Environment configuration
├── config/                      # Backend configuration
├── controllers/                 # API controllers
├── middleware/                  # Express middleware
├── models/                      # Database schemas
├── routes/                      # API routes
├── services/                    # Business logic services
├── scripts/                     # Setup scripts
├── DP world/                    # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   └── ...
```

## Prerequisites

- **Node.js** ≥ 18 (preferably 20+ for full compatibility)
- **npm** or yarn
- **PostgreSQL** database running locally

## Environment Setup

1. **PostgreSQL Database**: Make sure PostgreSQL is running on `localhost:5432`
   - Database name: `clearpath_db`
   - User: `postgres`
   - Password: `123456` (or update `.env` as needed)

2. **.env File**: Already configured at the root. Edit if needed:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=clearpath_db
   DB_USER=postgres
   DB_PASSWORD=123456
   PORT=3001
   NODE_ENV=development
   ```

## Installation

### Option 1: Automated Setup
```bash
npm run setup
```
This installs both backend and frontend dependencies.

### Option 2: Manual Setup
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd "DP world"
npm install
cd ..
```

## Running the Application

### Run Both Frontend & Backend (Recommended for Development)
```bash
npm run dev
```
This starts:
- **Backend**: `http://localhost:3001`
- **Frontend**: `http://localhost:5173`

The frontend's Vite proxy automatically routes API calls to the backend.

### Run Only Backend
```bash
npm run backend
```
Backend runs on `http://localhost:3001`

### Run Only Frontend
```bash
npm run frontend
```
Frontend runs on `http://localhost:5173` (requires backend to be running separately)

### Production Build
```bash
npm run build
```
Builds the frontend for production deployment.

## API Endpoints

The backend exposes these route groups:
- `/auth` — Authentication (login, register, logout)
- `/cha` — CHA (Customs House Agent) operations
- `/govt` — Government/Port Authority endpoints
- `/complaints` — Complaint management
- `/admin` — Admin dashboard & user management
- `/health` — Health check endpoint

## Frontend Features

The frontend is a React application with:
- Role-based dashboard (Admin, CHA, Government, Complaint Filer)
- Authentication with JWT tokens
- Real-time data visualization with Chart.js
- Responsive Tailwind CSS design
- Vite for fast development and build

## Development Workflow

1. **Start the full stack**:
   ```bash
   npm run dev
   ```

2. **Frontend changes**: Vite hot-reloads automatically as you edit files in `DP world/src/`

3. **Backend changes**: Nodemon auto-restarts the server when you modify backend files

4. **Database changes**: 
   - Seed data: Run `node scripts/setup-db.js`
   - Schema updates: Modify `models/schema.sql` and restart the backend

## Troubleshooting

### "Cannot find module" errors
```bash
# Clean install everything
rm -rf node_modules "DP world/node_modules"
npm run setup
```

### Port already in use
- If port 3001 is busy: Update `.env` `PORT=3002` (and update vite.config.js proxy)
- If port 5173 is busy: Stop other processes or let Vite pick another

### Database connection errors
- Ensure PostgreSQL is running: `pg_isready -h localhost`
- Check DB credentials in `.env`
- Create database: `createdb -U postgres clearpath_db`

### Node version warnings
The frontend requires Node 20+. If you have Node 18:
- Consider upgrading Node.js
- Or use: `npm install --legacy-peer-deps` in the frontend folder

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
   Output goes to `DP world/dist/`

2. Serve frontend as static files:
   ```javascript
   app.use(express.static(path.join(__dirname, 'DP world/dist')));
   ```

3. Deploy backend (with frontend dist folder included)

## Key Files to Know

- **[server.js](server.js)** — Express server entry point
- **[DP world/vite.config.js](DP%20world/vite.config.js)** — Frontend build config & proxy setup
- **[DP world/src/services/api.js](DP%20world/src/services/api.js)** — Axios client with interceptors
- **[DP world/src/context/AuthContext.jsx](DP%20world/src/context/AuthContext.jsx)** — Global auth state
- **[config/env.js](config/env.js)** — Backend env validation
- **[routes/](routes/)** — API route definitions
- **[middleware/auth.js](middleware/auth.js)** — JWT authentication middleware

## Next Steps

1. ✅ Ensure PostgreSQL is running
2. ✅ Run `npm run setup` to install all dependencies
3. ✅ Run `npm run dev` to start the full stack
4. ✅ Open `http://localhost:5173` in your browser
5. ✅ Test login with your credentials

---

**For more help**, check the backend [README.md](README.md) or frontend [DP world/README.md](DP%20world/README.md).
