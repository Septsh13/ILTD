# GSN - Global Success Network

GSN is a full-stack member networking platform built with React, Vite, Express, and PostgreSQL. It supports role-based portals for global administrators, chapter presidents, and normal members, with dashboard analytics, leaderboards, chapter/member visibility, meetings, settings, JWT authentication, OTP verification, and audit logging.

## Project Overview

The application is split into two major parts:

- Backend API: root-level Node.js/Express application.
- Frontend client: React/Vite application in `DP world/`.

Supported roles:

- `ADMIN`: global system access, all chapters, all members, user creation, chapter creation, and meeting management.
- `CHAPTER_PRESIDENT`: chapter-level access for their chapter and users under them, plus meeting management for their chapter.
- `NORMAL_USER`: member access to their own chapter, meetings, settings, and leaderboards.
- `USER`: frontend compatibility alias that redirects to the normal user dashboard.

High-level request flow:

```text
React page
-> DP world/src/services/api.js
-> Vite proxy in DP world/vite.config.js
-> Express route in routes/
-> Controller in controllers/
-> PostgreSQL pool in config/db.js
-> PostgreSQL tables from models/schema.sql
```

## Quick Start

### Prerequisites

- Node.js 16+
- npm
- PostgreSQL 12+

### Install Dependencies

```bash
npm install
cd "DP world"
npm install
cd ..
```

### Environment Variables

Create `.env` in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gsn_network_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=replace_with_a_long_secret
JWT_EXPIRES_IN=8h
PORT=3001
NODE_ENV=development
```

Environment validation lives at:

```text
project-root
-> config
-> env.js
```

Required variables checked by the backend:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

### PostgreSQL Setup

Option A, use the idempotent setup script:

```bash
npm run db:setup
```

If that script is not present in your local `package.json`, run:

```bash
node scripts/setup-db.js
```

Option B, run SQL files manually:

```bash
psql -U postgres -c "CREATE DATABASE gsn_network_db;"
psql -U postgres -d gsn_network_db -f models/schema.sql
psql -U postgres -d gsn_network_db -f models/seed.sql
```

### Run The Application

Backend only:

```bash
npm run backend
```

Frontend only:

```bash
npm run frontend
```

Full stack:

```bash
npm run dev
```

Runtime URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:3001`
- Health check: `http://127.0.0.1:3001/health`

## Test Accounts

Requested testing credentials:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `123456` |
| Chapter President | `CP` | `123456` |
| User | `user` | `123456` |

Current seed files in this repository use `CP1` for the chapter president account. If `CP` does not exist in your database, use:

| Role | Username | Password |
| --- | --- | --- |
| Chapter President | `CP1` | `123456` |

During development, OTP is returned by the `/auth/login` response and displayed on the login screen.

## Complete Project Structure

```text
project-root
-> server.js
-> start.js
-> package.json
-> nodemon.json
-> .env
-> config
   -> db.js
   -> env.js
-> controllers
   -> authController.js
   -> networkController.js
-> middleware
   -> auth.js
   -> rbac.js
   -> validate.js
   -> auditLogger.js
-> models
   -> schema.sql
   -> seed.sql
-> routes
   -> auth.js
   -> network.js
-> scripts
   -> setup-db.js
-> services
   -> authService.js
   -> auditService.js
-> DP world
   -> index.html
   -> package.json
   -> vite.config.js
   -> eslint.config.js
   -> public
      -> favicon.svg
      -> icons.svg
   -> src
      -> main.jsx
      -> App.jsx
      -> index.css
      -> App.css
      -> assets
         -> hero.png
         -> react.svg
         -> vite.svg
      -> components
         -> Badge.jsx
         -> Button.jsx
         -> Card.jsx
         -> LoginInputField.jsx
         -> LoginLoader.jsx
         -> LoginRoleSelect.jsx
         -> Modal.jsx
         -> Navbar.jsx
         -> ProfileModal.jsx
         -> ProtectedRoute.jsx
         -> Sidebar.jsx
         -> Table.jsx
      -> context
         -> AuthContext.jsx
      -> layouts
         -> DashboardLayout.jsx
      -> pages
         -> Login.jsx
         -> gsn
            -> GsnDashboard.jsx
      -> services
         -> api.js
      -> utils
         -> cn.js
```

## Frontend Structure

### Frontend Entry Point

```text
project-root
-> DP world
-> index.html
```

