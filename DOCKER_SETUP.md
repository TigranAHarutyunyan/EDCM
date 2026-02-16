# Docker Compose Setup Guide

This guide covers the complete Docker Compose setup for EDCM with PostgreSQL, automatic migrations, health checks, and proper database initialization.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Services Overview](#services-overview)
5. [Health Checks](#health-checks)
6. [Automatic Migrations](#automatic-migrations)
7. [Database Persistence](#database-persistence)
8. [Troubleshooting](#troubleshooting)
9. [Hard Reset](#hard-reset)
10. [Useful Commands](#useful-commands)

---

## 📦 Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **.env file** configured (copy from `.env.example` if needed)

Check your versions:

```bash
docker --version
docker compose version
```

---

## 🚀 Quick Start

### 1. Start the Application (First Time)

```bash
# Navigate to project directory
cd /Users/tigran/Desktop/EDCM

# Start all services (db and web)
docker compose up -d

# View logs
docker compose logs -f web
```

**What happens automatically:**
✅ PostgreSQL database starts
✅ Creates user `tigran` with password from `.env`
✅ Creates database `edcm_db`
✅ Web service waits for database health check
✅ Automatically runs Django migrations
✅ Collects static files
✅ Creates default superuser (admin/admin123) if DEBUG=True
✅ Starts Gunicorn web server

### 2. Access the Application

- **Web App:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin
    - Username: `admin`
    - Password: `admin123` (development only)
- **API:** http://localhost:8000/api
- **Health Check:** http://localhost:8000/api/health/

### 3. Stop the Application

```bash
# Stop containers (data persists)
docker compose down

# View all containers
docker compose ps

# View logs after stopping
docker compose logs web
```

---

## ⚙️ Configuration

### Environment Variables (.env)

The `.env` file controls both Docker Compose and Django:

```env
# Database Configuration
DB_USER=tigran                          # PostgreSQL user
DB_PASSWORD=tigran_password             # PostgreSQL password
DB_NAME=edcm_db                         # Database name
DB_HOST=localhost                       # For local access (override in Docker)
DB_PORT=5432                            # PostgreSQL port

# Django Settings
SECRET_KEY=your-secret-key-here         # Django secret key
DEBUG=True                              # Development mode
ALLOWED_HOSTS=localhost,127.0.0.1       # Allowed hostnames

# API Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Note:** Docker Compose overrides `DB_HOST` to `db` (the service name) internally.

### Updating Configuration

To change configuration:

```bash
# 1. Edit .env file
nano .env

# 2. Rebuild and restart
docker compose down
docker compose up -d --build
```

---

## 🔍 Services Overview

### Database Service (PostgreSQL)

**Image:** `postgres:15`  
**Container Name:** `edcm_db`  
**Port:** `5432`

**Features:**

- Automatic user creation (tigran)
- Automatic database creation (edcm_db)
- Data persisted in `postgres_data` volume
- Health checks enabled

**Check database status:**

```bash
# Connect to database
docker compose exec db psql -U tigran -d edcm_db

# Common psql commands
\dt                    # List tables
\du                    # List users
\l                     # List databases
SELECT version();      # PostgreSQL version
\q                     # Exit
```

### Web Service (Django)

**Image:** Custom (built from `Dockerfile`)  
**Container Name:** `edcm_web`  
**Port:** `8000`

**Features:**

- Waits for database health check before starting
- Automatic migrations via entrypoint script
- Static files collection
- Superuser creation (development)
- Gunicorn with 3 workers
- Health check endpoint

**Check application status:**

```bash
# View logs
docker compose logs -f web

# Execute Django commands
docker compose exec web python manage.py createsuperuser

# Open Django shell
docker compose exec web python manage.py shell
```

---

## 🏥 Health Checks

### Database Health Check

The database service has a built-in health check:

```bash
# Check database health
docker compose exec db pg_isready -U tigran -d edcm_db

# Expected output when healthy:
# "accepting connections"

# View health status
docker compose ps
# The db service should show "healthy" in the STATUS column
```

### Web Service Health

The web service waits for the database to be healthy before starting:

```bash
# Monitor startup process
docker compose logs -f web

# Look for this message when ready:
# "════════════════════════════════════"
# "🎉 EDCM Application Starting"
# "════════════════════════════════════"
```

---

## 🔄 Automatic Migrations

### What Happens Automatically

When the web service starts, the `entrypoint.sh` script:

1. ✅ Waits for PostgreSQL to be healthy (max 30 retries)
2. ✅ Runs `python manage.py migrate`
3. ✅ Collects static files
4. ✅ Creates superuser (if DEBUG=True and doesn't exist)
5. ✅ Starts Gunicorn server

### Manual Migration Commands

```bash
# Run migrations manually
docker compose exec web python manage.py migrate

# Show migration status
docker compose exec web python manage.py showmigrations

# Create a new app migration
docker compose exec web python manage.py makemigrations

# Reverse migrations (careful!)
docker compose exec web python manage.py migrate documents 0001
```

---

## 💾 Database Persistence

### Data Persistence Setup

Database data is stored in a Docker volume (`postgres_data`):

```bash
# View all volumes
docker volume ls

# Inspect volume details
docker volume inspect edcm_postgres_data

# Backup database data
docker run --rm -v edcm_postgres_data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/db_backup.tar.gz -C /data .

# Restore from backup
docker run --rm -v edcm_postgres_data:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/db_backup.tar.gz -C /data
```

### Container vs Volume Data

- **Containers:** Deleted when stopped with `docker compose down`
- **Volumes:** Persist indefinitely until explicitly removed
- **Docker Compose:** Automatically manages volumes unless you use `-v` flag

---

## 🐛 Troubleshooting

### Issue: "Connection refused" from web to database

**Symptoms:**

```
ERROR: could not translate host name "db" to address
```

**Solutions:**

```bash
# 1. Check if network exists
docker network ls

# 2. Recreate containers on network
docker compose down
docker compose up -d --force-recreate

# 3. Check network connectivity
docker compose exec web ping db
```

### Issue: "Database does not exist"

**Symptoms:**

```
FATAL: database "edcm_db" does not exist
```

**Solutions:**

```bash
# 1. Check database exists
docker compose exec db psql -U tigran -l

# 2. Hard reset (see Hard Reset section)
docker compose down -v
docker compose up -d
```

### Issue: "Permission denied" on migrations

**Symptoms:**

```
django.db.utils.OperationalError: permission denied
```

**Solutions:**

```bash
# 1. Check user permissions
docker compose exec db psql -U tigran -d edcm_db -c "GRANT ALL ON SCHEMA public TO tigran;"

# 2. Hard reset database
docker compose down -v
docker compose up -d
```

### Issue: Port already in use

**Symptoms:**

```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:5432
```

**Solutions:**

```bash
# 1. Kill process using port
lsof -i :5432
kill -9 <PID>

# 2. Use different port in docker-compose.yml
# Change: ports: - "5432:5432"
# To:     ports: - "5433:5432"

# 3. Check what's running
docker ps -a
docker compose ps
```

### Issue: Migrations not running

**Symptoms:**

```
No migrations to apply
(but tables don't exist)
```

**Solutions:**

```bash
# 1. Run migrations manually
docker compose exec web python manage.py migrate

# 2. Check migration status
docker compose exec web python manage.py showmigrations

# 3. View entrypoint logs
docker compose logs web | grep -i migrate
```

---

## 🔨 Hard Reset

### Complete Clean Slate

Use this when you need to completely reset everything:

```bash
# OPTION 1: Soft reset (keeps volumes)
docker compose down
docker compose up -d

# OPTION 2: Medium reset (removes volumes but keeps images)
docker compose down -v
docker compose up -d

# OPTION 3: Hard reset (removes everything)
docker compose down -v --rmi local
docker system prune -a --volumes
docker compose up -d --build

# OPTION 4: Nuclear reset (everything)
docker compose down
docker system prune -a --volumes -f
rm -rf postgres_data/  # Manual cleanup if needed
docker compose up -d --build
```

### What Each Option Does

| Option                | Containers         | Images             | Volumes            | Networks |
| --------------------- | ------------------ | ------------------ | ------------------ | -------- |
| `down`                | ✅ Remove          | Keep               | Keep               | Keep     |
| `down -v`             | ✅ Remove          | Keep               | ✅ Remove          | Keep     |
| `down -v --rmi local` | ✅ Remove          | ✅ Remove          | ✅ Remove          | Keep     |
| `system prune -a -f`  | All unused removed | All unused removed | All unused removed | Pruned   |

### Why Hard Reset?

Use a hard reset when:

- ✅ Old user `edcm_user` conflicts with new user `tigran`
- ✅ Database is corrupted
- ✅ Need to start completely fresh
- ✅ Changed database password in `.env`
- ✅ Run into permission issues

### Step-by-Step Hard Reset Process

```bash
# 1. Stop all containers
docker compose down -v

# 2. Remove all unused Docker resources
docker system prune -a --volumes -f

# 3. Verify nothing is left
docker ps -a
docker volume ls
docker image ls

# 4. Rebuild everything from scratch
docker compose up -d --build

# 5. Monitor startup
docker compose logs -f web

# 6. Verify
curl http://localhost:8000/api/health/
```

---

## 📝 Useful Commands

### Common Docker Compose Commands

```bash
# Start services in background
docker compose up -d

# Start and view logs
docker compose up

# Stop services (keep data)
docker compose down

# Stop and remove volumes
docker compose down -v

# View status
docker compose ps

# View logs
docker compose logs
docker compose logs web              # Specific service
docker compose logs -f web           # Follow logs
docker compose logs --tail=100 web   # Last 100 lines

# Rebuild containers
docker compose build
docker compose up --build

# Execute command in container
docker compose exec web bash
docker compose exec db psql -U tigran -d edcm_db

# View resource usage
docker stats

# Clean up unused resources
docker system prune
docker system prune -a --volumes
```

### Django Commands in Docker

```bash
# Create migrations
docker compose exec web python manage.py makemigrations

# Apply migrations
docker compose exec web python manage.py migrate

# Create superuser
docker compose exec web python manage.py createsuperuser

# Collect static files
docker compose exec web python manage.py collectstatic --noinput

# Django shell
docker compose exec web python manage.py shell

# Run tests
docker compose exec web python manage.py test

# Check for issues
docker compose exec web python manage.py check
```

### Database Commands

```bash
# Connect to database
docker compose exec db psql -U tigran -d edcm_db

# Backup database
docker compose exec db pg_dump -U tigran edcm_db > backup.sql

# Restore database
docker compose exec -T db psql -U tigran edcm_db < backup.sql

# Check database size
docker compose exec db psql -U tigran -d edcm_db -c "SELECT pg_size_pretty(pg_database_size('edcm_db'));"

# List connections
docker compose exec db psql -U tigran -d edcm_db -c "SELECT pid, usename, application_name FROM pg_stat_activity;"
```

---

## 📊 Docker Compose File Structure

### Key Configuration Elements

```yaml
services:
    db: # PostgreSQL database
    web: # Django application

volumes:
    postgres_data: # Database persistence
    static_volume: # Static files

networks:
    edcm_network: # Service communication
```

### Environment Variables in Docker Compose

Variables can be set in multiple ways (in order of precedence):

1. Command line: `docker compose --env-file .env.production up`
2. `.env` file: Automatically loaded if exists
3. `.env.example`: Reference template
4. `environment:` section in docker-compose.yml
5. Default values in docker-compose.yml

---

## 🔒 Security Notes

Currently, `entrypoint.sh` creates a default superuser:

- Username: `admin`
- Password: `admin123`

**⚠️ WARNING:** This is for development only!

For production:

```bash
# Disable auto-superuser creation in entrypoint.sh
# Change DEBUG from True to False
# Or remove the create_superuser section
```

---

## 📈 Performance Tuning

### Database Performance

```bash
# In docker-compose.yml, adjust for your machine:
# - CPU: increase workers in entrypoint.sh
# - RAM: increase max_connections for PostgreSQL
# - Storage: ensure sufficient disk space
```

### Web Server Performance

```bash
# Change in entrypoint.sh
gunicorn --workers 3          # Increase workers = more concurrency
gunicorn --workers 1          # Decrease workers = less memory
```

---

## 🚀 Production Deployment

For production, modify:

```bash
# .env changes
DEBUG=False                           # Disable debug mode
SECRET_KEY=<generate-new-key>         # Generate new secret
ALLOWED_HOSTS=your-domain.com         # Set actual domain
DB_PASSWORD=<strong-password>         # Use strong password
SECURE_SSL_REDIRECT=True              # Enable HTTPS
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

```bash
# docker-compose.yml changes
# Remove hardcoded ports if using reverse proxy
# Use environment-specific compose files
# Set restart policies: restart: always
```

---

## 📞 Need Help?

Check these files for more info:

- `DEPLOYMENT_GUIDE.md` - Overall deployment
- `quickstart.md` - Quick reference
- `env_variables.md` - Environment variables
- `.env.example` - Configuration template

---

## ✅ Verification Checklist

After starting Docker Compose, verify:

- [ ] `docker compose ps` shows all services running
- [ ] Database shows "healthy" status
- [ ] Web service started without errors
- [ ] Can access http://localhost:8000
- [ ] Can login to http://localhost:8000/admin (admin/admin123)
- [ ] Health check passes: http://localhost:8000/api/health/
- [ ] Database contains tables: `docker compose exec db psql -U tigran -d edcm_db -c "\dt"`

---

**Last Updated:** February 9, 2026

**Project:** EDCM (Electronic Document & Case Management)
