CREATE DATABASE docflow;
USE docflow;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


CREATE TABLE roles (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE, -- 'EMPLOYEE', 'MANAGER', 'CLERK', 'ADMIN'
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE departments (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(150) NOT NULL,
    parent_department_id    INT UNSIGNED NULL,
    CONSTRAINT fk_departments_parent
        FOREIGN KEY (parent_department_id) REFERENCES departments(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    UNIQUE KEY uq_departments_name_parent (name, parent_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document_types (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,   -- 'ORDER', 'LETTER', 'REQUEST', ...
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document_statuses (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE, -- 'DRAFT','SENT_FOR_APPROVAL','APPROVED','REJECTED','REGISTERED','ARCHIVED'
    name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE confidentiality_levels (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE, -- 'PUBLIC','INTERNAL','CONFIDENTIAL'
    name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE approval_statuses (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,   -- 'PENDING','APPROVED','REJECTED','SKIPPED'
    name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_types (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,   -- 'NEW_DOCUMENT','NEEDS_APPROVAL','DEADLINE','STATUS_CHANGED'
    name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE action_types (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,   -- 'CREATE_DOCUMENT','UPDATE_DOCUMENT','SEND_FOR_APPROVAL',...
    name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    department_id   INT UNSIGNED NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_roles (
    user_id     BIGINT UNSIGNED NOT NULL,
    role_id     INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE documents (
    id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doc_type_id                 INT UNSIGNED NOT NULL,
    status_id                   INT UNSIGNED NOT NULL,
    confidentiality_level_id    INT UNSIGNED NOT NULL,
    title                       VARCHAR(255) NOT NULL,
    summary                     TEXT NULL,
    creator_id                  BIGINT UNSIGNED NOT NULL,
    current_owner_id            BIGINT UNSIGNED NULL,
    department_id               INT UNSIGNED NULL, 
    due_date                    DATE NULL,
    external_reference          VARCHAR(100) NULL, 
    created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_documents_type
        FOREIGN KEY (doc_type_id) REFERENCES document_types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_documents_status
        FOREIGN KEY (status_id) REFERENCES document_statuses(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_documents_confidentiality
        FOREIGN KEY (confidentiality_level_id) REFERENCES confidentiality_levels(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_documents_creator
        FOREIGN KEY (creator_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_documents_current_owner
        FOREIGN KEY (current_owner_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_documents_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    KEY idx_documents_status (status_id),
    KEY idx_documents_department (department_id),
    KEY idx_documents_creator (creator_id),
    KEY idx_documents_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document_versions (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id         BIGINT UNSIGNED NOT NULL,
    version_number      INT UNSIGNED NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    size_bytes          BIGINT UNSIGNED NULL,
    checksum            VARCHAR(128) NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id  BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_doc_versions_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_doc_versions_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    UNIQUE KEY uq_doc_versions_doc_ver (document_id, version_number),
    KEY idx_doc_versions_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attachments (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id         BIGINT UNSIGNED NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    size_bytes          BIGINT UNSIGNED NULL,
    uploaded_by_user_id BIGINT UNSIGNED NOT NULL,
    uploaded_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachments_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_attachments_user
        FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    KEY idx_attachments_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Հաստատման գործընթաց

CREATE TABLE approvals (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id         BIGINT UNSIGNED NOT NULL,
    approver_id         BIGINT UNSIGNED NOT NULL,
    step_number         INT UNSIGNED NOT NULL,
    status_id           INT UNSIGNED NOT NULL, 
    comment             TEXT NULL,
    decided_at          DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_approvals_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_approvals_approver
        FOREIGN KEY (approver_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_approvals_status
        FOREIGN KEY (status_id) REFERENCES approval_statuses(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    KEY idx_approvals_document (document_id),
    KEY idx_approvals_approver (approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE registry_entries (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id     BIGINT UNSIGNED NOT NULL,
    reg_number      VARCHAR(100) NOT NULL,
    reg_date        DATE NOT NULL,
    registrar_id    BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_registry_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_registry_registrar
        FOREIGN KEY (registrar_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    UNIQUE KEY uq_registry_document (document_id),
    UNIQUE KEY uq_registry_reg_number (reg_number),
    KEY idx_registry_reg_date (reg_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE notifications (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT UNSIGNED NOT NULL,
    notification_type_id INT UNSIGNED NOT NULL,
    document_id         BIGINT UNSIGNED NULL,
    payload_json        JSON NULL,
    is_read             TINYINT(1) NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_notifications_type
        FOREIGN KEY (notification_type_id) REFERENCES notification_types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_notifications_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    KEY idx_notifications_user_read (user_id, is_read),
    KEY idx_notifications_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE activity_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NULL,
    action_type_id  INT UNSIGNED NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       BIGINT UNSIGNED NOT NULL,
    details_json    JSON NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_log_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_activity_log_action_type
        FOREIGN KEY (action_type_id) REFERENCES action_types(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    KEY idx_activity_entity (entity_type, entity_id),
    KEY idx_activity_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;