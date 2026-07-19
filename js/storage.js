/**
 * Storage Module - LocalStorage data persistence, backup/restore, and default database seeding.
 */

const Storage = {
    // LocalStorage Keys
    KEYS: {
        ROUTINES: 'retro_tracker_routines',
        HISTORY: 'retro_tracker_history',
        SETTINGS: 'retro_tracker_settings',
        XP: 'retro_tracker_xp'
    },

    // -------------------------------------------------------------
    // Data Seed Templates (Matches SS)
    // -------------------------------------------------------------
    getSeedData() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');

        // We seed completions for past days of this month to draw curves immediately
        const historySeed = {};
        const todayDay = today.getDate();

        const routines = [
            { id: 'r1', name: 'No Porn', emoji: '🌿🚫', goal: 30, order: 0 },
            { id: 'r2', name: 'No Alcohol', emoji: '🍾🚫', goal: 30, order: 1 },
            { id: 'r3', name: 'Goal tracking', emoji: '📂', goal: 30, order: 2 },
            { id: 'r4', name: 'Budget tracking', emoji: '💰', goal: 30, order: 3 },
            { id: 'r5', name: 'Reading/Meditating', emoji: '📖', goal: 30, order: 4 },
            { id: 'r6', name: 'Time with God', emoji: '🧘‍♀️', goal: 30, order: 5 },
            { id: 'r7', name: 'Deep Work', emoji: '🎯', goal: 30, order: 6 },
            { id: 'r8', name: 'Cold Shower', emoji: '🚿', goal: 30, order: 7 }
        ];

        // Seed completion states for the last 15 days
        for (let day = 1; day <= 31; day++) {
            const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
            
            // Limit seeding to past/current days only
            if (day <= todayDay) {
                historySeed[dateStr] = {};
                // Seed random-like checks to make it look active
                routines.forEach((r, idx) => {
                    // high probability of check (e.g. 75%)
                    const isChecked = (day + idx) % 4 !== 0;
                    historySeed[dateStr][r.id] = isChecked;
                });
            }
        }

        return {
            routines,
            history: historySeed,
            settings: {
                theme: 'dark',
                soundEnabled: true
            },
            xp: 320
        };
    },

    /**
     * Initializes local storage with seed data if empty.
     */
    init() {
        if (!localStorage.getItem(this.KEYS.ROUTINES)) {
            const seed = this.getSeedData();
            localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify(seed.routines));
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(seed.history));
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(seed.settings));
            localStorage.setItem(this.KEYS.XP, JSON.stringify(seed.xp));
            console.log("Retro database seeded successfully.");
        } else {
            // Run automatic pixelarticon-to-emoji rollback migration
            try {
                const routines = this.getRoutines();
                let migrated = false;
                
                const urlMap = {
                    'https://unpkg.com/pixelarticons@latest/svg/ban.svg': '🚫',
                    'https://unpkg.com/pixelarticons@latest/svg/flag.svg': '🚩',
                    'https://unpkg.com/pixelarticons@latest/svg/coin.svg': '💰',
                    'https://unpkg.com/pixelarticons@latest/svg/book.svg': '📖',
                    'https://unpkg.com/pixelarticons@latest/svg/sun.svg': '☀️',
                    'https://unpkg.com/pixelarticons@latest/svg/target.svg': '🎯',
                    'https://unpkg.com/pixelarticons@latest/svg/water.svg': '💧',
                    'https://unpkg.com/pixelarticons@latest/svg/zap.svg': '⚡'
                };

                routines.forEach(r => {
                    if (r.emoji && (r.emoji.startsWith('http') || r.emoji.includes('notion.so') || r.emoji.includes('unpkg.com'))) {
                        r.emoji = urlMap[r.emoji] || '⚡';
                        migrated = true;
                    }
                });

                if (migrated) {
                    this.saveRoutines(routines);
                    console.log("Rolled back routines from URLs to standard text emojis.");
                }
            } catch (e) {
                console.error("Routine emoji rollback failed:", e);
            }
        }
    },

    // -------------------------------------------------------------
    // Routines CRUD reads/writes
    // -------------------------------------------------------------
    getRoutines() {
        return JSON.parse(localStorage.getItem(this.KEYS.ROUTINES) || '[]');
    },

    saveRoutines(routines) {
        localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify(routines));
    },

    // -------------------------------------------------------------
    // History reads/writes
    // -------------------------------------------------------------
    getHistory() {
        return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '{}');
    },

    saveHistory(history) {
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    },

    toggleRoutineCheck(dateStr, routineId) {
        const history = this.getHistory();
        if (!history[dateStr]) {
            history[dateStr] = {};
        }

        const isCompleted = !history[dateStr][routineId];
        history[dateStr][routineId] = isCompleted;
        this.saveHistory(history);

        // Adjust XP
        const xpAmount = isCompleted ? Utils.XP_HABIT_COMPLETE : -Utils.XP_HABIT_COMPLETE;
        this.addXP(xpAmount);
        
        // Audio feedback
        Utils.playSynthSound(isCompleted ? 'complete' : 'uncomplete');

        // Check overall day completion bonus
        if (isCompleted) {
            const routines = this.getRoutines();
            const completedCount = Object.keys(history[dateStr]).filter(id => history[dateStr][id] === true).length;
            if (routines.length > 0 && completedCount === routines.length) {
                // Trigger bonus
                this.addXP(Utils.XP_DAILY_COMPLETION_BONUS);
                Utils.playSynthSound('fanfare');
                Utils.launchConfetti();
                Utils.showToast("Perfect Daily Routine! +50 XP Bonus!", "success");
            }
        }

        return isCompleted;
    },

    // -------------------------------------------------------------
    // Settings reads/writes
    // -------------------------------------------------------------
    getSettings() {
        return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || '{}');
    },

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    // -------------------------------------------------------------
    // XP math
    // -------------------------------------------------------------
    getXP() {
        return parseInt(localStorage.getItem(this.KEYS.XP) || '0', 10);
    },

    saveXP(xp) {
        localStorage.setItem(this.KEYS.XP, String(xp));
    },

    addXP(amount) {
        const currentXP = this.getXP();
        const newXP = Math.max(0, currentXP + amount);
        const oldLevel = Utils.calculateLevel(currentXP);
        const newLevel = Utils.calculateLevel(newXP);

        this.saveXP(newXP);

        if (newLevel > oldLevel) {
            Utils.playSynthSound('level_up');
            Utils.launchConfetti();
            Utils.showToast(`LEVEL UP! You reached Level ${newLevel}! 🎉`, "achievement");
        }

        // Trigger global sync event
        window.dispatchEvent(new CustomEvent('xp-changed', { detail: { xp: newXP, level: newLevel } }));
    },

    // -------------------------------------------------------------
    // Export / Import / Wipe Operations
    // -------------------------------------------------------------
    exportData() {
        const data = {
            routines: this.getRoutines(),
            history: this.getHistory(),
            settings: this.getSettings(),
            xp: this.getXP(),
            exportedAt: new Date().toISOString()
        };
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `retro-matrix-backup-${Utils.getTodayStr()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        Utils.showToast("JSON backup downloaded successfully!", "success");
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.routines || !data.history) {
                throw new Error("Invalid backup format.");
            }
            localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify(data.routines));
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(data.history));
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings || {}));
            localStorage.setItem(this.KEYS.XP, JSON.stringify(data.xp || 0));

            Utils.showToast("Backup restored!", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            Utils.showToast("Failed to restore backup: " + e.message, "error");
        }
    },

    resetAllData() {
        // Set empty arrays/objects to prevent init() from auto-reseeding the default habits
        localStorage.setItem(this.KEYS.ROUTINES, JSON.stringify([]));
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify({}));
        localStorage.setItem(this.KEYS.XP, '0');
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
            theme: 'retro-cyan',
            soundEnabled: true
        }));
        
        Utils.showToast("Wiped system memory. Re-initializing...", "info");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
};

Storage.init();
window.Storage = Storage;
