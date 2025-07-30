// Alpine.js: Componente principal para WeekDeck
function weekdeckApp() {
  return {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    currentDay: null,
    colors: ["#F36B6B", "#FFD86B", "#6B9AFF", "#7BE495", "#BBBBBB", ""],
    isFullscreen: false,
    tasks: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    },
    newTask: {
      Monday: '', Tuesday: '', Wednesday: '', Thursday: '', Friday: '', Saturday: '', Sunday: ''
    },
    modalOpen: false,
    modalTask: { title: '', desc: '', day: '', idx: null },
    dragData: null,
    dragOverDay: null,
    dragOverIdx: null,
    dragOverColumn: null,
    isDragging: false,
    // --- INIT ---
    init() {
      const saved = localStorage.getItem('weekdeck-tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            this.tasks = parsed;
          }
        } catch {}
      }
      
      // Agregar elementos tutoriales si no hay tareas guardadas
      this.addTutorialItems();
      
      this.$watch('tasks', (val) => {
        localStorage.setItem('weekdeck-tasks', JSON.stringify(val));
      }, { deep: true });
      
      // Detectar el día actual
      this.detectCurrentDay();
      
      // Event listeners para pantalla completa
      this.setupFullscreenListeners();
    },
    
    // Configurar event listeners para pantalla completa
    setupFullscreenListeners() {
      const updateFullscreenState = () => {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        console.log('Fullscreen state:', this.isFullscreen);
      };
      
      document.addEventListener('fullscreenchange', updateFullscreenState);
      document.addEventListener('webkitfullscreenchange', updateFullscreenState);
      document.addEventListener('msfullscreenchange', updateFullscreenState);
      
      // Verificar estado inicial
      updateFullscreenState();
      
      // Forzar actualización después de un breve delay
      setTimeout(() => {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      }, 100);
    },
    
    // Agregar elementos tutoriales
    addTutorialItems() {
      const hasAnyTasks = Object.values(this.tasks).some(dayTasks => dayTasks.length > 0);
      
      if (!hasAnyTasks) {
        // Tutorial para Monday
        this.tasks.Monday.push({
          id: 'tutorial-1',
          title: '<--- click for change the color',
          desc: '',
          color: '#6B9AFF',
          bgFill: false,
          completed: false
        });
        
        // Tutorial para Tuesday
        this.tasks.Tuesday.push({
          id: 'tutorial-2',
          title: 'Click for extra options --->',
          desc: '',
          color: '#FFD86B',
          bgFill: false,
          completed: false
        });
        
        // Tutorial para Wednesday
        this.tasks.Wednesday.push({
          id: 'tutorial-3',
          title: 'Drag and drop elements',
          desc: '',
          color: '#7BE495',
          bgFill: false,
          completed: false
        });
      }
    },
    
    // Detectar el día actual de la semana
    detectCurrentDay() {
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      this.currentDay = dayNames[today.getDay()];
    },
    
    // Funciones para pantalla completa
    toggleFullscreen() {
      try {
        if (!this.isFullscreen) {
          this.enterFullscreen();
        } else {
          this.exitFullscreen();
        }
      } catch (error) {
        console.error('Error toggling fullscreen:', error);
      }
    },
    
    enterFullscreen() {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      } else {
        console.error('Fullscreen not supported');
      }
    },
    
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else {
        console.error('Exit fullscreen not supported');
      }
    },
    // --- TAREAS ---
    addTask(day) {
      const title = this.newTask[day].trim();
      if (!title) return;
      
      console.log('Añadiendo tarea:', title, 'para el día:', day);
      
      // Crear el nuevo item
      const newTask = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        title,
        desc: '',
        color: '',
        bgFill: false,
        completed: false
      };
      
      // Añadir el item al array
      this.tasks[day].push(newTask);
      this.newTask[day] = '';
      
      // Animar el nuevo item creado
      this.$nextTick(() => {
        console.log('$nextTick ejecutado');
        
        // Usar un delay más largo para asegurar que Alpine.js haya terminado
        setTimeout(() => {
          // Buscar todos los elementos .group en la página
          const allGroups = document.querySelectorAll('.group');
          console.log('Total de elementos .group encontrados:', allGroups.length);
          
          // El último elemento debería ser el recién creado
          const newTaskElement = allGroups[allGroups.length - 1];
          
          if (newTaskElement) {
            console.log('Elemento encontrado, aplicando animación');
            
            // PRUEBA: Añadir borde rojo para verificar que es el elemento correcto
            newTaskElement.style.border = '2px solid red';
            
            // Aplicar estilos iniciales directamente
            newTaskElement.style.opacity = '0';
            newTaskElement.style.transform = 'translateY(30px)';
            newTaskElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Forzar un reflow
            newTaskElement.offsetHeight;
            
            // Animar hacia el estado final
            newTaskElement.style.opacity = '1';
            newTaskElement.style.transform = 'translateY(0)';
            
            console.log('Animación aplicada');
            
            // Limpiar estilos después de la animación
            setTimeout(() => {
              newTaskElement.style.transition = '';
              newTaskElement.style.opacity = '';
              newTaskElement.style.transform = '';
              newTaskElement.style.border = ''; // Remover borde rojo
              console.log('Estilos limpiados');
            }, 400);
          } else {
            console.log('No se encontró el elemento para animar');
          }
        }, 100); // 100ms de delay
      });
    },
    setColor(day, idx, color) {
      this.tasks[day][idx].color = color;
      if (!color) this.tasks[day][idx].bgFill = false;
    },
    toggleBgFill(day, idx) {
      const t = this.tasks[day][idx];
      if (t.color) t.bgFill = !t.bgFill;
    },
    toggleComplete(day, idx) {
      const task = this.tasks[day][idx];
      task.completed = !task.completed;
      
      // Si se marca como completa, quitar highlight y color
      if (task.completed) {
        task.bgFill = false;
        task.color = '';
      }
    },
      deleteTask(day, idx) {
    // Encontrar el elemento del item
    const taskElement = event.target.closest('.group');
    if (taskElement) {
      // Añadir clase de animación
      taskElement.classList.add('item-removing');
      
      // Esperar a que termine la animación antes de eliminar
      setTimeout(() => {
        this.tasks[day].splice(idx, 1);
      }, 300); // 300ms = duración de la animación
    } else {
      // Fallback si no se encuentra el elemento
      this.tasks[day].splice(idx, 1);
    }
  },
    openModal(day, idx) {
      const t = this.tasks[day][idx];
      this.modalTask = { ...t, day, idx };
      this.modalOpen = true;
    },
    saveModalTask() {
      const { day, idx, title, desc } = this.modalTask;
      if (day !== '' && idx !== null) {
        this.tasks[day][idx].title = title;
        this.tasks[day][idx].desc = desc;
      }
      this.modalOpen = false;
    },
    // --- DRAG & DROP ---
    onDragStart(day, idx, event) {
      this.dragData = { fromDay: day, fromIdx: idx };
      this.isDragging = true;
      event.dataTransfer.effectAllowed = 'move';
    },
    onDragOver(day, idx, event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (!this.dragData || (this.dragData.fromDay === day && this.dragData.fromIdx === idx)) {
        this.dragOverDay = null;
        this.dragOverIdx = null;
        return;
      }
      this.dragOverDay = day;
      this.dragOverIdx = idx;
      this.dragOverColumn = null;
    },
    onDragLeave(day, idx, event) {
      if (this.dragOverDay === day && this.dragOverIdx === idx) {
        this.dragOverDay = null;
        this.dragOverIdx = null;
      }
    },
    onDrop(day, idx, event) {
      event.preventDefault();
      if (!this.dragData) return;
      const { fromDay, fromIdx } = this.dragData;
      if (fromDay === day && fromIdx === idx) return;
      const task = this.tasks[fromDay][fromIdx];
      this.tasks[fromDay].splice(fromIdx, 1);
      if (typeof idx === 'number' && idx >= 0) {
        this.tasks[day].splice(idx, 0, task);
      } else {
        this.tasks[day].push(task);
      }
      this.dragData = null;
      this.dragOverDay = null;
      this.dragOverIdx = null;
      this.dragOverColumn = null;
      this.isDragging = false;
    },
    onDragEnd() {
      this.dragData = null;
      this.dragOverDay = null;
      this.dragOverIdx = null;
      this.dragOverColumn = null;
      this.isDragging = false;
    },
    // --- DRAG & DROP EN COLUMNA ---
    onColumnDragOver(day, event) {
      event.preventDefault();
      if (!this.dragData || this.dragData.fromDay === day) {
        this.dragOverColumn = null;
        return;
      }
      this.dragOverColumn = day;
      this.dragOverDay = null;
      this.dragOverIdx = null;
    },
    onColumnDragLeave(day, event) {
      if (this.dragOverColumn === day) {
        this.dragOverColumn = null;
      }
    },
    onColumnDrop(day, event) {
      event.preventDefault();
      if (!this.dragData) return;
      const { fromDay, fromIdx } = this.dragData;
      if (fromDay === day) return;
      const task = this.tasks[fromDay][fromIdx];
      this.tasks[fromDay].splice(fromIdx, 1);
      this.tasks[day].push(task);
      this.dragData = null;
      this.dragOverColumn = null;
      this.dragOverDay = null;
      this.dragOverIdx = null;
      this.isDragging = false;
    },
    // --- CLICK EN ZONA LIBRE ---
    onColumnClick(day, event) {
      // Solo si el click no fue en un elemento interactivo
      if (event.target.closest('input, button, span[class*="material-symbols"], .group')) {
        return;
      }
      
      // Buscar el input de la columna y hacer focus
      const column = event.target.closest('div[class*="bg-white"]');
      if (column) {
        const input = column.querySelector('input[type="text"]');
        if (input) {
          input.focus();
        }
      }
    },
    // --- HOVER EN ZONA LIBRE ---
    onColumnMouseEnter(day, event) {
      // Solo si el mouse no está sobre un elemento interactivo
      if (event.target.closest('input, button, span[class*="material-symbols"], .group')) {
        return;
      }
      
      // Agregar clase para mostrar indicador visual
      const column = event.target.closest('div[class*="bg-white"]');
      if (column) {
        const dayBox = column.querySelector('.flex-1.flex.flex-col.relative');
        if (dayBox) {
          dayBox.classList.add('clickable-area');
        }
      }
    },
    onColumnMouseLeave(day, event) {
      // Remover clase cuando el mouse sale
      const column = event.target.closest('div[class*="bg-white"]');
      if (column) {
        const dayBox = column.querySelector('.flex-1.flex.flex-col.relative');
        if (dayBox) {
          dayBox.classList.remove('clickable-area');
        }
      }
    }
  }
} 