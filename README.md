# EDCM - Electronic Document Control Management

EDCM is a modern, enterprise-grade Electronic Document Control Management system designed for efficient tracking, collaboration, and management of corporate documents. Built with a powerful Django REST API and a high-performance React frontend.

## 🚀 Key Features

- **Dynamic Dashboard**: Full overview of document statistics, recent activity, and quick search.
- **Advanced Document Workflow**:
    - Create, edit, and archive documents.
    - **"Take" System**: Users can claim unassigned documents.
    - **Department Assignment**: Heads of Department (Managers) can manage ownership/assignment for documents in their department.
- **Collaboration Suite**:
    - **Comments**: Real-time discussion on every document.
    - **Audit History**: Transparent tracking of every change, including field updates and ownership transfers.
- **Personalized Profiles**:
    - Detailed user profiles with personal bios and avatars.
    - Individual tracking of "Created" vs. "Taken" documents.
- **Role-Based Access Control (RBAC)**:
    - **Admins**: Access to Django Admin (`/admin/`) and system-wide management.
    - **Managers (Head of Department)**: Department Panel (`/department/`) to manage employees + department documents.
    - **Employees**: Focus on assigned tasks and department-wide collaboration.
- **Modern UI/UX**: Premium design using Tailwind CSS with glassmorphism effects and smooth transitions.

## 🛠 Tech Stack

- **Backend**: Python 3.10, Django 4.2, Django REST Framework
- **Frontend**: React 19, Vite, Tailwind CSS v4, Axios
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Server**: Gunicorn & Whitenoise (for static assets)

## 🔐 Authentication (API)

- The API uses DRF Token auth, stored in an **HttpOnly cookie** (`edcm_auth`) on login (frontend does not store tokens in `localStorage`).
- CSRF is enabled for cookie-auth unsafe methods (frontend boots CSRF via `GET /api/csrf/`).
- Useful endpoints:
    - `POST /api/auth/login/` (sets `edcm_auth` cookie)
    - `POST /api/auth/logout/` (clears cookies)
    - `GET /api/auth/me/` (current user info used by the frontend)

## 🐳 Quick Start with Docker

The easiest way to run the project locally is using Docker.

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd EDCM
    ```

2.  **Configure environment variables**:
    Copy the example env file and update your settings (defaults work with Docker):

    ```bash
    cp .env.example .env
    ```

3.  **Start the application**:
    ```bash
    docker-compose up --build -d
    ```
    _Note: By default, the container runs migrations + `python manage.py seed_data` on startup. You can toggle this with `SEED_DATA=False` in your `.env`._

## 📍 Access Points

- **App (Django serves built frontend)**: [http://localhost:8000](http://localhost:8000)
- **API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **API Health Check**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)

## 🔑 Default Credentials (after running seed_data)

- **Admin**: `admin` / `adminpass`
- **Manager**: `manager` / `managerpass`
- **Employee**: `employee` / `employeepass`

## 🧭 Panels

- **Admin Panel**: `/admin/` (Django admin)
    - Access requires either a Django superuser or a user with business role `Admin` (and `is_staff=True`).
    - Styled via template override in `documents/templates/admin/` and `documents/static/admin/edcm_admin.css`.
- **Department Panel**: `/department/` (React page)
    - Only **Managers** can access it.
    - The backend enforces department scoping: managers only see employees/documents from their own department.

## 🧑‍💻 Local Development (without Docker)

1. Backend:

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env
    python3 manage.py migrate
    python3 manage.py seed_data
    python3 manage.py runserver
    ```

2. Frontend (Vite dev server + proxy to Django):

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

    - Frontend dev URL: `http://localhost:5173`
    - Backend URL: `http://127.0.0.1:8000`

## 📁 Project Structure

- `/documents`: Core Django application (Models, Views, Serializers).
- `/frontend`: React application source code.
- `/config`: Project settings and URL routing.
- `docker-compose.yml`: Orchestration for app and database services.
- `entrypoint.sh`: Startup script for migrations and static collection.

## 📄 License

This project is licensed under the MIT License.
