// PulseTime Pro - Optimized Script
(function() {
    'use strict';
    
    // Defer non-critical initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        requestIdleCallback(initializeApp, { timeout: 2000 });
    }

    function initializeApp() {
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
                mainControls.innerHTML = `
                    <button class="control-btn primary-btn" onclick="window.toggleStopwatch()">
                        <i class="fa-solid fa-play" aria-hidden="true"></i> Start
                    </button>
                    <button class="control-btn" onclick="window.pauseStopwatch()">
                        <i class="fa-solid fa-pause" aria-hidden="true"></i> Pause
                    </button>
                    <button class="control-btn" onclick="window.lapStopwatch()">
                        <i class="fa-solid fa-flag" aria-hidden="true"></i> Lap
                    </button>
                    <button class="control-btn danger-btn" onclick="window.resetStopwatch()">
                        <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset
                    </button>
                `;
            } else if (toolId === 'timer' || toolId === 'pomodoro') {
                mainControls.innerHTML = `
                    <div class="timer-input-group">
                        <input type="number" id="timer-minutes" min="0" max="999" placeholder="Minutes" aria-label="Minutes" value="25">
                        <input type="number" id="timer-seconds" min="0" max="59" placeholder="Seconds" aria-label="Seconds" value="0">
                    </div>
                    <button class="control-btn primary-btn" onclick="window.startTimer()">
                        <i class="fa-solid fa-play" aria-hidden="true"></i> Start
                    </button>
                    <button class="control-btn" onclick="window.pauseTimer()">
                        <i class="fa-solid fa-pause" aria-hidden="true"></i> Pause
                    </button>
                    <button class="control-btn danger-btn" onclick="window.resetTimer()">
                        <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset
                    </button>
                `;
            }
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

        window.lapStopwatch = () => {
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
            
            const totalSeconds = Math.floor(state.stopwatch.elapsedTime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const milliseconds = Math.floor((state.stopwatch.elapsedTime % 1000) / 10);
            
            mainDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
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
            
            const totalSeconds = Math.floor(state.timer.remainingTime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            mainDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            if (state.timer.remainingTime <= 0) {
                clearInterval(state.timer.timerInterval);
                state.timer.running = false;
                playAlarmSound();
            }
        }

        function playAlarmSound() {
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
        }

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
    }
})();