`index.html` provides the Vite HTML shell and root DOM node.

```text
project-root
-> DP world
-> src
-> main.jsx
```

`main.jsx` creates the React root, renders a startup fallback, dynamically imports `App.jsx`, and wraps the app in an error boundary.

```text
project-root
-> DP world
-> src
-> App.jsx
```

`App.jsx` owns frontend routing with `react-router-dom`. It registers login routes and the three role-protected dashboard routes.

### Frontend Routing System

Routes are defined in:

```text
project-root
-> DP world
-> src
-> App.jsx
```

Current route map:

| Browser route | Component | Protection |
| --- | --- | --- |
| `/` | `Login` | Public |
| `/login` | `Login` | Public |
| `/admin/dashboard` | `GsnDashboard view="admin"` | `ADMIN` only |
| `/president/dashboard` | `GsnDashboard view="president"` | `CHAPTER_PRESIDENT` only |
| `/user/dashboard` | `GsnDashboard view="user"` | `NORMAL_USER` or `USER` |
| `*` | redirect to `/` | fallback |

Protected route logic:

```text
project-root
-> DP world
-> src
-> components
-> ProtectedRoute.jsx
```

`ProtectedRoute.jsx` reads auth state from `AuthContext.jsx`, redirects unauthenticated users to `/`, and redirects authenticated users away from routes their role cannot access.

### Layout System

Dashboard layout lives at:

```text
project-root
-> DP world
-> src
-> layouts
-> DashboardLayout.jsx
```

`DashboardLayout.jsx` renders:

- desktop sidebar through `Sidebar.jsx`
- top navbar through `Navbar.jsx`
- route content through React Router `Outlet`
- mobile bottom navigation using hash links
- sidebar open/collapse state

### Navbar And Sidebar

Navbar:

```text
project-root
-> DP world
-> src
-> components
-> Navbar.jsx
```

Purpose:

- shows search UI
- shows message/notification buttons
- shows current logged-in user name and role
- triggers mobile sidebar and desktop collapse actions

Sidebar:

```text
project-root
-> DP world
-> src
-> components
-> Sidebar.jsx
```

Purpose:

- defines role-specific menu arrays
- links to dashboard sections using hashes
- exposes logout action from `AuthContext.jsx`

Role-specific sidebar navigation:

```text
ADMIN
-> /admin/dashboard
-> /admin/dashboard#leaderboard
-> /admin/dashboard#chapter-leaderboard
-> /admin/dashboard#members
-> /admin/dashboard#meetings
-> /admin/dashboard#settings

CHAPTER_PRESIDENT
-> /president/dashboard
-> /president/dashboard#members
-> /president/dashboard#leaderboard
-> /president/dashboard#meetings
-> /president/dashboard#settings

NORMAL_USER
-> /user/dashboard
-> /user/dashboard#members
-> /user/dashboard#meetings
-> /user/dashboard#leaderboard
-> /user/dashboard#settings
```

### Reusable UI Components

```text
project-root
-> DP world
-> src
-> components
-> Button.jsx
```

Reusable button component with variants and sizes.

```text
project-root
-> DP world
-> src
-> components
-> Card.jsx
```

Reusable card primitives: `Card`, `CardHeader`, `CardTitle`, `CardContent`.

```text
project-root
-> DP world
-> src
-> components
-> Table.jsx
```

Reusable table primitives: `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableCell`.

```text
project-root
-> DP world
-> src
-> components
-> Badge.jsx
```

Status badge component with color variants.

```text
project-root
-> DP world
-> src
-> components
-> Modal.jsx
```

Generic modal shell.

```text
project-root
-> DP world
-> src
-> components
-> ProfileModal.jsx
```

Profile modal that calls `/auth/me`. This file still contains some legacy role labels such as `CHA_AGENT` and `GOVT_OFFICIAL`; it is not part of the primary GSN dashboard flow rendered by `GsnDashboard.jsx`.

Login-specific components:

```text
project-root
-> DP world
-> src
-> components
-> LoginInputField.jsx

project-root
-> DP world
-> src
-> components
-> LoginRoleSelect.jsx

project-root
-> DP world
-> src
-> components
-> LoginLoader.jsx
```

### Frontend Pages And Portals

Login page:

```text
project-root
-> DP world
-> src
-> pages
-> Login.jsx
```

Admin portal:

