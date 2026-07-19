/**
 * App Module - Main application manager, clock ticker, keyboard shortcuts, and custom Canvas Oscilloscope charting engine.
 */

const App = {
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(), // 0-11

    init() {
        const today = new Date();
        this.selectedYear = today.getFullYear();
        this.selectedMonth = today.getMonth();

        // Init modules
        window.Habits.init();
        window.Dashboard.init();
        window.Settings.init();
        window.SyncManager.init();

        this.bindEvents();
        this.startClock();
        this.updateMonthDisplay();
        this.renderAll();

        console.log("App Matrix initialized in single-page mode.");
    },

    bindEvents() {
        // Month switcher buttons
        document.getElementById('btn-matrix-prev-month').addEventListener('click', () => {
            this.selectedMonth--;
            if (this.selectedMonth < 0) {
                this.selectedMonth = 11;
                this.selectedYear--;
            }
            this.updateMonthDisplay();
            this.renderAll();
        });

        document.getElementById('btn-matrix-next-month').addEventListener('click', () => {
            this.selectedMonth++;
            if (this.selectedMonth > 11) {
                this.selectedMonth = 0;
                this.selectedYear++;
            }
            this.updateMonthDisplay();
            this.renderAll();
        });

        // Settings modal triggers
        document.getElementById('btn-settings-toggle').addEventListener('click', () => {
            this.openModal('settings-modal');
        });
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            this.closeModal('settings-modal');
        });

        // Routine modal close
        document.getElementById('btn-close-routine').addEventListener('click', () => {
            this.closeModal('routine-modal');
        });
        document.getElementById('btn-cancel-routine').addEventListener('click', () => {
            this.closeModal('routine-modal');
        });

        // Sync route change updates on window events
        window.addEventListener('habits-changed', () => {
            this.renderAll();
        });

        // Header logo clicks returns to routine tracker
        document.querySelector('.header-logo').style.cursor = 'pointer';
        document.querySelector('.header-logo').addEventListener('click', () => {
            this.toggleProfilesView(false);
        });

        // Toggle Profiles View click
        document.getElementById('btn-toggle-profiles').addEventListener('click', () => {
            this.toggleProfilesView();
        });

        // Refresh integrations
        document.getElementById('btn-refresh-profiles').addEventListener('click', () => {
            window.IntegrationManager.refreshAll();
        });

        // Back button in profiles
        document.getElementById('btn-back-to-matrix').addEventListener('click', () => {
            this.toggleProfilesView(false);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    },

    updateMonthDisplay() {
        const monthNames = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        const display = document.getElementById('matrix-month-display');
        if (display) {
            display.textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;
        }
    },

    toggleProfilesView(show = null) {
        const matrixView = document.querySelector('.dashboard-grid');
        const profilesView = document.getElementById('profiles-page');
        const btnToggle = document.getElementById('btn-toggle-profiles');
        
        const isShowing = show !== null ? show : (profilesView.style.display === 'none');

        if (isShowing) {
            matrixView.style.display = 'none';
            profilesView.style.display = 'flex';
            btnToggle.textContent = 'VIEW MATRIX';
            btnToggle.classList.add('btn-primary');
            btnToggle.classList.remove('btn-secondary');
            
            // Render integration stats
            window.IntegrationManager.loadAndRenderAll();
        } else {
            matrixView.style.display = 'flex';
            profilesView.style.display = 'none';
            btnToggle.textContent = 'MY PROFILES';
            btnToggle.classList.add('btn-secondary');
            btnToggle.classList.remove('btn-primary');
            
            // Re-render routines stats just in case
            this.renderAll();
        }
    },

    renderAll() {
        // Render matrix table spreadsheet
        window.Habits.renderMatrix();

        // Render dashboard statistics cards
        window.Dashboard.render();

        // Draw custom Canvas Oscilloscope chart
        this.drawOscilloscopeChart();
    },

    // -------------------------------------------------------------
    // Canvas Oscilloscope Chart (Custom Neon Line plot)
    // -------------------------------------------------------------
    drawOscilloscopeChart() {
        const canvas = document.getElementById('oscilloscope-canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Scale for high-DPI displays
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;

        const routines = Storage.getRoutines();
        const history = Storage.getHistory();
        
        const today = new Date();
        const year = this.selectedYear;
        const monthIndex = this.selectedMonth;
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();
        const monthStr = String(monthIndex + 1).padStart(2, '0');

        const actualYear = today.getFullYear();
        const actualMonth = today.getMonth();
        const todayDayNum = today.getDate();

        let daysToCount = 0;
        if (year < actualYear || (year === actualYear && monthIndex < actualMonth)) {
            daysToCount = totalDays; // Past month
        } else if (year === actualYear && monthIndex === actualMonth) {
            daysToCount = todayDayNum; // Current month
        } else {
            daysToCount = 0; // Future month
        }

        // Layout paddings
        const paddingLeft = 32 * dpr;
        const paddingRight = 10 * dpr;
        const paddingTop = 15 * dpr;
        const paddingBottom = 20 * dpr;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Colors based on theme (read dynamically from CSS variable tokens)
        const isLight = document.documentElement.classList.contains('light-theme');
        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent-color').trim() || '#00f0ff';
        const accentRGB = style.getPropertyValue('--accent-color-rgb').trim() || '0, 240, 255';
        const textStyle = style.getPropertyValue('--text-secondary').trim() || '#a0a0a0';
        
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : `rgba(${accentRGB}, 0.05)`;
        const oscColor = accentColor;
        const maxRoutines = Math.max(routines.length, 5);

        // 1. Draw Oscilloscope Grid lines (Horizontal/Vertical)
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 * dpr;
        
        // Vertical grid lines (divided into weeks)
        const verticalGridCount = 5;
        for (let i = 0; i <= verticalGridCount; i++) {
            const x = paddingLeft + (chartWidth / verticalGridCount) * i;
            ctx.beginPath();
            ctx.moveTo(x, paddingTop);
            ctx.lineTo(x, paddingTop + chartHeight);
            ctx.stroke();
        }

        // Horizontal grid lines (divided by routines max ceiling)
        const horizontalGridLines = 4;
        ctx.fillStyle = textStyle;
        ctx.font = `${8 * dpr}px 'Share Tech Mono', monospace`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= horizontalGridLines; i++) {
            const stepVal = Math.round((maxRoutines / horizontalGridLines) * i);
            const y = paddingTop + chartHeight - (stepVal / maxRoutines) * chartHeight;
            
            // Draw grid line
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - paddingRight, y);
            ctx.stroke();

            // Draw Y-axis labels
            ctx.fillText(String(stepVal), paddingLeft - 6 * dpr, y);
        }

        // Return early if no routines
        if (routines.length === 0) return;

        // 2. Gather completed counts per day of current month (1 to 31)
        const dataPoints = [];
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
            const dayHistory = history[dateStr] || {};
            
            let count = 0;
            routines.forEach(r => {
                if (dayHistory[r.id] === true) {
                    count++;
                }
            });

            // Calculate x, y coordinates
            const x = paddingLeft + ((day - 1) / (totalDays - 1)) * chartWidth;
            const y = paddingTop + chartHeight - (count / maxRoutines) * chartHeight;
            dataPoints.push({ x, y, day, count });
        }

        // 3. Draw Spline neon path with glow effect
        ctx.strokeStyle = oscColor;
        ctx.lineWidth = 2 * dpr;
        
        if (!isLight) {
            // Apply retro glow filter
            ctx.shadowColor = oscColor;
            ctx.shadowBlur = 8 * dpr;
        }

        ctx.beginPath();
        ctx.moveTo(dataPoints[0].x, dataPoints[0].y);

        // draw spline curve
        for (let i = 0; i < dataPoints.length - 1; i++) {
            const p0 = dataPoints[i];
            const p1 = dataPoints[i + 1];
            
            const cpX1 = p0.x + (p1.x - p0.x) / 2;
            const cpY1 = p0.y;
            const cpX2 = p0.x + (p1.x - p0.x) / 2;
            const cpY2 = p1.y;
            
            ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
        }
        ctx.stroke();

        // Remove glow effect for nodes/labels
        ctx.shadowBlur = 0;

        // 4. Draw node points
        ctx.fillStyle = oscColor;
        dataPoints.forEach((p, idx) => {
            // Only draw dots for past/current days and every 2nd node to save screen clutter
            if (p.day <= daysToCount && p.day % 2 !== 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3 * dpr, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        // 5. Draw X-axis label ticks
        ctx.fillStyle = textStyle;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Show weekly ticks e.g. "1st", "7th", "14th", "21st", "28th", "31st"
        const xTicks = [1, 7, 14, 21, 28, totalDays];
        xTicks.forEach(tickDay => {
            const x = paddingLeft + ((tickDay - 1) / (totalDays - 1)) * chartWidth;
            ctx.fillText(`${tickDay}d`, x, paddingTop + chartHeight + 4 * dpr);
        });
    },

    // -------------------------------------------------------------
    // Digital Clock
    // -------------------------------------------------------------
    startClock() {
        const timeEl = document.getElementById('ticker-time');
        const dateEl = document.getElementById('ticker-date');

        const ticker = () => {
            const now = new Date();
            
            // Format e.g. "12:35:10 PM"
            timeEl.textContent = now.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true 
            });

            // Format e.g. "SUNDAY, JULY 19, 2026"
            dateEl.textContent = now.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric',
                month: 'long', 
                day: 'numeric' 
            }).toUpperCase();
        };

        ticker();
        setInterval(ticker, 1000);
    },

    // -------------------------------------------------------------
    // Modal Helpers
    // -------------------------------------------------------------
    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    },

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.classList.remove('show');
        });
        const customConfirm = document.querySelector('.custom-confirm-modal-backdrop');
        if (customConfirm) customConfirm.remove();
    },

    // -------------------------------------------------------------
    // Keyboard Shortcuts
    // -------------------------------------------------------------
    handleKeyboardShortcuts(e) {
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            if (e.key === 'Escape') {
                this.closeAllModals();
                document.activeElement.blur();
            }
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                Storage.exportData();
            }
            return;
        }

        // N -> Add Routine modal
        if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            window.Habits.openRoutineModal();
        }

        // Ctrl + S -> Download backup
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            Storage.exportData();
        }

        // Esc -> Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Space -> Toggle first checkbox today
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            const todayColCheckboxes = document.querySelectorAll('.matrix-chk-cell.today .matrix-checkbox');
            if (todayColCheckboxes.length > 0) {
                // Toggles the first unchecked checkbox, or toggles first checkbox
                const unchecked = Array.from(todayColCheckboxes).find(chk => !chk.className.includes('checked-w'));
                if (unchecked) unchecked.click();
                else todayColCheckboxes[0].click();
            }
        }
    }
};

window.app = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
