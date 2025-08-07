// Focus Mode Manager for WeekDeck
// Provides distraction-free interface with Pomodoro timer

class FocusModeManager {
  constructor() {
    this.isActive = false;
    this.originalElements = {};
    this.focusOverlay = null;
    this.currentTask = null;
    this.pomodoroTimer = new PomodoroTimer();
    this.toast = null;
    
    this.init();
  }

  init() {
    console.log('🎯 FocusModeManager: Initializing...');
    this.createFocusOverlay();
    this.setupFocusOverlayEvents();
    this.createToast();
    this.setupKeyboardShortcuts();
  }

  // Create the focus mode overlay
  createFocusOverlay() {
    this.focusOverlay = document.createElement('div');
    this.focusOverlay.className = 'focus-mode-overlay modal-overlay';
    this.focusOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: 'Space Mono', monospace;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    this.focusOverlay.innerHTML = `
      <div class="focus-mode-container modal-container" style="
        max-width: 800px;
        width: 90%;
        text-align: center;
        padding: 2rem;
        position: relative;
      ">
        <!-- Close button -->
        <button class="focus-close-btn" style="
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        " title="Exit Focus Mode (Esc)">
          <span class="material-symbols-outlined">close</span>
        </button>

        <!-- Focus Mode Title -->
        <h1 style="
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #333;
          font-weight: 700;
        ">Focus Mode</h1>

        <!-- Current Task Display -->
        <div class="focus-current-task" style="
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--active-color, #155dfc);
        ">
          <h2 style="
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 400;
          ">Current Task</h2>
          <div class="focus-task-title" style="
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 0.5rem;
          "></div>
          <div class="focus-task-desc" style="
            font-size: 1rem;
            color: #666;
            line-height: 1.5;
          "></div>
        </div>

        <!-- Pomodoro Timer -->
        <div class="pomodoro-container" style="
          margin-bottom: 2rem;
        ">
          <!-- Timer Display with Editable Fields -->
          <div class="pomodoro-display-container" style="
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            font-family: 'Space Mono', monospace;
          ">
            <div class="time-field" style="text-align: center;">
              <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">Horas</div>
              <input type="number" class="time-input hours-input" value="0" min="0" max="23" style="
                width: 120px;
                font-size: 4rem;
                font-weight: 700;
                color: var(--active-color, #155dfc);
                background: #f5f5f5;
                border: none;
                border-radius: 12px;
                text-align: center;
                font-family: 'Space Mono', monospace;
                outline: none;
                padding: 0.5rem 0.2rem;
                transition: background-color 0.2s ease;
              ">
            </div>
            <div style="display: flex; align-items: center; height: 100%; margin-top: 1.5rem;">
              <span style="font-size: 4rem; font-weight: 700; color: var(--active-color, #155dfc); margin: 0 0.5rem;">:</span>
            </div>
            <div class="time-field" style="text-align: center;">
              <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">Minutos</div>
              <input type="number" class="time-input minutes-input" value="25" min="0" max="59" style="
                width: 120px;
                font-size: 4rem;
                font-weight: 700;
                color: var(--active-color, #155dfc);
                background: #f5f5f5;
                border: none;
                border-radius: 12px;
                text-align: center;
                font-family: 'Space Mono', monospace;
                outline: none;
                padding: 0.5rem 0.2rem;
                transition: background-color 0.2s ease;
              ">
            </div>
            <div style="display: flex; align-items: center; height: 100%; margin-top: 1.5rem;">
              <span style="font-size: 4rem; font-weight: 700; color: var(--active-color, #155dfc); margin: 0 0.5rem;">:</span>
            </div>
            <div class="time-field" style="text-align: center;">
              <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">Segundos</div>
              <input type="number" class="time-input seconds-input" value="0" min="0" max="59" style="
                width: 120px;
                font-size: 4rem;
                font-weight: 700;
                color: var(--active-color, #155dfc);
                background: #f5f5f5;
                border: none;
                border-radius: 12px;
                text-align: center;
                font-family: 'Space Mono', monospace;
                outline: none;
                padding: 0.5rem 0.2rem;
                transition: background-color 0.2s ease;
              ">
            </div>
          </div>
          
          <div class="pomodoro-controls" style="
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 1rem;
          ">
            <button class="pomodoro-btn pomodoro-start" style="
              padding: 1rem;
              background: var(--active-color, #155dfc);
              color: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 60px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span class="material-symbols-outlined" style="font-size: 2rem;">play_arrow</span>
            </button>
            
            <button class="pomodoro-btn pomodoro-pause" style="
              padding: 1rem;
              background: #ffc107;
              color: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 60px;
              height: 60px;
              display: none;
              align-items: center;
              justify-content: center;
            ">
              <span class="material-symbols-outlined" style="font-size: 2rem;">pause</span>
            </button>
            
            <button class="pomodoro-btn pomodoro-reset" style="
              padding: 1rem;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 60px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span class="material-symbols-outlined" style="font-size: 2rem;">history</span>
            </button>
            
            <button class="pomodoro-btn pomodoro-end" style="
              padding: 1rem;
              background: #dc3545;
              color: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 60px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span class="material-symbols-outlined" style="font-size: 2rem;">stop_circle</span>
            </button>
          </div>
        </div>




      </div>
    `;

    document.body.appendChild(this.focusOverlay);
    this.setupFocusOverlayEvents();
  }

