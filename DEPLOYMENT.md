# Deployment Guide for MDRRMOHub

This is a full-stack Vite + Express application that requires manual deployment.

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration
1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Environment Variables
Add these in your Vercel project settings:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret for sessions
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- Any other API keys your app needs

## Deploy to Other Platforms

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. Add environment variables

## Local Testing
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run db:push

# Build for production
npm run build

# Start production server
npm start
```

## Build Output
The build process creates:
- `dist/index.cjs` - Production server bundle
- `dist/public/` - Static frontend assets

## Requirements
- Node.js 18+ or Bun runtime
- PostgreSQL database
- Environment variables configured
```

```env file="" isHidden
