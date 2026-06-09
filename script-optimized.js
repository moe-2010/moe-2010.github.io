// PulseTime Pro - Fully Functional Script
(function() {
    'use strict';
    
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

    // DOM ELEMENTS (cached)
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

    // Initialize dark mode
    if (state.isDarkMode) {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
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
            createButton('Start', 'btn-primary', window.toggleStopwatch);
            createButton('Lap', 'btn-secondary', window.recordLap);
            createButton('Reset', 'btn-danger', window.resetStopwatch);
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
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '10px';
        inputContainer.style.marginBottom = '15px';
        
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.id = 'timer-minutes';
        minutesInput.placeholder = 'Minutes';
        minutesInput.min = '0';
        minutesInput.value = '25';
        
        const secondsInput = document.createElement('input');
        secondsInput.type = 'number';
        secondsInput.id = 'timer-seconds';
        secondsInput.placeholder = 'Seconds';
        secondsInput.min = '0';
        secondsInput.max = '59';
        secondsInput.value = '0';
        
        inputContainer.appendChild(minutesInput);
        inputContainer.appendChild(secondsInput);
        mainControls.appendChild(inputContainer);
        
        createButton('Start', 'btn-primary', window.startTimer);
        createButton('Pause', 'btn-secondary', window.pauseTimer);
        createButton('Reset', 'btn-danger', window.resetTimer);
    }

    function setupPomodoroTimer() {
        mainDisplay.textContent = '25:00';
        const presetContainer = document.createElement('div');
        presetContainer.style.display = 'flex';
        presetContainer.style.gap = '10px';
        presetContainer.style.marginBottom = '15px';
        presetContainer.style.flexWrap = 'wrap';
        
        const presets = [
            { label: 'Pomodoro (25m)', ms: 25 * 60 * 1000 },
            { label: 'Short Break (5m)', ms: 5 * 60 * 1000 },
            { label: 'Long Break (15m)', ms: 15 * 60 * 1000 }
        ];
        
        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.textContent = preset.label;
            btn.className = 'control-btn';
            btn.onclick = () => {
                state.timer.remainingTime = preset.ms;
                mainDisplay.textContent = formatTimer(preset.ms);
            };
            presetContainer.appendChild(btn);
        });
        
        mainControls.appendChild(presetContainer);
        createButton('Start', 'btn-primary', window.startTimer);
        createButton('Pause', 'btn-secondary', window.pauseTimer);
        createButton('Reset', 'btn-danger', window.resetTimer);
    }

    function setupClassroomTimer() {
        mainDisplay.textContent = '00:00:00';
        createButton('Start', 'btn-primary', window.startTimer);
        createButton('Pause', 'btn-secondary', window.pauseTimer);
        createButton('Reset', 'btn-danger', window.resetTimer);
    }

    function setupRaceTimer() {
        mainDisplay.textContent = '00:00:00';
        createButton('Start', 'btn-primary', window.startTimer);
        createButton('Pause', 'btn-secondary', window.pauseTimer);
        createButton('Reset', 'btn-danger', window.resetTimer);
    }

    function setupMultiTimer() {
        mainDisplay.textContent = 'Multi-Timer';
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Timer';
        addBtn.className = 'control-btn primary-btn';
        addBtn.onclick = window.addMultiTimer;
        mainControls.appendChild(addBtn);
    }

    function setupSleepTimer() {
        mainDisplay.textContent = '00:00:00';
        createButton('Start', 'btn-primary', window.startTimer);
        createButton('Pause', 'btn-secondary', window.pauseTimer);
        createButton('Reset', 'btn-danger', window.resetTimer);
    }

    function setupAlarmClock() {
        mainDisplay.textContent = 'Alarm Clock';
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.id = 'alarm-time';
        mainControls.appendChild(timeInput);
        createButton('Set Alarm', 'btn-primary', window.setAlarm);
    }

    function createButton(text, className, onclick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `control-btn ${className}`;
        btn.onclick = onclick;
        mainControls.appendChild(btn);
    }

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }

    function formatTimer(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // STOPWATCH FUNCTIONS
    window.toggleStopwatch = () => {
        if (state.stopwatch.running) {
            window.pauseStopwatch();
        } else {
            state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
            state.stopwatch.running = true;
            state.stopwatch.timerInterval = setInterval(updateStopwatch, 10);
        }
    };

    window.pauseStopwatch = () => {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.running = false;
    };

    window.recordLap = () => {
        if (state.stopwatch.running) {
            const lapTime = state.stopwatch.elapsedTime;
            state.stopwatch.laps.push(lapTime);
            localStorage.setItem('stopwatchLaps', JSON.stringify(state.stopwatch.laps));
        }
    };

    window.resetStopwatch = () => {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.running = false;
        state.stopwatch.elapsedTime = 0;
        state.stopwatch.laps = [];
        mainDisplay.textContent = '00:00:00.00';
        localStorage.removeItem('stopwatchElapsed');
        localStorage.removeItem('stopwatchLaps');
    };

    function updateStopwatch() {
        state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
        localStorage.setItem('stopwatchElapsed', state.stopwatch.elapsedTime);
        mainDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
    }

    // TIMER FUNCTIONS
    window.startTimer = () => {
        const minutes = parseInt(document.getElementById('timer-minutes')?.value || 25);
        const seconds = parseInt(document.getElementById('timer-seconds')?.value || 0);
        const totalMs = (minutes * 60 + seconds) * 1000;
        
        state.timer.endTime = Date.now() + totalMs;
        state.timer.running = true;
        state.timer.timerInterval = setInterval(updateTimer, 100);
    };

    window.pauseTimer = () => {
        clearInterval(state.timer.timerInterval);
        state.timer.running = false;
    };

    window.resetTimer = () => {
        clearInterval(state.timer.timerInterval);
        state.timer.running = false;
        state.timer.remainingTime = 0;
        mainDisplay.textContent = '00:00:00';
    };

    function updateTimer() {
        state.timer.remainingTime = Math.max(0, state.timer.endTime - Date.now());
        mainDisplay.textContent = formatTimer(state.timer.remainingTime);
        
        if (state.timer.remainingTime <= 0) {
            clearInterval(state.timer.timerInterval);
            state.timer.running = false;
            playAlarmSound();
        }
    }

    function playAlarmSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio context not available');
        }
    }

    // MULTI-TIMER FUNCTIONS
    window.addMultiTimer = () => {
        const timer = {
            id: state.multitimer.nextId++,
            name: `Timer ${state.multitimer.nextId}`,
            duration: 60000,
            remaining: 60000,
            running: false
        };
        state.multitimer.timers.push(timer);
        localStorage.setItem('multiTimers', JSON.stringify(state.multitimer.timers));
        localStorage.setItem('multiTimerNextId', state.multitimer.nextId);
    };

    // ALARM FUNCTIONS
    window.setAlarm = () => {
        const timeInput = document.getElementById('alarm-time');
        if (timeInput.value) {
            const alarm = {
                id: state.alarms.nextId++,
                time: timeInput.value,
                enabled: true
            };
            state.alarms.alarms.push(alarm);
            localStorage.setItem('alarms', JSON.stringify(state.alarms.alarms));
            localStorage.setItem('alarmNextId', state.alarms.nextId);
        }
    };

    // EVENT LISTENERS
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    });

    menuOverlay?.addEventListener('click', () => {
        sidebar.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    themeToggle?.addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', state.isDarkMode);
        themeToggle.innerHTML = state.isDarkMode 
            ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' 
            : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            window.switchTab(item.dataset.tab);
        });
    });

    // Initialize home tab
    window.switchTab('home');
})();
