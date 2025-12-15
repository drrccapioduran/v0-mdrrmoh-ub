# MDRR MO Hub

A comprehensive management system for disaster risk reduction operations.

## Features

- 📊 Inventory Management
- 📅 Calendar & Task Management
- 👥 Contact Management
- 📄 Document Management
- 🖼️ Gallery Management
- 🗺️ Interactive Maps with Drawing Tools
- 🌐 360° Panorama Viewer

## Prerequisites

- Node.js 18+ 
- Google Cloud Project with APIs enabled:
  - Google Drive API
  - Google Sheets API
- Google OAuth 2.0 credentials

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Google API credentials

## Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

See `.env.example` for required configuration. Key variables include:

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_SHEETS_ID` - Google Sheets document ID for data storage
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` - Root folder for file storage
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared schemas and types
- `/dist` - Production build output

## Technologies

- **Frontend**: React, Wouter, TanStack Query, Leaflet, Photo Sphere Viewer
- **Backend**: Express, Google APIs
- **Build**: Vite, esbuild
- **Styling**: Tailwind CSS, shadcn/ui

## License

MIT
