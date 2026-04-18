CREATE TABLE Department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE auth_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) NOT NULL,
    password VARCHAR(128) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined DATETIME NOT NULL
);

CREATE TABLE UserProfile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    department_id INT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Employee',
    full_name VARCHAR(150),
    position VARCHAR(150),
    profile_picture VARCHAR(255),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES Department(id) ON DELETE SET NULL
);

CREATE TABLE DocumentType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'OTHER'
);

CREATE TABLE DocumentStatus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE ConfidentialityLevel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type_id INT NOT NULL,
    status_id INT NOT NULL,
    confidentiality_level_id INT NULL,
    creator_id INT NOT NULL,
    current_owner_id INT NULL,
    department_id INT NULL,
    assigned_to_id INT NULL,
    external_reference VARCHAR(100),
    due_date DATE NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (document_type_id) REFERENCES DocumentType(id) ON DELETE RESTRICT,
    FOREIGN KEY (status_id) REFERENCES DocumentStatus(id) ON DELETE RESTRICT,
    FOREIGN KEY (confidentiality_level_id) REFERENCES ConfidentialityLevel(id) ON DELETE RESTRICT,
    FOREIGN KEY (creator_id) REFERENCES auth_user(id) ON DELETE RESTRICT,
    FOREIGN KEY (current_owner_id) REFERENCES auth_user(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES Department(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_id) REFERENCES auth_user(id) ON DELETE SET NULL
);

CREATE TABLE NotificationType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type_id INT NOT NULL,
    document_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    payload TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES NotificationType(id) ON DELETE RESTRICT,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE SET NULL
);

CREATE TABLE AuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    document_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE
);

CREATE TABLE DocumentComment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    is_external BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

CREATE TABLE PortalSubmission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT UNIQUE NOT NULL,
    client_name VARCHAR(150),
    client_email VARCHAR(254),
    client_phone VARCHAR(50),
    company VARCHAR(150),
    ip_address VARCHAR(39),
    user_agent VARCHAR(255),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE
);

CREATE TABLE DocumentAttachment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    file VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    size INT NOT NULL DEFAULT 0,
    uploaded_by_id INT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES auth_user(id) ON DELETE SET NULL
);

CREATE TABLE PortalNotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_email VARCHAR(254) NOT NULL,
    document_id INT NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE
);
