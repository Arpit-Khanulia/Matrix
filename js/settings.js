/**
 * Settings Module - Theme toggling, sound feedback, backup restorations, and developer profile connection managers.
 */

const Settings = {
    init() {
        this.loadSettings();
        this.bindEvents();
    },

    bindEvents() {
        // Theme Selection Dropdown
        const themeSelect = document.getElementById('settings-theme-select');
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            const settings = Storage.getSettings();
            settings.theme = theme;
            Storage.saveSettings(settings);
            
            this.applyThemeClass(theme);
            Utils.showToast(`Applied ${theme.replace('-', ' ').toUpperCase()} theme.`, 'info');
            
            // Fire settings change event to redraw charts
            window.dispatchEvent(new CustomEvent('theme-changed'));
            window.dispatchEvent(new CustomEvent('habits-changed'));
        });

        // Audio feedback switch
        const soundSwitch = document.getElementById('settings-sound-enabled');
        soundSwitch.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.soundEnabled = e.target.checked;
            Storage.saveSettings(settings);
            
            Utils.showToast(e.target.checked ? "Audio feedback enabled!" : "Audio feedback muted.", "info");
        });

        // Backups export
        document.getElementById('btn-export-backup').addEventListener('click', () => {
            Storage.exportData();
        });

        // Backups import file trigger
        const importTrigger = document.getElementById('btn-import-trigger');
        const importFile = document.getElementById('import-file');
        
        importTrigger.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const jsonStr = evt.target.result;
                Storage.importData(jsonStr);
            };
            reader.readAsText(file);
        });

        // Save Developer Connections Click
        document.getElementById('btn-save-connections').addEventListener('click', () => {
            const github = document.getElementById('settings-github-username').value.trim();
            const leetcode = document.getElementById('settings-leetcode-username').value.trim();

            const usernames = IntegrationManager.getUsernames();
            usernames.github = github;
            usernames.leetcode = leetcode;
            IntegrationManager.saveUsernames(usernames);

            Utils.showToast("Developer profile connections saved!", "success");

            // Refresh top-right header avatar immediately if logged in
            if (window.SyncManager && typeof window.SyncManager.updateHeaderProfile === 'function') {
                window.SyncManager.updateHeaderProfile();
            }

            // Re-render profiles dashboard if currently active
            if (document.getElementById('profiles-page').style.display !== 'none') {
                IntegrationManager.loadAndRenderAll();
            }
        });

        // Test Developer Connections Click
        document.getElementById('btn-test-connections').addEventListener('click', async () => {
            const github = document.getElementById('settings-github-username').value.trim();
            const leetcode = document.getElementById('settings-leetcode-username').value.trim();

            if (!github && !leetcode) {
                Utils.showToast("Please enter a username to test first.", "warning");
                return;
            }

            Utils.showToast("Running connection diagnostics...", "info");

            let githubStatus = "Not Configured";
            if (github) {
                try {
                    const res = await fetch(`https://api.github.com/users/${github}`);
                    githubStatus = res.ok ? "Connected (OK) ✅" : `Failed (Not Found) ❌`;
                } catch (e) {
                    githubStatus = "Error (Network Failed) ⚠️";
                }
            }

            let leetcodeStatus = "Not Configured";
            if (leetcode) {
                try {
                    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${leetcode}`);
                    if (res.ok) {
                        const json = await res.json();
                        leetcodeStatus = (!json.errors && json.message !== "User does not exist") ? "Connected (OK) ✅" : "Failed (Not Found) ❌";
                    } else {
                        leetcodeStatus = "Failed (Status Error) ❌";
                    }
                } catch (e) {
                    leetcodeStatus = "Error (Network Failed) ⚠️";
                }
            }

            Utils.confirm(
                "Connection Diagnosis Report",
                `GitHub: ${githubStatus}\nLeetCode: ${leetcodeStatus}\n\nClick Confirm to save these values.`,
                () => {
                    document.getElementById('btn-save-connections').click();
                }
            );
        });

        // Wipe Database Wipe
        document.getElementById('btn-wipe-db').addEventListener('click', () => {
            Utils.confirm(
                "Reset System Database", 
                "Warning: This will delete ALL routines, goals, and completion history. Your levels and XP will be set back to zero. This cannot be undone.", 
                () => {
                    Storage.resetAllData();
                }
            );
        });
    },

    loadSettings() {
        const settings = Storage.getSettings();

        // 1. Hydrate and Apply Theme Selection
        let theme = settings.theme || 'retro-cyan';
        // Handle backward compatibility for old 'dark'/'light' values
        if (theme === 'dark') theme = 'retro-cyan';
        if (theme === 'light') theme = 'light-paper';

        const themeSelect = document.getElementById('settings-theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        this.applyThemeClass(theme);

        // 2. Sound Switch Configuration
        const soundSwitch = document.getElementById('settings-sound-enabled');
        if (soundSwitch) {
            soundSwitch.checked = settings.soundEnabled !== false;
        }

        // 3. Hydrate Developer Profiles usernames
        const usernames = IntegrationManager.getUsernames();
        document.getElementById('settings-github-username').value = usernames.github || '';
        document.getElementById('settings-leetcode-username').value = usernames.leetcode || '';
    },

    applyThemeClass(theme) {
        const root = document.documentElement;
        // Clean old classes
        root.classList.remove(
            'theme-retro-cyan', 
            'theme-light-paper', 
            'theme-matrix-green', 
            'theme-terminal-amber', 
            'theme-modern-minimal',
            'light-theme'
        );
        
        // Add new class
        root.classList.add(`theme-${theme}`);
        
        // Backward compatible class hook for light styles in style.css
        if (theme === 'light-paper') {
            root.classList.add('light-theme');
        }
    }
};

window.Settings = Settings;