```text
project-root
-> DP world
-> src
-> App.jsx
-> route /admin/dashboard
-> DP world/src/pages/gsn/GsnDashboard.jsx
-> view="admin"
```

Chapter President portal:

```text
project-root
-> DP world
-> src
-> App.jsx
-> route /president/dashboard
-> DP world/src/pages/gsn/GsnDashboard.jsx
-> view="president"
```

User portal:

```text
project-root
-> DP world
-> src
-> App.jsx
-> route /user/dashboard
-> DP world/src/pages/gsn/GsnDashboard.jsx
-> view="user"
```

Dashboard sections are all rendered by:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
```

Section routing inside `GsnDashboard.jsx` is hash-based:

| Feature | Path |
| --- | --- |
| Dashboard overview | `/admin/dashboard`, `/president/dashboard`, `/user/dashboard` |
| Global leaderboard | `/admin/dashboard#leaderboard` |
| Chapter leaderboard | `/admin/dashboard#chapter-leaderboard`, `/president/dashboard#leaderboard`, `/user/dashboard#leaderboard` |
| Members | `/admin/dashboard#members`, `/president/dashboard#members`, `/user/dashboard#members` |
| Meetings | `/admin/dashboard#meetings`, `/president/dashboard#meetings`, `/user/dashboard#meetings` |
| Settings | `/admin/dashboard#settings`, `/president/dashboard#settings`, `/user/dashboard#settings` |
| Chapters | internal section support exists as `#chapters`; it is rendered by `ChaptersScreen` but not currently exposed in every sidebar menu |

## Backend Structure

### Backend Entry Point

```text
project-root
-> server.js
```

`server.js` performs the Express setup:

- loads `.env`
- validates required environment variables through `config/env.js`
- creates the Express app
- applies `helmet`
- applies CORS for Vite dev origins
- enables JSON and URL-encoded body parsing
- registers `/health`
- mounts `/auth`
- mounts `/network`
- registers 404 handling
- registers global error handling
- tests PostgreSQL connection before listening

### Server Startup Helper

```text
project-root
-> start.js
```

Runs backend and frontend together:

- backend: `nodemon server.js`
- frontend: `npm run dev` inside `DP world/`

### Backend Configuration

Database:

```text
project-root
-> config
-> db.js
```

Creates a `pg.Pool` with values from `.env`, exports `pool`, and exports `testConnection()`.

Environment validation:

```text
project-root
-> config
-> env.js
```

Ensures required environment variables exist before the server starts.

Nodemon:

```text
project-root
-> nodemon.json
```

Ignores frontend, `node_modules`, and `.git` changes while watching backend files.

### Routes

Auth routes:

```text
project-root
-> routes
-> auth.js
```

Endpoints:

- `POST /auth/login`
- `POST /auth/verify-otp`
- `GET /auth/me`
- `PUT /auth/me`

Network routes:

```text
project-root
-> routes
-> network.js
```

Endpoints:

- `GET /network/dashboard`
- `GET /network/settings`
- `PUT /network/settings/profile`
- `PUT /network/settings/preferences`
- `POST /network/settings/change-password`
- `POST /network/chapters`
- `POST /network/users`
- `POST /network/meetings`
- `PUT /network/meetings/:id`
- `DELETE /network/meetings/:id`

### Controllers

Auth controller:

```text
project-root
-> controllers
-> authController.js
```

Responsibilities:

- validate username/password against `users`
- reject inactive or flagged accounts
- compare passwords with `bcryptjs`
- generate mock OTP through `services/authService.js`
- verify OTP
- sign JWT
- return current profile through `/auth/me`
- update basic current-user profile through `/auth/me`

Network controller:

```text
project-root
-> controllers
-> networkController.js
```

Responsibilities:

- dashboard data loading
- role-scoped user/chapter/meeting queries
- leaderboard data
- metrics
- member breakdowns
- chapter creation
- user creation
- settings loading
- profile update
- notification/privacy/security/account preference update
- password change
- meeting create/update/delete

There are no separate `userController.js`, `chapterController.js`, or `meetingsController.js` files in the current project. Those responsibilities are centralized in `controllers/networkController.js`.

### Services

Authentication service:

```text
project-root
-> services
-> authService.js
```

Responsibilities:

- generate OTP
- store OTP in an in-memory `Map`
- expire OTP after five minutes
- verify OTP
- sign JWT
- verify JWT

Audit service:

