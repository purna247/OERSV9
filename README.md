# OERS v9 — Online Examination Registration System

A full-stack web application for managing student exam registrations, advisor workflows, and admin operations for an engineering college.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, TailwindCSS v4 |
| **Backend** | Node.js, Express v5 |
| **Database** | PostgreSQL |
| **Auth** | JWT + bcrypt |

---

## Project Structure

```
OERSv9/
├── .gitignore
├── README.md
│
├── backend/                  # Express REST API
│   ├── config/               # DB connection, schema init, seed
│   ├── constants/            # Enums and shared constants
│   ├── controllers/          # Route handler logic
│   ├── middleware/           # Auth, role guard, error handler
│   ├── models/               # DB query functions (no ORM)
│   ├── routes/               # Express routers
│   ├── services/             # Business logic (import, PDF, fee, etc.)
│   ├── uploads/              # Runtime file uploads (photos gitignored)
│   ├── utils/                # Validators and helpers
│   ├── .env.example          # Environment variable template
│   ├── package.json
│   └── server.js             # Entry point
│
└── frontend/                 # React SPA (Vite)
    ├── public/               # Static assets
    ├── src/
    │   ├── assets/           # Images, icons
    │   ├── components/       # Reusable UI components
    │   │   ├── common/       # Shared form & utility components
    │   │   ├── dashboard/    # Dashboard-specific widgets
    │   │   ├── layout/       # Shell, sidebar, topbar
    │   │   └── ui/           # Base UI primitives
    │   ├── context/          # React context providers
    │   ├── hooks/            # Custom React hooks
    │   ├── pages/            # Page components (admin / advisor / student)
    │   ├── routes/           # Route definitions & guards
    │   ├── services/api/     # Axios API service layer
    │   ├── styles/           # Design tokens, themes, animations
    │   └── utils/            # Formatters, error handlers, helpers
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** running locally on port `5432`

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/oers-v9.git
cd oers-v9
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in your values
# Windows:   copy .env.example .env
# Mac/Linux: cp .env.example .env

# Create the PostgreSQL database manually first:
#   CREATE DATABASE oers_v9;

# Initialize the database schema (creates all tables)
node config/initDb.js

# Seed the default admin user and program list
node config/seed.js

# Start the development server
node server.js
```

> Backend runs at **http://localhost:5000**

> **Note (Windows):** If `npm run dev` gives a PowerShell execution policy error, use `node server.js` directly or run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# OR (if PowerShell blocks npm scripts):
node node_modules/vite/bin/vite.js
```

> Frontend runs at **http://localhost:5173**

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:pwd@localhost:5432/oers_v9` |
| `JWT_SECRET` | Secret key for JWT signing | any long random string |
| `BCRYPT_ROUNDS` | bcrypt salt rounds | `10` |

> **Special characters in your PostgreSQL password** must be URL-encoded in `DATABASE_URL`:
> `@` → `%40` &nbsp;|&nbsp; `#` → `%23` &nbsp;|&nbsp; `$` → `%24` &nbsp;|&nbsp; `!` → `%21`

---

## User Roles

| Role | Login Identifier | Description |
|---|---|---|
| **Admin** | Email address | Manages students, advisors, exam events, reports |
| **Advisor** | Email address | Reviews & approves registrations for assigned batch |
| **Student** | Registration No. | Registers for exams, views schedule, downloads admit card |

> After running `node config/seed.js`, the default admin login is printed to the console.

---

## API Overview

| Route Prefix | Access | Description |
|---|---|---|
| `POST /auth/login` | Public | Unified login for all roles |
| `POST /auth/change-password` | Authenticated | Change own password |
| `/admin/*` | Admin only | Student & advisor management, events, reports |
| `/advisor/*` | Advisor only | View students, upload attendance |
| `/student/*` | Student only | Registration, profile, schedule, admit card |
| `/payment/*` | Student only | Payment initiation & confirmation |
| `GET /health` | Public | Server health check |

---

## License

Private — All rights reserved.
