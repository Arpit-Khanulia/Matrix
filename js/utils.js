/**
 * Utils Module - Helper functions for dates, audio, modals, notifications, and gamification.
 */

const Utils = {
    // -------------------------------------------------------------
    // Date Helpers
    // -------------------------------------------------------------
    
    /**
     * Get local date string in YYYY-MM-DD format
     */
    getTodayStr() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Parse date string YYYY-MM-DD into a local Date object
     */
    parseDateStr(str) {
        const parts = str.split('-');
        if (parts.length !== 3) return new Date();
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    },

    /**
     * Format date string to display format (e.g. "Sun, Jul 19, 2026")
     */
    formatDateStr(str, includeYear = true) {
        const date = this.parseDateStr(str);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        if (includeYear) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString(undefined, options);
    },

    /**
     * Get day of week name from date string (e.g. "Monday")
     */
    getDayOfWeekName(str) {
        const date = this.parseDateStr(str);
        return date.toLocaleDateString(undefined, { weekday: 'long' });
    },

    /**
     * Get relative date name ("Today", "Yesterday", or formatted date)
     */
    getRelativeDateName(str) {
        const today = this.getTodayStr();
        const yesterday = this.getOffsetDateStr(today, -1);
        if (str === today) return "Today";
        if (str === yesterday) return "Yesterday";
        return this.formatDateStr(str, false);
    },

    /**
     * Get date offset by N days from base date string
     */
    getOffsetDateStr(baseStr, offsetDays) {
        const date = this.parseDateStr(baseStr);
        date.setDate(date.getDate() + offsetDays);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Generate list of YYYY-MM-DD strings for the past N days, including today (descending or ascending)
     */
    getPastDates(daysCount, ascending = false) {
        const dates = [];
        const today = this.getTodayStr();
        for (let i = 0; i < daysCount; i++) {
            dates.push(this.getOffsetDateStr(today, -i));
        }
        return ascending ? dates.reverse() : dates;
    },

    /**
     * Check if a date string is in the future compared to today
     */
    isFutureDate(dateStr) {
        return dateStr > this.getTodayStr();
    },

    /**
     * Check if day of week index (0=Sunday, 6=Saturday) is a weekday (Mon-Fri)
     */
    isWeekday(dateStr) {
        const day = this.parseDateStr(dateStr).getDay();
        return day !== 0 && day !== 6;
    },

    /**
     * Check if day of week index is a weekend (Sat, Sun)
     */
    isWeekend(dateStr) {
        const day = this.parseDateStr(dateStr).getDay();
        return day === 0 || day === 6;
    },

    /**
     * Escape HTML special characters to prevent XSS injection
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Get a random vibrant retro theme color for subtopics/habits
     */
    getRandomVibrantColor() {
        const colors = [
            '#00f0ff', // Cyber Cyan
            '#ff007f', // Neon Pink
            '#00ff66', // Matrix Green
            '#ffb700', // Amber Yellow
            '#9d00ff', // Electric Purple
            '#0077ff', // Deep Blue
            '#ff4500', // Neon Orange
            '#7000ff'  // Violet
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Calculate goal (active days count) for a subtopic based on its Start Date and Due Date for a given month
     */
    calculateSubtopicGoal(sub, year, monthIndex) {
        if (!sub) return 0;
        const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        let count = 0;

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
            let isActive = true;
            if (sub.startDate && dateStr < sub.startDate) isActive = false;
            if (sub.dueDate && dateStr > sub.dueDate) isActive = false;

            if (isActive && Array.isArray(sub.repeatDays) && sub.repeatDays.length > 0 && sub.repeatDays.length < 7) {
                const dayOfWeek = new Date(year, monthIndex, day).getDay();
                if (!sub.repeatDays.includes(dayOfWeek) && !sub.repeatDays.includes(String(dayOfWeek))) {
                    isActive = false;
                }
            }

            if (isActive) count++;
        }

        return count;
    },

    // -------------------------------------------------------------
    // Gamification (XP & Leveling)
    // -------------------------------------------------------------
    
    /**
     * Calculate Level based on accumulated XP
     * Progression formula: Level = floor(sqrt(XP / 100)) + 1
     * Level 1: 0 - 99 XP
     * Level 2: 100 - 399 XP
     * Level 3: 400 - 899 XP
     * Level 4: 900 - 1599 XP
     * Level 5: 1600+ XP
     */
    calculateLevel(xp) {
        if (xp <= 0) return 1;
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    },

    /**
     * Calculate XP required for a specific level
     */
    xpRequiredForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100;
    },

    /**
     * Calculate completion percentage within current level range
     */
    getLevelProgress(xp) {
        const currentLevel = this.calculateLevel(xp);
        const nextLevel = currentLevel + 1;
        const currentLevelStartXP = this.xpRequiredForLevel(currentLevel);
        const nextLevelStartXP = this.xpRequiredForLevel(nextLevel);
        const totalXpInLevel = nextLevelStartXP - currentLevelStartXP;
        const xpEarnedInLevel = xp - currentLevelStartXP;
        return Math.min(100, Math.max(0, (xpEarnedInLevel / totalXpInLevel) * 100));
    },

    // XP constants
    XP_HABIT_COMPLETE: 15,
    XP_DAILY_COMPLETION_BONUS: 50,
    XP_MILESTONE_COMPLETE: 10,
    XP_GOAL_ACHIEVED: 100,
    XP_JOURNAL_SAVE: 25,

    // -------------------------------------------------------------
    // Web Audio API Synthesizer (Habit completion sounds)
    // -------------------------------------------------------------
    
    playSynthSound(type) {
        try {
            // Check if sounds are disabled in settings
            const settings = JSON.parse(localStorage.getItem('life_tracker_settings') || '{}');
            if (settings.soundEnabled === false) return;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            
            if (type === 'complete') {
                // Short bubbly upward chime for checking habit
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'uncomplete') {
                // Short sliding down tone for unchecking
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
                
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'level_up') {
                // Majestic, triumphant chord/arpeggio for leveling up
                const playBeep = (freq, startOffset, duration) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + startOffset);
                    g.gain.setValueAtTime(0.12, now + startOffset);
                    g.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
                    o.start(now + startOffset);
                    o.stop(now + startOffset + duration);
                };
                
                playBeep(523.25, 0.0, 0.3);   // C5
                playBeep(659.25, 0.1, 0.3);   // E5
                playBeep(783.99, 0.2, 0.3);   // G5
                playBeep(1046.50, 0.3, 0.6);  // C6
            } else if (type === 'fanfare') {
                // Triggered when completing ALL daily habits
                const playTone = (freq, time, duration) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(freq, now + time);
                    g.gain.setValueAtTime(0.15, now + time);
                    g.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
                    o.start(now + time);
                    o.stop(now + time + duration);
                };
                playTone(587.33, 0.0, 0.15); // D5
                playTone(587.33, 0.15, 0.15); // D5
                playTone(880.00, 0.3, 0.4); // A5
            }
        } catch (e) {
            console.error("Failed to play audio blip", e);
        }
    },

    // -------------------------------------------------------------
    // Toast Notification System
    // -------------------------------------------------------------
    
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '24px';
            container.style.right = '24px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-fade-in`;
        
        // Pick an icon based on type
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        if (type === 'achievement') icon = '🏆';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        // Style toast (can override in style.css)
        toast.style.background = 'var(--bg-card)';
        toast.style.color = 'var(--text-primary)';
        toast.style.padding = '12px 18px';
        toast.style.borderRadius = 'var(--radius-md)';
        toast.style.border = `1px solid ${type === 'success' ? 'var(--cat-finance)' : type === 'error' ? 'var(--cat-fitness)' : 'var(--border-color)'}`;
        toast.style.backdropFilter = 'var(--backdrop-blur)';
        toast.style.boxShadow = 'var(--glass-shadow)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.minWidth = '250px';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '500';
        toast.style.cursor = 'pointer';
        
        if (type === 'achievement') {
            toast.style.border = '1px solid var(--cat-career)';
            toast.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(20, 20, 25, 0.8))';
        }
        
        toast.addEventListener('click', () => {
            toast.remove();
        });
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut var(--transition-normal) forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    },

    // -------------------------------------------------------------
    // Custom Confirmation Dialog Modals
    // -------------------------------------------------------------
    
    confirm(title, message, callback) {
        // Create dynamic modal
        const modal = document.createElement('div');
        modal.className = 'custom-confirm-modal-backdrop';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.backdropFilter = 'blur(8px)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.animation = 'modalBackdropFade 0.25s forwards';

        const box = document.createElement('div');
        box.className = 'custom-confirm-box glass-card';
        box.style.width = '100%';
        box.style.maxWidth = '400px';
        box.style.padding = '24px';
        box.style.borderRadius = 'var(--radius-lg)';
        box.style.border = '1px solid var(--border-color)';
        box.style.backgroundColor = 'var(--bg-card)';
        box.style.boxShadow = 'var(--glass-shadow)';
        box.style.animation = 'modalContentShow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        box.innerHTML = `
            <h3 style="margin-top: 0; font-family: var(--font-heading); color: var(--text-primary); font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                ⚠️ ${title}
            </h3>
            <p style="color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; margin-bottom: 24px;">
                ${message}
            </p>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
                <button class="btn btn-danger" id="confirm-ok-btn" style="background: var(--cat-fitness); color: white; border: none;">Confirm</button>
            </div>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        const close = () => {
            box.style.animation = 'fadeOut 0.2s forwards';
            modal.style.animation = 'fadeOut 0.2s forwards';
            setTimeout(() => {
                modal.remove();
            }, 200);
        };

        modal.querySelector('#confirm-cancel-btn').addEventListener('click', () => {
            close();
        });

        modal.querySelector('#confirm-ok-btn').addEventListener('click', () => {
            callback();
            close();
        });

        // Close on esc
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    },

    // -------------------------------------------------------------
    // Confetti Animation (Canvas implementation)
    // -------------------------------------------------------------
    
    launchConfetti() {
        let canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'confetti-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, { passive: true });

        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
        const particles = [];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * -height - 20,
                r: Math.random() * 6 + 4,
                d: Math.random() * height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1
            });
        }

        let animationFrame;
        const startTime = Date.now();

        function draw() {
            ctx.clearRect(0, 0, width, height);

            let active = false;
            particles.forEach((p) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += p.speedY;
                p.x += p.speedX + Math.sin(p.tiltAngle) * 0.5;
                p.tilt = Math.sin(p.tiltAngle - (p.r / 2)) * 15;

                if (p.y < height) {
                    active = true;
                }

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
            });

            // Keep drawing for 4 seconds max
            if (active && Date.now() - startTime < 4000) {
                animationFrame = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, width, height);
                canvas.remove();
            }
        }

        draw();
    },

    /**
     * Render an emoji
     */
    renderEmoji(val) {
        return val || '⚡';
    }
};
window.Utils = Utils;
