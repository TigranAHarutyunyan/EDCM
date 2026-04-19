# EDCM - Electronic Document Control Management

EDCM is a modern, enterprise-grade Electronic Document Control Management system designed for efficient tracking, collaboration, and management of corporate documents. Built with a powerful Django REST API and a high-performance React frontend.

## 🚀 Key Features

- **🌍 World-Class Localization (i18n)**:
    - Full support for **Armenian (hy)**, **Russian (ru)**, and **English (en)**.
    - Premium language selector with flag indicators synchronized across all portals.
    - Automated cache-busting for real-time translation updates.
- **⚡ Dynamic Dashboard**: Real-time overview of document statistics, recent activity, and global search.
- **🛠 Advanced Workflow**:
    - Full CRUD operations with archiving capabilities.
    - **"Take" System**: Instant document claiming for unassigned tasks.
    - **Department Governance**: Managers oversee ownership and assignments within their departments.
- **🤝 Collaboration Suite**:
    - **Live Comments**: Threaded discussions on every document.
    - **Deep Audit Log**: Transparent tracking of every field change and ownership transfer.
    - **Multi-Format Attachments**: Support for large files (**up to 100MB**) including PDF, Word, Excel, and PowerPoint.
- **🔐 Secure RBAC**:
    - **Admin**: System-wide configuration and Django Admin access.
    - **Manager**: Departmental control and employee management.
    - **Employee**: Task focus and cross-department collaboration.
- **💎 Premium UI**: Built with Tailwind CSS v4, featuring glassmorphism, smooth transitions, and a mobile-first responsive design.

---
- **Dynamic Dashboard**: Full overview of document statistics, recent activity, and quick search.
- **Advanced Document Workflow**: 
    - Create, edit, and archive documents.
    - **"Take" System**: Users can claim unassigned documents.
    - **Manager Assignment**: Managers can assign documents to specific employees within their department.
- **Collaboration Suite**:
    - **Comments**: Real-time discussion on every document.
    - **Audit History**: Transparent tracking of every change, including field updates and ownership transfers.
- **Personalized Profiles**:
    - Detailed user profiles with personal bios and avatars.
    - Individual tracking of "Created" vs. "Taken" documents.
- **Role-Based Access Control (RBAC)**:
    - **Admins**: Full system control.
    - **Managers**: Department-level oversight of documents and employees.
    - **Employees**: Focus on assigned tasks and department-wide collaboration.
- **Modern UI/UX**: Premium design using Tailwind CSS with glassmorphism effects and smooth transitions.

## 🛠 Tech Stack

- **Backend**: Python 3.10, Django 4.2, Django REST Framework
- **Frontend**: React 18, Vite, Tailwind CSS v4, Axios
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Server**: Gunicorn & Whitenoise (for static assets)

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
    *Note: By default, the app will automatically run `setup_data.py` on startup to seed departments, types, and sample users. You can toggle this with `SEED_DATA=False` in your `.env`.*

## 📍 Access Points

- **Frontend/API**: [http://localhost:8000](http://localhost:8000)
- **Django Admin**: [http://localhost:8000/admin](http://localhost:8000/admin)
- **API Health Check**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)

## 🔑 Default Credentials (after running setup_data.py)

- **Admin**: `admin` / `adminpass`
- **Manager**: `manager` / `managerpass`
- **Employee**: `employee` / `employeepass`

## 📁 Project Structure

- `/documents`: Core Django application (Models, Views, Serializers).
- `/frontend`: React application source code.
- `/config`: Project settings and URL routing.
- `docker-compose.yml`: Orchestration for app and database services.
- `entrypoint.sh`: Startup script for migrations and static collection.

## 📄 License
This project is licensed under the MIT License.
