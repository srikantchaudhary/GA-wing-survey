# GA Wing Survey Portal — Backend

Node.js + Express + MySQL API for the GA Wing frontend.

## Prerequisites

- Node.js 18+
- MySQL 8+ running locally

## Setup

1. Copy environment file and set your MySQL password:

```bash
cd backend
copy .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gawing_survey
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

2. Install dependencies:

```bash
npm install
```

3. Create database and seed sample forms:

```bash
npm run db:setup
```

4. Start the API:

```bash
npm run dev
```

API base URL: `http://localhost:3001/api`

Health check: `GET http://localhost:3001/api/health`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server + DB status |
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Sign in (returns JWT) |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET | `/api/forms` | List all forms |
| POST | `/api/forms` | Create/update form |
| DELETE | `/api/forms/:id` | Delete form |
| PATCH | `/api/forms/:id/publish` | Publish form |
| GET | `/api/custom-sections` | List custom sections |
| POST | `/api/custom-sections` | Add section |
| DELETE | `/api/custom-sections/:id` | Remove section |
| GET | `/api/responses` | All submissions |
| GET | `/api/responses/lookup?state=&formId=` | One submission |
| POST | `/api/responses` | Submit form |
| GET | `/api/drafts?state=&formId=` | Load draft |
| PUT | `/api/drafts` | Save draft |
| DELETE | `/api/drafts?state=&formId=` | Clear draft |

## Frontend

From the project root, run the Vite dev server (proxies `/api` → port 3001):

```bash
npm run dev
```

Both servers must run for full functionality.
