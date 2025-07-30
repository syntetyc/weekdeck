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
    // Variables básicas para drag and drop
    dragData: null,
    dragOverDay: null,
    dragOverIdx: null,
    dragOverColumn: null,
    isDragging: false,
    weekendHidden: false,

    
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
      
      // Cargar estado del weekend
      const savedWeekendHidden = localStorage.getItem('weekdeck-weekend-hidden');
      if (savedWeekendHidden !== null) {
        this.weekendHidden = savedWeekendHidden === 'true';
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
      
      // Configurar menús contextuales
      this.setupContextMenus();
      
      // Aplicar estado inicial del weekend
      this.$nextTick(() => {
        if (this.weekendHidden) {
          const weekendColumns = document.querySelectorAll('.weekend-column');
          weekendColumns.forEach(column => {
            column.classList.add('weekend-hidden');
            column.style.display = 'none';
          });
        }
      });
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
    
    // Configurar menús contextuales
    setupContextMenus() {
      // Menú de temas
      const themeOptions = [
        {
          text: 'Light Theme',
          icon: 'light_mode',
          action: (event) => {
            const triggerElement = event.target.closest('.context-menu-item');
            window.changeTheme('default', triggerElement);
          },
          selected: () => window.getCurrentTheme() === 'default'
        },
        {
          text: 'Dark Theme',
          icon: 'dark_mode',
          action: (event) => {
            const triggerElement = event.target.closest('.context-menu-item');
            window.changeTheme('dark', triggerElement);
          },
          selected: () => window.getCurrentTheme() === 'dark'
        },
      ];
      
      // Registrar menú de temas
      window.registerContextMenu('theme-menu', themeOptions);
      
      // Menú de configuración
      const settingsOptions = [
        {
          text: this.weekendHidden ? 'Show weekend' : 'Hide weekend',
          icon: 'weekend',
          action: () => {
            this.toggleWeekend();
          }
        }
      ];
      
      // Registrar menú de configuración
      window.registerContextMenu('settings-menu', settingsOptions);
    },
    
    // Mostrar menú de temas
    showThemeMenu(event) {
      event.preventDefault();
      event.stopPropagation();
      
      window.showContextMenu('theme-menu', event.target.closest('button'), 'bottom-right');
    },
    
    // Mostrar menú de configuración
    showSettingsMenu(event) {
      event.preventDefault();
      event.stopPropagation();
      
      // Actualizar opciones del menú según el estado actual
      const settingsOptions = [
        {
          text: this.weekendHidden ? 'Show weekend' : 'Hide weekend',
          icon: 'weekend',
          action: () => {
            this.toggleWeekend();
          }
        }
      ];
      
      // Actualizar menú de configuración
      if (window.contextMenuManager.menus.has('settings-menu')) {
        window.contextMenuManager.menus.get('settings-menu').options = settingsOptions;
      } else {
        window.registerContextMenu('settings-menu', settingsOptions);
      }
      
      window.showContextMenu('settings-menu', event.target.closest('button'), 'bottom-right');
    },
    
    // Toggle del weekend
    toggleWeekend() {
      this.weekendHidden = !this.weekendHidden;
      
      // Obtener todas las columnas del weekend
      const weekendColumns = document.querySelectorAll('.weekend-column');
      
      if (this.weekendHidden) {
        // Ocultar con animación
        weekendColumns.forEach(column => {
          column.classList.add('weekend-hidden');
        });
        
        // Después de la animación, ocultar completamente
        setTimeout(() => {
          weekendColumns.forEach(column => {
            column.style.display = 'none';
          });
        }, 800);
        
      } else {
        // Mostrar primero
        weekendColumns.forEach(column => {
          column.style.display = 'flex';
        });
        
        // Luego animar la aparición
        setTimeout(() => {
          weekendColumns.forEach(column => {
            column.classList.remove('weekend-hidden');
          });
        }, 50);
      }
      
      // Guardar preferencia en localStorage
      localStorage.setItem('weekdeck-weekend-hidden', this.weekendHidden);
      
      console.log(`Weekend ${this.weekendHidden ? 'hidden' : 'shown'}`);
    },
    
    // Mostrar menú contextual de tareas
    showTaskContextMenu(event, day, idx) {
      event.preventDefault();
      event.stopPropagation();
      
      // Crear opciones del menú contextual
      const task = this.tasks[day][idx];
      const menuOptions = [
        {
          text: task.completed ? 'Unmark as complete' : 'Mark as complete',
          icon: task.completed ? 'radio_button_unchecked' : 'check_circle',
          action: () => this.toggleComplete(day, idx)
        },
        {
          text: 'Duplicate',
          icon: 'content_copy',
          action: () => this.duplicateTask(day, idx)
        },
        {
          text: 'Move to top',
          icon: 'vertical_align_top',
          action: () => this.moveTaskToTop(day, idx)
        },
        { separator: true },
        {
          text: 'Delete task',
          icon: 'delete',
          action: () => this.deleteTask(day, idx),
          iconClass: 'text-red-600'
        }
      ];
      
      // Registrar el menú si no existe
      if (!window.contextMenuManager.menus.has('task-menu')) {
        window.registerContextMenu('task-menu', menuOptions);
      } else {
        // Actualizar opciones si el menú ya existe
        window.contextMenuManager.menus.get('task-menu').options = menuOptions;
      }
      
      window.showContextMenu('task-menu', event.target.closest('button'), 'bottom-right');
    },
    
    // Mostrar menú contextual de colores
    showColorContextMenu(event, day, idx) {
      event.preventDefault();
      event.stopPropagation();
      
      // Crear opciones del menú contextual de colores
      const task = this.tasks[day][idx];
      const menuOptions = [];
      
      // Agregar opción de highlight (siempre visible, pero disabled si no hay color)
      menuOptions.push({
        text: task.bgFill ? 'Unhighlight' : 'Highlight',
        icon: task.bgFill ? 'highlight_off' : 'highlight',
        action: () => this.toggleBgFill(day, idx),
        disabled: !task.color || task.color === ''
      });
      
      // Agregar separador
      menuOptions.push({ separator: true });
      
      // Agregar opción transparente
      menuOptions.push({
        text: 'No color',
        icon: 'radio_button_unchecked',
        action: () => this.setColor(day, idx, ''),
        iconClass: task.color === '' ? 'text-blue-600' : '',
        selected: () => task.color === ''
      });
      
      // Agregar separador
      menuOptions.push({ separator: true });
      
      // Agregar opciones de colores
      const colorNames = ['Red', 'Yellow', 'Blue', 'Green', 'Gray'];
      const colorValues = ['#F36B6B', '#FFD86B', '#6B9AFF', '#7BE495', '#BBBBBB'];
      
      colorNames.forEach((name, colorIdx) => {
        const colorValue = colorValues[colorIdx];
        const isSelected = task.color === colorValue;
        menuOptions.push({
          text: name,
          action: () => this.setColor(day, idx, colorValue),
          selected: () => isSelected,
          customIcon: `<span class="w-4 h-4 rounded-full inline-block" style="background: ${colorValue}; border: 1px solid #ccc; border-radius: 50%; width: 16px; height: 16px; aspect-ratio: 1 / 1; min-width: 16px; min-height: 16px; max-width: 16px; max-height: 16px; ${isSelected ? 'border: 2px solid #2563eb;' : ''}"></span>`
        });
      });
      
      // Registrar el menú si no existe
      if (!window.contextMenuManager.menus.has('color-menu')) {
        window.registerContextMenu('color-menu', menuOptions);
      } else {
        // Actualizar opciones si el menú ya existe
        window.contextMenuManager.menus.get('color-menu').options = menuOptions;
      }
      
      window.showContextMenu('color-menu', event.target, 'bottom-left');
    },
    
    // Mostrar menú contextual del header de la tabla
    showHeaderContextMenu(event, day) {
      event.preventDefault();
      event.stopPropagation();
      
      // Crear opciones del menú contextual del header
      const menuOptions = [
        {
          text: 'Clear completed',
          icon: 'cleaning_services',
          action: () => this.clearCompletedTasks(day),
          iconClass: 'text-orange-600'
        },
        {
          text: 'Clear content',
          icon: 'delete_sweep',
          action: () => this.clearDayContent(day),
          iconClass: 'text-red-600'
        }
      ];
      
      // Registrar el menú si no existe
      if (!window.contextMenuManager.menus.has('header-menu')) {
        window.registerContextMenu('header-menu', menuOptions);
      } else {
        // Actualizar opciones si el menú ya existe
        window.contextMenuManager.menus.get('header-menu').options = menuOptions;
      }
      
      window.showContextMenu('header-menu', event.target, 'bottom-right');
    },
    
    // Borrar todo el contenido de un día
    clearDayContent(day) {
      // Confirmar antes de borrar
      if (confirm(`Are you sure you want to clear all content from ${day}?`)) {
        this.tasks[day] = [];
      }
    },
    
    // Borrar solo las tareas completadas de un día
    clearCompletedTasks(day) {
      const completedTasks = this.tasks[day].filter(task => task.completed);
      
      if (completedTasks.length === 0) {
        console.log(`No hay tareas completadas en ${day}`);
        return;
      }
      
      // Confirmar antes de borrar
      if (confirm(`Are you sure you want to clear ${completedTasks.length} completed task(s) from ${day}?`)) {
        // Filtrar solo las tareas no completadas
        this.tasks[day] = this.tasks[day].filter(task => !task.completed);
        
        console.log(`${completedTasks.length} tarea(s) completada(s) eliminada(s) de ${day}`);
      }
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
    // Encontrar el elemento del item usando el día y índice
    const taskElement = document.querySelector(`[data-day="${day}"][data-idx="${idx}"]`);
    
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
  
  duplicateTask(day, idx) {
    // Obtener la tarea original
    const originalTask = this.tasks[day][idx];
    
    // Crear una copia de la tarea
    const duplicatedTask = {
      id: '_' + Math.random().toString(36).substr(2, 9),
      title: originalTask.title + ' (copy)',
      desc: originalTask.desc,
      completed: false, // La copia siempre empieza como no completada
      color: originalTask.color,
      bgFill: originalTask.bgFill
    };
    
    // Insertar la copia después de la tarea original
    this.tasks[day].splice(idx + 1, 0, duplicatedTask);
    
    // Mostrar notificación visual (opcional)
    console.log(`Tarea duplicada: "${duplicatedTask.title}"`);
  },
  
  moveTaskToTop(day, idx) {
    // Verificar que la tarea no esté ya en la primera posición
    if (idx === 0) {
      console.log('La tarea ya está en la primera posición');
      return;
    }
    
    // Obtener la tarea
    const task = this.tasks[day][idx];
    
    // Remover la tarea de su posición actual
    this.tasks[day].splice(idx, 1);
    
    // Insertar la tarea al principio del array
    this.tasks[day].unshift(task);
    
    // Mostrar notificación visual (opcional)
    console.log(`Tarea movida al inicio: "${task.title}"`);
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
      
      const draggedElement = event.target.closest('.group');
      if (draggedElement) {
        draggedElement.classList.add('dragging');
      }
      
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', '');
    },
    
    onDragOver(day, idx, event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      if (!this.dragData || (this.dragData.fromDay === day && this.dragData.fromIdx === idx)) {
        return;
      }
      
      // Si idx es null, estamos en la zona de drop al final de la tabla
      if (idx === null) {
        const dropZone = event.target.closest('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150');
        if (!dropZone) return;
        
        // Limpiar indicador anterior
        if (this.dragOverDay !== null || this.dragOverIdx !== null) {
          const prevElement = document.querySelector(`[data-day="${this.dragOverDay}"][data-idx="${this.dragOverIdx}"]`);
          if (prevElement) {
            prevElement.classList.remove('drop-indicator');
          }
        }
        
        this.dragOverDay = day;
        this.dragOverIdx = idx;
        
        // Añadir clase al elemento actual
        dropZone.classList.add('drop-indicator');
        return;
      }
      
      const targetElement = event.target.closest('.group');
      if (!targetElement || targetElement.classList.contains('dragging')) {
        return;
      }
      
      // Limpiar indicador anterior
      if (this.dragOverDay !== null || this.dragOverIdx !== null) {
        const prevElement = document.querySelector(`[data-day="${this.dragOverDay}"][data-idx="${this.dragOverIdx}"]`);
        if (prevElement) {
          prevElement.classList.remove('drop-indicator');
        }
      }
      
      this.dragOverDay = day;
      this.dragOverIdx = idx;
      
      // Añadir clase al elemento actual
      targetElement.classList.add('drop-indicator');
    },
    
    onDragLeave(day, idx, event) {
      const relatedTarget = event.relatedTarget;
      
      // Si idx es null, estamos en la zona de drop al final de la tabla
      if (idx === null) {
        const currentElement = event.target.closest('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150');
        
        if (!relatedTarget || !currentElement.contains(relatedTarget)) {
          if (currentElement) {
            currentElement.classList.remove('drop-indicator');
          }
        }
        return;
      }
      
      const currentElement = event.target.closest('.group');
      
      if (!relatedTarget || !currentElement.contains(relatedTarget)) {
        if (currentElement) {
          currentElement.classList.remove('drop-indicator');
        }
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
      
      this.resetDragState();
    },
    
    onDragEnd() {
      this.resetDragState();
      
      // Limpiar todos los indicadores de drop
      document.querySelectorAll('.drop-indicator-line').forEach(indicator => {
        indicator.style.display = 'none';
      });
    },
    
    // --- DRAG & DROP EN COLUMNA ---
    onColumnDragOver(day, event) {
      event.preventDefault();
      
      if (!this.dragData || this.dragData.fromDay === day) {
        return;
      }
      
      const column = event.target.closest('div[class*="bg-white"]');
      if (!column) return;
      
      // Limpiar columna anterior
      if (this.dragOverColumn !== null) {
        const prevColumn = document.querySelector(`[data-day="${this.dragOverColumn}"]`);
        if (prevColumn) {
          prevColumn.classList.remove('drag-over', 'drop-zone');
        }
      }
      
      this.dragOverColumn = day;
      
      // Añadir clase a la columna actual
      column.classList.add('drag-over', 'drop-zone');
    },
    
    onColumnDragLeave(day, event) {
      const relatedTarget = event.relatedTarget;
      const currentColumn = event.target.closest('div[class*="bg-white"]');
      
      if (!relatedTarget || !currentColumn.contains(relatedTarget)) {
        if (currentColumn) {
          currentColumn.classList.remove('drag-over', 'drop-zone');
        }
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
      
      this.resetDragState();
    },
    

    
    // --- NUEVA LÓGICA DE DRAG & DROP SOBRE TABLA ---
    onTableDragOver(day, event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      console.log('onTableDragOver called for day:', day);
      
      if (!this.dragData || this.dragData.fromDay === day) {
        console.log('Returning early - no dragData or same day');
        return;
      }
      
      // Verificar si estamos sobre un elemento específico
      const targetElement = event.target.closest('.group');
      if (targetElement) {
        console.log('Returning early - over specific element');
        return;
      }
      
      console.log('Over table area, not over specific element');
      
      // Si estamos sobre la tabla pero no sobre un elemento específico, activar el indicador
      const tableContainer = event.target.closest('.flex-1.flex.flex-col.relative');
      console.log('Table container found:', tableContainer);
      if (tableContainer) {
        tableContainer.classList.add('table-drag-over');
        console.log('Added table-drag-over class');
        
        // Verificar si existe el último elemento
        const allGroups = tableContainer.querySelectorAll('.group');
        const lastElement = allGroups[allGroups.length - 1];
        if (lastElement) {
          // Crear un elemento indicador de drop
          let dropIndicator = lastElement.querySelector('.drop-indicator-line');
          if (!dropIndicator) {
            dropIndicator = document.createElement('div');
            dropIndicator.className = 'drop-indicator-line';
            dropIndicator.style.cssText = `
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: #155dfc;
              z-index: 1000;
            `;
            lastElement.style.position = 'relative';
            lastElement.appendChild(dropIndicator);
          }
          dropIndicator.style.display = 'block';
        }
      }
    },
    
    onTableDragLeave(day, event) {
      const relatedTarget = event.relatedTarget;
      const tableContainer = event.target.closest('.flex-1.flex.flex-col.relative');
      
      console.log('onTableDragLeave called for day:', day);
      
      if (!relatedTarget || !tableContainer.contains(relatedTarget)) {
        if (tableContainer) {
          tableContainer.classList.remove('table-drag-over');
          
          // Limpiar los estilos del último elemento
          const allGroups = tableContainer.querySelectorAll('.group');
          const lastElement = allGroups[allGroups.length - 1];
          if (lastElement) {
            const dropIndicator = lastElement.querySelector('.drop-indicator-line');
            if (dropIndicator) {
              dropIndicator.style.display = 'none';
            }
          }
        }
      }
    },
    
    onTableDrop(day, event) {
      event.preventDefault();
      if (!this.dragData) return;
      
      const { fromDay, fromIdx } = this.dragData;
      if (fromDay === day) return;
      
      const task = this.tasks[fromDay][fromIdx];
      this.tasks[fromDay].splice(fromIdx, 1);
      this.tasks[day].push(task);
      
      this.resetDragState();
      
      // Limpiar específicamente el indicador de la tabla donde se hizo drop
      const tableContainer = event.target.closest('.flex-1.flex.flex-col.relative');
      if (tableContainer) {
        const allGroups = tableContainer.querySelectorAll('.group');
        const lastElement = allGroups[allGroups.length - 1];
        if (lastElement) {
          const dropIndicator = lastElement.querySelector('.drop-indicator-line');
          if (dropIndicator) {
            dropIndicator.style.display = 'none';
          }
        }
      }
    },
    
    // Función para resetear el estado de drag
    resetDragState() {
      this.dragData = null;
      this.dragOverDay = null;
      this.dragOverIdx = null;
      this.dragOverColumn = null;
      this.isDragging = false;
      
      // Limpieza simple
      const elements = document.querySelectorAll('.dragging, .drag-over, .drop-zone, .drop-indicator');
      elements.forEach(el => {
        el.classList.remove('dragging', 'drag-over', 'drop-zone', 'drop-indicator');
      });
      
      // Limpiar específicamente la zona de drop al final
      const dropZones = document.querySelectorAll('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150.drop-indicator');
      dropZones.forEach(el => {
        el.classList.remove('drop-indicator');
      });
      
      // Limpiar la zona de drop de tabla completa
      const tableDragOver = document.querySelectorAll('.table-drag-over');
      tableDragOver.forEach(el => {
        el.classList.remove('table-drag-over');
      });
      
      // Limpiar todos los indicadores de drop line
      document.querySelectorAll('.drop-indicator-line').forEach(indicator => {
        indicator.style.display = 'none';
      });
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