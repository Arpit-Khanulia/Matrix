/**
 * Google Auth & MongoDB Cloud Sync Module - Handles Google Identity button, JWT cookie authentication, and MongoDB Atlas data syncing.
 */

const SyncManager = {
    // Dynamic configurations
    BACKEND_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://developer-dashboard-backend.vercel.app', // Replace with your actual deployed backend URL

    GOOGLE_CLIENT_ID: 'replace-with-your-google-client-id.apps.googleusercontent.com', // Replace with your actual Google Client ID

    user: null,

    init() {
        this.bindEvents();
        this.checkSession();
        
        // Permanent background sync listener (runs only when user is authenticated)
        window.addEventListener('habits-changed', () => {
            if (this.user) {
                this.autoPushSync();
            }
        });
    },

    bindEvents() {
        // Backup (Push) Trigger
        document.getElementById('btn-sync-push').addEventListener('click', () => {
            this.pushSync();
        });

        // Restore (Pull) Trigger
        document.getElementById('btn-sync-pull').addEventListener('click', () => {
            this.pullSync();
        });

        // Logout Trigger
        document.getElementById('btn-sync-logout').addEventListener('click', () => {
            this.logout();
        });

        // On settings modal load, ensure Google Sign-In renders if not logged in
        document.getElementById('btn-settings-toggle').addEventListener('click', () => {
            if (!this.user) {
                this.initializeGoogleSignIn();
            }
        });
    },

    // -------------------------------------------------------------
    // Google OAuth Identity Services
    // -------------------------------------------------------------
    initializeGoogleSignIn() {
        if (typeof google === 'undefined') {
            console.warn("Google Identity Services script is not loaded yet.");
            return;
        }

        try {
            google.accounts.id.initialize({
                client_id: this.GOOGLE_CLIENT_ID,
                callback: (response) => this.handleGoogleCredentialResponse(response),
                auto_select: false
            });

            google.accounts.id.renderButton(
                document.getElementById("google-signin-btn-container"),
                { 
                    theme: "outline", 
                    size: "medium", 
                    width: "250",
                    text: "signin_with",
                    shape: "rectangular"
                }
            );
        } catch (e) {
            console.error("Failed to initialize Google Sign-In Button:", e);
        }
    },

    async handleGoogleCredentialResponse(response) {
        Utils.showToast("Authenticating with Google...", "info");

        try {
            const authRes = await fetch(`${this.BACKEND_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // CRITICAL: Save the HttpOnly JWT Cookie cross-origin
                body: JSON.stringify({ credential: response.credential })
            });

            const result = await authRes.json();

            if (authRes.ok && result.success) {
                this.user = result.user;
                this.updateSyncUI();
                Utils.showToast(`Logged in as ${this.user.name.split(' ')[0]}!`, "success");
                
                // Automatically run sync pull and merge on first sign-in
                await this.pullSync(true);
            } else {
                throw new Error(result.error || "Authentication failed.");
            }
        } catch (e) {
            console.error("Sign-in verification error:", e);
            Utils.showToast(e.message || "Failed to authenticate.", "error");
        }
    },

    // -------------------------------------------------------------
    // Session checks
    // -------------------------------------------------------------
    async checkSession() {
        try {
            // Include credentials to send JWT cookie to backend cross-origin
            const res = await fetch(`${this.BACKEND_URL}/api/auth/me`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // CRITICAL: Send JWT Cookie for validation
            });

            if (res.ok) {
                const data = await res.json();
                if (data.loggedIn) {
                    this.user = data.user;
                    this.updateSyncUI();
                    console.log("Logged in session restored.");
                }
            } else {
                this.user = null;
                this.updateSyncUI();
            }
        } catch (e) {
            console.warn("No active server session found or server offline.");
            this.user = null;
            this.updateSyncUI();
        }
    },

    async logout() {
        try {
            const res = await fetch(`${this.BACKEND_URL}/api/auth/logout`, { 
                method: 'POST',
                credentials: 'include' // CRITICAL: Clear the JWT Cookie
            });
            if (res.ok) {
                this.user = null;
                this.updateSyncUI();
                Utils.showToast("Logged out from Cloud Backup.", "info");
                // Re-render sign in button
                setTimeout(() => this.initializeGoogleSignIn(), 100);
            }
        } catch (e) {
            Utils.showToast("Failed to logout safely.", "error");
        }
    },

    // -------------------------------------------------------------
    // Data Synchronizations (Push & Pull)
    // -------------------------------------------------------------
    async pushSync() {
        if (!this.user) return;
        Utils.showToast("Pushing local data to Cloud database...", "info");

        const routines = Storage.getRoutines();
        const history = Storage.getHistory();
        const xp = Storage.getXP();

        try {
            const res = await fetch(`${this.BACKEND_URL}/api/sync/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // CRITICAL: Transmit JWT Auth cookie
                body: JSON.stringify({ routines, history, xp })
            });

            if (res.ok) {
                Utils.showToast("Backup saved to MongoDB Atlas!", "success");
            } else {
                throw new Error("Failed to write sync backup.");
            }
        } catch (e) {
            Utils.showToast(e.message || "Failed to push backup.", "error");
        }
    },

    async autoPushSync() {
        if (!this.user) return;
        
        const routines = Storage.getRoutines();
        const history = Storage.getHistory();
        const xp = Storage.getXP();

        try {
            await fetch(`${this.BACKEND_URL}/api/sync/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // CRITICAL: Transmit JWT Auth cookie
                body: JSON.stringify({ routines, history, xp })
            });
            console.log("Cloud sync auto-updated.");
        } catch (e) {
            console.warn("Auto-backup failed (offline or server issues).");
        }
    },

    async pullSync(silent = false) {
        if (!this.user) return;
        if (!silent) Utils.showToast("Pulling remote data from Cloud...", "info");

        try {
            const res = await fetch(`${this.BACKEND_URL}/api/sync/pull`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // CRITICAL: Transmit JWT Auth cookie
            });

            if (res.ok) {
                const result = await res.json();
                if (result.data) {
                    this.mergeCloudData(result.data, silent);
                } else {
                    if (!silent) Utils.showToast("No cloud backups found. Creating initial backup.", "info");
                    // Auto push local data since cloud is empty
                    this.pushSync();
                }
            } else {
                throw new Error("Failed to read remote backup.");
            }
        } catch (e) {
            Utils.showToast(e.message || "Failed to pull backup.", "error");
        }
    },

    mergeCloudData(cloudData, silent) {
        // 1. Merge Habits List
        const localRoutines = Storage.getRoutines();
        const cloudRoutines = cloudData.routines || [];
        
        // If local is empty, populate from cloud. If both populated, merge based on ID matches
        let mergedRoutines = [...localRoutines];
        cloudRoutines.forEach(cr => {
            if (!mergedRoutines.some(lr => lr.id === cr.id)) {
                mergedRoutines.push(cr);
            }
        });

        if (mergedRoutines.length === 0) {
            mergedRoutines = cloudRoutines;
        }

        // 2. Merge History checkmarks (union of both checked dates)
        const localHistory = Storage.getHistory();
        const cloudHistory = cloudData.history || {};
        const mergedHistory = { ...localHistory };

        Object.keys(cloudHistory).forEach(dateStr => {
            if (!mergedHistory[dateStr]) {
                mergedHistory[dateStr] = cloudHistory[dateStr];
            } else {
                // Merge routine checkbox status within this day
                mergedHistory[dateStr] = { ...mergedHistory[dateStr], ...cloudHistory[dateStr] };
            }
        });

        // 3. Merge XP (take highest)
        const localXP = Storage.getXP();
        const cloudXP = cloudData.xp || 0;
        const mergedXP = Math.max(localXP, cloudXP);

        // Save back to Storage
        localStorage.setItem('habits_routines', JSON.stringify(mergedRoutines));
        localStorage.setItem('habits_history', JSON.stringify(mergedHistory));
        localStorage.setItem('habits_xp', String(mergedXP));

        // Re-render
        if (window.App) {
            window.App.renderAll();
        }

        if (!silent) {
            Utils.showToast("Cloud restore complete & merged successfully!", "success");
        }
    },

    // -------------------------------------------------------------
    // UI Helpers
    // -------------------------------------------------------------
    updateSyncUI() {
        const loggedOutPanel = document.getElementById('sync-logged-out-panel');
        const loggedInPanel = document.getElementById('sync-logged-in-panel');
        
        if (!loggedOutPanel || !loggedInPanel) return;

        if (this.user) {
            loggedOutPanel.style.display = 'none';
            loggedInPanel.style.display = 'flex';

            document.getElementById('sync-user-avatar').src = this.user.picture || 'https://assets.leetcode.com/users/default_avatar.jpg';
            document.getElementById('sync-user-name').textContent = this.user.name.toUpperCase();
            document.getElementById('sync-user-email').textContent = this.user.email;
        } else {
            loggedOutPanel.style.display = 'flex';
            loggedInPanel.style.display = 'none';
        }
    }
};

window.SyncManager = SyncManager;