```text
project-root
-> services
-> auditService.js
```

Writes audit records into `audit_logs`.

### Middleware

JWT middleware:

```text
project-root
-> middleware
-> auth.js
```

Reads `Authorization: Bearer <token>`, verifies JWT, and attaches:

```js
req.user = {
  id,
  role,
  employeeId
}
```

RBAC middleware:

```text
project-root
-> middleware
-> rbac.js
```

Exports `requireRole(...allowedRoles)`. It must run after `authenticate`.

Validation middleware:

```text
project-root
-> middleware
-> validate.js
```

Formats `express-validator` errors into consistent `400` responses.

Audit middleware:

```text
project-root
-> middleware
-> auditLogger.js
```

Hooks into `res.finish` and writes request metadata to the database through `services/auditService.js`.

## Database Structure

### PostgreSQL Connection

```text
project-root
-> config
-> db.js
```

The backend uses the `pg` package directly. There is no Prisma, Sequelize, TypeORM, or other ORM in the current project.

Connection flow:

```text
.env
-> config/env.js validates required values
-> config/db.js creates pg Pool
-> server.js calls testConnection()
-> controllers import pool
-> SQL queries run against PostgreSQL
```

### Schema

```text
project-root
-> models
-> schema.sql
```

Defines:

- PostgreSQL extension: `uuid-ossp`
- enum `user_role`: `ADMIN`, `CHAPTER_PRESIDENT`, `NORMAL_USER`
- enum `user_status`: `ACTIVE`, `INVITED`, `SUSPENDED`
- enum `meeting_status`: `UPCOMING`, `COMPLETED`, `CANCELLED`
- enum `referral_status`: `OPEN`, `WON`, `LOST`

Tables:

- `users`
- `chapters`
- `referrals`
- `meetings`
- `meeting_attendees`
- `user_settings`
- `audit_logs`

### Model Relationships

```text
chapters.president_id
-> users.id
```

Each chapter can have one president.

```text
users.chapter_id
-> chapters.id
```

Each non-admin user can belong to a chapter.

```text
users.president_id
-> users.id
```

Normal users can be assigned under a chapter president.

```text
referrals.from_user_id
-> users.id

referrals.to_user_id
-> users.id
```

Referral records connect two users.

```text
meetings.chapter_id
-> chapters.id

meetings.created_by
-> users.id
```

Meetings belong to chapters and track the creator.

```text
meeting_attendees.meeting_id
-> meetings.id

meeting_attendees.user_id
-> users.id
```

Join table for meeting attendance.

```text
user_settings.user_id
-> users.id
```

One settings record per user.

```text
audit_logs.user_id
-> users.id
```

Audit logs optionally reference the acting user.

### Seed Data

SQL seed:

```text
project-root
-> models
-> seed.sql
```

Development setup script:

```text
project-root
-> scripts
-> setup-db.js
```

`scripts/setup-db.js` is idempotent. It creates missing tables/enums/indexes, updates schema drift with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and upserts default test accounts.

### Migrations

There is no formal migration directory in the current project. Schema setup is handled by:

```text
project-root
-> models
-> schema.sql

project-root
-> scripts
-> setup-db.js
```

## API Connection Flow

### Frontend API Client

```text
project-root
-> DP world
-> src
-> services
-> api.js
```

Responsibilities:

- creates an Axios client
- uses an empty `baseURL` so requests hit the same Vite origin
- adds `Authorization: Bearer <token>` from `localStorage`
- clears auth data and redirects to `/` on `401`

### Vite Proxy

```text
project-root
-> DP world
-> vite.config.js
```

Proxies frontend requests to the backend:

```text
/auth -> http://127.0.0.1:3001
/network -> http://127.0.0.1:3001
/health -> http://127.0.0.1:3001
```

### Login Flow

```text
project-root
-> DP world
-> src
-> pages
-> Login.jsx
```

User submits credentials.

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
```

`requestOtp(employee_id, password)` calls the API client.

```text
project-root
-> DP world
-> src
-> services
-> api.js
```

Axios sends:

```text
POST /auth/login
```

Backend route:

```text
project-root
-> routes
-> auth.js
```

Controller:

```text
project-root
-> controllers
-> authController.js
-> login()
```

Service:

```text
project-root
-> services
-> authService.js
-> generateOtp()
```

Database:

```text
project-root
-> config
-> db.js
-> pool.query(...)
-> users table
```

OTP verification:

```text
Login.jsx
-> AuthContext.jsx verifyOtp()
-> api.js
-> POST /auth/verify-otp
-> routes/auth.js
-> controllers/authController.js verifyOtpHandler()
-> services/authService.js verifyOtp()
-> services/authService.js signToken()
-> localStorage token/role/employee_id/full_name
-> role dashboard redirect
```

### Create User Flow

Frontend:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
```

