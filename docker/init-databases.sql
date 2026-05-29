-- User Service Database
CREATE DATABASE users_db;

-- Class Service Database
CREATE DATABASE classes_db;

-- Content Service Database
CREATE DATABASE content_db;

-- Communication Service Database
CREATE DATABASE communication_db;

-- Notification Service Database
CREATE DATABASE notifications_db;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE users_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE classes_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE content_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE communication_db TO admin;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO admin;
