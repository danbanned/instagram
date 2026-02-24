# Instagram Clone (MERN)

Full-stack Instagram-style application with:
- User authentication (JWT)
- Image/video upload and storage
- Feed generation
- Likes and comments
- Real-time notifications (Socket.IO)
- Dockerized local development

## Monorepo Structure

```text
instagram/
├── client/
├── server/
├── shared/
├── docker/
└── README.md
```

## Quick Start (Local)

### 1. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment
- `server/.env`
- `client/.env`

Default local values are already included for quick boot.

### 3. Start MongoDB
Use local MongoDB or Docker.

### 4. Run apps
In separate terminals:
```bash
npm --prefix server run dev
npm --prefix client run dev
```

- API: `http://localhost:5000`
- Client: `http://localhost:5173`

## Docker Run
From `docker/`:
```bash
docker compose up --build
```

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Posts
- `GET /api/posts/feed`
- `POST /api/posts` (multipart with `media`, optional `caption`)
- `POST /api/posts/:postId/like`
- `POST /api/posts/:postId/comments`

### Follow + Notifications
- `POST /api/posts/users/:userId/follow`
- `GET /api/notifications`
- `PATCH /api/notifications/read`

## Deployment Notes
- Deploy `server/` to a Node runtime (Render, Railway, Fly, EC2, etc.)
- Deploy `client/` to static hosting (Vercel/Netlify) or Node runtime
- Use managed MongoDB (MongoDB Atlas)
- Store secrets in platform secret manager:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CLIENT_URL`
  - `VITE_API_BASE_URL`
  - `VITE_SOCKET_URL`
