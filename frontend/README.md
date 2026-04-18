# EDCM Frontend

React + Vite frontend for the EDCM system.

## Prerequisites

- Node.js installed.
- Backend server running on `http://127.0.0.1:8000`.

## Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running

Start the development server:

```bash
npm run dev
```

Visit the URL shown in the terminal (usually `http://localhost:5173`).

## Build

Generate production assets:

```bash
npm run build
```

## Notes

- Uses Vite proxy to `/api/` and `/admin/` in `vite.config.js`.
- API URL can be overridden with `VITE_API_URL` in `.env`.
- OAuth/CSRF and token cookie auth are managed by backend `/api/auth/*` endpoints.
