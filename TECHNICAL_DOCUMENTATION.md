# 📘 EDCM Technical Documentation

> **Detailed Technical Specification and Project Guide**

## 1. System Overview
EDCM (Electronic Document Control Management) is a full-stack application designed to manage the lifecycle of corporate documents. It follows a decoupled architecture with a **Django REST Framework (DRF)** backend and a **React 19** frontend.

### Primary Goals:
- Secure document storage with role-based access.
- Collaboration through comments and audit logs.
- External interaction via the Public Portal.
- Multi-language support (English, Armenian, Russian).

---

## 2. Backend Architecture (Django)

The backend is built using Django 4.2+ and DRF. It manages business logic, database integrity, and authentication.

### Data Models
| Model | Description |
| :--- | :--- |
| **Department** | Represents company divisions (HR, IT, etc.). |
| **UserProfile** | Extends Django `User` with roles (`Admin`, `Manager`, `Employee`) and department mapping. |
| **Document** | Core entity holding title, status, owner, department, and metadata. |
| **DocumentAttachment** | Handles file uploads (PDF, Word, etc.) with automated cleanup on delete. |
| **AuditLog** | Transparent record of every action taken on a document. |
| **PortalSubmission** | Tracks metadata for documents submitted from the public portal. |
| **Notification** | Internal alert system for document assignments and updates. |

### Authentication & Security
- **Cookie-Based Auth**: Uses DRF Token authentication, but the token is stored in an **HttpOnly, Secure cookie** (`edcm_auth`). This protects against XSS attacks.
- **CSRF Protection**: Standard Django CSRF middleware is active. The frontend fetches a CSRF token during initialization.
- **RBAC (Role Based Access Control)**:
    - **Admin**: Full system control + Django Admin access.
    - **Manager**: Controls department-specific documents and employees.
    - **Employee**: Manages assigned or "taken" documents.

---

## 3. Frontend Architecture (React)

The frontend is a modern SPA built with **Vite** and **Tailwind CSS v4**.

### Core Components
- **Navbar**: Sticky navigation with dynamic links based on user roles and the `LanguageSelector`.
- **LanguageSelector**: Dropdown powered by `react-i18next` for instant language switching.
- **Dashboard**: High-level statistical Overview and recent document tracking.
- **DocumentDetail**: Comprehensive view including metadata, attachments, audit logs, and comments.
- **Public Portal**: A simplified interface for external clients to submit documents without logging in.

### State management
- **Auth Context**: Persistent user state across the application.
- **i18next**: Handles localization strings and current language state.
- **Axios Interceptor**: Automatically handles CSRF tokens and credential sharing across requests.

---

## 4. Workflows

### Document Inbound (Internal)
1. User clicks "Add Document".
2. Metadata is entered; initial status is `DRAFT` or `PENDING`.
3. Document is assigned to a department/user.

### Document Inbound (Portal)
1. External client fills out the public form.
2. Backend creates a `Document` + `PortalSubmission` record.
3. The document enters the **Portal Inbox**.
4. An Admin/Manager reviews and "Routes" the document to a specific department.

---

## 5. Multi-Language Implementation (i18n)

The application uses `react-i18next` for internationalization.

- **Storage**: Translation strings are located in `frontend/public/locales/`.
    - `en/translation.json`: English
    - `hy/translation.json`: Armenian
    - `ru/translation.json`: Russian
- **Initialization**: Handled in `frontend/src/i18n.js`.
- **Usage**: Components use the `useTranslation` hook to retrieve values via keys (e.g., `t('nav.dashboard')`).

---

## 6. Project Structure

```text
EDCM/
├── config/               # Django project-level settings
├── documents/            # Main Django App
│   ├── api_views.py      # REST endpoints
│   ├── serializers.py    # Data transformation
│   ├── models.py         # Database schema
│   └── middleware.py     # Custom logic (e.g. Department gating)
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Reusable UI parts
│   │   ├── pages/        # Main route views
│   │   ├── services/     # API/Axios configuration
│   │   └── context/      # State management (Authentication)
│   └── public/locales/   # I18n translation files
├── media/                # Dynamic user uploads
├── staticfiles/          # Static assets for production
└── docker-compose.yml    # Service orchestration
```

---

## 7. Useful Terminal Commands

- **Backend Migrations**: `python manage.py makemigrations` && `python manage.py migrate`
- **Seed Data**: `python manage.py seed_data` (populates roles and departments)
- **Run Development**: `npm run dev` (Frontend) & `python manage.py runserver` (Backend)

---
*Last Updated: 2026-04-15*
