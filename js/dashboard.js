/**
 * Dashboard Module - Monthly overview calculations, progress bars, analysis summaries, and routine streaks.
 */

const Dashboard = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Sync triggers
        window.addEventListener('habits-changed', () => {
            this.render();
        });

        // XP change updates
        window.addEventListener('xp-changed', (e) => {
            this.updateXPViews(e.detail.xp, e.detail.level);
        });
    },

    render() {
        let routines = Storage.getRoutines();
        const history = Storage.getHistory();
        const today = new Date();
        const year = window.app ? window.app.selectedYear : today.getFullYear();
        const monthIndex = window.app ? window.app.selectedMonth : today.getMonth();
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();

        // Check if viewing subtopics for a specific routine
        const isSubtopicsView = window.Habits && window.Habits.currentSubtopicRoutineId;
        let activeSubtopicRoutine = null;

        if (isSubtopicsView) {
            activeSubtopicRoutine = window.Habits.getCurrentSubtopicRoutine();
            if (activeSubtopicRoutine) {
                routines = activeSubtopicRoutine.subcategories || [];
            }
        }

        // Update card title headers dynamically
        const titleOverview = document.getElementById('card-title-overview');
        const titleAnalysis = document.getElementById('card-title-analysis');
        const titlePerformance = document.getElementById('card-title-performance');

        if (isSubtopicsView && activeSubtopicRoutine) {
            const prefix = `${Utils.renderEmoji(activeSubtopicRoutine.emoji)} ${Utils.escapeHtml(activeSubtopicRoutine.name).toUpperCase()}`;
            if (titleOverview) titleOverview.innerHTML = `${prefix} OVERVIEW`;
            if (titleAnalysis) titleAnalysis.innerHTML = `${prefix} ANALYSIS`;
            if (titlePerformance) titlePerformance.innerHTML = `${prefix} SUB ROUTINE PERFORMANCE`;
        } else {
            if (titleOverview) titleOverview.textContent = "MONTHLY OVERVIEW";
            if (titleAnalysis) titleAnalysis.textContent = "OVERVIEW / ANALYSIS";
            if (titlePerformance) titlePerformance.textContent = "ROUTINE PERFORMANCE";
        }
        
        const actualYear = today.getFullYear();
        const actualMonth = today.getMonth();
        const todayDayNum = today.getDate();

        let daysToCount = 0;
        if (year < actualYear || (year === actualYear && monthIndex < actualMonth)) {
            daysToCount = totalDays; // Past month: evaluate all days
        } else if (year === actualYear && monthIndex === actualMonth) {
            daysToCount = todayDayNum; // Current month: evaluate up to today
        } else {
            daysToCount = 0; // Future month: evaluate 0
        }
        
        // Month string
        const monthStr = String(monthIndex + 1).padStart(2, '0');

        // -------------------------------------------------------------
        // 1. Calculate Monthly Overview Stats
        // -------------------------------------------------------------
        let totalScheduledTicks = 0;
        let totalCompletedTicks = 0;

        // We count metrics up to today's day of the month
        for (let day = 1; day <= daysToCount; day++) {
            const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
            routines.forEach(r => {
                let isActiveDay = true;
                if (r.startDate && dateStr < r.startDate) isActiveDay = false;
                if (r.dueDate && dateStr > r.dueDate) isActiveDay = false;

                if (isActiveDay) {
                    totalScheduledTicks++;
                    if (history[dateStr]?.[r.id] === true) {
                        totalCompletedTicks++;
                    }
                }
            });
        }

        const consistencyRate = totalScheduledTicks > 0 ? Math.round((totalCompletedTicks / totalScheduledTicks) * 100) : 0;
        
        // Render large percentage
        document.getElementById('overview-rate').textContent = `${consistencyRate}%`;

        // Render progress bar ratio (days elapsed in month)
        const monthProgressPct = Math.round((daysToCount / totalDays) * 100);
        document.getElementById('bar-days-ratio').textContent = `${daysToCount}/${totalDays} days`;
        document.getElementById('bar-month-progress').style.width = `${monthProgressPct}%`;

        // Load XP details
        const currentXP = Storage.getXP();
        const currentLevel = Utils.calculateLevel(currentXP);
        this.updateXPViews(currentXP, currentLevel);

        // -------------------------------------------------------------
        // 2. Overview / Analysis Counts
        // -------------------------------------------------------------
        let doneCount = 0;
        let goalCount = 0;

        // Sum goals
        routines.forEach(r => {
            if (isSubtopicsView) {
                goalCount += Utils.calculateSubtopicGoal(r, year, monthIndex);
            } else {
                goalCount += r.goal || 30;
            }
        });

        // Sum done checks across the full month so far
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
            const dayHistory = history[dateStr] || {};
            routines.forEach(r => {
                if (dayHistory[r.id] === true) {
                    doneCount++;
                }
            });
        }

        const openCount = Math.max(0, goalCount - doneCount);

        document.getElementById('an-done-val').textContent = doneCount;
        document.getElementById('an-goal-val').textContent = goalCount;
        document.getElementById('an-open-val').textContent = openCount;

        // -------------------------------------------------------------
        // 3. Routines Streaks Summary List
        // -------------------------------------------------------------
        this.renderStreaksList(routines, history);
    },

    renderStreaksList(routines, history) {
        const container = document.getElementById('streaks-list-container');
        container.innerHTML = '';

        if (routines.length === 0) {
            container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.75rem;">No active routine streaks.</div>`;
            return;
        }

        routines.forEach(routine => {
            const streak = this.calculateStreakForRoutine(routine.id, history);
            
            const item = document.createElement('div');
            item.className = 'streak-summary-item';
            item.innerHTML = `
                <span style="font-weight: 600;"><span style="margin-right: 4px;">${routine.emoji}</span>${routine.name}</span>
                <span style="color: var(--color-week-2); font-weight: bold;">${streak.current}d streak <span style="color: var(--text-muted); font-weight: normal; font-size: 0.7rem;">(max: ${streak.longest}d)</span></span>
            `;
            container.appendChild(item);
        });
    },

    calculateStreakForRoutine(routineId, history) {
        const today = new Date();
        const year = today.getFullYear();
        const monthIndex = today.getMonth();
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        const todayDayNum = today.getDate();
        
        let currentStreak = 0;
        let longestStreak = 0;
        let runningStreak = 0;

        // Loop backwards starting yesterday or today
        // If today is completed, start from today. If not, start from yesterday.
        const todayDateStr = `${year}-${monthStr}-${String(todayDayNum).padStart(2, '0')}`;
        const todayCompleted = history[todayDateStr]?.[routineId] === true;
        
        let checkDate = today;
        let isStreakBroken = false;

        // We check past 45 days to compute longest streaks
        for (let i = 0; i < 45; i++) {
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            const completed = history[dateStr]?.[routineId] === true;

            if (completed) {
                runningStreak++;
                if (!isStreakBroken) {
                    currentStreak++;
                }
            } else {
                // If it is today and not completed yet, we do NOT break current streak, but we check yesterday
                if (i === 0 && !todayCompleted) {
                    // ignore today, look at yesterday for current
                } else {
                    isStreakBroken = true;
                    if (runningStreak > longestStreak) {
                        longestStreak = runningStreak;
                    }
                    runningStreak = 0;
                }
            }
            
            // Move back 1 day
            checkDate.setDate(checkDate.getDate() - 1);
        }

        if (runningStreak > longestStreak) {
            longestStreak = runningStreak;
        }

        return { current: currentStreak, longest: longestStreak };
    },

    updateXPViews(xp, level) {
        // Sidebar level
        const sideLvl = document.getElementById('sidebar-level-val');
        const sideXP = document.getElementById('sidebar-xp-val');
        const sideFill = document.getElementById('sidebar-xp-progress');

        // Dashboard overview level/xp
        const mainLvl = document.getElementById('overview-level');
        const mainXP = document.getElementById('overview-xp');

        if (sideLvl) sideLvl.textContent = level;
        if (sideXP) sideXP.textContent = xp;
        if (sideFill) {
            sideFill.style.width = `${Utils.getLevelProgress(xp)}%`;
        }

        if (mainLvl) mainLvl.textContent = level;
        if (mainXP) mainXP.textContent = `${xp} / ${Utils.xpRequiredForLevel(level + 1)}`;
    }
};

window.Dashboard = Dashboard;
