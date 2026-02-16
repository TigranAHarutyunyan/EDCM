#!/bin/bash
set -e

echo "======================================"
echo "🚀 EDCM Docker Entrypoint"
echo "======================================"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📂 Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-edcm_db}
MAX_RETRIES=30
RETRY_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait for PostgreSQL
wait_for_db() {
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}...${NC}"
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" 2>/dev/null; then
            echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -e "${YELLOW}⏳ Attempt $RETRY_COUNT/$MAX_RETRIES - Database not ready yet, retrying...${NC}"
        sleep 2
    done
    
    echo -e "${RED}❌ Failed to connect to PostgreSQL after $MAX_RETRIES attempts${NC}"
    exit 1
}

# Function to run Django migrations
run_migrations() {
    echo -e "${YELLOW}📊 Running Django migrations...${NC}"
    
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
    
    if python manage.py collectstatic --noinput --clear; then
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
        if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(0 if User.objects.filter(is_superuser=True).exists() else 1)"; then
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
    # Run seeding if explicitly requested or if in DEBUG mode
    if [ "$SEED_DATA" = "True" ] || [ "$SEED_DATA" = "true" ] || [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
        echo -e "${YELLOW}🌱 Seeding initial data...${NC}"
        if python setup_data.py; then
            echo -e "${GREEN}✅ Data seeding completed successfully!${NC}"
        else
            echo -e "${RED}⚠️  Warning: Data seeding failed (continuing anyway)${NC}"
        fi
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
echo ""
echo "📍 Web Server: http://localhost:${PORT:-8000}"
echo "👨‍💼 Admin Panel: http://localhost:${PORT:-8000}/admin"
echo "📱 API: http://localhost:${PORT:-8000}/api"
echo ""

# Start Gunicorn server
exec gunicorn \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 3 \
    --worker-class sync \
    --worker-tmp-dir /dev/shm \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --timeout 30 \
    --access-logfile - \
    --error-logfile - \
    config.wsgi:application
