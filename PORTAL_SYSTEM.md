# EDCM Client Portal System Design

This document outlines the architecture for the Independent Client Portal and its integration with the main EDCM application.

## 1. High-Level Architecture

The system consists of two distinct zones:
- **Trust Zone (Main App)**: Internal application with full document management, review, and routing logic.
- **Client Zone (Portal)**: External-facing service where clients can submit requests and check progress.

### Components:
1. **Client Portal (Separate Service)**:
   - **Frontend**: A React/Vite app dedicated to external users.
   - **Backend**: A FastAPI service that handles client registration and proxies document submissions to the main app.
2. **Main Application (EDCM)**:
   - **Portal Inbox**: A specialized view for the "Gatekeeper" to see incoming submissions.
   - **Routing API**: Allows the Gatekeeper to approve and assign documents to departments.
   - **Status Sync API**: A read-only endpoint for the portal to track document phases.

## 2. Document Flow (The "Gatekeeper" Workflow)

1. **Submission**: Client uploads a document through the Portal.
2. **Ingest**: The Portal Backend calls `POST /api/portal/submit/` on the Main Backend.
3. **Inbox**: In the Main App, the document appears in the **Portal Inbox**. It is initially unassigned to any department.
4. **Review**: A "Gatekeeper" (an employee with Admin or specialized role) opens the document.
5. **Route & Approve**: The Gatekeeper uses the **Route** action to:
   - Set the `Status` (e.g., from PENDING to APPROVED).
   - Assign the `Department` (e.g., HR, IT, Finance).
   - Optional: Assign a specific `Employee` to handle it.
6. **Visibility**: The Client Portal periodically calls `GET /api/portal/sync-status/` to update the client on whether their document is "In Review", "Approved", or "Rejected".

## 3. Communication Layer

### Cross-Server Transmission
The communication happens via **Authenticated API Calls**.
- The main backend expects the Portal to provide the client metadata.
- Files are transmitted as `multipart/form-data`.
- For higher reliability, the system can be evolved to use a shared **S3 bucket** (AWS/Minio) where the portal uploads files and only passes the "Object Key" to the main app.

## 4. Security Considerations
- **API Keys**: In a production environment, the Portal Backend should use a `SYSTEM_API_KEY` when talking to the Main App.
- **CORS**: The Main App should only allow CORS requests from the Portal's domain.
- **Throttling**: The public portal intake must have rate limiting to prevent spam.

## 5. Next Steps
- Implement the "Portal Inbox" UI on the main dashboard.
- Create the React frontend for the `client_portal/` directory.
