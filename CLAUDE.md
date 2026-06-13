# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Run from the **root** directory:

```bash
npm run dev:client      # Start React frontend (Vite, http://localhost:5173)
npm run dev:server      # Start Express backend (nodemon, http://localhost:5000)
npm run build:client    # Production build of the React app
npm run seed            # Seed the database with demo data
npm run seed:reset      # Force-reset DB schema then re-seed
npm run db:reset        # Alias for seed:reset
```

Run from **`server/`** for Prisma operations:

```bash
npm run prisma:push     # Sync schema.prisma → database (no migration history)
npm run prisma:studio   # Open Prisma Studio GUI
npm run prisma:generate # Regenerate Prisma client after schema changes
```

There is no test suite. There is no lint script.

## Environment Setup

Copy `server/.env.example` → `server/.env` and fill in:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — minimum 32 characters
- `CLOUDINARY_*` — optional; falls back to local `server/uploads/`
- `HUGGINGFACE_API_TOKEN` / `GEMINI_API_KEY` — for AI-generated post detection

The client reads `client/.env` (Vite format: `VITE_*` prefix for any public vars).

## Architecture Overview

This is a **monorepo** with a Vite/React frontend (`client/`) and an Express/Node.js backend (`server/`). They run on separate ports and communicate over HTTP REST + Socket.io WebSockets.

### Backend (`server/`)

- **Entry point**: `server.js` — creates an `http.Server`, mounts all routes under `/api`, and initializes Socket.io via `config/socket.js`.
- **ORM**: Prisma v6 with PostgreSQL. The single source of truth for the schema is `prisma/schema.prisma`. All DB access goes through `config/prisma.js` (a shared Prisma client singleton).
- **Auth**: JWT-based. `middleware/authMiddleware.js` extracts and verifies the token. Tokens are issued on login/register and never stored server-side.
- **File uploads**: `multer` + `multer-storage-cloudinary` for cloud storage; local `uploads/` directory as a fallback. Static files are served at `/uploads`.
- **Real-time** (`config/socket.js`): Socket.io authenticates each connection via JWT in the handshake. Key events: `send_message`, `new_message`, `user_typing`, `react_to_message`, `edit_message`, `delete_message`, `mark_read`. Demo/seeded accounts have auto-reply logic inside this file.

### Frontend (`client/src/`)

- **Router**: React Router v6. All authenticated routes are wrapped in `PrivateRoute` (in `App.jsx`), which renders `MainLayout` — the persistent sidebar shell.
- **Auth state**: `hooks/useAuth.js` exposes `{ user, loading }` from context. JWT is stored in `localStorage` and injected into every Axios request via an interceptor in `services/api.js`.
- **Data fetching**: TanStack React Query v5 for all server state (caching, invalidation). Direct Axios calls go through `services/api.js` (the configured instance, not raw axios).
- **Real-time**: `services/socket.js` initializes a singleton Socket.io-client. `hooks/useSocket.js` exposes it to components.
- **Styling**: Plain CSS modules (`.module.css`) alongside global CSS files. No CSS-in-JS or Tailwind.

### Data Flow for Direct Messages

1. Client POSTs to `/api/messages` (REST) to create a conversation or fetch history.
2. Sending a message emits `send_message` over the socket; the server persists to DB then broadcasts `new_message` to participants.
3. `hooks/useUnreadCount.js` subscribes to socket events and tracks badge counts client-side.
4. Message edit window is enforced server-side: edits rejected after 10 minutes.

### Key Conventions

- Server uses **CommonJS** (`require`/`module.exports`). Client uses **ES modules** (`import`/`export`).
- Prisma schema changes require `npm run prisma:push` (dev) followed by `npm run prisma:generate` to update the client types.
- The `seed.js` script creates demo users with predictable usernames/passwords — useful for testing DM auto-replies.
