# System Architecture

## Overview
Enterprise-grade Audience Query Management System with microservices architecture, message queue, and multi-channel integration.

## Architecture Components

### 1. Channel Integrators
- **Email**: Gmail/Outlook webhooks and IMAP polling
- **Social Media**: Instagram/Facebook Graph API
- **WhatsApp**: WhatsApp Business API
- **Chat Widget**: Website chat integration
- **Community Forums**: Forum API connectors

### 2. Ingestion Layer
- Normalizes all incoming messages into unified format
- Validates and sanitizes input
- Routes to message queue

### 3. Message Queue (Redis/BullMQ)
- Handles traffic spikes
- Ensures message processing reliability
- Job queue for async processing

### 4. Processing Workers
- **Auto-tagging**: NLP-based categorization
- **Sentiment Analysis**: Detects positive/negative/neutral
- **Priority Detection**: Intelligent priority assignment
- **Spam Detection**: Filters spam messages
- **Channel Formatting**: Adapts content per channel

### 5. API Gateway
- RESTful API endpoints
- JWT Authentication
- Role-Based Access Control (RBAC)
- Rate limiting
- Request validation

### 6. Data Layer
- **MongoDB**: Primary database for queries, users, teams
- **Elasticsearch**: Fast search and filtering
- **Redis**: Caching and session management

### 7. Notification Service
- Email alerts (SMTP)
- Slack/Teams integration
- Push notifications

### 8. Frontend Dashboard
- Real-time updates (WebSocket)
- Advanced search and filters
- Unified inbox
- Analytics and reporting

## Technology Stack

### Backend
- Node.js + Express.js
- MongoDB (Mongoose)
- Redis + BullMQ
- JWT for authentication
- Socket.io for real-time

### Frontend
- React
- Socket.io-client
- Recharts for analytics
- Real-time updates

### Services
- NLP: Natural.js, Compromise
- Sentiment: Sentiment.js
- Email: Nodemailer
- Search: Elasticsearch (optional)

## File Structure

```
server/
├── index.js                 # API Gateway
├── workers/                 # Background workers
│   ├── index.js
│   ├── taggingWorker.js
│   ├── sentimentWorker.js
│   └── priorityWorker.js
├── integrators/            # Channel integrators
│   ├── email/
│   ├── instagram/
│   ├── whatsapp/
│   ├── chat/
│   └── forum/
├── services/
│   ├── queueService.js     # BullMQ setup
│   ├── authService.js      # JWT auth
│   ├── notificationService.js
│   └── searchService.js    # Elasticsearch
├── middleware/
│   ├── auth.js
│   ├── rbac.js
│   └── rateLimiter.js
└── ...
```

