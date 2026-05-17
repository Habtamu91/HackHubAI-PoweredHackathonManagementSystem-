# HackHub

AI-powered hackathon management system for organizers, participants, judges, mentors, and admins.

This repository is a microservice-oriented monorepo with:

- `frontend/` - React 18 + Vite + Tailwind CSS SPA
- `backend/` - Node.js + Express + Socket.IO + MongoDB API
- `ai/` - Python + FastAPI AI service
- `docker-compose.yml` - local MongoDB, Redis, API, frontend, and AI service orchestration

## Features implemented in this scaffold

- JWT access tokens with httpOnly refresh cookie flow
- Role-based access control for participant, organizer, judge, mentor, and admin roles
- Hackathon lifecycle APIs, participant registration, judging assignments, announcements
- Team creation, invitations, join requests, and member management
- Submission drafts, final submission locking, likes, judge scoring, leaderboards, result publishing
- Socket.IO user rooms and hackathon broadcast rooms
- Notification persistence with realtime events
- PDF certificate generation with public verification IDs
- AI team matching, project evaluation, similarity detection, and analytics endpoints
- Scheduled jobs for hackathon status transitions, deadline warnings, and invitation expiry
- Frontend pages for landing, auth, dashboard, hackathon browse/detail/create, team workspace, judge panel, admin analytics, certificate verification, and leaderboard

## Quick start

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm install
npm run dev:backend
npm run dev:frontend
uvicorn ai.main:app --reload --host 0.0.0.0 --port 8000
```

Or run the full local stack:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- Backend health: http://localhost:5000/health
- AI health: http://localhost:8000/health

## Environment variables

Backend variables are documented in `backend/.env.example`. The most important values are:

- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `AI_SERVICE_URL`
- `CLOUDINARY_*`
- `EMAIL_*`

Frontend variables are documented in `frontend/.env.example`:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

## API surface

All backend routes are prefixed with `/api/v1`.

- `/auth`
- `/hackathons`
- `/teams`
- `/submissions`
- `/judge`
- `/ai`
- `/notifications`
- `/certificates`

The AI service exposes:

- `POST /team-match`
- `POST /evaluate`
- `POST /similarity`
- `POST /analytics`

## Notes

This is an initial production-shaped MVP scaffold. External providers such as SMTP, Cloudinary, Redis-backed token blacklisting, OpenAI evaluation, Sentry, and managed hosting credentials are represented through integration points and environment variables so they can be wired in without changing the app architecture.
