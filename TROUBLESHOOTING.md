# Troubleshooting Guide

## Common Errors and Solutions

### 1. MongoDB Connection Error

**Error:** `❌ MongoDB connection error: MongoServerError: connect ECONNREFUSED`

**Solution:**
- Make sure MongoDB is running on your system
- For local MongoDB: Start MongoDB service
  ```bash
  # Windows (if installed as service)
  net start MongoDB
  
  # Or check if MongoDB is running
  mongod
  ```
- Check your `.env` file has the correct connection string:
  ```
  MONGODB_URI=mongodb://localhost:27017/query_management
  ```
- For MongoDB Atlas: Use your connection string from Atlas dashboard

### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change the port in `.env` file:
  ```
  PORT=5001
  ```
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### 3. Module Not Found Errors

**Error:** `Cannot find module 'express'` or similar

**Solution:**
```bash
# Install dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 4. React App Won't Start

**Error:** `Error: ENOENT: no such file or directory`

**Solution:**
- Make sure you're in the correct directory
- Run `npm run client-install` to install client dependencies
- Check if `node_modules` exists in both root and client folders

### 5. API Connection Errors (Frontend)

**Error:** `Network Error` or `Failed to fetch`

**Solution:**
- Make sure backend server is running on port 5000
- Check `.env` file in root has correct API URL (or use default)
- Check browser console for CORS errors
- Verify backend is accessible at `http://localhost:5000/api/health`

### 6. Empty Dashboard/Analytics

**Error:** Dashboard shows "No data available"

**Solution:**
- This is normal if no queries exist yet
- Run seed script to create sample data:
  ```bash
  npm run seed
  ```
- Make sure MongoDB is connected and database exists

### 7. Cannot Read Property Errors

**Error:** `Cannot read property 'queryTypes' of null`

**Solution:**
- This has been fixed in the latest code with null checks
- Make sure you have the latest code
- Check browser console for specific error details

## Step-by-Step Setup Verification

1. **Check MongoDB:**
   ```bash
   # Try connecting to MongoDB
   mongo
   # Or
   mongosh
   ```

2. **Create .env file** (if it doesn't exist):
   ```
   MONGODB_URI=mongodb://localhost:27017/query_management
   PORT=5000
   NODE_ENV=development
   SECRET_KEY=dev-secret-key-change-in-production
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Verify Dependencies:**
   ```bash
   # Check if node_modules exist
   ls node_modules  # or dir node_modules on Windows
   ls client/node_modules
   ```

4. **Test Backend:**
   ```bash
   npm run dev
   # Should see: ✅ Connected to MongoDB
   # Should see: 🚀 Server running on port 5000
   ```

5. **Test Frontend:**
   ```bash
   npm run client
   # Should open browser at http://localhost:3000
   ```

6. **Seed Sample Data:**
   ```bash
   npm run seed
   # Should create teams, users, and sample queries
   ```

## Getting Help

If you're still experiencing issues:

1. Check the terminal/console for specific error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check that ports 3000 and 5000 are available
5. Review the error messages in browser console (F12)

## Quick Fixes

**Reset everything:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules client/node_modules
npm run install-all

# Clear npm cache
npm cache clean --force
```

**Windows:**
```powershell
# Delete node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client\node_modules

# Reinstall
npm run install-all
```


