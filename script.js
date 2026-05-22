document.addEventListener('DOMContentLoaded', () => {
    // STATE
    const state = {
        activeTab: 'home',
        isDarkMode: false,
        stopwatch: {
            startTime: 0,
            elapsedTime: 0,
            timerInterval: null,
            running: false,
            laps: []
        },
        timer: {
            endTime: 0,
            remainingTime: 0,
            timerInterval: null,
            running: false,
            type: 'default' // 'default', 'egg', 'classroom', 'race'
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

    // TAB NAVIGATION
    window.switchTab = (tabId) => {
        state.activeTab = tabId;
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

        sidebar.classList.remove('active');
        menuOverlay.classList.remove('active');
    };

    function setupToolControls(toolId) {
        mainControls.innerHTML = '';
        if (toolId === 'stopwatch') {
            mainDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
            createButton('Start', 'btn-primary', toggleStopwatch);
            createButton('Lap', 'btn-secondary', recordLap);
            createButton('Reset', 'btn-danger', resetStopwatch);
        } else if (['timer', 'classroom', 'race', 'pomodoro', 'sleeptimer'].includes(toolId)) {
            mainDisplay.textContent = formatTimer(state.timer.remainingTime);
            const inputContainer = document.createElement('div');
            inputContainer.style.display = 'flex';
            inputContainer.style.gap = '10px';
            inputContainer.style.marginBottom = '20px';
            inputContainer.innerHTML = `
                <input type="number" id="input-h" placeholder="H" style="width: 60px; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <input type="number" id="input-m" placeholder="M" style="width: 60px; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                <input type="number" id="input-s" placeholder="S" style="width: 60px; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
            `;
            mainControls.appendChild(inputContainer);
            const ctrlGroup = document.createElement('div');
            ctrlGroup.style.display = 'flex';
            ctrlGroup.style.gap = '10px';
            mainControls.appendChild(ctrlGroup);
            createButton('Start', 'btn-primary', startTimer, ctrlGroup);
            createButton('Reset', 'btn-danger', resetTimer, ctrlGroup);
        } else {
            mainDisplay.textContent = "Coming Soon";
            createButton('Back to Home', 'btn-primary', () => window.switchTab('home'));
        }
    }

    function createButton(text, className, onClick, parent = mainControls) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `btn ${className}`;
        btn.onclick = onClick;
        parent.appendChild(btn);
        return btn;
    }

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
    }

    function updateStopwatch() {
        state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
        mainDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
    }

    function resetStopwatch() {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.elapsedTime = 0;
        state.stopwatch.running = false;
        state.stopwatch.laps = [];
        mainDisplay.textContent = formatTime(0);
        const startBtn = Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Pause' || b.textContent === 'Resume');
        if (startBtn) startBtn.textContent = 'Start';
    }

    function recordLap() {
        if (state.stopwatch.running) {
            state.stopwatch.laps.push(state.stopwatch.elapsedTime);
            showToast(`Lap ${state.stopwatch.laps.length}: ${formatTime(state.stopwatch.elapsedTime)}`);
        }
    }

    function startTimer() {
        if (!state.timer.running) {
            if (state.timer.remainingTime === 0) {
                const h = parseInt(document.getElementById('input-h').value) || 0;
                const m = parseInt(document.getElementById('input-m').value) || 0;
                const s = parseInt(document.getElementById('input-s').value) || 0;
                state.timer.remainingTime = (h * 3600 + m * 60 + s) * 1000;
            }
            if (state.timer.remainingTime <= 0) return;
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
        toast.style.background = 'white';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        toast.style.marginBottom = '10px';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    menuToggle.addEventListener('click', () => {
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
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && state.activeTab === 'stopwatch') {
            e.preventDefault();
            toggleStopwatch.call(Array.from(mainControls.querySelectorAll('.btn')).find(b => b.textContent === 'Start' || b.textContent === 'Pause' || b.textContent === 'Resume'));
        }
    });

    window.switchTab('home');
});
