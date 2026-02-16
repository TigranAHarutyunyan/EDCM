# Docker Compose Complete Setup ✅

## What Was Configured

Your EDCM project now has complete Docker Compose automation with:

### ✅ PostgreSQL Service

- **Image:** postgres:15
- **User:** tigran (auto-created)
- **Database:** edcm_db (auto-created)
- **Password:** From `.env` (DB_PASSWORD)
- **Data Persistence:** postgres_data volume
- **Health Check:** Enabled with retries
- **Initialization:** Automatic user and database setup

### ✅ Django Web Service

- **Automatic Migrations:** Runs on startup
- **Health Check:** Built-in for monitoring
- **Wait for DB:** Waits for PostgreSQL to be healthy
- **Gunicorn:** 3 workers, production-grade config
- **Static Files:** Auto-collected
- **Superuser:** Auto-created (development mode)
- **Environment Sync:** DATABASE_URL properly formatted

### ✅ Entrypoint Script

- **Smart Startup:** entrypoint.sh orchestrates everything
- **Database Waiting:** 30-retry loop with smart backoff
- **Formatted Output:** Color-coded logs for clarity
- **Automatic Superuser:** Creates admin/admin123 in dev mode
- **Error Handling:** Proper exit codes and error messages

### ✅ Docker Configuration Files

- **docker-compose.yml:** Complete service orchestration
- **entrypoint.sh:** Startup script with migration logic
- **init-db.sql:** PostgreSQL initialization
- **Dockerfile:** Updated with entrypoint integration

---

## 📊 Files Created/Modified

### New Files Created:

```
✅ entrypoint.sh              # Smart startup orchestration
✅ init-db.sql               # PostgreSQL initialization
✅ DOCKER_SETUP.md           # Complete Docker guide (3000+ words)
✅ DOCKER_QUICK_REF.md       # Quick reference card
✅ DOCKER_COMPOSE.md         # This document
```

### Files Modified:

```
✅ docker-compose.yml        # Complete rewrite with new features
✅ Dockerfile                # Added entrypoint integration
✅ .env                       # Set DB_PASSWORD=tigran_password
```

---

## 🚀 Quick Start

### First Time Setup (2 minutes)

```bash
# Start all services
docker compose up -d

# Watch startup logs
docker compose logs -f web

# Wait for "🎉 EDCM Application Starting" message

# Access the app:
# Web: http://localhost:8000
# Admin: http://localhost:8000/admin
#   Username: admin
#   Password: admin123
```

### What Happens Automatically:

1. **PostgreSQL Container Starts**
    - Detects postgres:15 image
    - Creates user `tigran`
    - Creates database `edcm_db`
    - Initializes with init-db.sql

2. **Django Container Waits**
    - Checks PostgreSQL health
    - Retries 30 times with 2-second intervals
    - Waits max 60 seconds

3. **Migrations Run**
    - `python manage.py migrate`
    - Applies all pending migrations
    - Creates database tables

4. **Static Files Collected**
    - `python manage.py collectstatic`
    - Gathers all static assets

5. **Superuser Created** (if DEBUG=True)
    - Username: admin
    - Password: admin123
    - Only if doesn't exist

6. **Gunicorn Starts**
    - 3 workers for concurrency
    - Listens on :8000
    - Ready for requests

---

## ⚙️ Configuration

### Database Setup in docker-compose.yml

```yaml
db:
    image: postgres:15
    environment:
        POSTGRES_DB: ${DB_NAME:-edcm_db} # From .env
        POSTGRES_USER: ${DB_USER:-tigran} # From .env
        POSTGRES_PASSWORD: ${DB_PASSWORD:-...} # From .env
    volumes:
        - postgres_data:/var/lib/postgresql/data # Persistent
```

### Web Service Configuration

```yaml
web:
    entrypoint: /app/entrypoint.sh # Smart startup
    environment:
        DATABASE_URL: postgresql://tigran:password@db:5432/edcm_db
    depends_on:
        db:
            condition: service_healthy # Wait for health
```

### Environment Variables (.env)

```env
# Used by Docker Compose
DB_USER=tigran
DB_PASSWORD=tigran_password
DB_NAME=edcm_db
DEBUG=True

# Used by Django in Docker
DATABASE_URL=postgresql://tigran:tigran_password@db:5432/edcm_db
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,web
```

---

## 📋 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Docker Compose Network              │
│         (edcm_network - bridge)             │
└─────────────────────────────────────────────┘
         │                         │
    ┌────▼────┐            ┌──────▼─────┐
    │ postgres│            │  Django    │
    │ :5432   │◄──────────►│  :8000     │
    │ (db)    │  TCP      │  (web)     │
    └────┬────┘ DATABASE  └──────┬─────┘
         │                       │
         │                       │
    ┌────▼──────────┐    ┌──────▼──────────┐
    │ postgres_data │    │ static_volume   │
    │ (volume)      │    │ (volume)        │
    └───────────────┘    └─────────────────┘
