-- User Service Database
CREATE DATABASE users_db;

-- Class Service Database
CREATE DATABASE classes_db;

-- Assignment & Submission Service Database
CREATE DATABASE assignments_db;

-- Content Service Database
CREATE DATABASE content_db;

-- Grading Service Database
CREATE DATABASE grades_db;

-- Notification Service Database (might not need this if using Redis)
CREATE DATABASE notifications_db;

-- Calendar Service Database
CREATE DATABASE calendar_db;

-- Communication Service Database
CREATE DATABASE communication_db;

-- File Storage Service Database
CREATE DATABASE files_db;

-- Search Service Database (metadata only, main data in Elasticsearch)
CREATE DATABASE search_db;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE users_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE classes_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE assignments_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE content_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE grades_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE calendar_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE communication_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE files_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE search_db TO admin;

-- Show success message
\echo '✅ All microservice databases created successfully!'