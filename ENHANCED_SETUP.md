# Enhanced System Setup Guide

## New Features Added

### 1. **Message Queue System (Redis/BullMQ)**
- Asynchronous query processing
- Handles traffic spikes
- Reliable job processing with retries

### 2. **Authentication & Authorization**
- JWT-based authentication
- Role-Based Access Control (RBAC)
- User registration and login
- Token refresh mechanism

### 3. **Channel Integrators**
- Email (Gmail/Outlook)
- Instagram/Facebook
- WhatsApp
- Website Chat Widget
- Community Forums

### 4. **Background Workers**
- Auto-tagging worker
- Sentiment analysis worker
- Priority detection worker
- Spam detection worker
- Notification worker

### 5. **Real-time Updates**
- Socket.io integration
- Live query updates
- Team-based notifications

### 6. **Notification Service**
- Email notifications (SMTP)
- Slack integration
- Push notifications (placeholder)

### 7. **Security Enhancements**
- Helmet.js for security headers
- Rate limiting
- Input sanitization
- CORS configuration

## Installation

### 1. Install New Dependencies

```bash
npm install
```

This will install:
- `redis` & `bull` - Message queue
- `jsonwebtoken` & `bcryptjs` - Authentication
- `socket.io` - Real-time updates
- `nodemailer` - Email notifications
- `sentiment` - Sentiment analysis
- `helmet` & `express-rate-limit` - Security
- And more...

### 2. Redis Setup (Optional but Recommended)

**Option A: Local Redis**
```bash
# Windows (using Chocolatey)
choco install redis-64

# Or download from: https://redis.io/download
```

**Option B: Redis Cloud (Free)**
- Sign up at: https://redis.com/try-free/
- Get connection string
- Add to `.env`:
```
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

**Option C: Docker**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### 3. Update .env File

Add these new environment variables:

```env
# Existing MongoDB
MONGODB_URI=mongodb+srv://...

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Email (SMTP) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Slack - Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Start Services

**Start all services:**
```bash
npm run dev-all
```

This starts:
- API Server (port 5000)
- Worker Service (background processing)
- React Frontend (port 3000)

**Or start separately:**
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Workers
npm run worker

# Terminal 3: Frontend
npm run client
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires auth)

### Webhooks (Public)
- `POST /api/webhooks/email` - Email webhook
- `POST /api/webhooks/social-media` - Instagram/Facebook
- `POST /api/webhooks/whatsapp` - WhatsApp
- `POST /api/webhooks/chat` - Chat widget
- `POST /api/webhooks/forum` - Community forum
- `POST /api/webhooks/generic` - Generic webhook

### Protected Routes
All query, analytics, and team routes now require authentication:
- Add header: `Authorization: Bearer <token>`

## Testing Webhooks

### Test Email Webhook:
```bash
curl -X POST http://localhost:5000/api/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"name": "John Doe", "email": "john@example.com"},
    "subject": "Test Email",
    "body": "This is a test email message",
    "date": "2024-01-01T10:00:00Z"
  }'
```

### Test Generic Webhook:
```bash
curl -X POST http://localhost:5000/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "from": {"name": "Jane Doe", "email": "jane@example.com"},
    "subject": "Test Query",
    "body": "This is a test query from webhook"
  }'
```

## Worker Service

The worker service processes:
1. **Query Processing** - Main queue
2. **Tagging** - Auto-categorization
3. **Sentiment Analysis** - Detects positive/negative/neutral
4. **Priority Detection** - Intelligent priority assignment
5. **Spam Detection** - Filters spam messages
6. **Notifications** - Sends emails, Slack messages

## Real-time Updates

Socket.io is enabled for real-time updates:
- Join team room: `socket.emit('join-team', teamId)`
- Join query room: `socket.emit('join-query', queryId)`
- Server emits updates to connected clients

## Next Steps

1. **Configure Email**: Set up SMTP in `.env` for email notifications
2. **Configure Slack**: Add Slack webhook URL for team notifications
3. **Set up Channel Integrations**: Connect actual channels (Gmail API, Facebook API, etc.)
4. **Deploy Workers**: Run workers on separate servers for production
5. **Add Elasticsearch**: For advanced search capabilities (optional)

## Architecture Notes

- **Queue System**: Redis is optional but recommended for production
- **Workers**: Can run on separate servers for scalability
- **Authentication**: JWT tokens, refresh tokens for security
- **Real-time**: Socket.io for live updates
- **Security**: Helmet, rate limiting, input sanitization