Current note: dashboard rendering supports members and role-scoped member visibility. The backend exposes `POST /network/users`, but the current `GsnDashboard.jsx` does not expose a full create-user form in the active UI.

Backend flow:

```text
Frontend form
-> DP world/src/services/api.js
-> POST /network/users
-> routes/network.js
-> authenticate
-> auditLogger
-> requireRole('ADMIN')
-> express-validator rules
-> validate
-> controllers/networkController.js createUser()
-> bcrypt.hash(password, 12)
-> INSERT INTO users
-> optional UPDATE chapters SET president_id for CHAPTER_PRESIDENT
-> PostgreSQL
```

### Create Chapter Flow

Backend endpoint exists for admins:

```text
Frontend form
-> DP world/src/services/api.js
-> POST /network/chapters
-> routes/network.js
-> authenticate
-> auditLogger
-> requireRole('ADMIN')
-> validate
-> controllers/networkController.js createChapter()
-> INSERT INTO chapters ... ON CONFLICT
-> PostgreSQL
```

Current note: the route exists, but the current primary dashboard file does not expose a dedicated create-chapter form.

### Create Meeting Flow

Frontend:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> MeetingsScreen
```

Flow:

```text
MeetingsScreen form
-> api.post('/network/meetings', form)
-> DP world/src/services/api.js
-> routes/network.js
-> authenticate
-> auditLogger
-> requireRole('ADMIN', 'CHAPTER_PRESIDENT')
-> validate
-> controllers/networkController.js createMeeting()
-> getCurrentUser()
-> INSERT INTO meetings
-> PostgreSQL
```

Role behavior:

- Admin can choose a chapter through `chapter_id`.
- Chapter president uses their own `chapter_id`.
- Normal user cannot create meetings because `roleCanManageMeetings(view)` only permits `admin` and `president`, and the backend route also blocks the role.

## Role-Based Access Control

### Where Roles Are Defined

Database roles:

```text
project-root
-> models
-> schema.sql
-> CREATE TYPE user_role AS ENUM ('ADMIN', 'CHAPTER_PRESIDENT', 'NORMAL_USER')
```

Frontend route role map:

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
-> roleRoutes
```

Frontend protected routes:

```text
project-root
-> DP world
-> src
-> App.jsx
```

Backend route permissions:

```text
project-root
-> routes
-> network.js
```

RBAC middleware:

```text
project-root
-> middleware
-> rbac.js
```

### Where Permissions Are Checked

Frontend:

```text
App.jsx
-> ProtectedRoute allowedRoles
-> ProtectedRoute.jsx
-> AuthContext user.role
```

Backend:

```text
routes/network.js
-> authenticate
-> requireRole(...)
-> networkController
```

Data-level scoping:

```text
project-root
-> controllers
-> networkController.js
-> scopedUserWhere()
-> getDashboard()
-> assertMeetingAccess()
```

### Admin Role Flow

```text
Login.jsx
-> AuthContext.verifyOtp()
-> user.role = ADMIN
-> localStorage role=ADMIN
-> navigate('/admin/dashboard')
-> App.jsx route /admin/dashboard
-> ProtectedRoute allowedRoles=['ADMIN']
-> DashboardLayout role='ADMIN'
-> Sidebar ADMIN menu
-> GsnDashboard view='admin'
-> api.get('/network/dashboard')
-> networkController.getDashboard()
-> ADMIN receives unscoped users/chapters/meetings
```

Admin backend privileges:

```text
POST /network/chapters
POST /network/users
POST /network/meetings
PUT /network/meetings/:id
DELETE /network/meetings/:id
```

### Chapter President Flow

```text
Login.jsx
-> AuthContext.verifyOtp()
-> user.role = CHAPTER_PRESIDENT
-> localStorage role=CHAPTER_PRESIDENT
-> navigate('/president/dashboard')
-> App.jsx route /president/dashboard
-> ProtectedRoute allowedRoles=['CHAPTER_PRESIDENT']
-> DashboardLayout role='CHAPTER_PRESIDENT'
-> Sidebar CHAPTER_PRESIDENT menu
-> GsnDashboard view='president'
-> api.get('/network/dashboard')
-> networkController.getDashboard()
-> scopedUserWhere() limits users to president/self relationship
-> meetings limited by chapter_id
```

