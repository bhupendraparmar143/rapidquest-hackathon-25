# Quick Fix: MongoDB Connection Error

## 🚀 Fastest Solution: MongoDB Atlas (5 minutes, FREE)

### Step 1: Create Free Account
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with email (or use Google/GitHub)

### Step 2: Create Free Cluster
1. Click **"Build a Database"**
2. Select **FREE** tier (M0 Sandbox)
3. Choose any cloud provider (AWS recommended)
4. Choose a region close to you
5. Click **"Create"** (takes 1-3 minutes)

### Step 3: Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username (e.g., `admin`) and password (save this!)
5. Set privileges to **"Atlas admin"**
6. Click **"Add User"**

### Step 4: Whitelist Your IP
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add your specific IP: `0.0.0.0/0`
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Select **"Node.js"** and version **"5.5 or later"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update .env File
1. Open `.env` file in project root
2. Replace the `MONGODB_URI` line with your connection string
3. Replace `<username>` with your database username
4. Replace `<password>` with your database password
5. Add database name at the end: `/query_management`

**Example:**
```env
MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.abc123.mongodb.net/query_management?retryWrites=true&w=majority
```

### Step 7: Restart Server
```bash
npm run dev-all
```

✅ **Done!** Your MongoDB connection should work now.

---

## Alternative: Install MongoDB Locally

### Windows:
1. Download: **https://www.mongodb.com/try/download/community**
2. Run installer → Choose **"Complete"** installation
3. Install as Windows Service (recommended)
4. Start service:
   ```powershell
   Start-Service MongoDB
   ```
5. Verify:
   ```powershell
   mongosh
   ```

### Your .env should have:
```env
MONGODB_URI=mongodb://localhost:27017/query_management
```

---

## Need Help?

If you still have issues:
1. Check your connection string in `.env` file
2. Make sure password doesn't have special characters (or URL-encode them)
3. Verify IP whitelist in MongoDB Atlas
4. Check server logs for specific error messages


