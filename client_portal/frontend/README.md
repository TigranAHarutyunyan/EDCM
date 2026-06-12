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

- **Public Submissions**: Submits documents via `/api/portal/submit/`.
- **Status Sync**: Allows public users to track their document status safely via `/api/portal/sync-status/`.
- **Inbox Config**: The receiver for portal items is set by `PORTAL_INBOX_USERNAME` in the backend environment.

## Internationalization (i18n)

The portal provides a seamless localized experience for external users:
- **Languages**: Full Armenian (hy), Russian (ru), and English (en) support.
- **UI Parity**: Features the same premium `LanguageSelector` as the main dashboard.
- **Form Handling**: All error messages, labels, and placeholders are fully translated.

## Notes

- This README was improved to reflect EDCM project-specific usage.
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
