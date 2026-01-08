# Webhook Setup Guide

## The Problem

If your website is hosted on a platform like Lovable.dev, it cannot reach `localhost:3001` because localhost is only accessible from your own computer.

## Solutions

### Option 1: Use ngrok (Recommended for Testing)

1. **Install ngrok** (if not already installed):
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your backend server** (if not already running):
   ```bash
   cd backend
   node server.js
   ```

3. **In a new terminal, create a tunnel**:
   ```bash
   ngrok http 3001
   ```

4. **Copy the HTTPS URL** (looks like `https://abc123.ngrok.io`)

5. **Use this URL in your website**:
   ```
   https://your-ngrok-url.ngrok.io/api/clients
   ```

### Option 2: Deploy Your Backend (Production)

For production, deploy your backend to a service like:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

Then use your deployed URL:
```
https://your-domain.com/api/clients
```

### Option 3: Check Current Logs

To see if requests are coming through, check the backend logs:
```bash
tail -f /tmp/crm-backend.log
```

## Testing Your Webhook

### Test with curl:
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "source": "website"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "client": {
    "id": 1,
    "full_name": "Test User",
    "email": "test@example.com",
    ...
  },
  "message": "Lead created successfully"
}
```

## Common Issues

1. **CORS Errors**: The backend has CORS enabled, so this shouldn't be an issue
2. **404 Not Found**: Make sure you're using `/api/clients` (not `/clients`)
3. **Validation Errors**: Make sure `full_name` is included in your request
4. **Network Errors**: If using localhost, your website can't reach it - use ngrok or deploy

## Required Fields

- `full_name` (string) - **REQUIRED**

## Optional Fields

- `email` (string)
- `phone` (string)
- `source` (string) - defaults to "website"
- `business_id` (integer) - assign to specific business
- `status` (string) - "new", "contacted", "active", "inactive"
- `tags` (array)
- `utm_source`, `utm_medium`, `utm_campaign` (strings)
- `referrer` (string)
- `signup_page` (string)

## Check Logs

The backend now logs all incoming webhook requests. Check:
```bash
tail -f /tmp/crm-backend.log
```

You should see:
```
=== Webhook Request Received ===
Method: POST
URL: /api/clients
Body: {...}
```

