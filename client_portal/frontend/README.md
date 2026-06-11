# EDCM Client Portal Frontend

React + Vite frontend for the public portal of the EDCM system. This app allows public users to submit documents without login.

## Prerequisites

- Node.js installed.
- Client portal backend running and accessible from `http://127.0.0.1:8000`.

## Setup

1. `cd client_portal/frontend`
2. `npm install`

## Running

`npm run dev`

## Build

`npm run build`

## Integration

- Public submissions call `/api/portal/submit/`.
- The inbox user for portal items is configured by `PORTAL_INBOX_USERNAME` in the backend environment.

## Notes

- This README was improved from the default Vite template to reflect EDCM project usage.
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
