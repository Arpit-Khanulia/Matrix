/**
 * Habits Module - Grid matrix routines generator, table rendering, week color grouping, and CRUD forms.
 */

const Habits = {
    draggedIdx: null,

    init() {
        this.bindEvents();
        this.initEmojiPicker();
    },

    bindEvents() {
        // Modal buttons
        document.getElementById('btn-add-routine').addEventListener('click', () => this.openRoutineModal());
        document.getElementById('btn-close-routine').addEventListener('click', () => this.closeRoutineModal());
        document.getElementById('btn-cancel-routine').addEventListener('click', () => this.closeRoutineModal());

        // Form submit
        document.getElementById('routine-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Delete routine
        document.getElementById('btn-delete-routine').addEventListener('click', () => this.handleDeleteRoutine());
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

            // Routine name cell
            const nameTd = document.createElement('td');
            nameTd.className = 'routine-title-cell';
            nameTd.innerHTML = `<span class="routine-emoji-txt">${Utils.renderEmoji(routine.emoji)}</span> ${routine.name}`;
            nameTd.addEventListener('click', () => this.openRoutineModal(routine));

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
    openRoutineModal(routine = null) {
        const modal = document.getElementById('routine-modal');
        const form = document.getElementById('routine-form');
        const titleEl = document.getElementById('routine-modal-title');
        
        form.reset();

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

        modal.classList.add('show');
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

        if (id) {
            // Edit
            const r = routines.find(item => item.id === id);
            r.name = name;
            r.emoji = emoji;
            r.goal = goal;
            Utils.showToast("Routine configuration saved!", "success");
        } else {
            // Create
            const nextOrder = routines.length;
            const newRoutine = {
                id: 'routine-' + Date.now(),
                name,
                emoji,
                goal,
                order: nextOrder
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
    }
};

window.Habits = Habits;
