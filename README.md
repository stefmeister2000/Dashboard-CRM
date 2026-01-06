# CRM Dashboard

A lightweight CRM dashboard built with an integration-first architecture. This CRM pulls client signups from your website, stores contact information, and provides a simple dashboard to view and manage your clients.

## Features

- **Authentication**: Role-based access (Admin, Support, Sales)
- **Clients Management**: Full CRUD operations with search and filters
- **Client Profiles**: Detailed view with contact info, notes, and timeline
- **Dashboard**: Key metrics and recent signups
- **CSV Export**: Export clients data anytime
- **API-First**: Built for easy integration with other platforms
- **Events System**: All actions are logged for future integrations

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (can be migrated to PostgreSQL)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: JWT-based

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up backend environment:
```bash
cd backend
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:3001`
- Frontend app on `http://localhost:3000`

### Default Login

- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change the default password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user (admin only)

### Clients
- `GET /api/clients` - List clients (with search/filters)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client (public endpoint for website signups)
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Notes
- `GET /api/notes/client/:clientId` - Get notes for a client
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/client/:clientId/timeline` - Get client timeline

### Export
- `GET /api/export/clients.csv` - Export clients as CSV

## Website Integration

To connect your website signup form to this CRM, make a POST request to `/api/clients`:

```javascript
fetch('http://your-crm-domain.com/api/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    source: 'website',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'summer_sale',
    referrer: 'https://google.com',
    signup_page: '/signup'
  })
});
```

**Note**: The `/api/clients` POST endpoint is public (no authentication required) to allow website signups. All other endpoints require authentication.

## Database Schema

### Clients Table
- `id` - Primary key
- `full_name` - Client's full name
- `email` - Email address
- `phone` - Phone number
- `status` - Status (new, contacted, active, inactive)
- `source` - Source (website, manual, import, etc.)
- `tags` - JSON array of tags
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Notes Table
- `id` - Primary key
- `client_id` - Foreign key to clients
- `note_text` - Note content
- `created_by` - User ID who created the note
- `created_at` - Creation timestamp

### Events Table
- `id` - Primary key
- `client_id` - Foreign key to clients
- `event_type` - Event type (signup, updated, note_added, etc.)
- `payload` - JSON payload with event data
- `created_at` - Creation timestamp

## Future Integrations

The Events table and API-first architecture make it easy to add integrations:

- **Email Platforms**: Subscribe clients to email lists based on status/tags
- **Slack/Discord**: Notify team on new signups
- **Stripe**: Attach payment status to clients
- **Calendly**: Link booked calls to client profiles
- **Ads Platforms**: Store UTM parameters and attribution data

## Development

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in your `.env` file
2. Use a production database (PostgreSQL recommended)
3. Update database connection in `backend/database.js`
4. Build frontend: `cd frontend && npm run build`
5. Serve frontend build with a static file server or integrate with Express

## License

MIT