Chapter president backend privileges:

```text
GET /network/dashboard
GET /network/settings
PUT /network/settings/profile
PUT /network/settings/preferences
POST /network/settings/change-password
POST /network/meetings
PUT /network/meetings/:id
DELETE /network/meetings/:id
```

### User Flow

```text
Login.jsx
-> AuthContext.verifyOtp()
-> user.role = NORMAL_USER
-> localStorage role=NORMAL_USER
-> navigate('/user/dashboard')
-> App.jsx route /user/dashboard
-> ProtectedRoute allowedRoles=['NORMAL_USER', 'USER']
-> DashboardLayout role='NORMAL_USER'
-> Sidebar NORMAL_USER menu
-> GsnDashboard view='user'
-> api.get('/network/dashboard')
-> networkController.getDashboard()
-> scopedUserWhere() limits users to current user
-> chapters and meetings limited by current chapter_id
```

Normal user backend privileges:

```text
GET /network/dashboard
GET /network/settings
PUT /network/settings/profile
PUT /network/settings/preferences
POST /network/settings/change-password
```

## Authentication Flow

Complete login sequence:

```text
project-root
-> DP world
-> src
-> pages
-> Login.jsx
```

The login page has two steps:

1. Credentials: username/password.
2. OTP verification.

```text
Login.jsx
-> useAuth()
-> requestOtp()
```

Auth state and API calls:

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
```

Request helper:

```text
project-root
-> DP world
-> src
-> services
-> api.js
```

Backend route:

```text
project-root
-> routes
-> auth.js
```

Controller:

```text
project-root
-> controllers
-> authController.js
```

JWT/OTP service:

```text
project-root
-> services
-> authService.js
```

Password hashing:

```text
project-root
-> controllers
-> authController.js
-> bcrypt.compare(...)

project-root
-> controllers
-> networkController.js
-> bcrypt.hash(...)

project-root
-> scripts
-> setup-db.js
-> bcrypt.hash(...)
```

Session storage:

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
-> localStorage.setItem('token', ...)
-> localStorage.setItem('role', ...)
-> localStorage.setItem('employee_id', ...)
-> localStorage.setItem('full_name', ...)
```

Dashboard redirect:

```text
AuthContext.jsx
-> roleRoutes
-> ADMIN: /admin/dashboard
-> CHAPTER_PRESIDENT: /president/dashboard
-> NORMAL_USER: /user/dashboard
```

## Dashboard Architecture

Primary dashboard file:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
```

`GsnDashboard.jsx` contains the dashboard screens and many local UI helpers:

- `DashboardShell`
- `MetricCard`
- `UserAvatar`
- `MobileHeader`
- `DataModal`
- `MembersTable`
- `ChapterTable`
- `MeetingsTable`
- `StatusBadge`
- `EventCard`
- `MatchmakingCard`
- `DonutChart`
- `LineChart`
- `MiniInput`
- `MiniSelect`
- `MiniTextarea`
- `PrimaryButton`
- `Overview`
- `LeaderboardScreen`
- `MembersScreen`
- `ChaptersScreen`
- `MeetingsScreen`
- `SettingsScreen`
- `SettingsToggles`

### Dashboard Data Loading

```text
GsnDashboard.jsx
-> load()
-> api.get('/network/dashboard')
-> routes/network.js GET /dashboard
-> networkController.getDashboard()
-> PostgreSQL queries for users, chapters, meetings
-> metrics, leaderboards, memberBreakdown
-> React state setData(response.data)
```

### Admin Dashboard

```text
project-root
-> DP world
-> src
-> App.jsx
-> /admin/dashboard
-> DashboardLayout role='ADMIN'
-> GsnDashboard view='admin'
```

Admin dashboard sections:

- overview metrics
- global leaderboard
- chapter leaderboard
- total members
- chapters support through `ChaptersScreen`
- meetings
- settings

### Chapter President Dashboard

```text
project-root
-> DP world
-> src
-> App.jsx
-> /president/dashboard
-> DashboardLayout role='CHAPTER_PRESIDENT'
-> GsnDashboard view='president'
```

President dashboard sections:

- overview metrics
- users under president
- chapter leaderboard
- meetings
- settings

### User Dashboard

```text
project-root
-> DP world
-> src
-> App.jsx
-> /user/dashboard
-> DashboardLayout role='NORMAL_USER'
-> GsnDashboard view='user'
```

User dashboard sections:

- overview metrics
- own chapter
- meetings
- chapter leaderboard
- settings

### Modal System

Dashboard-specific detail modal:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> DataModal
```

