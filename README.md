# EduSpace

A web-based classroom management platform built as a microservices monorepo. Supports two classroom types (Teaching and Friendly), organized content with chapters and post types, real-time group chat, full-text search and grading.

## Architecture

```
Frontend (React 19)
    ↓
NGINX (port 5000)
    ├── /socket.io/ → Communication Service (port 3005)
    └── everything else → API Gateway (port 3001)
                              ├── /users         → User Service (3002)
                              ├── /classroom     → Class Service (3003)
                              ├── /content       → Content Service (3004)
                              ├── /chat          → Communication Service (3005)
                              ├── /notifications → Notification Service (3006)
                              ├── /search        → Search Service (3007)
                              └── /files         → File Service (3010)
```

## Services

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| API Gateway | 3001 | — | JWT verification, rate limiting (Redis), request routing |
| User Service | 3002 | users_db | Auth, profiles, password reset |
| Class Service | 3003 | classes_db | Classrooms, members, roles, chapters |
| Content Service | 3004 | content_db | Posts, assignments, submissions, grading |
| Communication Service | 3005 | communication_db | Group chat (REST + WebSocket) |
| Notification Service | 3006 | notifications_db | Notifications (real-time + email) |
| Search Service | 3007 | — | Full-text search (Elasticsearch) |
| File Service | 3010 | — | File upload/download (MinIO) |
| Frontend | 5173 | — | React 19 SPA |

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router v7, TanStack React Query, TanStack React Table, FullCalendar, Axios, Socket.IO client

**Backend:** Node.js, Express v5, TypeScript, Prisma ORM, PostgreSQL, JWT, Multer, AWS S3 SDK (MinIO), Nodemailer, Morgan, Socket.IO

**Infrastructure:** PostgreSQL (5 databases), Redis, RabbitMQ, MinIO, NGINX, Elasticsearch, pgAdmin — all via Docker Compose

**Tooling:** pnpm workspaces, Docker Compose

## Prerequisites

- Node.js v20+
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose

## Getting Started

### 1. Start infrastructure

```bash
cd docker
docker compose up -d
```

This starts PostgreSQL (5 databases), Redis, RabbitMQ, MinIO, NGINX, Elasticsearch, and pgAdmin.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Push database schemas (fresh setup only)

If this is a first-time setup or you wiped Docker volumes, push the Prisma schemas to create tables:

```bash
pnpm --filter user-service exec prisma db push
pnpm --filter class-service exec prisma db push
pnpm --filter content-service exec prisma db push
pnpm --filter communication-service exec prisma db push
pnpm --filter notification-service exec prisma db push
```

Skip this if the databases already have tables.

### 4. Start all services

```bash
pnpm dev
```

Or start individually:

```bash
pnpm --filter user-service dev
pnpm --filter frontend dev
```

### 5. Access the app

- **Frontend:** http://localhost:5173
- **Through NGINX:** http://localhost:5000
- **pgAdmin:** http://localhost:5050
- **RabbitMQ Management:** http://localhost:15672
- **MinIO Console:** http://localhost:9001

## Monorepo Structure

```
EduSpace/
├── api-gateway/                  # JWT verify, rate limit, proxy
├── services/
│   ├── user-service/             # Auth, profiles
│   ├── class-service/            # Classrooms, members, chapters
│   ├── content-service/          # Posts, assignments, grading
│   ├── file-service/             # File upload (MinIO)
│   ├── communication-service/    # Group chat (WebSocket)
│   ├── notification-service/     # Notifications
│   └── search-service/           # Full-text search (Elasticsearch)
├── shared/                       # @repo/shared — types, utils, middleware
├── frontend/                     # React 19 SPA
└── docker/                       # docker-compose.yml, nginx/, init-databases.sql
```

## Environment Variables

Each service has its own `.env` file. Key variables:

**User Service (`services/user-service/.env`):**
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/users_db
JWT_SECRET=your-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**API Gateway (`api-gateway/.env`):**
```
PORT=3001
JWT_SECRET=your-secret
REDIS_URL=redis://localhost:6379
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000
```

## Verification

After starting everything, verify the stack:

```bash
# Check Docker containers
docker compose -f docker/docker-compose.yml ps

# Check API Gateway health
curl http://localhost:5000/health

# Check a service directly
curl http://localhost:3002/health
```
