/* ============================================ */
/* TIMER ACTIVITY - Componente                  */
/* Cronómetro para actividades distractoras     */
/* ============================================ */

// ✅ Inyectar HTML del timer al DOM
function injectTimerHTML() {
    // Verificar si ya existe el modal
    if (document.getElementById('timerModal')) return;

    const timerHTML = `
        <div class="timer-modal-overlay" id="timerModal">
            <div class="timer-modal">
                <button class="timer-close" id="timerCloseBtn">
                    <i class="fas fa-times"></i>
                </button>

                <h2 class="timer-title" id="timerTitle">🏋️ Actividad</h2>

                <div class="timer-circle-wrapper">
                    <svg class="timer-circle" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" class="timer-circle-bg"/>
                        <circle cx="60" cy="60" r="54" fill="none" class="timer-circle-progress" id="timerCircleProgress"/>
                    </svg>
                    <div class="timer-time-display" id="timerTimeDisplay">10:00</div>
                </div>

                <div class="timer-progress-bar-wrapper">
                    <div class="timer-progress-bar" id="timerProgressBar" style="width: 100%;"></div>
                </div>

                <div class="timer-info">
                    <span class="timer-info-item">
                        <i class="fas fa-clock"></i>
                        <span id="timerCurrentTime">0:00</span>
                        <span class="timer-info-separator">/</span>
                        <span id="timerTotalTime">10:00</span>
                    </span>
                    <span class="timer-info-item">
                        <i class="fas fa-percentage"></i>
                        <span id="timerPercentage">0%</span>
                    </span>
                </div>

                <div class="timer-message" id="timerMessage" style="display: none;">
                    <i class="fas fa-trophy timer-message-icon"></i>
                    <p class="timer-message-text" id="timerMessageText">¡Cada día más cerca de tu meta! 🏆</p>
                </div>

                <div class="timer-controls">
                    <button class="btn timer-btn timer-btn-pause" id="timerPauseBtn">
                        <i class="fas fa-pause"></i>
                        PAUSAR
                    </button>
                    <button class="btn timer-btn timer-btn-reset" id="timerResetBtn">
                        <i class="fas fa-undo"></i>
                        REINICIAR
                    </button>
                </div>

                <button class="btn btn-primary timer-btn-complete" id="timerCompleteBtn" style="display: none;">
                    <i class="fas fa-check-circle"></i>
                    COMPLETADO
                </button>
            </div>
        </div>
    `;

    // Inyectar al final del body
    document.body.insertAdjacentHTML('beforeend', timerHTML);
}

// ✅ Inyectar al cargar
injectTimerHTML();

