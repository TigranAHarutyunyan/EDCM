#!/bin/bash
# Build script for Render deployment
# This script builds both frontend and backend

set -e

echo "📦 Building EDCM Application..."
echo "================================"

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Build frontend
echo "⚛️  Building React frontend..."
cd frontend
npm install --frozen-lockfile
npm run build
cd ..

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "✅ Build completed successfully!"
echo "================================"
