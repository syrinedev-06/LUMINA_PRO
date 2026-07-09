# 🗂️ Lumina Pro

A collaborative task management web application based on the **Kanban** method.
Built as the certification project for the **DWWM** professional title (Développeur Web et Web Mobile) — La Plateforme_, 2025/2026 cohort.

**Author:** Syrine Ben Hassine

---

## Features

- Kanban board with **customizable columns** (create, rename, delete)
- **Full CRUD** on tasks (create, edit, move, delete)
- Moving tasks between columns via **directional buttons** (⬅️ ➡️) — a deliberate choice over native drag & drop, to keep the UI and code simple
- Assigning tasks to team members
- Secure authentication with **JWT** (24h expiration)
- Passwords hashed with **bcrypt** (10 salt rounds)
- Role management: **admin** (team + column management) and **user**
- **Responsive** interface across desktop, tablet (≤ 900px) and mobile (≤ 600px)
- Interactive API documentation with **Swagger UI**

---

## Tech stack

| Layer | Technology | Exact version |
|---|---|---|
| Front-end | HTML5, modular CSS3 (8 files), JavaScript ES6+ Vanilla | — (no framework, no build step) |
| Back-end | Node.js, Express | Express 5.2.1, Node.js v24.14.0 |
| Database | MySQL (via `mysql2`) | MySQL Server 8.0.45, mysql2 3.22.2 |
| Security | jsonwebtoken, bcrypt, dotenv, cors | jsonwebtoken 9.0.3, bcrypt 6.0.0, dotenv 17.4.2, cors 2.8.6 |
| Documentation | swagger-ui-express | 5.0.1 |
| Versioning | Git + GitHub | — |

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+ (developed with v24.14.0)
- [MySQL Server 8.0](https://dev.mysql.com/downloads/mysql/) (developed with 8.0.45)

---

## Installation

**1. Clone the project**
```bash
git clone https://github.com/syrinedev-06/LUMINA_PRO.git
cd LUMINA_PRO
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Configure environment variables**
Copy `.env.example` to `.env` and fill in the values (this file is never committed):
```bash
cp .env.example .env
```
```
SECRET_KEY=your_jwt_secret_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lumina_pro
PORT=3000
```

**4. Start MySQL**
Make sure the **MySQL80** Windows service (or your MySQL server) is running.

**5. Create the database**
In phpMyAdmin (`http://localhost/phpmyadmin`), create a database named:
```sql
CREATE DATABASE lumina_pro;
```
The 3 tables (`users`, `columns`, `tasks`) are created automatically on first server start — see `database/schema.sql` for the reference schema.

**6. Start the server**
```bash
npm start
```
The server runs on **http://localhost:3000**.

**7. Open the application**
Open `frontend/login.html` in a browser (or via VS Code Live Server).

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lumina.com | Lumina1! |
| User | user@lumina.com | Lumina1! |

No seed script is currently maintained (`seed.js` was removed during the exam-scope simplification). These accounts are created through the normal `/api/auth/register` flow, then the admin role is set with:
```sql
UPDATE users SET role='admin' WHERE email='admin@lumina.com';
```

---

## Project structure

```
lumina_pro/
├── frontend/
│   ├── index.html          # Kanban dashboard
│   ├── login.html           # Login / registration page
│   ├── css/                 # 8 CSS modules
│   │   ├── variables.css    # Colors and fonts
│   │   ├── layout.css        # Sidebar + layout
│   │   ├── kanban.css        # Columns and cards
│   │   └── responsive.css    # Tablet (≤900px) and mobile (≤600px) media queries
│   └── js/                   # 8 JS modules
│       ├── api.js            # authFetch() + escapeHTML()
│       ├── auth.js           # Login / Register
│       ├── kanban.js          # Board rendering
│       ├── tasks.js           # Task CRUD
│       ├── columns.js         # Column CRUD
│       ├── ui.js              # UI events (sidebar, modals)
│       ├── team.js            # Team management (admin)
│       └── profile.js         # "My Profile" card (name, email, role, status)
├── backend/
│   ├── server.js             # Express entry point, table auto-creation
│   ├── config/
│   │   └── db.js             # DB connection config, read from process.env
│   ├── middleware/
│   │   └── security.js       # verifyToken middleware (JWT)
│   ├── routes/
│   │   ├── auth.js            # POST /login, POST /register
│   │   ├── tasks.js           # Task CRUD
│   │   ├── columns.js         # Column CRUD
│   │   └── users.js           # GET/DELETE users
│   ├── .env.example           # Environment variable template
│   └── swagger.json           # API documentation source
└── database/
    └── schema.sql             # Reference SQL schema (matches server.js exactly)
```

---

## API documentation

Once the server is running, the Swagger documentation is available at:
**http://localhost:3000/api-docs**

| Method | Route | Description | Auth |
|--------|-------|--------------|------|
| POST | /api/auth/login | Log in | No |
| POST | /api/auth/register | Register | No |
| GET | /api/tasks | Fetch all tasks | JWT |
| POST | /api/tasks | Create a task | JWT |
| PUT | /api/tasks/:id | Edit / move a task | JWT |
| DELETE | /api/tasks/:id | Delete a task (owner or admin only) | JWT |
| GET | /api/columns | Fetch columns | JWT |
| POST | /api/columns | Create a column | JWT |
| PUT | /api/columns/:id | Rename a column | JWT |
| DELETE | /api/columns/:id | Delete a column (cascades to its tasks) | JWT |
| GET | /api/users | View the team | JWT |
| DELETE | /api/users/:id | Delete a user | JWT |

---

## Security

- **SQL injection**: prepared statements with `?` placeholders on every route
- **XSS**: `escapeHTML()` applied to any user-supplied content injected into the DOM
- **Passwords**: irreversible bcrypt hashing with a unique random salt per user
- **Authentication**: HMAC-SHA256-signed JWT, 24h expiration, verified by middleware, secret read from `.env` (never hard-coded, never committed)
- **CSRF**: JWT sent in the `Authorization` header, never in a cookie
- **IDOR**: task deletion checks server-side that the requester owns the task or is an admin

### Known limitations (documented on purpose, not hidden)
- No automated test suite yet (Jest/Supertest identified as a priority improvement)
- No rate limiting on `/api/auth` (brute-force protection to add)
- Runs locally only for now (XAMPP + Node), no containerization or remote hosting yet
- No formal routes/controllers/models separation — routes hold their SQL directly, a deliberate simplification for a solo project of this size

---

*Project built for the Développeur Web et Web Mobile (DWWM) certification — La Plateforme_, 2025/2026.*