class TimerActivity {
    constructor(options = {}) {
        this.activityId = options.activityId || null;
        this.title = options.title || 'Actividad';
        this.duration = options.duration || 10; // minutos
        this.onComplete = options.onComplete || null;

        // Estado del timer
        this.timeRemaining = this.duration * 60;
        this.totalTime = this.duration * 60;
        this.isRunning = false;
        this.isPaused = false;
        this.isCompleted = false;
        this.intervalId = null;

        // Frases motivacionales
        this.phrases = [
            "¡Cada día más cerca de tu meta! 🏆",
            "Un paso más hacia la victoria ⚔️",
            "La disciplina es el puente entre la meta y el logro 💪",
            "El guerrero no se rinde, se transforma 🔥",
            "Esta batalla la estás ganando 🏅",
            "La constancia vence al talento 🌟",
            "Cada minuto cuenta en tu camino ✨",
            "El cambio comienza con una decisión 🚀",
            "Eres más fuerte de lo que crees ⚡",
            "Hoy estás forjando un mejor mañana 🛡️",
            "La victoria es de los persistentes 🎯",
            "Tu disciplina inspira a otros 🔥",
            "El dolor es temporal, la gloria es eterna ⚡",
            "Cada batalla te hace más fuerte 💪",
            "No pares, cada paso cuenta 🏃"
        ];

        this.elements = {};
        this.modal = document.getElementById('timerModal');
        this.isOpen = false;

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#timerCloseBtn')) {
                this.close();
            }
        });

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#timerPauseBtn');
            if (btn) {
                this.togglePause();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#timerResetBtn')) {
                this.reset();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#timerCompleteBtn')) {
                this.handleComplete();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        if (this.isOpen) return;

        this.timeRemaining = this.totalTime;
        this.isRunning = false;
        this.isPaused = false;
        this.isCompleted = false;
        this.stopTimer();

        this.cacheElements();

        this.updateTitle();
        this.updateTimeDisplay();
        this.updateCircle();
        this.updateProgressBar();
        this.updateInfo();
        this.hideMessage();
        this.hideCompleteButton();

        this.modal.classList.add('active');
        this.isOpen = true;

        setTimeout(() => {
            this.start();
        }, 500);

        document.dispatchEvent(new CustomEvent('timer:opened', {
            detail: { activityId: this.activityId }
        }));
    }

    close() {
        if (!this.isOpen) return;

        this.stopTimer();
        this.modal.classList.remove('active');
        this.isOpen = false;
        this.isRunning = false;

        document.dispatchEvent(new CustomEvent('timer:closed', {
            detail: { activityId: this.activityId }
        }));
    }

    cacheElements() {
        this.elements = {
            title: document.getElementById('timerTitle'),
            timeDisplay: document.getElementById('timerTimeDisplay'),
            circle: document.getElementById('timerCircleProgress'),
            progressBar: document.getElementById('timerProgressBar'),
            currentTime: document.getElementById('timerCurrentTime'),
            totalTime: document.getElementById('timerTotalTime'),
            percentage: document.getElementById('timerPercentage'),
            message: document.getElementById('timerMessage'),
            messageText: document.getElementById('timerMessageText'),
            pauseBtn: document.getElementById('timerPauseBtn'),
            completeBtn: document.getElementById('timerCompleteBtn')
        };
    }

    updateTitle() {
        if (this.elements.title) {
            this.elements.title.textContent = `🏋️ ${this.title}`;
        }
        if (this.elements.totalTime) {
            this.elements.totalTime.textContent = this.formatTime(this.totalTime);
        }
    }

    updateTimeDisplay() {
        if (this.elements.timeDisplay) {
            this.elements.timeDisplay.textContent = this.formatTime(this.timeRemaining);
        }
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(this.timeRemaining);
        }
    }

    updateCircle() {
        if (!this.elements.circle) return;

        const circumference = 339.292;
        const progress = this.timeRemaining / this.totalTime;
        const offset = circumference * (1 - progress);

        this.elements.circle.style.strokeDashoffset = offset;

        const percent = progress * 100;
        this.elements.circle.classList.remove('warning', 'danger', 'complete');

        if (this.isCompleted) {
            this.elements.circle.classList.add('complete');
        } else if (percent <= 20) {
            this.elements.circle.classList.add('danger');
        } else if (percent <= 50) {
            this.elements.circle.classList.add('warning');
        }
    }

    updateProgressBar() {
        if (!this.elements.progressBar) return;
        const percent = (this.timeRemaining / this.totalTime) * 100;
        this.elements.progressBar.style.width = `${percent}%`;
    }

    updateInfo() {
        if (!this.elements.percentage) return;
        const percent = Math.round((this.timeRemaining / this.totalTime) * 100);
        this.elements.percentage.textContent = `${100 - percent}%`;
    }

    showMessage() {
        if (!this.elements.message || !this.elements.messageText) return;

        const randomIndex = Math.floor(Math.random() * this.phrases.length);
        this.elements.messageText.textContent = this.phrases[randomIndex];
        this.elements.message.style.display = 'block';
    }

    hideMessage() {
        if (this.elements.message) {
            this.elements.message.style.display = 'none';
        }
    }

    showCompleteButton() {
        if (this.elements.completeBtn) {
            this.elements.completeBtn.style.display = 'flex';
        }
    }

    hideCompleteButton() {
        if (this.elements.completeBtn) {
            this.elements.completeBtn.style.display = 'none';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    start() {
        if (this.isRunning || this.isCompleted) return;

        this.isRunning = true;
        this.isPaused = false;
        this.updatePauseButton();

        this.intervalId = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining -= 1;

                this.updateTimeDisplay();
                this.updateCircle();
                this.updateProgressBar();
                this.updateInfo();

                if (this.timeRemaining <= 0) {
                    this.timeRemaining = 0;
                    this.updateTimeDisplay();
                    this.updateCircle();
                    this.updateProgressBar();
                    this.updateInfo();
                    this.completeTimer();
                }
            }
        }, 1000);

        document.dispatchEvent(new CustomEvent('timer:started', {
            detail: { activityId: this.activityId }
        }));
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    togglePause() {
        if (this.isCompleted) return;

        if (this.isRunning) {
            this.isPaused = !this.isPaused;
            this.updatePauseButton();

            document.dispatchEvent(new CustomEvent(this.isPaused ? 'timer:paused' : 'timer:resumed', {
                detail: { activityId: this.activityId }
            }));
        } else {
            this.start();
        }
    }

    updatePauseButton() {
        if (!this.elements.pauseBtn) return;

        if (this.isPaused) {
            this.elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> REANUDAR';
            this.elements.pauseBtn.classList.add('resume');
        } else {
            this.elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSAR';
            this.elements.pauseBtn.classList.remove('resume');
        }
    }

    reset() {
        if (this.isCompleted) {
            this.isCompleted = false;
            this.hideCompleteButton();
            this.hideMessage();
        }

        this.stopTimer();
        this.timeRemaining = this.totalTime;
        this.isRunning = false;
        this.isPaused = false;

        this.updateTimeDisplay();
        this.updateCircle();
        this.updateProgressBar();
        this.updateInfo();
        this.updatePauseButton();

        document.dispatchEvent(new CustomEvent('timer:reset', {
            detail: { activityId: this.activityId }
        }));

        setTimeout(() => {
            this.start();
        }, 300);
    }

    completeTimer() {
        this.stopTimer();
        this.isRunning = false;
        this.isCompleted = true;

        this.showMessage();
        this.showCompleteButton();

        this.elements.circle.classList.remove('warning', 'danger');
        this.elements.circle.classList.add('complete');

        document.dispatchEvent(new CustomEvent('timer:completed', {
            detail: { 
                activityId: this.activityId,
                title: this.title,
                duration: this.duration
            }
        }));

        this.playCompleteSound();
    }

    handleComplete() {
        document.dispatchEvent(new CustomEvent('timer:complete-confirmed', {
            detail: { 
                activityId: this.activityId,
                title: this.title,
                duration: this.duration
            }
        }));

        if (this.onComplete) {
            this.onComplete(this.activityId);
        }

        this.close();
    }

    playCompleteSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 300);
        } catch (e) {}
    }

    setDuration(minutes) {
        this.duration = minutes;
        this.totalTime = minutes * 60;
        this.timeRemaining = this.totalTime;
    }
}

// ============================================ //
// EXPORTAR INSTANCIA Y FUNCIÓN                 //
// ============================================ //

export const timerInstance = new TimerActivity();

export function openTimerModal(options) {
    const { activityId, title, duration, onComplete } = options;

    timerInstance.activityId = activityId;
    timerInstance.title = title;
    timerInstance.duration = duration;
    timerInstance.totalTime = duration * 60;
    timerInstance.timeRemaining = duration * 60;
    timerInstance.onComplete = onComplete;

    timerInstance.open();
}