Generic reusable modal:

```text
project-root
-> DP world
-> src
-> components
-> Modal.jsx
```

Profile modal:

```text
project-root
-> DP world
-> src
-> components
-> ProfileModal.jsx
```

### Tables And Charts

Dashboard local tables:

```text
GsnDashboard.jsx
-> MembersTable
-> ChapterTable
-> MeetingsTable
```

Reusable table primitives:

```text
project-root
-> DP world
-> src
-> components
-> Table.jsx
```

Charts:

```text
GsnDashboard.jsx
-> DonutChart
-> LineChart
```

## Settings System

Settings screen:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> SettingsScreen
```

Backend settings routes:

```text
project-root
-> routes
-> network.js
-> GET /network/settings
-> PUT /network/settings/profile
-> PUT /network/settings/preferences
-> POST /network/settings/change-password
```

Backend handlers:

```text
project-root
-> controllers
-> networkController.js
-> getSettings()
-> updateProfile()
-> updateSettings()
-> changePassword()
```

Database tables:

```text
project-root
-> models
-> schema.sql
-> users
-> user_settings
```

### Profile Update Flow

```text
SettingsScreen
-> saveProfile()
-> api.put('/network/settings/profile', profile)
-> routes/network.js
-> authenticate
-> auditLogger
-> networkController.updateProfile()
-> UPDATE users
-> PostgreSQL
```

### Password Change Flow

```text
SettingsScreen
-> changePassword()
-> api.post('/network/settings/change-password', password)
-> routes/network.js
-> authenticate
-> auditLogger
-> networkController.changePassword()
-> bcrypt.compare(current_password)
-> bcrypt.hash(new_password, 12)
-> UPDATE users SET password_hash
-> PostgreSQL
```

### Notification Settings Flow

```text
SettingsScreen
-> SettingsToggles
-> savePreferences({ notifications: next })
-> api.put('/network/settings/preferences', next)
-> routes/network.js
-> networkController.updateSettings()
-> INSERT INTO user_settings ... ON CONFLICT (user_id) DO UPDATE
-> notification_preferences JSONB
```

Settings categories currently supported:

- profile
- account
- notifications
- privacy
- security
- password
- language
- help
- about

## State Management

The project uses React Context and local component state. There is no Redux, Zustand, React Query, SWR, or other external state manager in the current codebase.

Auth state:

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
```

Stores:

- current user in React state
- token in `localStorage`
- role in `localStorage`
- employee id in `localStorage`
- full name in `localStorage`

Dashboard state:

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
```

Uses local `useState` for:

- loaded dashboard data
- loading state
- API error
- active modal detail
- meeting form state
- settings form state
- password form state
- settings tabs

API caching:

- No shared API cache exists.
- Dashboard data is fetched on mount and refreshed after meeting/settings changes through local `load()`.

## Styling System

Tailwind entry:

```text
project-root
-> DP world
-> src
-> index.css
```

Tailwind/Vite setup:

```text
project-root
-> DP world
-> vite.config.js
```

Uses:

- `tailwindcss`
- `@tailwindcss/vite`
- Tailwind v4 `@theme`
- utility-first classes directly in JSX

Theme tokens:

```text
--color-brand-light
--color-brand-blue
--color-brand-dark
```

Reusable class helper:

```text
project-root
-> DP world
-> src
-> utils
-> cn.js
```

`cn.js` combines `clsx` and `tailwind-merge` for safe conditional class composition.

Design system components:

```text
project-root
-> DP world
-> src
-> components
-> Button.jsx
-> Card.jsx
-> Badge.jsx
-> Table.jsx
-> Modal.jsx
```

## Responsive Design Structure

Responsive layout lives mainly in:

```text
project-root
-> DP world
-> src
-> layouts
-> DashboardLayout.jsx

project-root
-> DP world
-> src
-> components
-> Sidebar.jsx

