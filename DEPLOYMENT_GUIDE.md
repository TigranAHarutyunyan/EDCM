# EDCM Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Setup](#environment-variables-setup)
3. [Local Development](#local-development)
4. [Production Deployment to Render](#production-deployment-to-render)
5. [Docker Deployment](#docker-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Git
- Python 3.10+
- Node.js 18+ and npm
- Docker (optional, for containerized deployment)
- PostgreSQL (for local development, or use remote DB)

### Accounts Required

- [Render.com](https://render.com) account (for production deployment)
- [GitHub](https://github.com) account (if using Render's GitHub integration)

---

## Environment Variables Setup

### Step 1: Create `.env` file from template

```bash
cp .env.example .env
```

### Step 2: Configure Development Environment

Edit `.env` with your local settings:

```env
# Django Settings
SECRET_KEY=django-insecure-your-secret-key-here-change-in-production
DEBUG=True

# Local Database (for development)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=edcm_db
DB_USER=edcm_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# CORS for local development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# API & Frontend URLs (local)
API_URL=http://localhost:8000/api/
FRONTEND_URL=http://localhost:3000

# Security (disabled for local development)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

### Step 3: Generate a Secure Secret Key

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Copy the output and update `SECRET_KEY` in your `.env` file.

---

## Local Development

### Step 1: Set up Backend

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create PostgreSQL database (first time only)
# Make sure PostgreSQL is running
createdb edcm_db
createuser edcm_user
# In PostgreSQL shell:
# ALTER USER edcm_user WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE edcm_db TO edcm_user;

# Run migrations
python manage.py migrate

# Create superuser account
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

The backend will be available at: `http://localhost:8000`

### Step 2: Set up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173` (Vite default)

**Note:** Update your `.env` to have `FRONTEND_URL=http://localhost:5173` if using different port.

### Step 3: Access the Application

- Frontend UI: http://localhost:5173 (or http://localhost:3000 if configured)
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- API Documentation: http://localhost:8000/api/health/

---

## Production Deployment to Render

### Step 1: Prepare Repository

1. Commit all changes to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

2. Ensure `.env` is in `.gitignore` (it already is)

### Step 2: Create Render Services

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +" → "Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Click **"Create New Resources"**
6. Set environment variables in Render dashboard (see Step 3)

#### Option B: Manual Service Creation

1. **Create Web Service:**
    - Go to Render Dashboard
    - Click **"New +" → "Web Service"**
    - Connect your GitHub repository
    - Configure:
        - **Name:** edcm-app
        - **Runtime:** Python 3.10
        - **Build Command:**
            ```
            pip install -r requirements.txt && \
            cd frontend && npm install && npm run build && cd .. && \
            python manage.py collectstatic --noinput
            ```
        - **Start Command:**
            ```
            python manage.py migrate && \
            gunicorn --bind 0.0.0.0:$PORT config.wsgi:application
            ```

2. **Create PostgreSQL Database:**
    - Click **"New +" → "PostgreSQL"**
    - Configure:
        - **Name:** edcm-postgres
        - **PostgreSQL Version:** 15
        - **Plan:** Free or Standard

### Step 3: Configure Environment Variables in Render

In Render Dashboard, go to your Web Service → **Environment**:

```env
SECRET_KEY=<generate-new-secure-key>
DEBUG=False
ALLOWED_HOSTS=*.onrender.com,your-custom-domain.com
DATABASE_URL=<auto-filled by Render>
CORS_ALLOWED_ORIGINS=https://your-service.onrender.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
API_URL=https://your-service.onrender.com/api/
FRONTEND_URL=https://your-service.onrender.com
```

**Important:**

- Replace `your-service` with your actual Render service name
- Do NOT commit `.env` to GitHub (it's already in `.gitignore`)
- Always generate a new `SECRET_KEY` for production

### Step 4: Custom Domain (Optional)

1. In Render Dashboard → Web Service → **Settings**
2. Scroll to **Custom Domain**
3. Add your domain and configure DNS records as instructed

### Step 5: Deploy

- Push to `main` branch triggers automatic deployment
- Monitor deployment in **Deployments** tab
- Check logs in **Logs** tab

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t edcm-app:latest .
```

### Run Docker Container Locally

```bash
docker run -p 8000:8000 \
  -e SECRET_KEY="your-secret-key" \
  -e DEBUG=False \
  -e DATABASE_URL="postgresql://user:password@host:port/dbname" \
  edcm-app:latest
```

### Push to Container Registry (optional)

```bash
# Tag image
docker tag edcm-app:latest your-registry/edcm-app:latest

# Push to registry
docker push your-registry/edcm-app:latest
```

---

## Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'django'"

**Solution:** Ensure virtual environment is activated and dependencies installed:

```bash
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

#### 2. "psycopg2" connection errors

**Solution:** Ensure PostgreSQL is running and credentials are correct in `.env`

#### 3. "Static files not found" in production

**Solution:** Run collectstatic:

```bash
python manage.py collectstatic --noinput
```

#### 4. CORS errors on frontend

**Solution:** Check `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-url.com,http://localhost:3000
```

#### 5. "Unauthorized" errors in API calls

**Solution:** Ensure token is properly stored and sent in requests:

```javascript
const token = localStorage.getItem("token");
config.headers.Authorization = `Token ${token}`;
```

#### 6. Database migrations fail on deploy

**Solution:** Check database URL and ensure migrations are committed:

```bash
python manage.py makemigrations
git add documents/migrations/
git commit -m "Add new migrations"
```

### Viewing Logs

**Local Development:**

```bash
# Backend logs - shown in terminal
python manage.py runserver

# Frontend logs - shown in terminal
cd frontend && npm run dev
```

**Production (Render):**

1. Go to Render Dashboard → Web Service
2. Click **"Logs"** tab
3. View real-time logs

### Database Backup (Render PostgreSQL)

1. Go to Render Dashboard → PostgreSQL → **Connections**
2. Use connection string to connect via `psql`:
    ```bash
    psql <CONNECTION_STRING>
    ```

---

## Security Checklist

Before deploying to production:

- [ ] Generate new `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Set `SECURE_SSL_REDIRECT=True`
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Update `CORS_ALLOWED_ORIGINS` with production frontend URL
- [ ] Create strong database password
- [ ] Configure email settings for password resets
- [ ] Set up HTTPS certificate (Render handles this automatically)
- [ ] Review `.gitignore` to exclude sensitive files
- [ ] Enable two-factor authentication on GitHub account

---

## Next Steps

1. **Monitor Application:**
    - Set up error tracking (e.g., Sentry)
    - Monitor performance metrics
    - Check application logs regularly

2. **Backups:**
    - Enable automated database backups on Render
    - Plan regular manual backups

3. **Updates:**
    - Keep dependencies updated
    - Monitor security alerts
    - Test updates in development before production

4. **Support:**
    - Refer to [Django Documentation](https://docs.djangoproject.com)
    - Refer to [Render Documentation](https://render.com/docs)
    - Check [DRF Documentation](https://www.django-rest-framework.org)

---

## Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Render Deployment Guide](https://render.com/docs/deploy-django)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Last Updated:** February 2026

For questions or issues, create an issue on the GitHub repository or contact the development team.
