/**
 * Google Auth & MongoDB Cloud Sync Module - Handles Google Identity button, JWT cookie authentication, and MongoDB Atlas data syncing.
 */

const SyncManager = {
    BACKEND_URL: 'https://matrix-pied-two.vercel.app',

    GOOGLE_CLIENT_ID: '502481790383-13ai01cm7r5e5tldqa4to1699tgdiode.apps.googleusercontent.com', // Active Google Client ID

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

        // Header profile button click opens settings modal
        const headerProfile = document.getElementById('header-profile-btn');
        if (headerProfile) {
            headerProfile.addEventListener('click', () => {
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('show');
                }
            });
        }
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
                    size: "large", 
                    width: "400",
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
            await fetch(`${this.BACKEND_URL}/api/auth/logout`, { 
                method: 'POST',
                credentials: 'include' // Clear JWT cookie on backend
            });
        } catch (e) {
            console.warn("Backend logout request failed, clearing local session anyway.", e);
        }

        // Unconditionally wipe all local user data
        this.user = null;
        
        // Clear all LocalStorage data, stats, and connections
        localStorage.removeItem('retro_tracker_routines');
        localStorage.removeItem('retro_tracker_history');
        localStorage.removeItem('retro_tracker_xp');
        localStorage.removeItem('developer_usernames');
        
        // Clear all integration API response caches (GitHub, LeetCode, etc.)
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('integration_cache_')) {
                localStorage.removeItem(key);
            }
        });

        // Reset theme and settings to clean state defaults
        localStorage.setItem('retro_tracker_settings', JSON.stringify({
            theme: 'retro-cyan',
            soundEnabled: true
        }));

        Utils.showToast("Logged out safely. Local storage & caches cleared!", "success");

        // Reload the page to boot back up in a clean blank slate
        setTimeout(() => {
            window.location.reload();
        }, 1000);
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
        // Completely overwrite local data with cloud data (rejecting offline data in favor of account's data)
        const cloudRoutines = cloudData.routines || [];
        const cloudHistory = cloudData.history || {};
        const cloudXP = cloudData.xp || 0;

        // Save back to Storage using the correct retro_tracker_ keys
        localStorage.setItem('retro_tracker_routines', JSON.stringify(cloudRoutines));
        localStorage.setItem('retro_tracker_history', JSON.stringify(cloudHistory));
        localStorage.setItem('retro_tracker_xp', String(cloudXP));

        // Re-render
        if (window.app && typeof window.app.renderAll === 'function') {
            window.app.renderAll();
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

        // Keep the top right header profile avatar updated
        this.updateHeaderProfile();
    },

    updateHeaderProfile() {
        const profileBtn = document.getElementById('header-profile-btn');
        const profileAvatar = document.getElementById('header-profile-avatar');
        
        if (!profileBtn || !profileAvatar) return;

        if (this.user) {
            profileBtn.style.display = 'flex';
            
            // Default dummy avatar
            let avatarUrl = 'https://assets.leetcode.com/users/default_avatar.jpg';
            
            // Check if GitHub profile connection username is set in local storage
            if (window.IntegrationManager && typeof window.IntegrationManager.getUsernames === 'function') {
                const usernames = window.IntegrationManager.getUsernames();
                if (usernames && usernames.github) {
                    // Fetch direct GitHub avatar using their username profile shortcut
                    avatarUrl = `https://github.com/${usernames.github}.png`;
                } else if (this.user.picture) {
                    // Fallback to Google user avatar picture
                    avatarUrl = this.user.picture;
                }
            } else if (this.user.picture) {
                avatarUrl = this.user.picture;
            }

            profileAvatar.src = avatarUrl;
        } else {
            profileBtn.style.display = 'none';
        }
    }
};

window.SyncManager = SyncManager;
