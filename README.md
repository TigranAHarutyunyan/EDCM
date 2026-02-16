# EDCM - Electronic Document Control Management

EDCM is a modern, enterprise-grade Electronic Document Control Management system designed for efficient tracking, collaboration, and management of corporate documents. Built with a powerful Django REST API and a high-performance React frontend.

## 🚀 Key Features

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

4.  **Populate Initial Data** (Optional but recommended):
    Run the setup script to create departments, document types, and sample users (Admin/Manager/Employee):
    ```bash
    docker-compose exec web python setup_data.py
    ```

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
