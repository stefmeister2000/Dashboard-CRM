# Railway Deployment Guide

## Prerequisites

1. Railway account connected to your GitHub repository
2. The repository is connected to Railway

## Setup Steps

### 1. Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```
JWT_SECRET=your-secure-random-string-here
```

**Important:** Generate a secure random string for production. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Build Configuration

Railway will automatically detect the build configuration from:
- `nixpacks.toml` - Build configuration
- `railway.json` - Railway-specific settings
- `Procfile` - Start command

### 3. Build Process

The deployment will:
1. Install root dependencies
2. Install backend dependencies (`backend/node_modules`)
3. Install frontend dependencies (`frontend/node_modules`)
4. Build frontend (`frontend/dist`)
5. Start backend server (which serves the frontend build)

### 4. Database

The SQLite database (`backend/crm.db`) will be created automatically on first run.

**Note:** For production, consider using Railway's PostgreSQL plugin for persistent data storage.

### 5. Verify Deployment

After deployment:
1. Check Railway logs for any errors
2. Visit your Railway URL
3. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
4. **Change the password immediately!**

## Troubleshooting

### Build Fails
- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Issues
- Check if `backend/crm.db` has write permissions
- Consider using Railway PostgreSQL plugin for production

### Frontend Not Loading
- Verify `frontend/dist` directory exists after build
- Check backend logs for static file serving errors
- Ensure API routes are working (`/api/health`)

## Production Recommendations

1. **Use PostgreSQL** instead of SQLite for production
2. **Set up persistent volumes** for database storage
3. **Enable HTTPS** (Railway provides this automatically)
4. **Set up monitoring** and error tracking
5. **Use environment-specific configurations**

