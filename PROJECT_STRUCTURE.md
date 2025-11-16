# Project Structure

## 📁 Directory Layout

```
audience-query-management/
│
├── .gitignore                 # Root gitignore
├── package.json               # Root package.json (manages both client & server)
├── package-lock.json           # Dependency lock file
├── README.md                   # Main project documentation
├── ARCHITECTURE.md             # System architecture documentation
│
├── client/                     # React Frontend
│   ├── .gitignore             # Client-specific gitignore
│   ├── package.json           # Frontend dependencies
│   ├── package-lock.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js           # React entry point
│       ├── App.js             # Main App component
│       ├── App.css
│       ├── index.css
│       ├── components/        # React components
│       │   └── layout/
│       │       ├── Navbar.js
│       │       └── Navbar.css
│       ├── pages/            # Page components
│       │   ├── Dashboard.js
│       │   ├── Dashboard.css
│       │   ├── UnifiedInbox.js
│       │   ├── UnifiedInbox.css
│       │   ├── QueryDetail.js
│       │   ├── QueryDetail.css
│       │   ├── Analytics.js
│       │   └── Analytics.css
│       └── services/
│           └── api.js        # API client
│
└── server/                    # Node.js Backend
    ├── .gitignore            # Server-specific gitignore
    ├── index.js              # API Gateway entry point
    │
    ├── controllers/          # Request handlers
    │   ├── queryController.js
    │   ├── analyticsController.js
    │   └── teamController.js
    │
    ├── routes/               # API routes
    │   ├── queryRoutes.js
    │   ├── analyticsRoutes.js
    │   ├── teamRoutes.js
    │   ├── authRoutes.js
    │   └── webhookRoutes.js
    │
    ├── models/               # MongoDB models
    │   ├── Query.js
    │   ├── User.js
    │   └── Team.js
    │
    ├── services/             # Business logic
    │   ├── queueService.js
    │   ├── authService.js
    │   ├── notificationService.js
    │   ├── taggingService.js
    │   ├── priorityService.js
    │   ├── routingService.js
    │   └── analyticsService.js
    │
    ├── middleware/           # Express middleware
    │   ├── auth.js
    │   └── rbac.js
    │
    ├── integrators/          # Channel integrators
    │   └── channelIntegrator.js
    │
    ├── workers/              # Background workers
    │   ├── index.js
    │   └── notificationWorker.js
    │
    ├── scripts/              # Utility scripts
    │   └── seedData.js
    │
    └── utils/                # Utility functions
        └── constants.js
```

## 📝 File Organization

### Root Level
- **README.md** - Main project documentation
- **ARCHITECTURE.md** - System architecture details
- **package.json** - Root package.json for managing both client and server
- **.gitignore** - Root-level gitignore

### Client Folder (`client/`)
- React frontend application
- All frontend dependencies in `client/package.json`
- Build output goes to `client/build/`
- Has its own `.gitignore`

### Server Folder (`server/`)
- Node.js backend API
- All backend dependencies in root `package.json`
- Workers, controllers, services, models
- Has its own `.gitignore`

## 🔒 Gitignore Files

### Root `.gitignore`
- Ignores root `node_modules/`
- Ignores `.env` files
- Ignores logs and temporary files
- Ignores IDE files

### `client/.gitignore`
- Ignores `client/node_modules/`
- Ignores `client/build/`
- Ignores React-specific files
- Ignores IDE files

### `server/.gitignore`
- Ignores server-specific files
- Ignores database files
- Ignores Redis dumps
- Ignores logs and cache

## 🚀 Running the Project

All commands are run from the root directory:

```bash
# Install all dependencies
npm run install-all

# Start all services
npm run dev-all

# Start individual services
npm run dev      # API server
npm run worker   # Background workers
npm run client   # React frontend
```

## 📦 Dependencies

- **Root `package.json`**: Contains all backend dependencies
- **`client/package.json`**: Contains all frontend dependencies

## 🔐 Environment Variables

Create `.env` file in the **root directory** (not in client or server folders).

The server will automatically load it from the root.


