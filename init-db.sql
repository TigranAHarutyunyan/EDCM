-- PostgreSQL initialization script
-- This script runs automatically when the PostgreSQL container starts
-- It ensures the tigran user and edcm_db database exist with proper permissions

-- Set up the tigran user with necessary permissions
-- The user is created by POSTGRES_USER env var, so this just ensures permissions

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: The database is created by POSTGRES_DB env var
-- The user is created by POSTGRES_USER env var
-- This script just adds any additional setup needed

