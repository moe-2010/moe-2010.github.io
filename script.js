document.addEventListener('DOMContentLoaded', () => {
    // STATE
    const state = {
        activeTab: 'home',
        isDarkMode: localStorage.getItem('darkMode') === 'true' || false,
        stopwatch: {
            startTime: 0,
            elapsedTime: parseInt(localStorage.getItem('stopwatchElapsed')) || 0,
            timerInterval: null,
            running: false,
            laps: JSON.parse(localStorage.getItem('stopwatchLaps')) || []
        },
        timer: {
            endTime: 0,
            remainingTime: 0,
            timerInterval: null,
            running: false,
            type: 'default',
            presets: {
                pomodoro: 25 * 60 * 1000,
                shortBreak: 5 * 60 * 1000,
                longBreak: 15 * 60 * 1000
            }
        },
        multitimer: {
            timers: JSON.parse(localStorage.getItem('multiTimers')) || [],
            nextId: parseInt(localStorage.getItem('multiTimerNextId')) || 1
        },
        alarms: {
            alarms: JSON.parse(localStorage.getItem('alarms')) || [],
            nextId: parseInt(localStorage.getItem('alarmNextId')) || 1
        }
    };

    // DOM ELEMENTS
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const menuOverlay = document.getElementById('menu-overlay');
    const themeToggle = document.querySelector('.theme-toggle-btn');
    const activeToolTitle = document.getElementById('active-tool-title');
    const mainTimerContainer = document.getElementById('main-timer-container');
    const mainDisplay = document.getElementById('main-display');
    const mainControls = document.getElementById('main-controls');
    const focusedToolName = document.getElementById('focused-tool-name');
    const audioAlarm = document.getElementById('audio-alarm');

    // Initialize dark mode
    if (state.isDarkMode) {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    // TAB NAVIGATION
    window.switchTab = (tabId) => {
        state.activeTab = tabId;
        
        // Update tab visibility
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        const activeTabElement = document.getElementById(tabId);
        if (activeTabElement) activeTabElement.classList.add('active');

        const toolMap = {
            'stopwatch': 'Stopwatch',
            'timer': 'Countdown Timer',
            'classroom': 'Classroom Timer',
            'race': 'Race Timer',
            'pomodoro': 'Pomodoro',
            'multitimer': 'Multi-Timer',
            'sleeptimer': 'Sleep Timer',
            'alarm': 'Alarm Clock'
        };

        if (toolMap[tabId]) {
            mainTimerContainer.classList.remove('hidden');
            focusedToolName.textContent = toolMap[tabId];
            activeToolTitle.textContent = toolMap[tabId];
            state.timer.type = tabId === 'classroom' ? 'classroom' : (tabId === 'race' ? 'race' : 'default');
            setupToolControls(tabId);
        } else {
            mainTimerContainer.classList.add('hidden');
            activeToolTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
        }

        // Close sidebar on navigation (mobile)
        sidebar.classList.remove('active');
        menuOverlay.classList.remove('active');
        
        // Scroll to top
        window.scrollTo(0, 0);
    };

    function setupToolControls(toolId) {
        mainControls.innerHTML = '';
        
        if (toolId === 'stopwatch') {
            mainDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
            createButton('Start', 'btn-primary', toggleStopwatch);
            createButton('Lap', 'btn-secondary', recordLap);
            createButton('Reset', 'btn-danger', resetStopwatch);
            
            // Display laps
            const lapsContainer = document.createElement('div');
            lapsContainer.style.marginTop = '20px';
            lapsContainer.style.maxHeight = '200px';
            lapsContainer.style.overflowY = 'auto';
            if (state.stopwatch.laps.length > 0) {
                lapsContainer.innerHTML = '<h4>Laps:</h4>';
                state.stopwatch.laps.forEach((lap, idx) => {
                    const lapEl = document.createElement('div');
                    lapEl.textContent = `Lap ${idx + 1}: ${formatTime(lap)}`;
                    lapEl.style.padding = '8px';
                    lapEl.style.borderBottom = '1px solid #ddd';
                    lapsContainer.appendChild(lapEl);
                });
            }
            mainControls.appendChild(lapsContainer);
            
        } else if (toolId === 'timer') {
            setupCountdownTimer();
            
        } else if (toolId === 'pomodoro') {
            setupPomodoroTimer();
            
        } else if (toolId === 'classroom') {
            setupClassroomTimer();
            
        } else if (toolId === 'race') {
            setupRaceTimer();
            
        } else if (toolId === 'multitimer') {
            setupMultiTimer();
            
        } else if (toolId === 'sleeptimer') {
            setupSleepTimer();
            
        } else if (toolId === 'alarm') {
            setupAlarmClock();
        }
    }

    function setupCountdownTimer() {
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
        const inputContainer = document.createElement('div');
        inputContainer.className = 'timer-inputs';
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '10px';
        inputContainer.style.marginBottom = '20px';
        inputContainer.style.justifyContent = 'center';
        inputContainer.style.flexWrap = 'wrap';
        inputContainer.innerHTML = `
            <input type="number" id="input-h" placeholder="H" min="0" max="99" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-m" placeholder="M" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-s" placeholder="S" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
        `;
        mainControls.appendChild(inputContainer);
        const ctrlGroup = document.createElement('div');
        ctrlGroup.style.display = 'flex';
        ctrlGroup.style.gap = '15px';
        ctrlGroup.style.justifyContent = 'center';
        mainControls.appendChild(ctrlGroup);
        createButton('Start', 'btn-primary', startTimer, ctrlGroup);
        createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
    }

    function setupPomodoroTimer() {
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
        const presetContainer = document.createElement('div');
        presetContainer.style.display = 'flex';
        presetContainer.style.gap = '10px';
        presetContainer.style.justifyContent = 'center';
        presetContainer.style.marginBottom = '20px';
        presetContainer.style.flexWrap = 'wrap';
        
        const presets = [
            { label: 'Work (25m)', value: 25 * 60 * 1000 },
            { label: 'Short Break (5m)', value: 5 * 60 * 1000 },
            { label: 'Long Break (15m)', value: 15 * 60 * 1000 }
        ];
        
        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.textContent = preset.label;
            btn.className = 'btn btn-secondary';
            btn.onclick = () => {
                state.timer.remainingTime = preset.value;
                mainDisplay.textContent = formatTimer(state.timer.remainingTime);
            };
            presetContainer.appendChild(btn);
        });
        
        mainControls.appendChild(presetContainer);
        const ctrlGroup = document.createElement('div');
        ctrlGroup.style.display = 'flex';
        ctrlGroup.style.gap = '15px';
        ctrlGroup.style.justifyContent = 'center';
        mainControls.appendChild(ctrlGroup);
        createButton('Start', 'btn-primary', startTimer, ctrlGroup);
        createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
    }

    function setupClassroomTimer() {
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
        const inputContainer = document.createElement('div');
        inputContainer.className = 'timer-inputs';
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '10px';
        inputContainer.style.marginBottom = '20px';
        inputContainer.style.justifyContent = 'center';
        inputContainer.innerHTML = `
            <input type="number" id="input-h" placeholder="H" min="0" max="99" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-m" placeholder="M" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-s" placeholder="S" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
        `;
        mainControls.appendChild(inputContainer);
        const ctrlGroup = document.createElement('div');
        ctrlGroup.style.display = 'flex';
        ctrlGroup.style.gap = '15px';
        ctrlGroup.style.justifyContent = 'center';
        mainControls.appendChild(ctrlGroup);
        createButton('Start', 'btn-primary', startTimer, ctrlGroup);
        createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
    }

    function setupRaceTimer() {
        mainDisplay.textContent = '00:00:00';
        const inputContainer = document.createElement('div');
        inputContainer.className = 'timer-inputs';
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '10px';
        inputContainer.style.marginBottom = '20px';
        inputContainer.style.justifyContent = 'center';
        inputContainer.innerHTML = `
            <input type="number" id="input-h" placeholder="H" min="0" max="99" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-m" placeholder="M" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
            <input type="number" id="input-s" placeholder="S" min="0" max="59" style="width: 70px; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-size: 1.2rem; text-align: center;">
        `;
        mainControls.appendChild(inputContainer);
        const ctrlGroup = document.createElement('div');
        ctrlGroup.style.display = 'flex';
        ctrlGroup.style.gap = '15px';
        ctrlGroup.style.justifyContent = 'center';
        mainControls.appendChild(ctrlGroup);
        createButton('Start', 'btn-primary', startTimer, ctrlGroup);
        createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
    }

    function setupMultiTimer() {
        const container = document.createElement('div');
        container.style.marginTop = '20px';
        
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Timer';
        addBtn.className = 'btn btn-primary';
        addBtn.onclick = () => {
            const newTimer = {
                id: state.multitimer.nextId++,
                label: `Timer ${state.multitimer.nextId}`,
                duration: 0,
                remaining: 0,
                running: false,
                interval: null
            };
            state.multitimer.timers.push(newTimer);
            saveMultiTimers();
            renderMultiTimers();
        };
        container.appendChild(addBtn);
        
        const timersList = document.createElement('div');
        timersList.id = 'multitimers-list';
        timersList.style.marginTop = '20px';
        container.appendChild(timersList);
        
        mainControls.appendChild(container);
        renderMultiTimers();
    }

    function renderMultiTimers() {
        const list = document.getElementById('multitimers-list');
        if (!list) return;
        list.innerHTML = '';
        
        state.multitimer.timers.forEach(timer => {
            const timerEl = document.createElement('div');
            timerEl.style.padding = '15px';
            timerEl.style.marginBottom = '10px';
            timerEl.style.border = '1px solid #ddd';
            timerEl.style.borderRadius = '8px';
            timerEl.style.display = 'flex';
            timerEl.style.justifyContent = 'space-between';
            timerEl.style.alignItems = 'center';
            timerEl.innerHTML = `
                <div>
                    <input type="text" value="${timer.label}" placeholder="Label" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; width: 150px;">
                    <input type="number" value="${Math.floor(timer.duration / 1000)}" placeholder="Seconds" min="0" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; width: 100px; margin-left: 10px;">
                </div>
                <div style="font-size: 1.5rem; font-weight: bold; min-width: 100px; text-align: right;">${formatTimer(timer.remaining)}</div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="window.toggleMultiTimer(${timer.id})">Start</button>
                    <button class="btn btn-danger" onclick="window.removeMultiTimer(${timer.id})">Remove</button>
                </div>
            `;
            list.appendChild(timerEl);
        });
    }

    window.toggleMultiTimer = (id) => {
        const timer = state.multitimer.timers.find(t => t.id === id);
        if (!timer) return;
        
        if (!timer.running) {
            const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
            let idx = 0;
            state.multitimer.timers.forEach(t => {
                if (t.id === id) {
                    t.label = inputs[idx].value;
                    t.duration = parseInt(inputs[idx + 1].value) * 1000 || t.duration;
                    t.remaining = t.duration;
                }
                idx += 2;
            });
            
            timer.running = true;
            timer.interval = setInterval(() => {
                timer.remaining -= 100;
                if (timer.remaining <= 0) {
                    timer.remaining = 0;
                    timer.running = false;
                    clearInterval(timer.interval);
                    audioAlarm.play();
                    showToast(`${timer.label} finished!`);
                }
                renderMultiTimers();
            }, 100);
        } else {
            timer.running = false;
            clearInterval(timer.interval);
        }
        renderMultiTimers();
    };

    window.removeMultiTimer = (id) => {
        state.multitimer.timers = state.multitimer.timers.filter(t => t.id !== id);
        saveMultiTimers();
        renderMultiTimers();
    };

    function setupSleepTimer() {
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
        const presetContainer = document.createElement('div');
        presetContainer.style.display = 'flex';
        presetContainer.style.gap = '10px';
        presetContainer.style.justifyContent = 'center';
        presetContainer.style.marginBottom = '20px';
        presetContainer.style.flexWrap = 'wrap';
        
        const presets = [
            { label: '15 min', value: 15 * 60 * 1000 },
            { label: '20 min', value: 20 * 60 * 1000 },
            { label: '30 min', value: 30 * 60 * 1000 },
            { label: '1 hour', value: 60 * 60 * 1000 }
        ];
        
        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.textContent = preset.label;
            btn.className = 'btn btn-secondary';
            btn.onclick = () => {
                state.timer.remainingTime = preset.value;
                mainDisplay.textContent = formatTimer(state.timer.remainingTime);
            };
            presetContainer.appendChild(btn);
        });
        
        mainControls.appendChild(presetContainer);
        const ctrlGroup = document.createElement('div');
        ctrlGroup.style.display = 'flex';
        ctrlGroup.style.gap = '15px';
        ctrlGroup.style.justifyContent = 'center';
        mainControls.appendChild(ctrlGroup);
        createButton('Start', 'btn-primary', startTimer, ctrlGroup);
        createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
    }

    function setupAlarmClock() {
        const container = document.createElement('div');
        container.style.marginTop = '20px';
        
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Alarm';
        addBtn.className = 'btn btn-primary';
        addBtn.onclick = () => {
            const newAlarm = {
                id: state.alarms.nextId++,
                time: '07:00',
                label: 'Alarm',
                enabled: true
            };
            state.alarms.alarms.push(newAlarm);
            saveAlarms();
            renderAlarms();
        };
        container.appendChild(addBtn);
        
        const alarmsList = document.createElement('div');
        alarmsList.id = 'alarms-list';
        alarmsList.style.marginTop = '20px';
        container.appendChild(alarmsList);
        
        mainControls.appendChild(container);
        renderAlarms();
    }

    function renderAlarms() {
        const list = document.getElementById('alarms-list');
        if (!list) return;
        list.innerHTML = '';
        
        state.alarms.alarms.forEach(alarm => {
            const alarmEl = document.createElement('div');
            alarmEl.style.padding = '15px';
            alarmEl.style.marginBottom = '10px';
            alarmEl.style.border = '1px solid #ddd';
            alarmEl.style.borderRadius = '8px';
            alarmEl.style.display = 'flex';
            alarmEl.style.justifyContent = 'space-between';
            alarmEl.style.alignItems = 'center';
            alarmEl.innerHTML = `
                <div>
                    <input type="time" value="${alarm.time}" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
                    <input type="text" value="${alarm.label}" placeholder="Label" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; margin-left: 10px; width: 150px;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="window.toggleAlarm(${alarm.id})">${alarm.enabled ? 'Disable' : 'Enable'}</button>
                    <button class="btn btn-danger" onclick="window.removeAlarm(${alarm.id})">Delete</button>
                </div>
            `;
            list.appendChild(alarmEl);
        });
    }

    window.toggleAlarm = (id) => {
        const alarm = state.alarms.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            saveAlarms();
            renderAlarms();
        }
    };

    window.removeAlarm = (id) => {
        state.alarms.alarms = state.alarms.alarms.filter(a => a.id !== id);
        saveAlarms();
        renderAlarms();
    };

    function createButton(text, className, onClick, parent = mainControls) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `btn ${className}`;
        btn.onclick = onClick;
        parent.appendChild(btn);
        return btn;
    }

    // STOPWATCH LOGIC
    function toggleStopwatch() {
        if (!state.stopwatch.running) {
            state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
            state.stopwatch.timerInterval = setInterval(updateStopwatch, 10);
            state.stopwatch.running = true;
            this.textContent = 'Pause';
        } else {
            clearInterval(state.stopwatch.timerInterval);
            state.stopwatch.running = false;
            this.textContent = 'Resume';
        }
        localStorage.setItem('stopwatchElapsed', state.stopwatch.elapsedTime);
    }

    function updateStopwatch() {
        state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
        mainDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
        localStorage.setItem('stopwatchElapsed', state.stopwatch.elapsedTime);
    }

    function resetStopwatch() {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.elapsedTime = 0;
        state.stopwatch.running = false;
        state.stopwatch.laps = [];
        mainDisplay.textContent = formatTime(0);
        localStorage.setItem('stopwatchElapsed', 0);
        localStorage.setItem('stopwatchLaps', JSON.stringify([]));
        const startBtn = Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Pause' || b.textContent === 'Resume');
        if (startBtn) startBtn.textContent = 'Start';
        setupToolControls('stopwatch');
    }

    function recordLap() {
        if (state.stopwatch.running) {
            state.stopwatch.laps.push(state.stopwatch.elapsedTime);
            localStorage.setItem('stopwatchLaps', JSON.stringify(state.stopwatch.laps));
            showToast(`Lap ${state.stopwatch.laps.length}: ${formatTime(state.stopwatch.elapsedTime)}`);
            setupToolControls('stopwatch');
        }
    }

    // TIMER LOGIC
    function startTimer() {
        if (!state.timer.running) {
            if (state.timer.remainingTime === 0) {
                const h = parseInt(document.getElementById('input-h')?.value) || 0;
                const m = parseInt(document.getElementById('input-m')?.value) || 0;
                const s = parseInt(document.getElementById('input-s')?.value) || 0;
                state.timer.remainingTime = (h * 3600 + m * 60 + s) * 1000;
            }
            if (state.timer.remainingTime <= 0) {
                showToast("Please set a time first!");
                return;
            }
            state.timer.endTime = Date.now() + state.timer.remainingTime;
            state.timer.timerInterval = setInterval(updateTimer, 100);
            state.timer.running = true;
            this.textContent = 'Pause';
        } else {
            clearInterval(state.timer.timerInterval);
            state.timer.running = false;
            this.textContent = 'Resume';
        }
    }

    function updateTimer() {
        state.timer.remainingTime = state.timer.endTime - Date.now();
        if (state.timer.remainingTime <= 0) {
            state.timer.remainingTime = 0;
            clearInterval(state.timer.timerInterval);
            state.timer.running = false;
            audioAlarm.play();
            showToast(state.timer.type === 'classroom' ? "Classroom Time's Up!" : "Time's Up!");
            const startBtn = Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Pause' || b.textContent === 'Resume');
            if (startBtn) startBtn.textContent = 'Start';
        }
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
    }

    function resetTimer() {
        clearInterval(state.timer.timerInterval);
        state.timer.remainingTime = 0;
        state.timer.running = false;
        mainDisplay.textContent = formatTimer(0);
        const startBtn = Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Pause' || b.textContent === 'Resume');
        if (startBtn) startBtn.textContent = 'Start';
    }

    // HELPERS
    function formatTime(ms) {
        const date = new Date(ms);
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms2 = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
        return `${mm}:${ss}.${ms2}`;
    }

    function formatTimer(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'glass-card toast';
        toast.style.padding = '15px 25px';
        toast.style.background = state.isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'white';
        toast.style.color = state.isDarkMode ? 'white' : '#1e293b';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        toast.style.marginBottom = '10px';
        toast.style.animation = 'slideIn 0.3s ease';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function saveMultiTimers() {
        localStorage.setItem('multiTimers', JSON.stringify(state.multitimer.timers));
        localStorage.setItem('multiTimerNextId', state.multitimer.nextId);
    }

    function saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(state.alarms.alarms));
        localStorage.setItem('alarmNextId', state.alarms.nextId);
    }

    // EVENT LISTENERS
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    });

    menuOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    themeToggle.addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        body.classList.toggle('dark-mode', state.isDarkMode);
        themeToggle.innerHTML = state.isDarkMode ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('darkMode', state.isDarkMode);
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && state.activeTab === 'stopwatch') {
            e.preventDefault();
            const startBtn = Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Start' || b.textContent === 'Pause' || b.textContent === 'Resume');
            if (startBtn) startBtn.click();
        }
    });

    // Close sidebar if clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggle) {
            sidebar.classList.remove('active');
            menuOverlay.classList.remove('active');
        }
    });

    // Initialize
    window.switchTab('home');
});
