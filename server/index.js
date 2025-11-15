/**
 * Main server entry point for the Audience Query Management & Response System
 * Sets up Express server, connects to MongoDB, and initializes routes
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Load environment variables explicitly
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body Parser Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection check middleware
const checkMongoConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected. Please check MongoDB connection.',
      error: 'MongoDB connection required. See server logs for setup instructions.'
    });
  }
  next();
};

// Initialize Redis/Queue Service
const { initRedis } = require('./services/queueService');
initRedis().then(() => {
  console.log('✅ Redis/Queue service initialized');
}).catch(err => {
  console.warn('⚠️  Redis not available, continuing without queue features');
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join user to their team room
  socket.on('join-team', (teamId) => {
    socket.join(`team-${teamId}`);
    console.log(`User ${socket.id} joined team ${teamId}`);
  });

  // Join user to query room
  socket.on('join-query', (queryId) => {
    socket.join(`query-${queryId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Import Routes
const queryRoutes = require('./routes/queryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const teamRoutes = require('./routes/teamRoutes');
const authRoutes = require('./routes/authRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Public Routes (no auth required)
app.use('/api/webhooks', webhookRoutes); // Webhooks don't require auth
app.use('/api/auth', authRoutes);

// Protected API Routes with MongoDB check
app.use('/api/queries', checkMongoConnection, queryRoutes);
app.use('/api/analytics', checkMongoConnection, analyticsRoutes);
app.use('/api/teams', checkMongoConnection, teamRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(mongoStatus === 'connected' ? 200 : 503).json({ 
    status: mongoStatus === 'connected' ? 'OK' : 'WARNING',
    message: 'Audience Query Management System is running',
    mongodb: mongoStatus,
    mongodbReadyState: mongoose.connection.readyState // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/query_management';

// Debug: Log which connection string is being used (hide password)
const uriForLog = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
console.log(`\n🔗 Attempting to connect to: ${uriForLog}\n`);

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Increased timeout
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`📦 Database: ${MONGODB_URI.split('/').pop()}`);
})
.catch((error) => {
  console.error('\n❌ MongoDB Connection Failed!');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Error:', error.message);
  console.error('\n📋 To fix this issue:');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('\nOption 1: Use MongoDB Atlas (Cloud - Free & Easy)');
  console.error('  1. Go to: https://www.mongodb.com/cloud/atlas/register');
  console.error('  2. Create free account and cluster');
  console.error('  3. Get connection string and update .env file');
  console.error('  4. Update MONGODB_URI in .env file');
  console.error('\nOption 2: Install MongoDB Locally');
  console.error('  1. Download: https://www.mongodb.com/try/download/community');
  console.error('  2. Install MongoDB Community Server');
  console.error('  3. Start MongoDB service: Start-Service MongoDB');
  console.error('\nOption 3: Use Docker');
  console.error('  docker run -d -p 27017:27017 --name mongodb mongo:latest');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.error('⚠️  Server will continue but API endpoints will not work until MongoDB is connected.\n');
  // Don't exit - allow server to start but API won't work
});

// Server Configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Unified Query Management System ready`);
  console.log(`🔌 Socket.io enabled for real-time updates`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   - API: http://localhost:${PORT}/api`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Webhooks: http://localhost:${PORT}/api/webhooks`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
});

// Export for testing
module.exports = { app, server, io };