```

---

## 🏥 Health Checks

### Database Health Check

The database has a built-in health check:

```bash
# Manual check
docker compose exec db pg_isready -U tigran -d edcm_db

# View health status
docker compose ps
# db STATUS should show "healthy"
```

### Web Service Health

The web service starts only after database is healthy:

```bash
# Check if web is running
docker compose ps
# web STATUS should show "Up"

# Verify API is responding
curl http://localhost:8000/api/health/
# Should return: {"status": "healthy", "message": "..."}
```

---

## 🔄 Automatic Migrations

### How Migrations Work

The `entrypoint.sh` script automatically:

1. Waits for PostgreSQL to be ready
2. Runs `python manage.py migrate`
3. Shows migration progress
4. Exits on error (proper error handling)

### Monitor Migrations

```bash
# Watch migration output
docker compose logs -f web | grep -i migrate

# Should see:
# "📊 Running Django migrations..."
# "Operations to perform:..."
# "✅ Migrations completed successfully!"
```

### Manual Migration Commands

```bash
# If something goes wrong, run manually
docker compose exec web python manage.py migrate

# Check migration status
docker compose exec web python manage.py showmigrations

# Create new migration
docker compose exec web python manage.py makemigrations
```

---

## 💾 Data Persistence

### Volume Management

Data is stored in Docker volumes:

```bash
# List volumes
docker volume ls

# View volume info
docker volume inspect edcm_postgres_data

# Data in volume persists across:
# ✅ Container restarts
# ✅ docker compose down (without -v)
# ✅ Host machine restarts

# Data is DELETED by:
# ❌ docker compose down -v
# ❌ docker volume rm edcm_postgres_data
```

### Backup & Restore

```bash
# Backup database
docker compose exec db pg_dump -U tigran edcm_db > backup.sql

# Restore database
docker compose exec -T db psql -U tigran edcm_db < backup.sql

# Backup entire volume
docker run --rm -v edcm_postgres_data:/data \
  busybox tar czf /backup/db.tar.gz -C /data .
```

---

## 🔨 Hard Reset Command

### When to Use Hard Reset

- Old user `edcm_user` conflicts with new user `tigran`
- Database is corrupted or has permission issues
- Need to start completely fresh
- Changed database password in `.env`
- Migrations are in a bad state

### Hard Reset - Complete

```bash
# Nuclear option - remove everything
docker compose down -v

# Clean up ALL unused Docker resources
docker system prune -a --volumes -f

# Rebuild from scratch
docker compose up -d --build

# Monitor startup
docker compose logs -f web
```

### Hard Reset - One Liner

```bash
docker compose down -v && docker system prune -a --volumes -f && docker compose up -d --build
```

### What Gets Reset

| Component          | Removed    | Recreated  |
| ------------------ | ---------- | ---------- |
| Containers         | ✅         | ✅         |
| Images             | ✅ (local) | ✅         |
| Volumes            | ✅         | ✅ (empty) |
| Network            | ✅         | ✅         |
| Database Data      | ✅         | ✅ (fresh) |
| User `tigran`      | ✅         | ✅         |
| Database `edcm_db` | ✅         | ✅         |

---

## 📝 Database Setup Process

### What PostgreSQL Does Automatically

1. **Image Runs**
    - Pulls postgres:15 image
    - Initializes empty database

2. **Environment Variables Processed**

    ```env
    POSTGRES_USER=tigran              # Creates user
    POSTGRES_PASSWORD=tigran_password # Sets password
    POSTGRES_DB=edcm_db               # Creates database
    ```

3. **Initialization Scripts Run**
    - Executes init-db.sql
    - Grants permissions to tigran user

4. **Health Check Ready**
    - `pg_isready` returns success
    - Web service can connect

### Verify Setup

```bash
# Connect to database
docker compose exec db psql -U tigran -d edcm_db

# Check tables (after migrations)
\dt

# List users
\du

# Check database
\l

# Exit
\q
```

---

## 🎯 USE CASES

### Development Workflow

```bash
# Start everything
docker compose up -d

# Make code changes (no restart needed for most)
# Edit Django files - auto-reload (if DEBUG=True)
# Edit frontend - manual browser refresh

# Check logs for errors
docker compose logs -f web

# Run migrations if needed
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate

# Stop when done
docker compose down
```

### Testing

```bash
# Run Django tests
docker compose exec web python manage.py test

# Run specific app tests
docker compose exec web python manage.py test documents

# Check code quality
docker compose exec web python manage.py check
```

### Production Preparation

```bash
# Update .env for production
DEBUG=False
SECRET_KEY=<generate-new>
ALLOWED_HOSTS=your-domain.com
DB_PASSWORD=<strong-password>
SECURE_SSL_REDIRECT=True

