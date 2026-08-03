/**
 * Habits Module - Grid matrix routines generator, table rendering, week color grouping, and CRUD forms.
 */

const Habits = {
    draggedIdx: null,

    init() {
        this.bindEvents();
        this.initEmojiPicker();
        this.initDatePickerPopups();
    },

    initDatePickerPopups() {
        setTimeout(() => {
            const bindPopup = (id) => {
                const el = document.getElementById(id);
                if (el) {
                    const trigger = (e) => {
                        if (typeof el.showPicker === 'function') {
                            try { el.showPicker(); } catch(err){}
                        }
                    };
                    el.addEventListener('click', trigger);
                    el.addEventListener('focus', trigger);
                }
            };

            bindPopup('subtopic-start-date');
            bindPopup('subtopic-due-date');
            bindPopup('new-sub-start-date');
            bindPopup('new-sub-due-date');
        }, 50);
    },

    bindEvents() {
        // Modal buttons
        document.getElementById('btn-add-routine').addEventListener('click', () => {
            if (this.currentSubtopicRoutineId) {
                this.openSubtopicModal(null, this.currentSubtopicRoutineId);
            } else {
                this.openRoutineModal();
            }
        });

        document.getElementById('btn-close-routine').addEventListener('click', () => this.closeRoutineModal());
        document.getElementById('btn-cancel-routine').addEventListener('click', () => this.closeRoutineModal());

        // Form submit
        document.getElementById('routine-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Delete routine
        document.getElementById('btn-delete-routine').addEventListener('click', () => this.handleDeleteRoutine());

        // JSON / AI Import Modal events
        const toggleBtn = document.getElementById('btn-json-import-toggle');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.openJsonImportModal());

        const settingsToggleBtn = document.getElementById('btn-json-import-settings');
        if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', () => this.openJsonImportModal());

        const closeBtn = document.getElementById('btn-close-json-import');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeJsonImportModal());

        const cancelBtn = document.getElementById('btn-cancel-json-import');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeJsonImportModal());

        const submitBtn = document.getElementById('btn-submit-json-import');
        if (submitBtn) submitBtn.addEventListener('click', () => this.handleJsonImportSubmit());

        const copyPromptBtn = document.getElementById('btn-copy-llm-prompt');
        if (copyPromptBtn) copyPromptBtn.addEventListener('click', () => this.copyLlmPrompt());

        const addSubBtn = document.getElementById('btn-add-subtopic');
        if (addSubBtn) addSubBtn.addEventListener('click', () => this.handleAddSubtopic());

        // Subtopic Dedicated View & Modal events
        const backBtn = document.getElementById('btn-back-to-matrix');
        if (backBtn) backBtn.addEventListener('click', () => this.closeSubtopicView());

        const editCurrentGroupBtn = document.getElementById('btn-edit-current-routine');
        if (editCurrentGroupBtn) editCurrentGroupBtn.addEventListener('click', () => {
            const r = this.getCurrentSubtopicRoutine();
            if (r) this.openRoutineModal(r);
        });

        const addSubSidebarBtn = document.getElementById('btn-add-subtopic-sidebar');
        if (addSubSidebarBtn) addSubSidebarBtn.addEventListener('click', () => {
            if (this.currentSubtopicRoutineId) {
                this.openSubtopicModal(null, this.currentSubtopicRoutineId);
            }
        });

        const closeSubtopicModalBtn = document.getElementById('btn-close-subtopic');
        if (closeSubtopicModalBtn) closeSubtopicModalBtn.addEventListener('click', () => this.closeSubtopicModal());

        const cancelSubtopicModalBtn = document.getElementById('btn-cancel-subtopic');
        if (cancelSubtopicModalBtn) cancelSubtopicModalBtn.addEventListener('click', () => this.closeSubtopicModal());

        const subtopicForm = document.getElementById('subtopic-form');
        if (subtopicForm) subtopicForm.addEventListener('submit', (e) => this.handleSubtopicFormSubmit(e));

        const delSubModalBtn = document.getElementById('btn-delete-subtopic-modal');
        if (delSubModalBtn) delSubModalBtn.addEventListener('click', () => this.handleDeleteSubtopicModal());

        // Subtopic View Month Selector
        const subPrevMonth = document.getElementById('btn-sub-prev-month');
        if (subPrevMonth) subPrevMonth.addEventListener('click', () => {
            if (window.app) {
                let m = window.app.selectedMonth - 1;
                let y = window.app.selectedYear;
                if (m < 0) { m = 11; y--; }
                window.app.selectedMonth = m;
                window.app.selectedYear = y;
                this.renderSubtopicView();
            }
        });

        const subNextMonth = document.getElementById('btn-sub-next-month');
        if (subNextMonth) subNextMonth.addEventListener('click', () => {
            if (window.app) {
                let m = window.app.selectedMonth + 1;
                let y = window.app.selectedYear;
                if (m > 11) { m = 0; y++; }
                window.app.selectedMonth = m;
                window.app.selectedYear = y;
                this.renderSubtopicView();
            }
        });
    },

    initEmojiPicker() {
        const toggleBtn = document.getElementById('btn-emoji-picker-toggle');
        const pickerPanel = document.getElementById('routine-emoji-picker-panel');
        const emojiGrid = document.getElementById('emoji-picker-grid');
        const emojiInput = document.getElementById('routine-emoji');
        const searchInput = document.getElementById('emoji-search-input');

        if (!toggleBtn || !pickerPanel || !emojiGrid || !emojiInput || !searchInput) return;

        const defaultEmojis = [
            // Habits / Health
            { emoji: '🌿', name: 'green plant leaf nature' },
            { emoji: '🚫', name: 'no block stop restricted' },
            { emoji: '🍇', name: 'grape fruit food' },
            { emoji: '🍎', name: 'apple red fruit food' },
            { emoji: '🥗', name: 'salad healthy vegetable food' },
            { emoji: '☕', name: 'coffee caffeine morning beverage drink' },
            { emoji: '🍵', name: 'tea green matcha drink' },
            { emoji: '💧', name: 'water hydration drink drop sweat' },
            { emoji: '🚿', name: 'shower wash clean bathroom cold shower' },
            { emoji: '💊', name: 'pill medicine vitamin health drug' },
            { emoji: '🚭', name: 'no smoking healthy' },
            { emoji: '🍏', name: 'apple green fruit food health' },
            { emoji: '🍌', name: 'banana fruit food potassium' },
            { emoji: '🍉', name: 'watermelon fruit food summer' },
            { emoji: '🥑', name: 'avocado healthy fat food' },
            { emoji: '🥦', name: 'broccoli green vegetable healthy' },
            { emoji: '🥩', name: 'meat protein steak food' },
            { emoji: '🥛', name: 'milk calcium beverage drink' },
            { emoji: '🍷', name: 'wine alcohol drink glass' },
            { emoji: '🍺', name: 'beer alcohol drink pub' },
            // Work / Study
            { emoji: '💻', name: 'laptop computer code developer technology work' },
            { emoji: '📂', name: 'folder archive directory goal track' },
            { emoji: '📈', name: 'chart graph growth progress success' },
            { emoji: '📖', name: 'book read study learn meditation' },
            { emoji: '✍️', name: 'write pen pencil journal diary' },
            { emoji: '🎨', name: 'art paint draw creative design' },
            { emoji: '🎵', name: 'music audio song listen sound instrument' },
            { emoji: '🛠️', name: 'tools build repair construct setup' },
            { emoji: '💡', name: 'idea light bulb smart creativity' },
            { emoji: '🔑', name: 'key security unlock access priority' },
            { emoji: '🎯', name: 'target focus deep work goal aim' },
            { emoji: '📚', name: 'books read study library education' },
            { emoji: '🎬', name: 'movie cinema video watch screen' },
            { emoji: '📷', name: 'camera photo shoot memories' },
            { emoji: '🎮', name: 'game play console gaming controller' },
            { emoji: '🎲', name: 'dice board game luck random' },
            { emoji: '🧩', name: 'puzzle solve match think logic' },
            { emoji: '🎸', name: 'guitar music rock acoustic string' },
            { emoji: '🧪', name: 'science chemistry lab test research' },
            { emoji: '📐', name: 'ruler math measure geometry layout' },
            { emoji: '💼', name: 'briefcase work job office business' },
            { emoji: '🖥️', name: 'monitor screen desktop workstation' },
            { emoji: '💾', name: 'floppy disk save storage backup' },
            { emoji: '📅', name: 'calendar date schedule month event' },
            { emoji: '⏰', name: 'alarm clock time wake morning hour' },
            // Fitness / Motion
            { emoji: '🏋️‍♂️', name: 'gym lift weight workout fitness exercise strength' },
            { emoji: '🏃‍♂️', name: 'run cardio jogging fitness fast speed' },
            { emoji: '🧘‍♀️', name: 'yoga meditate peace calm relax stretch mindfulness' },
            { emoji: '🚴‍♂️', name: 'cycling bike ride fitness cardio outdoor' },
            { emoji: '🚶‍♂️', name: 'walk steps foot stride outdoor active' },
            { emoji: '🥊', name: 'boxing punch fight workout combat' },
            { emoji: '🏆', name: 'trophy win award first success victory rank' },
            { emoji: '💪', name: 'bicep flex muscle strength fitness body building' },
            // Finance
            { emoji: '💰', name: 'money gold cash coins budget finance save wealth' },
            { emoji: '💳', name: 'credit card expense payment pay bank' },
            { emoji: '💵', name: 'dollar cash note money bill' },
            { emoji: '🪙', name: 'coin silver currency cent' },
            { emoji: '📊', name: 'bar chart stats data metrics report' },
            { emoji: '📉', name: 'chart line down drop expense reduction' },
            { emoji: '💸', name: 'money wings spend waste loss cash flow' },
            { emoji: '💎', name: 'diamond gem crystal rich expensive quality' },
            { emoji: '🏦', name: 'bank money savings safe institution' },
            { emoji: '🏷️', name: 'tag price discount purchase product' },
            // Lifestyle / Nature
            { emoji: '🐾', name: 'paw animal pet dog cat footprints tracker' },
            { emoji: '🧹', name: 'broom clean dust sweep chore room' },
            { emoji: '☀️', name: 'sun light morning day weather clear' },
            { emoji: '💤', name: 'sleep rest night nap tired snooze' },
            { emoji: '🚀', name: 'rocket launch startup fly space accelerate boost' },
            { emoji: '🔋', name: 'battery energy power charge full status' },
            { emoji: '🚗', name: 'car drive transport travel commute' },
            { emoji: '✈️', name: 'airplane fly vacation flight travel' },
            { emoji: '🏕️', name: 'camp outdoor tent forest nature' },
            { emoji: '🐶', name: 'dog pet puppy animal bark friend' },
            { emoji: '🐱', name: 'cat pet kitten animal meow' },
            { emoji: '🪴', name: 'potted plant green grow nature home decoration' },
            { emoji: '🌸', name: 'flower cherry blossom spring nature' },
            { emoji: '🍀', name: 'clover luck green fortune nature' },
            // Miscellaneous / Symbols
            { emoji: '⭐', name: 'star rate favorite glow flash yellow' },
            { emoji: '✨', name: 'sparkles clean magic new glow shinning' },
            { emoji: '❤️', name: 'heart love care health vital' },
            { emoji: '🔥', name: 'fire hot streak burner trend popular' },
            { emoji: '⚡', name: 'lightning bolt fast electric energy speed action' },
            { emoji: '🌟', name: 'star gold shine success special' },
            { emoji: '🛑', name: 'stop sign red danger halt limit' },
            { emoji: '⚠️', name: 'warning alert caution hazard notification' },
            { emoji: '⚙️', name: 'gear settings engine configurations process' },
            { emoji: '🔒', name: 'lock secure private safe closed' },
            { emoji: '🔓', name: 'unlock open clear access' },
            { emoji: '🔔', name: 'bell notification ring sound wake' },
            { emoji: '💬', name: 'speech bubble chat communication comment message' }
        ];

        // Render grid helper
        const renderGrid = (filteredEmojis) => {
            emojiGrid.innerHTML = '';
            filteredEmojis.forEach(item => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn';
                btn.style.padding = '4px';
                btn.style.fontSize = '1.1rem';
                btn.style.background = 'transparent';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'transform 0.1s ease';
                btn.textContent = item.emoji;
                btn.title = item.name.toUpperCase();

                btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.2)');
                btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');

                btn.addEventListener('click', () => {
                    emojiInput.value = item.emoji;
                    pickerPanel.style.display = 'none';
                    if (window.Utils && typeof window.Utils.playBlip === 'function') {
                        window.Utils.playBlip(600, 'sine', 0.05);
                    }
                });

                emojiGrid.appendChild(btn);
            });
        };

        // Initial render
        renderGrid(defaultEmojis);

        // Filter search input events
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = defaultEmojis.filter(item => item.name.includes(query) || item.emoji === query);
            renderGrid(filtered);
        });

        // Toggle visibility
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = pickerPanel.style.display === 'block';
            pickerPanel.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) {
                searchInput.value = '';
                renderGrid(defaultEmojis);
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (!pickerPanel.contains(e.target) && e.target !== toggleBtn) {
                pickerPanel.style.display = 'none';
            }
        });
    },

    renderMatrix() {
        const routines = Storage.getRoutines();
        const history = Storage.getHistory();
        
        // Sort by order index
        routines.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Determine current month details
        const today = new Date();
        const year = window.app ? window.app.selectedYear : today.getFullYear();
        const monthIndex = window.app ? window.app.selectedMonth : today.getMonth(); // 0-11
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();
        
        // -------------------------------------------------------------
        // Header Generation
        // -------------------------------------------------------------
        const weekHeader = document.getElementById('matrix-week-header');
        const nameHeader = document.getElementById('matrix-day-name-header');
        const numHeader = document.getElementById('matrix-day-num-header');

        // Reset
        weekHeader.innerHTML = '<th rowspan="3" style="width: 40px; border-bottom: 2px solid var(--border-color);"></th><th rowspan="3" style="border-bottom: 2px solid var(--border-color);">DAILY ROUTINES</th><th rowspan="3" style="border-bottom: 2px solid var(--border-color); text-align: center;">GOALS</th>';
        nameHeader.innerHTML = '';
        numHeader.innerHTML = '';

        // Generate week banners (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-31)
        const weekRanges = [
            { name: 'WEEK 1', start: 1, end: 7, class: 'week-col-1' },
            { name: 'WEEK 2', start: 8, end: 14, class: 'week-col-2' },
            { name: 'WEEK 3', start: 15, end: 21, class: 'week-col-3' },
            { name: 'WEEK 4', start: 22, end: 28, class: 'week-col-4' },
            { name: 'WEEK 5', start: 29, end: totalDays, class: 'week-col-5' }
        ];

        weekRanges.forEach(w => {
            if (w.start <= totalDays) {
                const span = Math.min(w.end, totalDays) - w.start + 1;
                const th = document.createElement('th');
                th.className = `week-header-cell ${w.class}`;
                th.colSpan = span;
                th.textContent = w.name;
                weekHeader.appendChild(th);
            }
        });

        // Generate weekday names and number headers
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayDayNum = today.getDate();
        const actualYear = today.getFullYear();
        const actualMonth = today.getMonth();

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, monthIndex, day);
            const dayOfWeek = dayLabels[dateObj.getDay()];
            
            const isToday = day === todayDayNum && year === actualYear && monthIndex === actualMonth;

            // Name cell
            const nameTh = document.createElement('th');
            nameTh.className = `day-name-cell ${isToday ? 'today' : ''}`;
            nameTh.textContent = dayOfWeek.substring(0, 3);
            nameHeader.appendChild(nameTh);

            // Number cell
            const numTh = document.createElement('th');
            numTh.className = `day-num-cell ${isToday ? 'today' : ''}`;
            numTh.textContent = day;
            numHeader.appendChild(numTh);
        }

        // -------------------------------------------------------------
        // Body (Routines rows) Generation
        // -------------------------------------------------------------
        const tbody = document.getElementById('matrix-body');
        tbody.innerHTML = '';

        if (routines.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${3 + totalDays}" style="text-align: center; color: var(--text-muted); padding: 48px;">
                        No routines logged. Click "+ ADD ROUTINE" to map your day-to-day habits.
                    </td>
                </tr>
            `;
            return;
        }

        this.expandedRoutines = this.expandedRoutines || new Set();

        routines.forEach((routine, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.routineId = routine.id;
            tr.dataset.index = idx;
            tr.setAttribute('draggable', 'true');

            this.bindDragRow(tr);

            // Drag cell
            const dragTd = document.createElement('td');
            dragTd.className = 'drag-grip';
            dragTd.innerHTML = '⋮⋮';

            // Check if subcategories exist
            const hasSubcategories = routine.subcategories && Array.isArray(routine.subcategories) && routine.subcategories.length > 0;
            const isExpanded = hasSubcategories && this.expandedRoutines.has(routine.id);

            // Routine name cell
            const nameTd = document.createElement('td');
            nameTd.className = 'routine-title-cell';
            
            let toggleHtml = '';
            if (hasSubcategories) {
                toggleHtml = `<button type="button" class="btn-toggle-sub" style="background: none; border: none; color: var(--accent-color); cursor: pointer; padding: 0 4px 0 0; font-size: 0.7rem; font-weight: bold;" title="Expand/Collapse Subtopics">${isExpanded ? '▼' : '▶'}</button>`;
            }

            let subtopicsBtnHtml = '';
            if (hasSubcategories) {
                subtopicsBtnHtml = ` <button type="button" class="btn-open-sub-view" style="background: rgba(0,0,0,0.6); border: 1px solid var(--border-color); color: var(--accent-color); cursor: pointer; padding: 1px 5px; font-size: 0.6rem; border-radius: var(--radius-sm);" title="Open Subtopics Calendar View">SUBTOPICS (${routine.subcategories.length}) 📂</button>`;
            } else {
                subtopicsBtnHtml = ` <button type="button" class="btn-open-sub-view" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 1px 4px; font-size: 0.6rem;" title="Add Subtopics">+ SUBTOPIC</button>`;
            }

            nameTd.innerHTML = `${toggleHtml}<span class="routine-emoji-txt">${Utils.renderEmoji(routine.emoji)}</span> <span class="routine-name-lbl" style="cursor: pointer; font-weight: bold;" title="Edit Routine">${Utils.escapeHtml(routine.name)}</span> ${subtopicsBtnHtml} <span class="btn-edit-routine-icon" style="cursor: pointer; opacity: 0.7; font-size: 0.72rem; margin-left: 2px;" title="Edit Routine Config">✏️</span>`;

            if (hasSubcategories) {
                const toggleBtn = nameTd.querySelector('.btn-toggle-sub');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.expandedRoutines.has(routine.id)) {
                            this.expandedRoutines.delete(routine.id);
                        } else {
                            this.expandedRoutines.add(routine.id);
                        }
                        this.renderMatrix();
                    });
                }
            }

            const subViewBtn = nameTd.querySelector('.btn-open-sub-view');
            if (subViewBtn) {
                subViewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSubtopicView(routine.id);
                });
            }

            const editIcon = nameTd.querySelector('.btn-edit-routine-icon');
            if (editIcon) {
                editIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openRoutineModal(routine);
                });
            }

            const nameLbl = nameTd.querySelector('.routine-name-lbl');
            if (nameLbl) {
                nameLbl.addEventListener('click', () => this.openRoutineModal(routine));
            } else {
                nameTd.addEventListener('click', () => this.openRoutineModal(routine));
            }

            // Goal target cell
            const goalTd = document.createElement('td');
            goalTd.className = 'goal-val-cell';
            goalTd.textContent = routine.goal || 30;

            tr.appendChild(dragTd);
            tr.appendChild(nameTd);
            tr.appendChild(goalTd);

            // Days columns checkboxes
            const monthStr = String(monthIndex + 1).padStart(2, '0');
            
            for (let day = 1; day <= totalDays; day++) {
                const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
                
                const td = document.createElement('td');
                td.className = 'matrix-chk-cell';
                const isCellToday = day === todayDayNum && year === actualYear && monthIndex === actualMonth;
                if (isCellToday) {
                    td.className += ' today';
                }

                // Check completed state
                const isChecked = history[dateStr]?.[routine.id] === true;

                // Determine week index for coloring (1-5)
                const weekIndex = Math.ceil(day / 7);
                
                const checkbox = document.createElement('div');
                checkbox.className = 'matrix-checkbox';
                
                if (isChecked) {
                    checkbox.classList.add(`checked-w${weekIndex}`);
                }

                // Prevent future checking
                const isFuture = dateStr > Utils.getTodayStr();
                if (isFuture) {
                    checkbox.style.opacity = '0.15';
                    checkbox.style.cursor = 'not-allowed';
                } else {
                    checkbox.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleCheckbox(checkbox, dateStr, routine.id, weekIndex);
                    });
                }

                td.appendChild(checkbox);
                tr.appendChild(td);
            }

            tbody.appendChild(tr);

            // -------------------------------------------------------------
            // Render Child Subcategory Rows if Expanded
            // -------------------------------------------------------------
            if (isExpanded) {
                routine.subcategories.forEach(sub => {
                    const subTr = document.createElement('tr');
                    subTr.className = 'subcategory-row';
                    subTr.style.background = 'rgba(0, 0, 0, 0.45)';

                    const subDragTd = document.createElement('td');
                    subDragTd.innerHTML = '';

                    const subNameTd = document.createElement('td');
                    subNameTd.className = 'routine-title-cell';
                    subNameTd.style.paddingLeft = '22px';
                    subNameTd.style.fontSize = '0.7rem';
                    subNameTd.style.color = 'var(--text-secondary)';

                    let subDateTag = '';
                    if (sub.startDate || sub.dueDate) {
                        const sTag = sub.startDate ? sub.startDate.substring(5) : 'Start';
                        const dTag = sub.dueDate ? sub.dueDate.substring(5) : 'Due';
                        subDateTag = ` <span style="font-size: 0.58rem; color: var(--accent-color); font-family: monospace;">[${sTag} → ${dTag}]</span>`;
                    }

                    subNameTd.innerHTML = `<span style="color: var(--accent-color); opacity: 0.7;">↳</span> <span class="routine-emoji-txt">${Utils.renderEmoji(sub.emoji || '📌')}</span> ${Utils.escapeHtml(sub.name)}${subDateTag}`;
                    
                    const subGoalTd = document.createElement('td');
                    subGoalTd.className = 'goal-val-cell';
                    subGoalTd.style.fontSize = '0.65rem';
                    subGoalTd.style.color = 'var(--text-muted)';
                    subGoalTd.textContent = '-';

                    subTr.appendChild(subDragTd);
                    subTr.appendChild(subNameTd);
                    subTr.appendChild(subGoalTd);

                    for (let day = 1; day <= totalDays; day++) {
                        const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
                        const subTd = document.createElement('td');
                        subTd.className = 'matrix-chk-cell';
                        if (day === todayDayNum && year === actualYear && monthIndex === actualMonth) {
                            subTd.className += ' today';
                        }

                        // Check date range active state
                        let isActiveRange = true;
                        if (sub.startDate && dateStr < sub.startDate) isActiveRange = false;
                        if (sub.dueDate && dateStr > sub.dueDate) isActiveRange = false;

                        if (!isActiveRange) {
                            subTd.style.opacity = '0.2';
                            subTd.innerHTML = '<span style="font-size: 0.6rem; color: var(--text-muted);">-</span>';
                            subTd.title = `Subtopic inactive (${sub.startDate || 'Any'} to ${sub.dueDate || 'Any'})`;
                        } else {
                            const isSubChecked = history[dateStr]?.[sub.id] === true;
                            const weekIndex = Math.ceil(day / 7);
                            const checkbox = document.createElement('div');
                            checkbox.className = 'matrix-checkbox';
                            checkbox.style.width = '13px';
                            checkbox.style.height = '13px';

                            if (isSubChecked) {
                                checkbox.classList.add(`checked-w${weekIndex}`);
                            }

                            const isFuture = dateStr > Utils.getTodayStr();
                            if (isFuture) {
                                checkbox.style.opacity = '0.15';
                                checkbox.style.cursor = 'not-allowed';
                            } else {
                                checkbox.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    this.toggleCheckbox(checkbox, dateStr, sub.id, weekIndex);
                                });
                            }
                            subTd.appendChild(checkbox);
                        }

                        subTr.appendChild(subTd);
                    }

                    tbody.appendChild(subTr);
                });
            }
        });
    },

    toggleCheckbox(element, dateStr, routineId, weekIndex) {
        const isCheckedNow = Storage.toggleRoutineCheck(dateStr, routineId);
        
        // Update checkbox UI immediately
        const checkedClass = `checked-w${weekIndex}`;
        if (isCheckedNow) {
            element.classList.add(checkedClass);
        } else {
            element.classList.remove(checkedClass);
        }

        // Trigger updates in sibling widgets (oscilloscope, overview counts)
        window.dispatchEvent(new CustomEvent('habits-changed'));
    },

    // -------------------------------------------------------------
    // Drag & Drop swap
    // -------------------------------------------------------------
    bindDragRow(row) {
        row.addEventListener('dragstart', (e) => {
            this.draggedIdx = parseInt(row.dataset.index, 10);
            row.classList.add('row-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetIdx = parseInt(row.dataset.index, 10);
            if (this.draggedIdx !== null && this.draggedIdx !== targetIdx) {
                this.swapRoutines(this.draggedIdx, targetIdx);
            }
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('row-dragging');
            this.draggedIdx = null;
        });
    },

    swapRoutines(from, to) {
        const routines = Storage.getRoutines();
        routines.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const [moved] = routines.splice(from, 1);
        routines.splice(to, 0, moved);

        routines.forEach((r, i) => {
            r.order = i;
        });

        Storage.saveRoutines(routines);
        this.renderMatrix();
    },

    // -------------------------------------------------------------
    // Routine Forms CRUD Modals
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Routine Forms CRUD Modals & Subtopics Management
    // -------------------------------------------------------------
    openRoutineModal(routine = null) {
        const modal = document.getElementById('routine-modal');
        const form = document.getElementById('routine-form');
        const titleEl = document.getElementById('routine-modal-title');
        
        form.reset();
        this.tempSubcategories = routine && Array.isArray(routine.subcategories) ? JSON.parse(JSON.stringify(routine.subcategories)) : [];

        if (routine) {
            titleEl.textContent = "EDIT ROUTINE";
            document.getElementById('routine-id').value = routine.id;
            document.getElementById('routine-name').value = routine.name;
            document.getElementById('routine-emoji').value = routine.emoji;
            document.getElementById('routine-goal-target').value = routine.goal || 30;

            document.getElementById('btn-delete-routine').style.display = 'inline-flex';
        } else {
            titleEl.textContent = "ADD ROUTINE";
            document.getElementById('routine-id').value = '';
            document.getElementById('routine-emoji').value = '⚡';
            document.getElementById('routine-goal-target').value = 30;

            document.getElementById('btn-delete-routine').style.display = 'none';
        }

        // Clear subtopic input fields
        const newSubName = document.getElementById('new-sub-name');
        const newSubEmoji = document.getElementById('new-sub-emoji');
        const newSubStart = document.getElementById('new-sub-start-date');
        const newSubDue = document.getElementById('new-sub-due-date');
        if (newSubName) newSubName.value = '';
        if (newSubEmoji) newSubEmoji.value = '';
        if (newSubStart) newSubStart.value = '';
        if (newSubDue) newSubDue.value = '';

        this.renderSubcategoriesList();
        modal.classList.add('show');
        this.initDatePickerPopups();
    },

    renderSubcategoriesList() {
        const listContainer = document.getElementById('routine-subcategories-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (!this.tempSubcategories || this.tempSubcategories.length === 0) {
            listContainer.innerHTML = '<div style="font-size: 0.68rem; color: var(--text-muted); font-style: italic;">No subtopics added yet.</div>';
            return;
        }

        this.tempSubcategories.forEach((sub, index) => {
            const item = document.createElement('div');
            item.className = 'glass-card';
            item.style.padding = '5px 8px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.fontSize = '0.72rem';
            item.style.border = '1px solid var(--border-color)';
            item.style.borderRadius = 'var(--radius-sm)';
            item.style.background = '#000';

            let dateStr = '';
            if (sub.startDate || sub.dueDate) {
                const s = sub.startDate ? sub.startDate : 'Any';
                const d = sub.dueDate ? sub.dueDate : 'No due date';
                dateStr = ` <span style="font-size: 0.6rem; color: var(--accent-color); font-family: monospace;">[${s} → ${d}]</span>`;
            }

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                    <span>${sub.emoji || '📌'}</span>
                    <span style="font-weight: bold;">${Utils.escapeHtml(sub.name)}</span>
                    ${dateStr}
                </div>
                <button type="button" class="btn btn-danger btn-retro btn-sm" style="padding: 1px 6px; font-size: 0.65rem;" title="Remove Subtopic">&times;</button>
            `;

            item.querySelector('button').addEventListener('click', () => {
                this.tempSubcategories.splice(index, 1);
                this.renderSubcategoriesList();
            });

            listContainer.appendChild(item);
        });
    },

    handleAddSubtopic() {
        const nameInput = document.getElementById('new-sub-name');
        const emojiInput = document.getElementById('new-sub-emoji');
        const startDateInput = document.getElementById('new-sub-start-date');
        const dueDateInput = document.getElementById('new-sub-due-date');

        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) {
            Utils.showToast("Subtopic name is required.", "warning");
            return;
        }

        const emoji = emojiInput.value.trim() || '📌';
        const startDate = startDateInput.value || null;
        const dueDate = dueDateInput.value || null;

        this.tempSubcategories = this.tempSubcategories || [];
        this.tempSubcategories.push({
            id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name,
            emoji,
            startDate,
            dueDate
        });

        nameInput.value = '';
        emojiInput.value = '';
        startDateInput.value = '';
        dueDateInput.value = '';

        this.renderSubcategoriesList();
    },

    closeRoutineModal() {
        document.getElementById('routine-modal').classList.remove('show');
    },

    handleFormSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('routine-id').value;
        const name = document.getElementById('routine-name').value;
        const emoji = document.getElementById('routine-emoji').value || '⚡';
        const goal = parseInt(document.getElementById('routine-goal-target').value, 10) || 30;

        const routines = Storage.getRoutines();
        const subcategories = this.tempSubcategories || [];

        if (id) {
            // Edit
            const r = routines.find(item => item.id === id);
            r.name = name;
            r.emoji = emoji;
            r.goal = goal;
            r.subcategories = subcategories;
            Utils.showToast("Routine configuration saved!", "success");
        } else {
            // Create
            const nextOrder = routines.length;
            const newRoutine = {
                id: 'routine-' + Date.now(),
                name,
                emoji,
                goal,
                order: nextOrder,
                subcategories
            };
            routines.push(newRoutine);
            Utils.showToast("Routine added! +15 XP", "success");
            Storage.addXP(15);
        }

        Storage.saveRoutines(routines);
        this.closeRoutineModal();
        this.renderMatrix();
        
        window.dispatchEvent(new CustomEvent('habits-changed'));
    },

    handleDeleteRoutine() {
        const id = document.getElementById('routine-id').value;
        if (!id) return;

        const routines = Storage.getRoutines();
        const idx = routines.findIndex(r => r.id === id);
        if (idx === -1) return;

        const routineName = routines[idx].name;

        Utils.confirm("Delete Routine", `Are you sure you want to permanently delete "${routineName}" and its full completion record? This cannot be undone.`, () => {
            // Delete history items
            const history = Storage.getHistory();
            Object.keys(history).forEach(date => {
                if (history[date][id] !== undefined) {
                    delete history[date][id];
                }
            });
            Storage.saveHistory(history);

            // Delete routine
            routines.splice(idx, 1);
            Storage.saveRoutines(routines);

            this.closeRoutineModal();
            this.renderMatrix();
            window.dispatchEvent(new CustomEvent('habits-changed'));
        });
    },

    // -------------------------------------------------------------
    // JSON / AI Import Workflows
    // -------------------------------------------------------------
    openJsonImportModal() {
        const modal = document.getElementById('json-import-modal');
        if (!modal) return;
        modal.classList.add('show');
    },

    closeJsonImportModal() {
        const modal = document.getElementById('json-import-modal');
        if (modal) modal.classList.remove('show');
    },

    copyLlmPrompt() {
        const promptText = `Act as a personal productivity and habit coach. Generate a JSON list of 5 to 8 daily habits/routines for my goal: [INSERT YOUR GOAL HERE, e.g. Study, Fitness, Software Engineering].

Return ONLY a valid raw JSON array of objects with no markdown formatting or extra text outside the JSON array.

Each object can have main topics (like Study, Gym) and optional subcategories (like Networking, DSA under Study). You can specify optional "startDate" and "dueDate" (in YYYY-MM-DD format) for subcategories.

Each object must follow this exact schema:
[
  {
    "name": "Study",
    "emoji": "📖",
    "goal": 30,
    "subcategories": [
      {
        "name": "Networking",
        "emoji": "🌐",
        "startDate": "2026-08-01",
        "dueDate": "2026-08-15"
      },
      {
        "name": "Data Structures & Algorithms",
        "emoji": "💻",
        "startDate": "2026-08-05",
        "dueDate": "2026-08-31"
      }
    ]
  },
  {
    "name": "Gym & Fitness",
    "emoji": "🏋️‍♂️",
    "goal": 30,
    "subcategories": [
      { "name": "Leg Day Routine", "emoji": "🦵" },
      { "name": "Push Ups & Core", "emoji": "💪" }
    ]
  }
]

Requirements:
- "name": Concise name of the habit or subtopic.
- "emoji": A single matching emoji for the habit or subtopic.
- "goal": Integer representing target days (default 30).
- "subcategories": Optional array of subtopics, with optional "startDate" (YYYY-MM-DD) and "dueDate" (YYYY-MM-DD).`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(promptText).then(() => {
                Utils.showToast("AI Prompt copied to clipboard! 📋", "success");
            }).catch(() => {
                this.fallbackCopyPrompt(promptText);
            });
        } else {
            this.fallbackCopyPrompt(promptText);
        }
    },

    fallbackCopyPrompt(text) {
        const textarea = document.getElementById('json-import-input');
        if (textarea) {
            textarea.value = text;
            textarea.select();
            document.execCommand('copy');
            Utils.showToast("AI Prompt copied to text box!", "info");
        }
    },

    handleJsonImportSubmit() {
        const textarea = document.getElementById('json-import-input');
        const replaceModeCheckbox = document.getElementById('json-import-replace-mode');
        if (!textarea) return;

        const rawText = textarea.value.trim();
        if (!rawText) {
            Utils.showToast("Please paste JSON content first.", "warning");
            return;
        }

        let parsedData;
        try {
            // Strip potential markdown code fence markers ```json ... ``` if pasted directly from ChatGPT
            const cleanedText = rawText.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
            parsedData = JSON.parse(cleanedText);
        } catch (err) {
            console.error("JSON parse error:", err);
            Utils.showToast("Invalid JSON syntax! Please check your formatting.", "error");
            return;
        }

        // Handle array, wrapper object, or single item
        let routinesToProcess = [];
        if (Array.isArray(parsedData)) {
            routinesToProcess = parsedData;
        } else if (parsedData && Array.isArray(parsedData.routines)) {
            routinesToProcess = parsedData.routines;
        } else if (parsedData && typeof parsedData === 'object' && parsedData.name) {
            routinesToProcess = [parsedData];
        } else {
            Utils.showToast("Could not find valid routines in JSON. Expected array or object with 'name'.", "warning");
            return;
        }

        const existingRoutines = Storage.getRoutines();
        const isReplaceMode = replaceModeCheckbox ? replaceModeCheckbox.checked : false;

        let baseIndex = isReplaceMode ? 0 : existingRoutines.length;
        const validNewRoutines = [];

        routinesToProcess.forEach((item, idx) => {
            if (item && typeof item === 'object' && item.name && String(item.name).trim() !== '') {
                const subList = item.subcategories || item.subtopics || item.sub_categories || [];
                const parsedSubcategories = Array.isArray(subList) ? subList.map((sub, sIdx) => ({
                    id: 'sub-' + Date.now() + '-' + idx + '-' + sIdx,
                    name: String(sub.name || 'Subtopic').trim(),
                    emoji: (sub.emoji && String(sub.emoji).trim()) ? String(sub.emoji).trim() : '📌',
                    startDate: sub.startDate || sub.start_date || null,
                    dueDate: sub.dueDate || sub.due_date || null
                })).filter(s => s.name !== '') : [];

                validNewRoutines.push({
                    id: 'routine-' + Date.now() + '-' + idx,
                    name: String(item.name).trim(),
                    emoji: (item.emoji && String(item.emoji).trim()) ? String(item.emoji).trim() : '⚡',
                    goal: parseInt(item.goal, 10) || 30,
                    order: baseIndex + idx,
                    subcategories: parsedSubcategories
                });
            }
        });

        if (validNewRoutines.length === 0) {
            Utils.showToast("No valid routines found in JSON. Each routine must have a 'name'.", "warning");
            return;
        }

        const updatedRoutines = isReplaceMode 
            ? validNewRoutines 
            : [...existingRoutines, ...validNewRoutines];

        Storage.saveRoutines(updatedRoutines);

        // Clear input
        textarea.value = '';

        // Close modal and re-render dashboard
        this.closeJsonImportModal();
        this.renderMatrix();

        // Trigger global state events & cloud sync
        window.dispatchEvent(new CustomEvent('habits-changed'));

        const count = validNewRoutines.length;
        Utils.showToast(`Successfully imported ${count} routine${count > 1 ? 's' : ''}! +15 XP`, "success");
        Storage.addXP(15);
    },

    // -------------------------------------------------------------
    // Subtopics Dedicated View Workflows & Modal Handling
    // -------------------------------------------------------------
    openSubtopicView(routineId) {
        this.currentSubtopicRoutineId = routineId;
        
        const mainView = document.querySelector('.card-matrix:not(#subtopics-detail-view)');
        const subView = document.getElementById('subtopics-detail-view');
        const addBtn = document.getElementById('btn-add-routine');

        if (mainView) mainView.style.display = 'none';
        if (subView) subView.style.display = 'block';

        if (addBtn) {
            addBtn.textContent = '+ ADD SUB ROUTINE';
            addBtn.title = 'Add Sub Routine to current topic';
        }

        this.renderSubtopicView();
    },

    closeSubtopicView() {
        this.currentSubtopicRoutineId = null;

        const mainView = document.querySelector('.card-matrix:not(#subtopics-detail-view)');
        const subView = document.getElementById('subtopics-detail-view');
        const addBtn = document.getElementById('btn-add-routine');

        if (mainView) mainView.style.display = 'block';
        if (subView) subView.style.display = 'none';

        if (addBtn) {
            addBtn.textContent = '+ ADD ROUTINE';
            addBtn.title = 'Add new routine';
        }

        this.renderMatrix();
    },

    getCurrentSubtopicRoutine() {
        if (!this.currentSubtopicRoutineId) return null;
        const routines = Storage.getRoutines();
        return routines.find(r => r.id === this.currentSubtopicRoutineId) || null;
    },

    renderSubtopicView() {
        const routine = this.getCurrentSubtopicRoutine();
        if (!routine) {
            this.closeSubtopicView();
            return;
        }

        // Title
        const titleEl = document.getElementById('subtopic-routine-title');
        if (titleEl) {
            titleEl.innerHTML = `${Utils.renderEmoji(routine.emoji)} ${Utils.escapeHtml(routine.name).toUpperCase()} <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: normal;">[SUBCATEGORIES VIEW]</span>`;
        }

        // Render Left Sidebar List
        const sidebarList = document.getElementById('subtopics-sidebar-list');
        if (sidebarList) {
            sidebarList.innerHTML = '';

            const subcategories = routine.subcategories || [];
            if (subcategories.length === 0) {
                sidebarList.innerHTML = '<div style="font-size: 0.7rem; color: var(--text-muted); font-style: italic; padding: 12px 0;">No subtopics yet. Click "+ SUBTOPIC" to add your first sub routine.</div>';
            } else {
                subcategories.forEach((sub, idx) => {
                    const card = document.createElement('div');
                    card.className = 'glass-card';
                    card.style.padding = '8px 10px';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.gap = '4px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.borderRadius = 'var(--radius-sm)';
                    card.style.background = '#000';

                    let dateBadge = '';
                    if (sub.startDate || sub.dueDate) {
                        const sStr = sub.startDate ? sub.startDate : 'Start';
                        const dStr = sub.dueDate ? sub.dueDate : 'Due';
                        dateBadge = `<div style="font-size: 0.58rem; color: var(--accent-color); font-family: monospace;">📅 ${sStr} → ${dStr}</div>`;
                    }

                    card.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; font-size: 0.78rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                                <span>${Utils.renderEmoji(sub.emoji || '📌')}</span>
                                <span title="${Utils.escapeHtml(sub.name)}">${Utils.escapeHtml(sub.name)}</span>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button type="button" class="btn btn-secondary btn-retro btn-sm btn-edit-sub" style="padding: 2px 6px; font-size: 0.65rem;" title="Edit Subtopic">✏️</button>
                                <button type="button" class="btn btn-danger btn-retro btn-sm btn-del-sub" style="padding: 2px 6px; font-size: 0.65rem;" title="Delete Subtopic">&times;</button>
                            </div>
                        </div>
                        ${dateBadge}
                    `;

                    // Edit button click listener
                    card.querySelector('.btn-edit-sub').addEventListener('click', () => {
                        this.openSubtopicModal(sub, routine.id);
                    });

                    // Delete button click listener
                    card.querySelector('.btn-del-sub').addEventListener('click', () => {
                        Utils.confirm("Delete Subtopic", `Are you sure you want to delete "${sub.name}"?`, () => {
                            routine.subcategories.splice(idx, 1);
                            const routines = Storage.getRoutines();
                            const rIdx = routines.findIndex(r => r.id === routine.id);
                            if (rIdx !== -1) {
                                routines[rIdx] = routine;
                                Storage.saveRoutines(routines);
                            }
                            this.renderSubtopicView();
                            window.dispatchEvent(new CustomEvent('habits-changed'));
                        });
                    });

                    sidebarList.appendChild(card);
                });
            }
        }

        // Render Right Subtopic Matrix Table
        this.renderSubtopicMatrixTable(routine);
    },

    renderSubtopicMatrixTable(routine) {
        const history = Storage.getHistory();
        const today = new Date();
        const year = window.app ? window.app.selectedYear : today.getFullYear();
        const monthIndex = window.app ? window.app.selectedMonth : today.getMonth(); // 0-11
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();

        // Display month
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const subMonthDisp = document.getElementById('sub-month-display');
        if (subMonthDisp) subMonthDisp.textContent = `${monthNames[monthIndex]} ${year}`;

        // Headers
        const weekHeader = document.getElementById('sub-week-header');
        const nameHeader = document.getElementById('sub-day-name-header');
        const numHeader = document.getElementById('sub-day-num-header');

        weekHeader.innerHTML = '<th rowspan="3" style="border-bottom: 2px solid var(--border-color); min-width: 120px;">SUB ROUTINE</th>';
        nameHeader.innerHTML = '';
        numHeader.innerHTML = '';

        const weekRanges = [
            { name: 'WEEK 1', start: 1, end: 7, class: 'week-col-1' },
            { name: 'WEEK 2', start: 8, end: 14, class: 'week-col-2' },
            { name: 'WEEK 3', start: 15, end: 21, class: 'week-col-3' },
            { name: 'WEEK 4', start: 22, end: 28, class: 'week-col-4' },
            { name: 'WEEK 5', start: 29, end: totalDays, class: 'week-col-5' }
        ];

        weekRanges.forEach(w => {
            if (w.start <= totalDays) {
                const span = Math.min(w.end, totalDays) - w.start + 1;
                const th = document.createElement('th');
                th.className = `week-header-cell ${w.class}`;
                th.colSpan = span;
                th.textContent = w.name;
                weekHeader.appendChild(th);
            }
        });

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayDayNum = today.getDate();
        const actualYear = today.getFullYear();
        const actualMonth = today.getMonth();

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, monthIndex, day);
            const dayOfWeek = dayLabels[dateObj.getDay()];
            const isToday = day === todayDayNum && year === actualYear && monthIndex === actualMonth;

            const nameTh = document.createElement('th');
            nameTh.className = `day-name-cell ${isToday ? 'today' : ''}`;
            nameTh.textContent = dayOfWeek.substring(0, 3);
            nameHeader.appendChild(nameTh);

            const numTh = document.createElement('th');
            numTh.className = `day-num-cell ${isToday ? 'today' : ''}`;
            numTh.textContent = day;
            numHeader.appendChild(numTh);
        }

        // Body
        const tbody = document.getElementById('sub-matrix-body');
        tbody.innerHTML = '';

        const subcategories = routine.subcategories || [];
        if (subcategories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${1 + totalDays}" style="text-align: center; color: var(--text-muted); padding: 40px;">
                        No sub routines added yet. Click "+ SUBTOPIC" to add your first subtopic.
                    </td>
                </tr>
            `;
            return;
        }

        const monthStr = String(monthIndex + 1).padStart(2, '0');

        subcategories.forEach(sub => {
            const tr = document.createElement('tr');
            
            const nameTd = document.createElement('td');
            nameTd.className = 'routine-title-cell';
            nameTd.innerHTML = `<span class="routine-emoji-txt">${Utils.renderEmoji(sub.emoji || '📌')}</span> ${Utils.escapeHtml(sub.name)}`;
            tr.appendChild(nameTd);

            for (let day = 1; day <= totalDays; day++) {
                const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
                const td = document.createElement('td');
                td.className = 'matrix-chk-cell';
                if (day === todayDayNum && year === actualYear && monthIndex === actualMonth) {
                    td.className += ' today';
                }

                // Check active range
                let isActiveRange = true;
                if (sub.startDate && dateStr < sub.startDate) isActiveRange = false;
                if (sub.dueDate && dateStr > sub.dueDate) isActiveRange = false;

                if (!isActiveRange) {
                    td.style.opacity = '0.15';
                    td.innerHTML = '<span style="font-size: 0.6rem; color: var(--text-muted);">-</span>';
                    td.title = `Inactive outside active dates (${sub.startDate || 'Start'} to ${sub.dueDate || 'Due'})`;
                } else {
                    const isChecked = history[dateStr]?.[sub.id] === true;
                    const weekIndex = Math.ceil(day / 7);

                    const checkbox = document.createElement('div');
                    checkbox.className = 'matrix-checkbox';
                    
                    if (isChecked) {
                        checkbox.classList.add(`checked-w${weekIndex}`);
                    }

                    const isFuture = dateStr > Utils.getTodayStr();
                    if (isFuture) {
                        checkbox.style.opacity = '0.15';
                        checkbox.style.cursor = 'not-allowed';
                    } else {
                        checkbox.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleCheckbox(checkbox, dateStr, sub.id, weekIndex);
                        });
                    }

                    td.appendChild(checkbox);
                }

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        });
    },

    openSubtopicModal(subtopic = null, parentRoutineId) {
        const modal = document.getElementById('subtopic-modal');
        const form = document.getElementById('subtopic-form');
        const titleEl = document.getElementById('subtopic-modal-title');
        
        form.reset();
        document.getElementById('subtopic-parent-id').value = parentRoutineId;

        if (subtopic) {
            titleEl.textContent = "EDIT SUB ROUTINE";
            document.getElementById('subtopic-id').value = subtopic.id;
            document.getElementById('subtopic-name').value = subtopic.name;
            document.getElementById('subtopic-emoji').value = subtopic.emoji || '📌';
            document.getElementById('subtopic-start-date').value = subtopic.startDate || '';
            document.getElementById('subtopic-due-date').value = subtopic.dueDate || '';
            document.getElementById('btn-delete-subtopic-modal').style.display = 'inline-flex';
        } else {
            titleEl.textContent = "ADD SUB ROUTINE";
            document.getElementById('subtopic-id').value = '';
            document.getElementById('subtopic-emoji').value = '📌';
            document.getElementById('subtopic-start-date').value = '';
            document.getElementById('subtopic-due-date').value = '';
            document.getElementById('btn-delete-subtopic-modal').style.display = 'none';
        }

        modal.classList.add('show');
        this.initDatePickerPopups();
    },

    closeSubtopicModal() {
        document.getElementById('subtopic-modal').classList.remove('show');
    },

    handleSubtopicFormSubmit(e) {
        e.preventDefault();

        const parentId = document.getElementById('subtopic-parent-id').value;
        const subId = document.getElementById('subtopic-id').value;
        const name = document.getElementById('subtopic-name').value.trim();
        const emoji = document.getElementById('subtopic-emoji').value.trim() || '📌';
        const startDate = document.getElementById('subtopic-start-date').value || null;
        const dueDate = document.getElementById('subtopic-due-date').value || null;

        if (!parentId || !name) return;

        const routines = Storage.getRoutines();
        const routine = routines.find(r => r.id === parentId);
        if (!routine) return;

        routine.subcategories = routine.subcategories || [];

        if (subId) {
            // Edit existing
            const sub = routine.subcategories.find(s => s.id === subId);
            if (sub) {
                sub.name = name;
                sub.emoji = emoji;
                sub.startDate = startDate;
                sub.dueDate = dueDate;
            }
            Utils.showToast("Sub routine updated!", "success");
        } else {
            // Create new
            routine.subcategories.push({
                id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                name,
                emoji,
                startDate,
                dueDate
            });
            Utils.showToast("Sub routine added!", "success");
        }

        Storage.saveRoutines(routines);
        this.closeSubtopicModal();

        if (this.currentSubtopicRoutineId === parentId) {
            this.renderSubtopicView();
        } else {
            this.renderMatrix();
        }

        window.dispatchEvent(new CustomEvent('habits-changed'));
    },

    handleDeleteSubtopicModal() {
        const parentId = document.getElementById('subtopic-parent-id').value;
        const subId = document.getElementById('subtopic-id').value;
        if (!parentId || !subId) return;

        Utils.confirm("Delete Sub Routine", "Are you sure you want to delete this sub routine?", () => {
            const routines = Storage.getRoutines();
            const routine = routines.find(r => r.id === parentId);
            if (routine && routine.subcategories) {
                const sIdx = routine.subcategories.findIndex(s => s.id === subId);
                if (sIdx !== -1) {
                    routine.subcategories.splice(sIdx, 1);
                    Storage.saveRoutines(routines);
                }
            }

            this.closeSubtopicModal();
            if (this.currentSubtopicRoutineId === parentId) {
                this.renderSubtopicView();
            } else {
                this.renderMatrix();
            }
            window.dispatchEvent(new CustomEvent('habits-changed'));
        });
    }
};

window.Habits = Habits;