  // Setup event listeners for focus overlay
  setupFocusOverlayEvents() {
    // Close button - only closes modal, doesn't exit focus mode
    const closeBtn = this.focusOverlay.querySelector('.focus-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeFocusModal();
      });
    }

    // Pomodoro controls
    const startBtn = this.focusOverlay.querySelector('.pomodoro-start');
    const pauseBtn = this.focusOverlay.querySelector('.pomodoro-pause');
    const resetBtn = this.focusOverlay.querySelector('.pomodoro-reset');
    const endBtn = this.focusOverlay.querySelector('.pomodoro-end');

    startBtn.addEventListener('click', () => {
      if (!this.currentTask) {
        this.showNotification('Please select a task first', 'warning');
        return;
      }
      this.pomodoroTimer.start();
      // Close modal and show toast when timer starts
      this.focusOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.showToast();
    });
    pauseBtn.addEventListener('click', () => this.pomodoroTimer.pause());
    resetBtn.addEventListener('click', () => this.pomodoroTimer.reset());
    endBtn.addEventListener('click', () => this.exitFocusMode());

    // Time input settings
    const hoursInput = this.focusOverlay.querySelector('.hours-input');
    const minutesInput = this.focusOverlay.querySelector('.minutes-input');
    const secondsInput = this.focusOverlay.querySelector('.seconds-input');

    // Update timer when time inputs change
    const updateTimerFromInputs = () => {
      const hours = parseInt(hoursInput.value) || 0;
      const minutes = parseInt(minutesInput.value) || 0;
      const seconds = parseInt(secondsInput.value) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      this.pomodoroTimer.setWorkDurationInSeconds(Math.max(1, totalSeconds));
    };

    // Format and validate inputs
    const formatInput = (input, max) => {
      let value = parseInt(input.value) || 0;
      value = Math.max(0, Math.min(max, value));
      input.value = value.toString().padStart(2, '0');
      return value;
    };

    hoursInput.addEventListener('input', () => {
      formatInput(hoursInput, 23);
      updateTimerFromInputs();
    });
    minutesInput.addEventListener('input', () => {
      formatInput(minutesInput, 59);
      updateTimerFromInputs();
    });
    secondsInput.addEventListener('input', () => {
      formatInput(secondsInput, 59);
      updateTimerFromInputs();
    });

    // Format inputs on blur to ensure proper display
    hoursInput.addEventListener('blur', () => formatInput(hoursInput, 23));
    minutesInput.addEventListener('blur', () => formatInput(minutesInput, 59));
    secondsInput.addEventListener('blur', () => formatInput(secondsInput, 59));

    // Listen to pomodoro events
    document.addEventListener('pomodoroTick', (e) => {
      this.updatePomodoroDisplay(e.detail.timeLeft, e.detail.isBreak);
      // Update toast if visible
      if (this.toast && this.toast.style.display === 'block') {
        this.updateToastContent();
      }
    });

    document.addEventListener('pomodoroComplete', (e) => {
      this.handlePomodoroComplete(e.detail.isBreak);
    });

    document.addEventListener('pomodoroStateChange', (e) => {
      this.updatePomodoroControls(e.detail.state);
    });
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape to close focus modal (not exit focus mode)
      if (e.key === 'Escape' && this.isActive && this.focusOverlay.style.display === 'flex') {
        this.closeFocusModal();
      }
      
      // F key to enter focus mode (when not in input)
      if (e.key === 'f' && !this.isActive && !e.target.matches('input, textarea')) {
        e.preventDefault();
        this.enterFocusMode();
      }
      
      // Space to start/pause timer in focus mode
      if (e.key === ' ' && this.isActive && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (this.pomodoroTimer.isRunning) {
          this.pomodoroTimer.pause();
        } else {
          this.pomodoroTimer.start();
        }
      }
    });
  }

  // Enter focus mode
  enterFocusMode(task = null) {
    console.log('🎯 Entering focus mode...');
    
    this.isActive = true;
    
    // Use preselected task if available
    if (this.selectedTask) {
      this.currentTask = this.selectedTask;
    } else {
      this.currentTask = task;
    }
    
    // Hide main interface
    document.body.style.overflow = 'hidden';
    
    // Show focus overlay with initial hidden state
    this.focusOverlay.style.display = 'flex';
    this.focusOverlay.style.opacity = '0';
    this.focusOverlay.style.transform = 'scale(0.95)';
    
    // Update task display
    this.updateCurrentTaskDisplay();
    
    // Trigger smooth entrance animation
     requestAnimationFrame(() => {
       this.focusOverlay.classList.add('show', 'modal-enter');
       this.focusOverlay.style.opacity = '1';
       this.focusOverlay.style.transform = 'scale(1)';
     });
    

    
    // Trigger focus mode event
    document.dispatchEvent(new CustomEvent('focusModeEntered', {
      detail: { task: this.currentTask }
    }));
  }
  
  // Show focus modal (for reopening from toast)
  showFocusModal() {
    if (!this.isActive) return;
    
    // Show focus overlay with initial hidden state
    this.focusOverlay.style.display = 'flex';
    this.focusOverlay.style.opacity = '0';
    this.focusOverlay.style.transform = 'scale(0.95)';
    document.body.style.overflow = 'hidden';
    
    // Trigger smooth entrance animation
    requestAnimationFrame(() => {
      this.focusOverlay.classList.add('show', 'modal-enter');
      this.focusOverlay.style.opacity = '1';
      this.focusOverlay.style.transform = 'scale(1)';
    });
  }

  // Close focus modal (without exiting focus mode)
  closeFocusModal() {
    if (!this.isActive) return;
    
    // Trigger exit animation
    this.focusOverlay.classList.remove('show', 'modal-enter');
    this.focusOverlay.classList.add('modal-exit');
    
    // Hide after animation (200ms to match CSS animation duration)
    setTimeout(() => {
      this.focusOverlay.style.display = 'none';
      this.focusOverlay.classList.remove('modal-exit');
      document.body.style.overflow = 'auto';
      
      // Show toast only if timer is running
      if (this.pomodoroTimer.isRunning) {
        this.showToast();
      }
    }, 200);
  }

  // Exit focus mode
  exitFocusMode() {
    console.log('🎯 Exiting focus mode...');
    
    this.isActive = false;
    
    // Pause timer if running
    if (this.pomodoroTimer.isRunning) {
      this.pomodoroTimer.pause();
    }
    
    // Hide toast
    this.hideToast();
    
    // Trigger exit animation
    this.focusOverlay.classList.remove('show', 'modal-enter');
    this.focusOverlay.classList.add('modal-exit');
    
    // Hide after animation (200ms to match CSS animation duration)
    setTimeout(() => {
      this.focusOverlay.style.display = 'none';
      this.focusOverlay.classList.remove('modal-exit');
      document.body.style.overflow = 'auto';
    }, 200);
    
    // Clear selected task
    this.selectedTask = null;
    this.currentTask = null;
    

    
    // Trigger focus mode event
    document.dispatchEvent(new CustomEvent('focusModeExited', {
      detail: { task: this.currentTask }
    }));
  }

  // Update current task display
  updateCurrentTaskDisplay() {
    const titleEl = this.focusOverlay.querySelector('.focus-task-title');
    const descEl = this.focusOverlay.querySelector('.focus-task-desc');
    const taskContainer = this.focusOverlay.querySelector('.focus-current-task');
    
    if (this.currentTask) {
      titleEl.textContent = this.currentTask.title || 'Untitled Task';
      descEl.textContent = this.currentTask.desc || '';
      descEl.style.display = this.currentTask.desc ? 'block' : 'none';
      
      // Update task color if available
      if (this.currentTask.color) {
        const colorMap = {
          'blue': '#155dfc',
          'green': '#28a745',
          'yellow': '#ffc107',
          'red': '#dc3545',
          'purple': '#6f42c1',
          'orange': '#fd7e14'
        };
        const color = colorMap[this.currentTask.color] || '#155dfc';
        taskContainer.style.borderLeftColor = color;
      }
    } else {
      titleEl.textContent = 'Select a task to focus on';
      descEl.textContent = '';
      descEl.style.display = 'none';
      taskContainer.style.borderLeftColor = '#155dfc';
    }
  }



  // Update pomodoro display
  updatePomodoroDisplay(timeLeft, isBreak) {
    const hoursInput = this.focusOverlay.querySelector('.hours-input');
    const minutesInput = this.focusOverlay.querySelector('.minutes-input');
    const secondsInput = this.focusOverlay.querySelector('.seconds-input');
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    if (hoursInput) hoursInput.value = hours.toString().padStart(2, '0');
    if (minutesInput) minutesInput.value = minutes.toString().padStart(2, '0');
    if (secondsInput) secondsInput.value = seconds.toString().padStart(2, '0');
    
    // Update input colors based on break/work state
    const color = isBreak ? '#28a745' : 'var(--active-color, #155dfc)';
    [hoursInput, minutesInput, secondsInput].forEach(input => {
      if (input) input.style.color = color;
    });
  }

  // Update pomodoro controls
  updatePomodoroControls(state) {
    const startBtn = this.focusOverlay.querySelector('.pomodoro-start');
    const pauseBtn = this.focusOverlay.querySelector('.pomodoro-pause');
    
    if (state === 'running') {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } else {
      startBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
  }

  // Handle pomodoro completion
  handlePomodoroComplete(wasBreak) {
    if (wasBreak) {
      this.showNotification('Break time is over! Ready to focus?', 'info');
    } else {
      this.showNotification('Pomodoro completed! Time for a break.', 'success');
      
      // Mark current task as completed if selected
      if (this.currentTask && window.weekdeckApp) {
        const task = window.weekdeckApp.tasks[this.currentTask.day][this.currentTask.idx];
        if (task && !task.completed) {
          window.weekdeckApp.toggleComplete(this.currentTask.day, this.currentTask.idx);
        }
      }
    }
    
    // Play notification sound
    this.playNotificationSound();
  }



  // Create toast notification element
  createToast() {
    this.toast = document.createElement('div');
    this.toast.className = 'focus-toast';
    this.toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-family: 'Space Mono', monospace;
      font-size: 0.9rem;
      z-index: 10001;
      transition: transform 0.3s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      backdrop-filter: blur(10px);
      cursor: pointer;
      display: none;
      min-width: 280px;
      text-align: center;
    `;
    
    // Add click handler to reopen modal
    this.toast.addEventListener('click', () => {
      this.showFocusModal();
    });
    
    document.body.appendChild(this.toast);
  }

  // Show toast with task and timer info
  showToast() {
    if (!this.toast || !this.selectedTask) return;
    
    this.toast.style.display = 'block';
    this.updateToastContent();
    
    // Smooth slide-in animation from bottom
    requestAnimationFrame(() => {
      this.toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  }
  
  // Hide toast
  hideToast() {
    if (!this.toast) return;
    
    this.toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => {
      this.toast.style.display = 'none';
    }, 300);
  }
  
  // Update toast content with current timer
  updateToastContent() {
    if (!this.toast || !this.selectedTask) return;
    
    const timeLeft = this.pomodoroTimer.getTimeLeft();
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${this.selectedTask.title}</div>
      <div style="font-size: 1.2em; color: #4ade80;">${timeString}</div>
      <div style="font-size: 0.8em; opacity: 0.8; margin-top: 4px;">Click to open Focus Mode</div>
    `;
  }

  // Show notification
  showNotification(message, type = 'info') {
    if (window.weekdeckApp && window.weekdeckApp.showNotification) {
      window.weekdeckApp.showNotification(message, type);
    } else {
      console.log(`🎯 Focus: ${message}`);
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Get focus mode status
  getStatus() {
    return {
      active: this.isActive,
      currentTask: this.currentTask,
      pomodoroRunning: this.pomodoroTimer.isRunning,
      pomodoroTimeLeft: this.pomodoroTimer.timeLeft
    };
  }
}

// Pomodoro Timer Class
class PomodoroTimer {
  constructor() {
    this.workDuration = 25 * 60; // 25 minutes in seconds
    this.breakDuration = 5 * 60; // 5 minutes in seconds
    this.timeLeft = this.workDuration;
    this.isRunning = false;
    this.isBreak = false;
    this.interval = null;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.timeLeft--;
      
      // Dispatch tick event
      document.dispatchEvent(new CustomEvent('pomodoroTick', {
        detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
      }));
      
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
    
    // Dispatch state change
    document.dispatchEvent(new CustomEvent('pomodoroStateChange', {
      detail: { state: 'running' }
    }));
  }

  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.interval);
    
    // Dispatch state change
    document.dispatchEvent(new CustomEvent('pomodoroStateChange', {
      detail: { state: 'paused' }
    }));
  }

  reset() {
    this.pause();
    this.timeLeft = this.isBreak ? this.breakDuration : this.workDuration;
    
    // Dispatch tick event to update display
    document.dispatchEvent(new CustomEvent('pomodoroTick', {
      detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
    }));
  }

  complete() {
    this.pause();
    
    // Dispatch completion event
    document.dispatchEvent(new CustomEvent('pomodoroComplete', {
      detail: { isBreak: this.isBreak }
    }));
    
    // Switch between work and break
    this.isBreak = !this.isBreak;
    this.timeLeft = this.isBreak ? this.breakDuration : this.workDuration;
    
    // Update display
    document.dispatchEvent(new CustomEvent('pomodoroTick', {
      detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
    }));
  }

  setWorkDuration(minutes) {
    this.workDuration = minutes * 60;
    if (!this.isBreak && !this.isRunning) {
      this.timeLeft = this.workDuration;
      document.dispatchEvent(new CustomEvent('pomodoroTick', {
        detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
      }));
    }
  }

  setWorkDurationInSeconds(seconds) {
    this.workDuration = seconds;
    if (!this.isBreak && !this.isRunning) {
      this.timeLeft = this.workDuration;
      document.dispatchEvent(new CustomEvent('pomodoroTick', {
        detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
      }));
    }
  }

  setBreakDuration(minutes) {
    this.breakDuration = minutes * 60;
    if (this.isBreak && !this.isRunning) {
      this.timeLeft = this.breakDuration;
      document.dispatchEvent(new CustomEvent('pomodoroTick', {
        detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
      }));
    }
  }
  
  getTimeLeft() {
    return this.timeLeft;
  }
}

// Initialize focus mode manager
window.focusModeManager = new FocusModeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FocusModeManager, PomodoroTimer };
}
