# Audience Query Management & Response System

A unified enterprise-grade system that centralizes all incoming audience queries, categorizes and prioritizes them automatically, routes urgent issues to the right teams, and tracks progress with comprehensive analytics.

## 📁 Project Structure

```
.
├── client/          # React frontend application
├── server/          # Node.js backend API and workers
├── package.json     # Root package.json for managing both client and server
├── README.md        # This file
└── ARCHITECTURE.md  # System architecture documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- MongoDB (local or MongoDB Atlas)
- Redis (optional, for message queue)

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   npm run client-install
   ```

3. **Set up environment variables:**
   - Create `.env` file in root directory
   - See `server/.env.example` for required variables

4. **Start all services:**
   ```bash
   npm run dev-all
   ```

   This starts:
   - API Server (port 5000)
   - Worker Service (background processing)
   - React Frontend (port 3000)

### Individual Services

```bash
# Start API server only
npm run dev

# Start worker service only
npm run worker

# Start frontend only
npm run client
```

## 📋 Features

### Core Functionality
- ✅ **Unified Inbox**: Centralized view of all queries
- ✅ **Auto-Tagging**: NLP-based categorization
- ✅ **Priority Detection**: Intelligent priority assignment
- ✅ **Auto-Routing**: Smart assignment to teams/users
- ✅ **Status Tracking**: Complete lifecycle management
- ✅ **Escalation**: Automatic escalation of overdue queries
- ✅ **Analytics**: Comprehensive reporting

### Advanced Features
- ✅ **Multi-Channel Integration**: Email, Social Media, WhatsApp, Chat, Forums
- ✅ **Message Queue**: Redis/BullMQ for async processing
- ✅ **Background Workers**: Tagging, Sentiment, Priority, Spam detection
- ✅ **Real-time Updates**: Socket.io for live updates
- ✅ **Authentication**: JWT-based with RBAC
- ✅ **Notifications**: Email, Slack, Push notifications

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/query_management

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📚 Documentation

- **ARCHITECTURE.md** - Detailed system architecture
- **server/README.md** - Backend API documentation
- **client/README.md** - Frontend documentation

## 🛠️ Development

### Project Structure

- **client/** - React frontend application
  - `src/` - Source code
  - `public/` - Static files
  - `package.json` - Frontend dependencies

- **server/** - Node.js backend
  - `index.js` - API Gateway
  - `workers/` - Background workers
  - `controllers/` - Request handlers
  - `routes/` - API routes
  - `services/` - Business logic
  - `models/` - Database models
  - `middleware/` - Express middleware
  - `integrators/` - Channel integrators

### Scripts

```bash
npm run dev          # Start API server
npm run worker       # Start background workers
npm run client       # Start React frontend
npm run dev-all      # Start all services
npm run seed         # Seed sample data
npm run install-all  # Install all dependencies
```

## 🔐 Authentication

The system uses JWT-based authentication:

1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Use token**: Add `Authorization: Bearer <token>` header

## 📡 Webhooks

Receive messages from various channels:

- `POST /api/webhooks/email` - Email messages
- `POST /api/webhooks/social-media` - Instagram/Facebook
- `POST /api/webhooks/whatsapp` - WhatsApp
- `POST /api/webhooks/chat` - Chat widget
- `POST /api/webhooks/forum` - Community forums

## 🧪 Testing

### Seed Sample Data
```bash
npm run seed
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/webhooks/generic \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "from": {"name": "Test User", "email": "test@example.com"},
    "subject": "Test Query",
    "body": "This is a test message"
  }'
```

## 🌐 Live Demo

- **Frontend**: [View Live Demo](https://bhupendraparmar143.github.io/rapidquest-hackathon-25/)
- **API**: Configure your backend URL in the frontend

## 🐛 Troubleshooting

### Redis Connection Errors
If you see Redis connection errors, don't worry! Redis is optional. The application will work without it, but queue features will be limited. To enable Redis:
- Install Redis locally, or
- Use a cloud Redis service and set `REDIS_HOST` in `.env`

### MongoDB Connection Issues
Make sure MongoDB is running or use MongoDB Atlas:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues or questions, please check the documentation or create an issue in the repository.

## 👨‍💻 Author

**Bhupendra Parmar**
- GitHub: [@bhupendraparmar143](https://github.com/bhupendraparmar143)

## 🙏 Acknowledgments

- Built for RapidQuest Hackathon 2025
- Thanks to all contributors and the open-source community
