// Focus Mode Manager for WeekDeck
// Provides distraction-free interface with Pomodoro timer

class FocusModeManager {
  constructor() {
    this.isActive = false;
    this.originalElements = {};
    this.focusOverlay = null;
    this.currentTask = null;
    this.pomodoroTimer = new PomodoroTimer();
    
    this.init();
  }

  init() {
    console.log('🎯 FocusModeManager: Initializing...');
    this.createFocusOverlay();
    this.setupKeyboardShortcuts();
  }

  // Create the focus mode overlay
  createFocusOverlay() {
    this.focusOverlay = document.createElement('div');
    this.focusOverlay.className = 'focus-mode-overlay';
    this.focusOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg-primary, #f5f5f5);
      z-index: 10000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Space Mono', monospace;
      transition: all 0.3s ease;
    `;

    this.focusOverlay.innerHTML = `
      <div class="focus-mode-container" style="
        max-width: 800px;
        width: 90%;
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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
          ">Select a task to focus on</div>
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
          <div class="pomodoro-display" style="
            font-size: 4rem;
            font-weight: 700;
            color: var(--active-color, #155dfc);
            margin-bottom: 1rem;
            font-family: 'Space Mono', monospace;
          ">25:00</div>
          
          <div class="pomodoro-controls" style="
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 1rem;
          ">
            <button class="pomodoro-btn pomodoro-start" style="
              padding: 0.75rem 1.5rem;
              background: var(--active-color, #155dfc);
              color: white;
              border: none;
              border-radius: 6px;
              font-family: 'Space Mono', monospace;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            ">Start</button>
            
            <button class="pomodoro-btn pomodoro-pause" style="
              padding: 0.75rem 1.5rem;
              background: #ffc107;
              color: white;
              border: none;
              border-radius: 6px;
              font-family: 'Space Mono', monospace;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              display: none;
            ">Pause</button>
            
            <button class="pomodoro-btn pomodoro-reset" style="
              padding: 0.75rem 1.5rem;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 6px;
              font-family: 'Space Mono', monospace;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            ">Reset</button>
          </div>
          
          <div class="pomodoro-settings" style="
            display: flex;
            gap: 1rem;
            justify-content: center;
            align-items: center;
            font-size: 0.9rem;
            color: #666;
          ">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              Work:
              <input type="number" class="work-duration" value="25" min="1" max="60" style="
                width: 60px;
                padding: 0.25rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                font-family: 'Space Mono', monospace;
              "> min
            </label>
            
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              Break:
              <input type="number" class="break-duration" value="5" min="1" max="30" style="
                width: 60px;
                padding: 0.25rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                font-family: 'Space Mono', monospace;
              "> min
            </label>
          </div>
        </div>

        <!-- Task Selection -->
        <div class="focus-task-selection" style="
          margin-bottom: 2rem;
        ">
          <h3 style="
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: #555;
          ">Select Task to Focus On</h3>
          
          <div class="focus-task-list" style="
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 0.5rem;
          ">
            <!-- Tasks will be populated here -->
          </div>
        </div>

        <!-- Focus Stats -->
        <div class="focus-stats" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        ">
          <div class="stat-item" style="
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
          ">
            <div class="stat-number" style="
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--active-color, #155dfc);
            ">0</div>
            <div class="stat-label" style="
              font-size: 0.8rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Pomodoros</div>
          </div>
          
          <div class="stat-item" style="
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
          ">
            <div class="stat-number" style="
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--active-color, #155dfc);
            ">0</div>
            <div class="stat-label" style="
              font-size: 0.8rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Focus Time</div>
          </div>
          
          <div class="stat-item" style="
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
          ">
            <div class="stat-number" style="
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--active-color, #155dfc);
            ">0</div>
            <div class="stat-label" style="
              font-size: 0.8rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Tasks Done</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.focusOverlay);
    this.setupFocusOverlayEvents();
  }

  // Setup event listeners for focus overlay
  setupFocusOverlayEvents() {
    // Close button
    const closeBtn = this.focusOverlay.querySelector('.focus-close-btn');
    closeBtn.addEventListener('click', () => this.exitFocusMode());

    // Pomodoro controls
    const startBtn = this.focusOverlay.querySelector('.pomodoro-start');
    const pauseBtn = this.focusOverlay.querySelector('.pomodoro-pause');
    const resetBtn = this.focusOverlay.querySelector('.pomodoro-reset');

    startBtn.addEventListener('click', () => this.pomodoroTimer.start());
    pauseBtn.addEventListener('click', () => this.pomodoroTimer.pause());
    resetBtn.addEventListener('click', () => this.pomodoroTimer.reset());

    // Duration settings
    const workDuration = this.focusOverlay.querySelector('.work-duration');
    const breakDuration = this.focusOverlay.querySelector('.break-duration');

    workDuration.addEventListener('change', (e) => {
      this.pomodoroTimer.setWorkDuration(parseInt(e.target.value));
    });

    breakDuration.addEventListener('change', (e) => {
      this.pomodoroTimer.setBreakDuration(parseInt(e.target.value));
    });

    // Listen to pomodoro events
    document.addEventListener('pomodoroTick', (e) => {
      this.updatePomodoroDisplay(e.detail.timeLeft, e.detail.isBreak);
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
      // Escape to exit focus mode
      if (e.key === 'Escape' && this.isActive) {
        this.exitFocusMode();
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
    this.currentTask = task;
    
    // Hide main interface
    document.body.style.overflow = 'hidden';
    
    // Show focus overlay
    this.focusOverlay.style.display = 'flex';
    
    // Update task display
    this.updateCurrentTaskDisplay();
    
    // Populate task list
    this.populateTaskList();
    
    // Load focus stats
    this.loadFocusStats();
    
    // Trigger focus mode event
    document.dispatchEvent(new CustomEvent('focusModeEntered', {
      detail: { task: this.currentTask }
    }));
  }

  // Exit focus mode
  exitFocusMode() {
    console.log('🎯 Exiting focus mode...');
    
    this.isActive = false;
    
    // Pause timer if running
    if (this.pomodoroTimer.isRunning) {
      this.pomodoroTimer.pause();
    }
    
    // Show main interface
    document.body.style.overflow = 'auto';
    
    // Hide focus overlay
    this.focusOverlay.style.display = 'none';
    
    // Save focus stats
    this.saveFocusStats();
    
    // Trigger focus mode event
    document.dispatchEvent(new CustomEvent('focusModeExited', {
      detail: { task: this.currentTask }
    }));
  }

  // Update current task display
  updateCurrentTaskDisplay() {
    const titleEl = this.focusOverlay.querySelector('.focus-task-title');
    const descEl = this.focusOverlay.querySelector('.focus-task-desc');
    
    if (this.currentTask) {
      titleEl.textContent = this.currentTask.title || 'Untitled Task';
      descEl.textContent = this.currentTask.desc || '';
      descEl.style.display = this.currentTask.desc ? 'block' : 'none';
    } else {
      titleEl.textContent = 'Select a task to focus on';
      descEl.textContent = '';
      descEl.style.display = 'none';
    }
  }

  // Populate task list for selection
  populateTaskList() {
    const taskList = this.focusOverlay.querySelector('.focus-task-list');
    taskList.innerHTML = '';
    
    if (!window.weekdeckApp) return;
    
    const allTasks = [];
    window.weekdeckApp.days.forEach(day => {
      if (window.weekdeckApp.tasks[day]) {
        window.weekdeckApp.tasks[day].forEach((task, idx) => {
          if (!task.completed) {
            allTasks.push({ ...task, day, idx });
          }
        });
      }
    });
    
    if (allTasks.length === 0) {
      taskList.innerHTML = '<div style="padding: 1rem; color: #666; text-align: center;">No tasks available</div>';
      return;
    }
    
    allTasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'focus-task-item';
      taskEl.style.cssText = `
        padding: 0.75rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      taskEl.innerHTML = `
        <div>
          <div style="font-weight: 600; color: #333;">${task.title}</div>
          <div style="font-size: 0.8rem; color: #666;">${task.day}</div>
        </div>
        <span class="material-symbols-outlined" style="color: var(--active-color, #155dfc);">play_arrow</span>
      `;
      
      taskEl.addEventListener('mouseenter', () => {
        taskEl.style.background = '#f8f9fa';
      });
      
      taskEl.addEventListener('mouseleave', () => {
        taskEl.style.background = 'transparent';
      });
      
      taskEl.addEventListener('click', () => {
        this.selectTask(task);
      });
      
      taskList.appendChild(taskEl);
    });
  }

  // Select a task for focus
  selectTask(task) {
    this.currentTask = task;
    this.updateCurrentTaskDisplay();
    
    // Highlight selected task
    const taskItems = this.focusOverlay.querySelectorAll('.focus-task-item');
    taskItems.forEach(item => {
      item.style.background = 'transparent';
      item.style.borderLeft = 'none';
    });
    
    const selectedItem = Array.from(taskItems).find(item => 
      item.querySelector('div').textContent === task.title
    );
    
    if (selectedItem) {
      selectedItem.style.background = '#e3f2fd';
      selectedItem.style.borderLeft = '4px solid var(--active-color, #155dfc)';
    }
  }

  // Update pomodoro display
  updatePomodoroDisplay(timeLeft, isBreak) {
    const display = this.focusOverlay.querySelector('.pomodoro-display');
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    display.style.color = isBreak ? '#28a745' : 'var(--active-color, #155dfc)';
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
      this.incrementFocusStats('pomodoros');
      
      // Mark current task as completed if selected
      if (this.currentTask && window.weekdeckApp) {
        const task = window.weekdeckApp.tasks[this.currentTask.day][this.currentTask.idx];
        if (task && !task.completed) {
          window.weekdeckApp.toggleComplete(this.currentTask.day, this.currentTask.idx);
          this.incrementFocusStats('tasksCompleted');
          this.populateTaskList(); // Refresh task list
        }
      }
    }
    
    // Play notification sound
    this.playNotificationSound();
  }

  // Load focus statistics
  loadFocusStats() {
    const stats = JSON.parse(localStorage.getItem('weekdeck-focus-stats') || '{}');
    const today = new Date().toDateString();
    const todayStats = stats[today] || { pomodoros: 0, focusTime: 0, tasksCompleted: 0 };
    
    const statItems = this.focusOverlay.querySelectorAll('.stat-number');
    statItems[0].textContent = todayStats.pomodoros;
    statItems[1].textContent = Math.round(todayStats.focusTime / 60) + 'm';
    statItems[2].textContent = todayStats.tasksCompleted;
  }

  // Save focus statistics
  saveFocusStats() {
    // Stats are saved in real-time via incrementFocusStats
  }

  // Increment focus statistics
  incrementFocusStats(type, value = 1) {
    const stats = JSON.parse(localStorage.getItem('weekdeck-focus-stats') || '{}');
    const today = new Date().toDateString();
    
    if (!stats[today]) {
      stats[today] = { pomodoros: 0, focusTime: 0, tasksCompleted: 0 };
    }
    
    stats[today][type] = (stats[today][type] || 0) + value;
    localStorage.setItem('weekdeck-focus-stats', JSON.stringify(stats));
    
    this.loadFocusStats(); // Refresh display
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

  setBreakDuration(minutes) {
    this.breakDuration = minutes * 60;
    if (this.isBreak && !this.isRunning) {
      this.timeLeft = this.breakDuration;
      document.dispatchEvent(new CustomEvent('pomodoroTick', {
        detail: { timeLeft: this.timeLeft, isBreak: this.isBreak }
      }));
    }
  }
}

// Initialize focus mode manager
window.focusModeManager = new FocusModeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FocusModeManager, PomodoroTimer };
}