project-root
-> DP world
-> src
-> components
-> Navbar.jsx

project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
```

Responsive behavior:

- Desktop sidebar is shown at `lg` breakpoint.
- Mobile bottom navigation is shown below `sm`.
- Navbar is hidden on very small screens and shown from `sm`.
- `MobileHeader` in `GsnDashboard.jsx` provides mobile-specific dashboard header.
- Dashboard grids use Tailwind breakpoints such as `sm:`, `md:`, `lg:`, `xl:`.
- Tables use horizontal overflow wrappers for narrow screens.

Bottom navigation:

```text
DashboardLayout.jsx
-> mobileItems
-> Dashboard
-> Leaderboard
-> Members
-> Meetings
-> Settings
```

## Configuration Files

Root package:

```text
project-root
-> package.json
```

Backend dependencies and scripts.

Frontend package:

```text
project-root
-> DP world
-> package.json
```

React/Vite dependencies and scripts.

Vite:

```text
project-root
-> DP world
-> vite.config.js
```

React plugin, Tailwind plugin, dev server port, API proxy.

ESLint:

```text
project-root
-> DP world
-> eslint.config.js
```

Frontend lint configuration.

Nodemon:

```text
project-root
-> nodemon.json
```

Backend watcher ignore rules.

Workspace:

```text
project-root
-> GSN.code-workspace
```

VS Code workspace file.

## Major Feature Navigation Paths

### Login

Frontend:

```text
project-root
-> DP world
-> src
-> pages
-> Login.jsx
```

Auth context:

```text
project-root
-> DP world
-> src
-> context
-> AuthContext.jsx
```

Backend:

```text
project-root
-> routes
-> auth.js

project-root
-> controllers
-> authController.js

project-root
-> services
-> authService.js
```

### Admin Portal

```text
project-root
-> DP world
-> src
-> App.jsx
-> /admin/dashboard
-> DP world/src/layouts/DashboardLayout.jsx
-> DP world/src/pages/gsn/GsnDashboard.jsx
```

### Chapter President Portal

```text
project-root
-> DP world
-> src
-> App.jsx
-> /president/dashboard
-> DP world/src/layouts/DashboardLayout.jsx
-> DP world/src/pages/gsn/GsnDashboard.jsx
```

### User Portal

```text
project-root
-> DP world
-> src
-> App.jsx
-> /user/dashboard
-> DP world/src/layouts/DashboardLayout.jsx
-> DP world/src/pages/gsn/GsnDashboard.jsx
```

### Dashboard Pages

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> Overview
```

### Settings Pages

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> SettingsScreen
```

Backend:

```text
project-root
-> controllers
-> networkController.js
-> getSettings()
-> updateProfile()
-> updateSettings()
-> changePassword()
```

### Meetings Pages

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> MeetingsScreen
```

Backend:

```text
project-root
-> routes
-> network.js
-> /meetings

project-root
-> controllers
-> networkController.js
-> createMeeting()
-> updateMeeting()
-> deleteMeeting()
```

### Leaderboard Pages

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> LeaderboardScreen
```

Data source:

```text
project-root
-> controllers
-> networkController.js
-> getDashboard()
-> leaderboards.global
-> leaderboards.chapter
```

### Members

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> MembersScreen
-> MembersTable
```

Backend:

```text
project-root
-> controllers
-> networkController.js
-> getDashboard()
-> scopedUserWhere()
```

### Chapters

```text
project-root
-> DP world
-> src
-> pages
-> gsn
-> GsnDashboard.jsx
-> ChaptersScreen
-> ChapterTable
```

Backend:

```text
project-root
-> routes
-> network.js
-> POST /network/chapters

project-root
-> controllers
-> networkController.js
-> createChapter()
```

## Available Scripts

Root scripts:

```bash
npm start
npm run dev
npm run build
npm run backend
npm run frontend
npm run setup
npm run setup-frontend
```

Frontend scripts:

```bash
cd "DP world"
npm run dev
npm run build
npm run lint
npm run preview
```

## Developer Notes

- The active frontend is under `DP world/`, not root `src/`.
- The active backend is at the project root, not under a `server/` folder.
- The backend uses direct SQL through `pg`; there is no ORM.
- The current active dashboard is consolidated in `GsnDashboard.jsx`.
- Several older files are deleted in git status and should not be treated as active architecture.
- `README.md` had been deleted before this documentation pass; this file is the restored main project README.
