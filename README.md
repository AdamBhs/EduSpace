# 🚀 Setup Guide

## 📋 Prerequisites

First, verify that you have the following software installed:

### 1. Node.js

```bash
node --version  # Should show v20 or higher
npm --version
```

### 2. Docker Desktop

```bash
docker --version
docker compose --version  # Should have the v5.0.0
```

### 3. Git

```bash
git --version
```

### 4. Code Editor

VS Code recommended with these extensions:

- ESLint
- Prettier
- Docker

---

## 🐳 Docker Setup

Navigate to the docker folder and run:

1. **Start the containers:**

   ```bash
   docker compose up -d
   ```

2. **Verify containers are running:**
   ```bash
   docker compose ps  # for checking that everything work fine
   ```

> ⚠️ **Note:** If you have anything running on port 5432, stop it before proceeding.

---

## ✅ Verification Checklist

### 1. Docker is running

```bash
docker ps
# Should show: postgres, redis, rabbitmq, minio
```

### 2. PostgreSQL databases exist

```bash
docker exec -it EduSpace-postgres psql -U admin -d postgres -c "\l"
# Should list all 10 databases
```

### 3. RabbitMQ is accessible

```bash
curl http://localhost:15672
# Should return RabbitMQ management UI
```

### 4. MinIO is accessible

```bash
curl http://localhost:9000/minio/health/live
# Should return success
# If you don't get nothing that's fine just make sure the dashbord on http://localhost:9000 is running
```

### 5. Redis is running

```bash
docker exec -it EduSpace-redis redis-cli ping
# Should return: PONG
```

### 6. Run setup.sh

```bash
chmod +x setup.sh
./setup.sh
# To install the shared library bettwen all services
```

---

✨ **Setup Complete!** You're ready to go.
