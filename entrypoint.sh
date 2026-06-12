#!/bin/sh
set -eu

echo "======================================"
echo "🚀 EDCM Docker Entrypoint"
echo "======================================"

# Configuration
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-edcm_db}
DEBUG=${DEBUG:-}
SEED_DATA=${SEED_DATA:-}
PORT=${PORT:-8000}
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
CLIENT_FRONTEND_PORT=${CLIENT_FRONTEND_PORT:-8002}
MAX_RETRIES=30
RETRY_COUNT=0

# Parse DATABASE_URL if available
if [ -n "${DATABASE_URL:-}" ]; then
    # Remove protocol: e.g. postgresql://user:pass@host:port/db -> user:pass@host:port/db
    proto_removed="${DATABASE_URL#*://}"
    # Remove query string: e.g. user:pass@host:port/db?sslmode=require -> user:pass@host:port/db
    without_query="${proto_removed%%\?*}"
    
    # Extract DB_NAME (everything after first /)
    if echo "$without_query" | grep -q "/"; then
        DB_NAME="${without_query#*/}"
    fi
    
    # Extract user_pass_host_port (everything before first /)
    user_pass_host_port="${without_query%%/*}"
    
    # Check if credentials are in URI
    if echo "$user_pass_host_port" | grep -q "@"; then
        credentials="${user_pass_host_port%%@*}"
        host_port="${user_pass_host_port#*@}"
        
        # Extract DB_USER (everything before first : in credentials)
        if echo "$credentials" | grep -q ":"; then
            DB_USER="${credentials%%:*}"
        else
            DB_USER="$credentials"
        fi
    else
        host_port="$user_pass_host_port"
    fi
    
    # Extract DB_HOST and DB_PORT from host_port
    if echo "$host_port" | grep -q ":"; then
        DB_HOST="${host_port%%:*}"
        DB_PORT="${host_port##*:}"
    else
        DB_HOST="$host_port"
        DB_PORT=5432
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait for PostgreSQL
wait_for_db() {
    if [ -n "${DATABASE_URL:-}" ]; then
        echo -e "${YELLOW}⏳ Waiting for PostgreSQL database defined in DATABASE_URL...${NC}"
        
        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
                return 0
            fi
            
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo -e "${YELLOW}⏳ Attempt $RETRY_COUNT/$MAX_RETRIES - Database not ready yet, retrying...${NC}"
            sleep 2
        done
    else
        echo -e "${YELLOW}⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}...${NC}"
        
        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
                return 0
            fi
            
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo -e "${YELLOW}⏳ Attempt $RETRY_COUNT/$MAX_RETRIES - Database not ready yet, retrying...${NC}"
            sleep 2
        done
    fi
    
    echo -e "${RED}❌ Failed to connect to PostgreSQL after $MAX_RETRIES attempts${NC}"
    exit 1
}

# Function to run Django migrations
run_migrations() {
    echo -e "${YELLOW}📊 Detecting and running Django migrations...${NC}"
    
    # Generate migrations for any new models/fields (auto-detect)
    python manage.py makemigrations --noinput
    
    if python manage.py migrate --noinput; then
        echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        exit 1
    fi
}

# Function to collect static files
collect_static() {
    echo -e "${YELLOW}📦 Collecting static files...${NC}"
    mkdir -p /app/staticfiles /app/media
    chown -R appuser:appuser /app/staticfiles /app/media

    if python manage.py collectstatic --noinput --clear; then
        chown -R appuser:appuser /app/staticfiles /app/media
        echo -e "${GREEN}✅ Static files collected!${NC}"
    else
        echo -e "${RED}⚠️  Warning: Static file collection had issues (continuing anyway)${NC}"
    fi
}

# Function to create superuser if DEBUG is True
create_superuser() {
    if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
        echo -e "${YELLOW}👤 Checking for superuser...${NC}"
        
        # Check if superuser exists
        if python manage.py shell -c "import sys; from django.contrib.auth import get_user_model; User = get_user_model(); sys.exit(0 if User.objects.filter(is_superuser=True).exists() else 1)"; then
            echo -e "${GREEN}✅ Superuser already exists${NC}"
        else
            echo -e "${YELLOW}📝 Creating default superuser (admin/admin123)...${NC}"
            python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@edcm.local', 'admin123')
    print("✅ Superuser 'admin' created successfully")
else:
    print("✅ Superuser 'admin' already exists")
END
        fi
    fi
}

# Function to seed initial data
seed_data() {
    echo -e "${YELLOW}🌱 Initializing Organizational Data & Default Users...${NC}"
    
    # We run seeding to ensure 'manager', 'employee', and default departments exist.
    # The command uses get_or_create internally, so it's safe to run on every start.
    if python manage.py seed_data; then
        echo -e "${GREEN}✅ Database seeding successful! Default accounts are ready.${NC}"
    else
        echo -e "${RED}⚠️  Seeding encountered issues. Check the backend logs for details.${NC}"
    fi
}

# Main execution
echo -e "${YELLOW}📋 Environment Variables:${NC}"
echo "  DB_HOST: $DB_HOST"
echo "  DB_PORT: $DB_PORT"
echo "  DB_USER: $DB_USER"
echo "  DB_NAME: $DB_NAME"
echo "  DEBUG: $DEBUG"
echo ""

# Step 1: Wait for database
wait_for_db

# Step 2: Run migrations
run_migrations

# Step 3: Collect static files
collect_static

# Step 4: Create superuser (in development)
create_superuser

# Step 5: Seed initial data
seed_data

echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 EDCM Application Starting${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo "📍 Backend API: http://localhost:${BACKEND_PORT}"
echo "👨‍💼 Admin Panel: http://localhost:${BACKEND_PORT}/admin"
echo "📱 Main Dashboard: http://localhost:${FRONTEND_PORT}"
echo "🌐 Client Portal: http://localhost:${CLIENT_FRONTEND_PORT}"
echo ""

# Start server as non-root appuser
if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
    echo -e "${YELLOW}🚀 Starting Django development server (with hot-reload) as appuser...${NC}"
    exec runuser -u appuser -- python manage.py runserver 0.0.0.0:${PORT}
else
    echo -e "${YELLOW}🚀 Starting Gunicorn server as appuser...${NC}"
    exec runuser -u appuser -- gunicorn \
        --bind 0.0.0.0:${PORT} \
        --workers 3 \
        --worker-class sync \
        --worker-tmp-dir /dev/shm \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --timeout 30 \
        --access-logfile - \
        --error-logfile - \
        config.wsgi:application
fi
