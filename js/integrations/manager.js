/**
 * Integration Manager Module - Orchestrates registry, caching, offline checks, and discovers developers' profiles.
 */

const IntegrationManager = {
    registry: {},
    cacheDuration: 60 * 60 * 1000, // 1 hour in ms

    // Available integrations metadata
    metadata: {
        github: { title: "GitHub", icon: "🐙", color: "#22c55e" },
        leetcode: { title: "LeetCode", icon: "💡", color: "#f59e0b" },
        codeforces: { title: "Codeforces", icon: "🏆", color: "#3b82f6" },
        codechef: { title: "CodeChef", icon: "🍳", color: "#a855f7" },
        geeksforgeeks: { title: "GeeksforGeeks", icon: "💻", color: "#0f766e" },
        hackerrank: { title: "HackerRank", icon: "⭐", color: "#10b981" },
        atcoder: { title: "AtCoder", icon: "🇯🇵", color: "#ef4444" },
        steam: { title: "Steam", icon: "🎮", color: "#0284c7" },
        spotify: { title: "Spotify", icon: "🎵", color: "#1db954" },
        googlecalendar: { title: "Google Calendar", icon: "📅", color: "#ea4335" },
        weather: { title: "Weather Info", icon: "☀️", color: "#eab308" },
        googlefit: { title: "Google Fit", icon: "🏃‍♂️", color: "#ef4444" }
    },

    register(name, module) {
        this.registry[name] = module;
        console.log(`Integration discovered and registered: ${name}`);
    },

    getUsernames() {
        return JSON.parse(localStorage.getItem('developer_usernames') || '{}');
    },

    saveUsernames(usernames) {
        localStorage.setItem('developer_usernames', JSON.stringify(usernames));
    },

    // -------------------------------------------------------------
    // Cache Helpers
    // -------------------------------------------------------------
    getCache(name) {
        const cacheStr = localStorage.getItem(`integration_cache_${name}`);
        if (!cacheStr) return null;
        try {
            return JSON.parse(cacheStr);
        } catch (e) {
            return null;
        }
    },

    saveCache(name, data) {
        const cacheObj = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(`integration_cache_${name}`, JSON.stringify(cacheObj));
    },

    isCacheValid(cacheObj) {
        if (!cacheObj || !cacheObj.timestamp) return false;
        return (Date.now() - cacheObj.timestamp) < this.cacheDuration;
    },

    isOnline() {
        return navigator.onLine;
    },

    // -------------------------------------------------------------
    // Global Integration Workflows
    // -------------------------------------------------------------
    async loadAndRenderAll() {
        const usernames = this.getUsernames();
        const connectionBadge = document.getElementById('profiles-connection-badge');
        
        // Render online/offline status banner
        if (connectionBadge) {
            const online = this.isOnline();
            connectionBadge.textContent = online ? "ONLINE" : "OFFLINE";
            connectionBadge.className = online ? "connection-badge online" : "connection-badge offline";
        }

        // Render placeholders for all configured keys
        const container = document.getElementById('developer-profiles-grid');
        if (!container) return;

        // Draw skeletons/containers for all known keys
        container.innerHTML = '';
        
        Object.keys(this.metadata).forEach(key => {
            const cardWrap = document.createElement('div');
            cardWrap.id = `integration-card-${key}`;
            cardWrap.className = `retro-card glass-card integration-profile-card card-${key}`;
            container.appendChild(cardWrap);

            const meta = this.metadata[key];
            const mod = this.registry[key];
            const username = usernames[key];

            if (mod && username) {
                // Connected integration
                this.handleIntegrationLoad(key, mod, username);
            } else {
                // Placeholder/Unconnected module
                this.renderPlaceholderCard(key, meta, username);
            }
        });
    },

    async handleIntegrationLoad(key, module, username) {
        const containerId = `integration-card-${key}`;
        const container = document.getElementById(containerId);
        if (!container) return;

        const cache = this.getCache(key);
        const online = this.isOnline();

        if (cache) {
            // Display cached data immediately
            module.renderCard(container, cache.data);

            if (this.isCacheValid(cache) || !online) {
                // Cache is still fresh, or user is offline
                if (!online) {
                    this.addOfflineIndicator(container);
                }
                return;
            }
        }

        // Cache expired and user is online -> refresh in background
        this.showLoadingSpinner(container);
        try {
            const data = await module.fetchData(username);
            if (data && !data.error) {
                this.saveCache(key, data);
                module.renderCard(container, data);
            } else {
                this.renderErrorCard(container, key, data?.error || "User not found");
            }
        } catch (e) {
            console.error(`Failed background refresh for ${key}`, e);
            if (cache) {
                // Fallback to cache on error
                module.renderCard(container, cache.data);
                this.addWarningBanner(container, "Unable to refresh right now. Showing cached data.");
            } else {
                this.renderErrorCard(container, key, "Connection failed");
            }
        }
    },

    async refreshAll() {
        const usernames = this.getUsernames();
        const promises = [];

        Object.keys(this.registry).forEach(key => {
            const username = usernames[key];
            const mod = this.registry[key];
            if (username && mod) {
                const container = document.getElementById(`integration-card-${key}`);
                if (container) {
                    this.showLoadingSpinner(container);
                    promises.push(
                        mod.fetchData(username).then(data => {
                            if (data && !data.error) {
                                this.saveCache(key, data);
                                mod.renderCard(container, data);
                            } else {
                                this.renderErrorCard(container, key, data?.error || "User not found");
                            }
                        }).catch(err => {
                            console.error(`Refresh error for ${key}`, err);
                            const cache = this.getCache(key);
                            if (cache) {
                                mod.renderCard(container, cache.data);
                                this.addWarningBanner(container, "Unable to refresh right now. Showing cached data.");
                            } else {
                                this.renderErrorCard(container, key, "Refresh failed");
                            }
                        })
                    );
                }
            }
        });

        await Promise.all(promises);
        Utils.showToast("Developer profiles refreshed!", "success");
    },

    // -------------------------------------------------------------
    // UI Templates for integrations states
    // -------------------------------------------------------------
    renderPlaceholderCard(key, meta, username) {
        const container = document.getElementById(`integration-card-${key}`);
        if (!container) return;

        const isDiscovered = this.registry[key] !== undefined;

        container.innerHTML = `
            <div class="integration-placeholder-state" style="text-align: center; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; gap: 8px;">
                <span style="font-size: 2.2rem; filter: grayscale(1);">${meta.icon}</span>
                <h3 style="font-size: 0.95rem; font-weight: bold; letter-spacing: 0.5px;">${meta.title.toUpperCase()}</h3>
                <span class="badge" style="border: 1px dashed var(--text-muted); color: var(--text-muted); font-size: 0.65rem;">
                    ${isDiscovered ? 'AVAILABLE' : 'STANDBY'}
                </span>
                <p style="font-size: 0.72rem; color: var(--text-muted); max-width: 250px; line-height: 1.3; margin-top: 4px;">
                    ${isDiscovered 
                        ? `Integrate your ${meta.title} profile in system settings to track stats.` 
                        : `Dynamic architecture placeholder loaded. Standby for release updates.`}
                </p>
            </div>
        `;
    },

    showLoadingSpinner(container) {
        // Keep header if present to avoid screen jumping
        const cardTitle = container.querySelector('.card-title')?.outerHTML || '';
        container.innerHTML = `
            ${cardTitle}
            <div class="integration-loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; gap: 10px; flex-grow: 1;">
                <div class="loading-spinner"></div>
                <span style="font-size: 0.75rem; color: var(--accent-color); font-weight: bold; letter-spacing: 1px; animation: pulseGlow 1s infinite alternate;">REFRESHING DATA...</span>
            </div>
        `;
    },

    renderErrorCard(container, key, message) {
        const meta = this.metadata[key];
        container.innerHTML = `
            <h2 class="card-title">${meta.title.toUpperCase()} INTEGRATION</h2>
            <div class="integration-error-state" style="text-align: center; padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <span style="font-size: 2rem;">⚠️</span>
                <strong style="color: var(--cat-fitness); font-size: 0.85rem;">ERROR: ${message.toUpperCase()}</strong>
                <p style="font-size: 0.72rem; color: var(--text-secondary); max-width: 280px;">
                    Verify credentials in Settings. If rate limits are reached, stats will auto-recover later.
                </p>
            </div>
        `;
    },

    addOfflineIndicator(container) {
        const header = container.querySelector('.card-title');
        if (header && !container.querySelector('.offline-badge-inline')) {
            const badge = document.createElement('span');
            badge.className = 'offline-badge-inline';
            badge.textContent = 'OFFLINE';
            badge.style.cssText = 'float: right; font-size: 0.65rem; border: 1px solid var(--text-muted); color: var(--text-muted); padding: 1px 6px; font-weight: bold;';
            header.appendChild(badge);
        }
    },

    addWarningBanner(container, text) {
        if (container.querySelector('.integration-warning-banner')) return;
        const banner = document.createElement('div');
        banner.className = 'integration-warning-banner';
        banner.textContent = text;
        banner.style.cssText = 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 8px; font-size: 0.7rem; font-weight: bold; text-align: center; border-radius: var(--radius-sm); margin-bottom: 10px;';
        // insert before body contents
        const title = container.querySelector('.card-title');
        if (title) title.after(banner);
        else container.prepend(banner);
    }
};

window.IntegrationManager = IntegrationManager;
