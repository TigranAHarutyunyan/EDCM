# Quick Start Guide

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL (for local development)
- Git

---

## 🚀 Quick Start (Local Development)

### 1️⃣ Backend Setup (5 minutes)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
# or
venv\Scripts\activate              # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file for local development
cp .env.example .env

# Edit .env with your local database credentials
nano .env  # or open in your editor
```

**Required .env values for local dev:**

```env
SECRET_KEY=django-insecure-gmahhygx^a0*(ufq09_f81$$kvd)mq&er_^x()
DEBUG=True
DB_PASSWORD=your_password
```

```bash
# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

✅ Backend is ready at: `http://localhost:8000`

### 2️⃣ Frontend Setup (3 minutes)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend is ready at: `http://localhost:5173` (or shown in terminal)

---

## 🎯 Testing the New Document Modal

1. Open your browser to `http://localhost:5173`
2. Login with your credentials
3. Go to **Dashboard**
4. Click the green **"+ Add Document"** button
5. Fill in the form:
    - **Title** (required) - "Test Document"
    - **Description** - "This is a test"
    - **Department** - Select one from dropdown
    - **Document Type** - Select one from dropdown
    - **Confidentiality Level** - Select one from dropdown
6. Click **"Create Document"**
7. See your document added to the Recent Documents table!

---

## 🌍 Production Deployment (Render)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add environment variables and deployment config"
git push origin main
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`
5. Click **"Create New Resources"**

### Step 3: Set Environment Variables

In Render Dashboard → Your Web Service → **Environment**:

Generate a new SECRET_KEY:

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Add these variables:

```env
SECRET_KEY=<your-generated-key>
DEBUG=False
ALLOWED_HOSTS=*.onrender.com
CORS_ALLOWED_ORIGINS=https://your-service.onrender.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

✅ Your app is deployed! Visit: `https://your-service.onrender.com`

---

## 📁 Project Structure

```
EDCM/
├── backend/                    # Django backend
│   ├── config/                 # Settings and configuration
│   ├── documents/              # Main app with models and APIs
│   └── manage.py               # Django management script
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   └── context/           # State management
│   └── package.json           # Frontend dependencies
│
├── .env.example               # Environment variables template
├── Dockerfile                 # Docker configuration
├── render.yaml                # Render deployment config
├── DEPLOYMENT_GUIDE.md        # Full deployment guide
└── ENV_VARIABLES.md           # Environment variables reference
```

---

## 🔧 Useful Commands

### Backend

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Collect static files (production)
python manage.py collectstatic --noinput

# Django shell
python manage.py shell
```

### Frontend

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Docker

```bash
# Build image
docker build -t edcm-app:latest .

# Run container
docker run -p 8000:8000 \
  -e SECRET_KEY="your-key" \
  -e DEBUG=False \
  -e DATABASE_URL="postgresql://..." \
  edcm-app:latest
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check database connection
python manage.py dbshell
```

### Port already in use

```bash
# Change Django port
python manage.py runserver 8001

# Change Vite port
# Edit frontend/vite.config.js or run:
npm run dev -- --port 5174
```

### CORS errors

- Check `CORS_ALLOWED_ORIGINS` in `.env`
- Must include your frontend URL (with http/https)

### Modal not showing

- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Check browser console for errors (F12)
- Verify departments and document types exist in database

---

## 📚 Documentation

- **`DEPLOYMENT_GUIDE.md`** - Complete deployment instructions
- **`ENV_VARIABLES.md`** - All environment variables explained
- **`SETUP_SUMMARY.md`** - Summary of changes made

---

## 🆘 Still Need Help?

1. Check the relevant `.md` documentation files
2. Check browser console for errors (F12)
3. Check terminal/server logs for errors
4. Create an issue on GitHub with:
    - Error message
    - What you were doing
    - Steps to reproduce

---

## ✅ Next Steps

- [ ] Start backend and frontend
- [ ] Test document creation modal
- [ ] Deploy to Render
- [ ] Test production deployment
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and backups

---

**Ready to go!** 🎉

Questions? Check the full guides or create an issue!
