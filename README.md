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
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/api-key` - Get API key
- `POST /api/auth/api-key/generate` - Generate API key
- `POST /api/auth/api-key/revoke` - Revoke API key

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

Connect your website leads directly to this CRM platform. The integration supports optional API key authentication for enhanced security.

### Getting Your API Key

1. Log in to your CRM dashboard
2. Navigate to **Settings** → **Website Integration** tab
3. Click **Generate API Key** to create a new key
4. Copy and securely store your API key

### Integration Methods

#### Method 1: With API Key (Recommended)

```javascript
async function submitLead(formData) {
  const response = await fetch('http://your-crm-domain.com/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key-here' // Optional but recommended
    },
    body: JSON.stringify({
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: 'website',
      business_id: null, // Optional: assign to specific business
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      referrer: document.referrer,
      signup_page: window.location.pathname
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Lead created:', data);
  }
}
```

#### Method 2: Public Endpoint (No Authentication)

The endpoint works without authentication for backward compatibility, but API key authentication is recommended for production use.

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
    source: 'website'
  })
});
```

### API Endpoint Details

**Endpoint**: `POST /api/clients`

**Required Fields**:
- `full_name` (string) - Lead's full name

**Optional Fields**:
- `email` (string) - Email address
- `phone` (string) - Phone number
- `source` (string) - Lead source (default: "website")
- `status` (string) - Status: "new", "contacted", "active", "inactive" (default: "new")
- `business_id` (integer) - Assign lead to specific business
- `tags` (array) - Array of tags
- `utm_source`, `utm_medium`, `utm_campaign` - UTM tracking parameters
- `referrer` (string) - Referrer URL
- `signup_page` (string) - Page where signup occurred

**Response**: Returns the created client object with success status.

### Authentication Endpoints

- `GET /api/auth/api-key` - Get your current API key (requires authentication)
- `POST /api/auth/api-key/generate` - Generate a new API key (requires authentication)
- `POST /api/auth/api-key/revoke` - Revoke your API key (requires authentication)

**Note**: All authentication endpoints require a valid JWT token in the Authorization header.

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