# Rebuild and test
docker compose down
docker compose up -d --build

# Verify security
docker compose exec web python manage.py check --deploy
```

---

## 🐛 Common Issues & Solutions

### Issue: "database does not exist"

```bash
# Solution 1: Hard reset
docker compose down -v
docker compose up -d

# Solution 2: Manual database creation
docker compose exec db psql -U tigran -c "CREATE DATABASE edcm_db;"
```

### Issue: "Connection refused" from web to db

```bash
# Solution 1: Check network
docker network inspect edcm_edcm_network

# Solution 2: Recreate network
docker compose down
docker compose up -d --force-recreate

# Solution 3: Verify db is healthy
docker compose logs db
```

### Issue: "port already in use"

```bash
# Find process using port
lsof -i :5432

# Kill it
kill -9 <PID>

# Or use different port in docker-compose.yml
# ports: - "5433:5432"
```

### Issue: Migrations not applied

```bash
# Check migration status
docker compose exec web python manage.py showmigrations

# Manually run
docker compose exec web python manage.py migrate

# Check logs
docker compose logs web | grep -i migrate
```

---

## 📚 File Structure

### docker-compose.yml

```yaml
version: "3.8"
services:
    db: # PostgreSQL database
    web: # Django application
volumes:
    postgres_data: # Database persistence
    static_volume: # Static files
networks:
    edcm_network: # Service communication
```

### entrypoint.sh

- Waits for database (30 retries)
- Runs migrations
- Collects static files
- Creates superuser (dev mode)
- Starts Gunicorn

### init-db.sql

- Grants permissions to tigran user
- Creates extensions
- Initial database setup

---

## 🔐 Security Notes

### Development Mode

- Superuser auto-created: admin/admin123
- DEBUG=True for detailed errors
- Insecure settings for convenience

### Production Mode

```env
DEBUG=False                # No detailed errors
SECRET_KEY=<new-key>       # Generate new
ALLOWED_HOSTS=your-domain  # Actual domain
DB_PASSWORD=<strong>       # Long, random
SECURE_SSL_REDIRECT=True   # HTTPS only
```

### Security Checklist

- [ ] Change DB_PASSWORD to strong password
- [ ] Generate new SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Set ALLOWED_HOSTS to actual domain
- [ ] Enable SSL settings
- [ ] Remove default superuser credentials
- [ ] Use environment-specific .env files

---

## 📞 Useful Commands

```bash
# Start/Stop
docker compose up -d                  # Start in background
docker compose down                   # Stop (keep data)
docker compose down -v                # Stop (delete data)
docker compose restart                # Restart services

# View Status
docker compose ps                     # List services
docker compose logs -f web            # Follow logs
docker compose logs --tail=50 web     # Last 50 lines

# Execute
docker compose exec web bash          # Access container
docker compose exec db psql -U tigran # Access database

# Build
docker compose build                  # Rebuild images
docker compose up -d --build          # Rebuild and start

# Clean
docker system prune -a --volumes      # Remove unused resources
docker volume prune                   # Remove unused volumes
```

---

## 📖 Reference Documents

- `DOCKER_SETUP.md` - Complete 3000+ word guide
- `DOCKER_QUICK_REF.md` - Quick reference card
- `docker-compose.yml` - Configuration file
- `entrypoint.sh` - Startup script
- `Dockerfile` - Build configuration

---

## ✅ Verification Checklist

After running `docker compose up -d`:

- [ ] `docker compose ps` shows all services up
- [ ] Database status is "healthy"
- [ ] Web service is "Up"
- [ ] Can access http://localhost:8000
- [ ] Admin login works: admin/admin123
- [ ] API health check: http://localhost:8000/api/health/
- [ ] Database has tables: `docker compose exec db psql -U tigran -d edcm_db -c "\dt"`
- [ ] Logs show "🎉 EDCM Application Starting"

---

## 🎉 Ready to Deploy with Docker!

Your EDCM application is now fully automated with Docker Compose:

✅ **PostgreSQL** - Auto-setup with user tigran  
✅ **Django** - Auto-migrations on startup  
✅ **Health Checks** - Automated monitoring  
✅ **Data Persistence** - Volumes for keeping data  
✅ **Smart Startup** - entrypoint.sh orchestration  
✅ **Hard Reset** - Simple one-liner cleanup

**Next Steps:**

1. Run: `docker compose up -d`
2. Monitor: `docker compose logs -f web`
3. Access: http://localhost:8000
4. Read: `DOCKER_SETUP.md` for full details

---

**Status: ✅ COMPLETE**

**Last Updated:** February 9, 2026

**Project:** EDCM (Electronic Document & Case Management)
