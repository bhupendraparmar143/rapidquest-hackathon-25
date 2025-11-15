# Audience Query Management & Response System

A unified system that centralizes all incoming audience queries, categorizes and prioritizes them automatically, routes urgent issues to the right teams, and tracks progress with comprehensive analytics.

## Features

### Core Functionality
- **Unified Inbox**: Centralized view of all queries from email, social media, chat, community platforms, and phone
- **Auto-Tagging**: Automatically categorizes queries (question, request, complaint, compliment, feedback, technical_issue, billing, other)
- **Priority Detection**: Intelligent priority assignment (low, medium, high, urgent) based on content analysis
- **Auto-Routing**: Smart assignment of queries to appropriate teams and users based on tags, channels, and workload
- **Status Tracking**: Complete lifecycle tracking (new → assigned → in_progress → resolved → closed)
- **Escalation**: Automatic escalation of overdue queries based on priority and response time
- **History & Notes**: Complete audit trail of all actions and notes
- **Analytics**: Comprehensive analytics on response times, query types, channel distribution, and team performance

## Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **MongoDB** with **Mongoose** - Database and ODM
- **Natural** - Natural language processing for auto-tagging
- **Moment.js** - Date/time handling

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Moment.js** - Date formatting

## Project Structure

```
audience-query-management/
├── server/                 # Backend code
│   ├── index.js           # Express server entry point
│   ├── models/            # MongoDB models
│   │   ├── Query.js       # Query model
│   │   ├── User.js        # User model
│   │   └── Team.js        # Team model
│   ├── routes/            # API routes
│   │   ├── queryRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── teamRoutes.js
│   ├── controllers/       # Request handlers
│   │   ├── queryController.js
│   │   ├── analyticsController.js
│   │   └── teamController.js
│   └── services/          # Business logic
│       ├── taggingService.js      # Auto-tagging logic
│       ├── priorityService.js     # Priority detection & escalation
│       ├── routingService.js      # Auto-routing & assignment
│       └── analyticsService.js    # Analytics calculations
├── client/                # Frontend code
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── layout/
│   │   │       └── Navbar.js
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── UnifiedInbox.js
│   │   │   ├── QueryDetail.js
│   │   │   └── Analytics.js
│   │   ├── services/      # API service
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json           # Root package.json
├── .env.example           # Environment variables template
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Step 1: Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/query_management
PORT=5000
```

### Step 3: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

### Step 4: Run the Application

#### Option 1: Run Backend and Frontend Separately

```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend
npm run client
```

#### Option 2: Run Both Together (if concurrently is installed)

```bash
npm run dev-all
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API Endpoints

### Query Management

- `POST /api/queries` - Create a new query
- `GET /api/queries` - Get all queries (with filters)
- `GET /api/queries/:id` - Get single query
- `PATCH /api/queries/:id/status` - Update query status
- `POST /api/queries/:id/assign` - Manually assign query
- `POST /api/queries/:id/auto-assign` - Auto-assign query
- `POST /api/queries/:id/notes` - Add note to query
- `DELETE /api/queries/:id` - Delete query

### Analytics

- `GET /api/analytics/dashboard` - Get comprehensive dashboard data
- `GET /api/analytics/response-time` - Get response time analytics
- `GET /api/analytics/query-types` - Get query type distribution
- `GET /api/analytics/team-performance` - Get team performance metrics
- `GET /api/analytics/time-based` - Get time-based analytics

### Team & User Management

- `GET /api/teams/teams` - Get all teams
- `POST /api/teams/teams` - Create team
- `GET /api/teams/users` - Get all users
- `POST /api/teams/users` - Create user

## Usage Examples

### Creating a Query

```javascript
POST /api/queries
{
  "subject": "Product not working",
  "content": "I purchased your product last week and it's not functioning properly. This is urgent!",
  "channel": "email",
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "autoAssign": true
}
```

The system will automatically:
1. Tag the query (e.g., "complaint", "technical_issue")
2. Detect priority (e.g., "urgent" based on keywords)
3. Route to appropriate team
4. Assign to available user

### Filtering Queries

```javascript
GET /api/queries?status=new&priority=urgent&channel=email&page=1&limit=20
```

### Updating Status

```javascript
PATCH /api/queries/:id/status
{
  "status": "in_progress",
  "userId": "user-id",
  "notes": "Started working on this issue"
}
```

## Key Features Explained

### Auto-Tagging
The system uses natural language processing to analyze query content and automatically assign relevant tags. It looks for keywords and patterns to categorize queries into:
- Question, Request, Complaint, Compliment, Feedback, Technical Issue, Billing, Other

### Priority Detection
Priority is determined by:
- Keywords in content (urgent, critical, emergency, etc.)
- Query tags (complaints and technical issues are typically high priority)
- Channel type (phone calls are more urgent than emails)
- Priority score (0-100) calculated from multiple factors

### Auto-Routing
Queries are automatically routed based on:
- Team capabilities (tags, channels, priorities they handle)
- Current workload (prefers teams/users with lower workload)
- User performance (prefers users with better response times)

### Escalation
Queries are automatically escalated if:
- Not responded to within threshold time (varies by priority)
- Urgent: 1 hour
- High: 4 hours
- Medium: 12 hours
- Low: 24 hours

## Development

### Code Structure
- **Models**: Define database schemas with Mongoose
- **Services**: Contain business logic (tagging, priority, routing, analytics)
- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints
- **Components**: React components for UI

### Adding New Features

1. **New Model**: Add to `server/models/`
2. **New Service**: Add to `server/services/`
3. **New Controller**: Add to `server/controllers/`
4. **New Route**: Add to `server/routes/` and register in `server/index.js`
5. **New Component**: Add to `client/src/components/` or `client/src/pages/`

## Testing

To test the system:

1. Create some teams and users via API or directly in MongoDB
2. Create queries via the API
3. Observe auto-tagging and priority detection
4. Check auto-assignment
5. Update statuses and track history
6. View analytics dashboard

## Future Enhancements

- User authentication and authorization
- Real-time notifications
- Email integration
- Social media API integrations
- Advanced ML-based tagging
- Custom workflow rules
- SLA tracking
- Customer satisfaction surveys

## License

ISC

## Support

For issues or questions, please create an issue in the repository.


