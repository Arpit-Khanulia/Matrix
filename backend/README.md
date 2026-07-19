# Developer Dashboard Auth & Sync Backend

This Node.js + Express backend acts as the secure database synchronization server for the Personal Life Tracker. It implements Google Identity Services (OAuth 2.0) authentication and backs up/restores routines matrix records from MongoDB Atlas using secure JWT cookies.

---

## 🛠️ Step-by-Step Google Cloud OAuth 2.0 Configuration

To enable **Sign in with Google** on your Developer Dashboard, you need to configure an OAuth client on the Google Cloud Console.

### 1. Create a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. Click the project dropdown in the top-left corner (next to the logo) and select **New Project**.
4. Enter a project name (e.g., `Personal Life Tracker`) and click **Create**. Wait a few seconds for provisioning to finish, then select the project.

### 2. Configure the OAuth Consent Screen
Before creating credentials, you must define the user consent interface:
1. Navigate to **APIs & Services** > **OAuth consent screen** via the left-hand navigation menu.
2. Select **External** as the User Type (allowing any Gmail address to authenticate) and click **Create**.
3. Fill in the **App Information**:
   * **App name**: `Personal Life Tracker`
   * **User support email**: Select your Gmail address.
   * **Developer contact information**: Type your email address.
4. Click **Save and Continue**.
5. On the **Scopes** screen, click **Add or Remove Scopes**. Check `.../auth/userinfo.email` and `.../auth/userinfo.profile` to read names and avatars. Click **Update** and then **Save and Continue**.
6. On the **Test users** screen, click **Add Users** and add your own Gmail address (since the app is in "Testing" status, only test users can log in).
7. Review the details and click **Back to Dashboard**.

### 3. Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Choose **Web application** as the Application type.
4. Enter a descriptive name (e.g., `Tracker Web Client`).

### 4. Configure JavaScript Origins & Redirect URIs
Under the **Restrictions** headers, add the domains where your web app runs:

* **Authorized JavaScript Origins**:
  *(Domains allowed to host the Sign-In button)*
  * Add: `http://localhost:5500` (for local development, or VSCode Live Server)
  * Add: `https://your-github-username.github.io` (for your GitHub Pages production site)

* **Authorized Redirect URIs**:
  *(Not strictly needed for Google Identity One Tap button login since it returns tokens directly via browser Javascript callbacks, but required for backup endpoints)*
  * Add: `http://localhost:5000` (local backend)
  * Add: `https://your-backend-app.vercel.app` (Vercel production backend)

### 5. Copy Client ID and Secret
1. Click **Create**.
2. A modal will display. Copy your **Client ID** (e.g., `xxxxxxxx-xxxxxxx.apps.googleusercontent.com`) and **Client Secret**.
3. Paste these values into the backend `.env` file:
   * Paste the Client ID to `GOOGLE_CLIENT_ID`
   * Paste the Client Secret to `GOOGLE_CLIENT_SECRET`
4. Also paste the Client ID into the top configuration variable in [js/sync.js](file:///home/firedragon/Downloads/tracker/js/sync.js#L9).

---

## ☁️ Deploying the Backend on Vercel

Vercel provides free, high-performance hosting for Node/Express serverless functions.

### 1. Structure Check
Ensure `vercel.json` exists in the `/backend` folder with these rules mapping URL paths to `server.js`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### 2. Deployment Steps
1. Install Vercel CLI globally if you haven't already:
   ```bash
   npm install -g vercel
   ```
2. Navigate to the `backend/` directory in your terminal:
   ```bash
   cd backend
   ```
3. Run the deployment command:
   ```bash
   vercel
   ```
   Follow the prompts to link your Vercel account.
4. Go to your [Vercel Dashboard](https://vercel.com/dashboard), click on the new project, and navigate to **Settings** > **Environment Variables**.
5. Add all keys from your `.env` file to Vercel:
   * `GOOGLE_CLIENT_ID`
   * `GOOGLE_CLIENT_SECRET`
   * `JWT_SECRET` (Use a strong random string!)
   * `MONGODB_URI` (Your MongoDB Atlas connection string)
   * `FRONTEND_URL` (`https://your-github-username.github.io` - crucial for CORS cookie acceptance!)
   * `BACKEND_URL` (`https://your-backend-app.vercel.app` - your newly deployed Vercel domain URL)
6. Redeploy to push env configurations to live serverless endpoints:
   ```bash
   vercel --prod
   ```
7. Copy the production backend URL provided by Vercel and paste it as the `BACKEND_URL` in [js/sync.js](file:///home/firedragon/Downloads/tracker/js/sync.js#L7).

---

## 🐙 Deploying the Frontend on GitHub Pages

1. Commit and push the static files in the root folder (like `index.html`, `css/`, and `js/`) to a public GitHub repository.
2. Go to your repository page, click **Settings**, and select **Pages** from the sidebar.
3. Under **Build and deployment**, select **Deploy from a branch** and choose `main` (or your active default branch) `/root` folder. Click **Save**.
4. GitHub will build and host your site at `https://your-github-username.github.io/your-repository-name/`.
5. Ensure this exact URL is added to:
   * Google Cloud Console **Authorized JavaScript Origins**
   * Vercel env variable `FRONTEND_URL`
   * The backend `.env` file `FRONTEND_URL`

---

## 🗄️ Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared Cluster.
2. Under **Database Access**, create a database user with password credentials.
3. Under **Network Access**, allow IP access (e.g. `0.0.0.0/32` to allow serverless Vercel endpoints to read/write).
4. Click **Connect**, select **Drivers**, and copy the connection string. Replace `<username>` and `<password>` and place it as `MONGODB_URI` inside your `.env` or Vercel configurations.
