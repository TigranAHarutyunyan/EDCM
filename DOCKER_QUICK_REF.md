# Docker Compose Quick Reference

## 🚀 Start the Application

```bash
# First time startup (includes database setup)
docker compose up -d

# View startup progress
docker compose logs -f web

# Access the app
# Web: http://localhost:8000
# Admin: http://localhost:8000/admin (admin/admin123)
```

---

## ⛔ Hard Reset (When Things Break)

### For Old User Conflict (`edcm_user` → `tigran`)

```bash
# Complete reset with new user
docker compose down -v

# Rebuild and start fresh
docker compose up -d --build

# Verify
docker compose ps
curl http://localhost:8000/api/health/
```

### Quick One-Liner Hard Reset

```bash
docker compose down -v && docker system prune -a --volumes -f && docker compose up -d --build
```

---

## ⚙️ Configure

```bash
# Edit environment
nano .env

# Restart with new config
docker compose down
docker compose up -d
```

**Key variables in .env:**

```env
DB_USER=tigran
DB_PASSWORD=tigran_password
DB_NAME=edcm_db
DEBUG=True
```

---

## 🔍 Check Status

```bash
# All services status
docker compose ps

# Database health
docker compose exec db pg_isready -U tigran -d edcm_db

# View logs
docker compose logs -f web

# Check database exists
docker compose exec db psql -U tigran -l
```

---

## 🛑 Stop

```bash
# Stop (keeps data)
docker compose down

# Stop and delete data
docker compose down -v
```

---

## 🐛 Troubleshoot

```bash
# Database not ready
docker compose logs db

# Migrations failed
docker compose logs web | grep -i migrate

# Connection issues
docker compose exec web ping db

# Run migration manually
docker compose exec web python manage.py migrate
```

---

## 💾 Database

```bash
# Connect to database
docker compose exec db psql -U tigran -d edcm_db

# Backup
docker compose exec db pg_dump -U tigran edcm_db > backup.sql

# List tables
docker compose exec db psql -U tigran -d edcm_db -c "\dt"
```

---

## 📊 Django Commands

```bash
# Create superuser
docker compose exec web python manage.py createsuperuser

# Django shell
docker compose exec web python manage.py shell

# Check migrations
docker compose exec web python manage.py showmigrations

# Collect static files
docker compose exec web python manage.py collectstatic --noinput
```

---

## 🔄 Rebuild

```bash
# Rebuild after code changes
docker compose up -d --build

# Hard rebuild (clean slate)
docker compose down -v
docker compose up -d --build
```

---

## 🌐 Access Points

- **Web App:** http://localhost:8000
- **Admin:** http://localhost:8000/admin
    - User: `admin`
    - Pass: `admin123`
- **API:** http://localhost:8000/api
- **Health:** http://localhost:8000/api/health/
- **Database:** localhost:5432
    - User: `tigran`
    - Pass: (from `.env`)

---

## 📋 Service Summary

| Service             | Port | Status           | Role        |
| ------------------- | ---- | ---------------- | ----------- |
| **db** (PostgreSQL) | 5432 | Waits for health | Database    |
| **web** (Django)    | 8000 | Waits for db     | Application |

---

**Full docs:** See `DOCKER_SETUP.md`

**Last Updated:** February 9, 2026
