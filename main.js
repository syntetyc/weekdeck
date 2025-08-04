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
    newTaskHover: {
      Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false
    },
    hoveredDay: null,
    modalOpen: false,
    modalTask: { title: '', desc: '', day: '', idx: null },
    // Variables básicas para drag and drop
    dragData: null,
    dragOverDay: null,
    dragOverIdx: null,
    dragOverColumn: null,
    isDragging: false,
    weekendHidden: false,
    pageTitle: '',
    pageTitleEditing: false,
    currentTheme: 'default',

    
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
      
      // Cargar título de la página
      const savedPageTitle = localStorage.getItem('weekdeck-page-title');
      if (savedPageTitle) {
        this.pageTitle = savedPageTitle;
      }
      
      // Inicializar tema actual
      this.currentTheme = window.themeManager ? window.themeManager.getCurrentTheme() : 'default';
      
      // Agregar elementos tutoriales si no hay tareas guardadas
      this.addTutorialItems();
      
      this.$watch('tasks', (val) => {
        localStorage.setItem('weekdeck-tasks', JSON.stringify(val));
      }, { deep: true });
      
      // Watcher para el título de la página
      this.$watch('pageTitle', (val) => {
        localStorage.setItem('weekdeck-page-title', val);
      });
      
      // Detectar el día actual
      this.detectCurrentDay();
      
      // Event listeners para pantalla completa
      this.setupFullscreenListeners();
      
      // Configurar menús contextuales
      this.setupContextMenus();
      
      // Listener para cambios de tema
      document.addEventListener('themeChanged', (event) => {
        // Actualizar variable reactiva
        this.currentTheme = event.detail.theme;
        console.log('Tema cambiado a:', this.currentTheme, '- Actualizando colores de iconos');
      });
      
      // Aplicar estado inicial del weekend
      this.$nextTick(() => {
        if (this.weekendHidden) {
          const weekendColumns = document.querySelectorAll('.weekend-column');
          const mainContainer = document.querySelector('.flex.flex-col.lg\\:flex-row.gap-3.w-full.mx-auto.h-full');
          
          // Agregar clase al contenedor principal
          if (mainContainer) {
            mainContainer.classList.add('weekend-hidden');
          }
          
          weekendColumns.forEach(column => {
            column.classList.add('weekend-hidden');
            column.style.visibility = 'hidden';
            column.style.position = 'absolute';
          });
        }
        
        // Verificar si se han cargado tareas y mostrar notificación
        const tasksLoaded = localStorage.getItem('weekdeck-tasks-loaded');
        if (tasksLoaded === 'true') {
          localStorage.removeItem('weekdeck-tasks-loaded'); // Limpiar flag
          this.showSuccessNotification('Tasks restored successfully!');
        }
      });
    },
    
    // Funciones para el título editable
    startEditPageTitle() {
      this.pageTitleEditing = true;
      this.$nextTick(() => {
        const input = document.querySelector('input[x-model="pageTitle"]');
        if (input) {
          input.focus();
          input.select();
        }
      });
    },
    
    // Funciones para edición inline de tareas
    startEditTask(day, idx) {
      const task = this.tasks[day][idx];
      task.editing = true;
      this.$nextTick(() => {
        const input = document.querySelector(`[data-day="${day}"][data-idx="${idx}"] input[x-model="task.title"]`);
        if (input) {
          input.focus();
          input.select();
          // Agregar event listener para atajos de teclado
          input.addEventListener('keydown', (e) => this.handleTextFormatting(e, day, idx));
        }
      });
    },
    
    saveTaskEdit(day, idx) {
      const task = this.tasks[day][idx];
      task.editing = false;
      
      // Remover event listener
      const input = document.querySelector(`[data-day="${day}"][data-idx="${idx}"] input[x-model="task.title"]`);
      if (input) {
        input.removeEventListener('keydown', (e) => this.handleTextFormatting(e, day, idx));
      }
      
      this.saveData();
    },
    
    cancelTaskEdit(day, idx) {
      const task = this.tasks[day][idx];
      task.editing = false;
      
      // Remover event listener
      const input = document.querySelector(`[data-day="${day}"][data-idx="${idx}"] input[x-model="task.title"]`);
      if (input) {
        input.removeEventListener('keydown', (e) => this.handleTextFormatting(e, day, idx));
      }
      
      // Restaurar el título original si es necesario
      this.$nextTick(() => {
        // Forzar actualización de Alpine.js
        this.tasks[day] = [...this.tasks[day]];
      });
    },
    
    savePageTitle() {
      this.pageTitleEditing = false;
      // El watcher se encarga de guardar automáticamente en localStorage
    },
    
    cancelEditPageTitle() {
      this.pageTitleEditing = false;
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
        },
        { separator: true },
        {
          text: 'Save Week',
          icon: 'save',
          action: () => {
            this.saveTasksToFile();
          }
        },
        {
          text: 'Load Week',
          icon: 'upload_file',
          action: () => {
            this.loadTasksFromFile();
          }
        },
        { separator: true },
        {
          text: 'Export to PDF',
          icon: 'picture_as_pdf',
          action: () => {
            this.exportToPDF();
          }
        },
        { separator: true },
        {
          text: 'Clear all',
          icon: 'delete_forever',
          action: () => {
            this.showClearAllConfirmation();
          },
          iconClass: 'text-red-600'
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
      
      // Obtener todas las columnas del weekend y el contenedor principal
      const weekendColumns = document.querySelectorAll('.weekend-column');
      const mainContainer = document.querySelector('.flex.flex-col.lg\\:flex-row.gap-3.w-full.mx-auto.h-full');
      
      if (this.weekendHidden) {
        // Agregar clase al contenedor principal para redistribuir columnas
        if (mainContainer) {
          mainContainer.classList.add('weekend-hidden');
        }
        
        // Ocultar con animación
        weekendColumns.forEach(column => {
          column.classList.add('weekend-hidden');
        });
        
        // Después de la animación, ocultar completamente
        setTimeout(() => {
          weekendColumns.forEach(column => {
            column.style.visibility = 'hidden';
            column.style.position = 'absolute';
          });
        }, 800);
        
      } else {
        // Remover clase del contenedor principal
        if (mainContainer) {
          mainContainer.classList.remove('weekend-hidden');
        }
        
        // Mostrar primero
        weekendColumns.forEach(column => {
          column.style.visibility = 'visible';
          column.style.position = 'relative';
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
    
    // Mostrar confirmación para borrar todo
    showClearAllConfirmation() {
      const confirmed = confirm(
        '⚠️ WARNING: This will delete ALL tasks and reset the application to its initial state.\n\n' +
        'This action cannot be undone.\n\n' +
        'Are you sure you want to continue?'
      );
      
      if (confirmed) {
        this.clearAllData();
      }
    },
    
    // Borrar todos los datos y resetear al estado inicial
    clearAllData() {
      console.log('🗑️ Clearing all data...');
      
      // Limpiar localStorage
      localStorage.removeItem('weekdeck-tasks');
      localStorage.removeItem('weekdeck-weekend-hidden');
      localStorage.removeItem('weekdeck-page-title');
      
      // Resetear título de la página
      this.pageTitle = '';
      
      // Refresh inmediato
      window.location.reload();
    },

    // Guardar tareas en archivo
    saveTasksToFile() {
      try {
        // Crear objeto con todos los datos
        const dataToSave = {
          tasks: this.tasks,
          weekendHidden: this.weekendHidden,
          pageTitle: this.pageTitle,
          currentTheme: window.themeManager ? window.themeManager.getCurrentTheme() : 'default',
          exportDate: new Date().toISOString(),
          version: '1.0'
        };
        
        // Convertir a JSON
        const jsonData = JSON.stringify(dataToSave, null, 2);
        
        // Crear blob y descargar
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Crear nombre del archivo usando el título de la página
        const pageTitle = this.pageTitle || 'untitled';
        const sanitizedTitle = pageTitle.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
        const fileName = `${sanitizedTitle}_weekdeck.wdeck`;
        
        // Crear elemento de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpiar URL
        URL.revokeObjectURL(url);
        
        this.showSuccessNotification('Tasks saved successfully!');
      } catch (error) {
        console.error('Error saving tasks:', error);
        alert('Error saving tasks. Please try again.');
      }
    },

    // Cargar tareas desde archivo
    loadTasksFromFile() {
      try {
        // Crear input file oculto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.wdeck,.json';
        input.style.display = 'none';
        
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              console.log('📁 Loading file...');
              const loadedData = JSON.parse(e.target.result);
              console.log('📄 Loaded data:', loadedData);
              
              // Validar estructura básica
              if (!loadedData.tasks || typeof loadedData.tasks !== 'object') {
                throw new Error('Invalid file format - missing tasks object');
              }
              
              // Validar que tenga al menos un día
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              const hasValidDays = days.some(day => loadedData.tasks[day] && Array.isArray(loadedData.tasks[day]));
              
              if (!hasValidDays) {
                throw new Error('Invalid file format - no valid day data found');
              }
              
              // Cargar tareas - asegurar que Alpine.js detecte los cambios
              
              // Crear un nuevo objeto tasks para forzar la reactividad
              const newTasks = {};
              
              // Cargar nuevas tareas en el nuevo objeto
              days.forEach(day => {
                if (loadedData.tasks[day] && Array.isArray(loadedData.tasks[day])) {
                  newTasks[day] = [...loadedData.tasks[day]];
                  console.log(`📅 Loaded ${newTasks[day].length} tasks for ${day}`);
                } else {
                  newTasks[day] = [];
                }
              });
              
              // Método 1: Asignar el nuevo objeto completo para forzar la reactividad
              this.tasks = newTasks;
              
              // Método 2: Forzar reactividad usando Alpine.js
              this.$nextTick(() => {
                // Re-asignar cada día individualmente para forzar la reactividad
                days.forEach(day => {
                  this.tasks[day] = [...newTasks[day]];
                });
                
                // Método 3: Forzar actualización usando setTimeout
                setTimeout(() => {
                  // Re-asignar nuevamente para forzar la reactividad
                  days.forEach(day => {
                    if (newTasks[day].length > 0) {
                      this.tasks[day] = [...newTasks[day]];
                      console.log(`🔄 Re-assigned ${this.tasks[day].length} tasks for ${day}`);
                    }
                  });
                }, 50);
              });
              
              // Verificar que la estructura es correcta
              console.log('🔍 Tasks object structure:', Object.keys(this.tasks));
              console.log('🔍 Sample task data:', this.tasks.Monday?.[0]);
              
              // Forzar actualización de Alpine.js usando $nextTick
              this.$nextTick(() => {
                // Trigger un evento personalizado para forzar re-render
                window.dispatchEvent(new CustomEvent('tasks-updated'));
                
                // Verificar que las tareas se asignaron correctamente
                console.log('🔍 Monday tasks after assignment:', this.tasks.Monday?.length);
                console.log('🔍 Tuesday tasks after assignment:', this.tasks.Tuesday?.length);
              });
              
              // Cargar configuración si existe
              if (loadedData.weekendHidden !== undefined) {
                this.weekendHidden = loadedData.weekendHidden;
                // Aplicar estado del weekend
                this.toggleWeekend();
                this.toggleWeekend(); // Toggle dos veces para aplicar el estado correcto
              }
              
              // Cargar título si existe
              if (loadedData.pageTitle) {
                this.pageTitle = loadedData.pageTitle;
              }
              
              // Cargar tema si existe
              if (loadedData.currentTheme && window.themeManager) {
                window.themeManager.setTheme(loadedData.currentTheme);
              }
              
              // Guardar datos
              this.saveData();
              
              // Marcar que se han cargado tareas para que se restauren después del refresh
              localStorage.setItem('weekdeck-tasks-loaded', 'true');
              
              // Forzar actualización de Alpine.js
              this.$nextTick(() => {
                console.log('✅ Tasks loaded successfully!');
                console.log('📊 Current tasks state:', this.tasks);
                
                // Verificar que las tareas se cargaron correctamente
                const totalTasks = Object.values(this.tasks).reduce((sum, dayTasks) => sum + dayTasks.length, 0);
                console.log(`📈 Total tasks loaded: ${totalTasks}`);
                
                // Forzar una actualización adicional usando Alpine.js
                this.$dispatch('tasks-loaded');
                
                // Método alternativo: forzar re-render usando Alpine.js
                this.$nextTick(() => {
                  // Trigger múltiples eventos para asegurar actualización
                  this.$dispatch('tasks-loaded');
                  window.dispatchEvent(new CustomEvent('tasks-updated'));
                });
                
                // Verificar que Alpine.js detectó los cambios
                setTimeout(() => {
                  const visibleTasks = document.querySelectorAll('.flex.min-h-\\[48px\\].px-2.py-1.group');
                  console.log(`👁️ Visible tasks in DOM: ${visibleTasks.length}`);
                  
                  // Verificar el estado de Alpine.js
                  const mondayColumn = document.querySelector('[data-day="Monday"]');
                  console.log('🔍 Monday column exists:', !!mondayColumn);
                  
                  // Verificar si Alpine.js está renderizando las tareas
                  const mondayTasks = document.querySelectorAll('[data-day="Monday"]');
                  console.log('🔍 Monday tasks in DOM:', mondayTasks.length);
                  
                  // Si no hay tareas visibles o hay menos tareas de las esperadas
                  if (visibleTasks.length < totalTasks) {
                    console.log(`⚠️ Only ${visibleTasks.length} tasks visible, expected ${totalTasks}, forcing refresh...`);
                    
                    // Método 1: Forzar re-render usando Alpine.js
                    this.$nextTick(() => {
                      // Disparar múltiples eventos para forzar actualización
                      this.$dispatch('tasks-loaded');
                      window.dispatchEvent(new CustomEvent('tasks-updated'));
                      
                      // Método 2: Re-asignar tareas para forzar reactividad
                      days.forEach(day => {
                        if (this.tasks[day] && this.tasks[day].length > 0) {
                          const currentTasks = [...this.tasks[day]];
                          this.tasks[day] = [];
                          setTimeout(() => {
                            this.tasks[day] = currentTasks;
                            console.log(`🔄 Re-rendered ${this.tasks[day].length} tasks for ${day}`);
                          }, 10);
                        }
                      });
                      
                      // Método 3: Intentar re-renderizar manualmente
                      const template = document.querySelector('template[x-for*="tasks[day]"]');
                      if (template) {
                        console.log('🔄 Re-rendering template...');
                        template.remove();
                        template.parentNode.appendChild(template);
                      }
                    });
                  }
                }, 100);
                
                this.showSuccessNotification(`Tasks loaded successfully! (${totalTasks} tasks)`);
                
                // Verificación final después de un tiempo
                setTimeout(() => {
                  const finalVisibleTasks = document.querySelectorAll('.flex.min-h-\\[48px\\].px-2.py-1.group');
                  console.log(`🎯 Final check - Visible tasks in DOM: ${finalVisibleTasks.length}`);
                  
                  if (finalVisibleTasks.length < totalTasks) {
                    console.log('⚠️ Still missing tasks, forcing page refresh...');
                    // Forzar refresh de la página para asegurar que Alpine.js renderice correctamente
                    this.showSuccessNotification('Tasks loaded! Refreshing page to display them...');
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } else {
                    console.log('✅ All tasks rendered successfully!');
                  }
                }, 200);
              });
            } catch (error) {
              console.error('Error loading tasks:', error);
              alert('Error loading file. Please make sure it\'s a valid WeekDeck (.wdeck) file.');
            }
          };
          
          reader.readAsText(file);
        };
        
        // Trigger file selection
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        
      } catch (error) {
        console.error('Error setting up file input:', error);
        alert('Error loading tasks. Please try again.');
      }
    },
    
    // Mostrar notificación de éxito
    showSuccessNotification(message) {
      this.showNotification(message, 'success');
    },
    
    // Mostrar notificación de error
    showErrorNotification(message) {
      this.showNotification(message, 'error');
    },
    
    // Mostrar notificación
    showNotification(message, type = 'success') {
      // Crear contenedor de notificaciones si no existe
      let notificationCenter = document.querySelector('.notification-center');
      if (!notificationCenter) {
        notificationCenter = document.createElement('div');
        notificationCenter.className = 'notification-center';
        document.body.appendChild(notificationCenter);
      }
      
      // Crear elemento de notificación
      const notification = document.createElement('div');
      notification.className = `notification-toast ${type}`;
      
      // Icono según el tipo
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = type === 'success' ? 'check_circle' : 'error';
      
      // Texto del mensaje
      const text = document.createElement('span');
      text.textContent = message;
      
      // Agregar elementos al notification
      notification.appendChild(icon);
      notification.appendChild(text);
      
      // Agregar al contenedor
      notificationCenter.appendChild(notification);
      
      // Remover después de 3 segundos
      setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    },
    
    // Mostrar menú contextual de tareas
    showTaskContextMenu(event, day, idx) {
      event.preventDefault();
      event.stopPropagation();
      
      const task = this.tasks[day][idx];
      const menuOptions = [
        {
          text: task.completed ? 'Mark as incomplete' : 'Mark as complete',
          icon: task.completed ? 'radio_button_unchecked' : 'check_circle',
          action: () => this.toggleComplete(day, idx)
        },
        {
          text: 'Move to',
          icon: 'swap_horiz',
          action: () => this.showMoveToSubmenu(event, day, idx),
          keepOpen: true // Mantener el menú abierto
        },
        {
          text: 'Duplicate',
          icon: 'content_copy',
          action: () => this.duplicateTask(day, idx)
        },
        {
          text: 'Add notes',
          icon: 'note_add',
          action: () => this.openModal(day, idx)
        },
        { separator: true },
        {
          text: 'Delete',
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

      const triggerElement = event.target.closest('button') || event.target;
      window.showContextMenu('task-menu', triggerElement, 'bottom-right');
    },
    
    // Mostrar submenú de "Move to"
    showMoveToSubmenu(event, day, idx) {
      console.log('showMoveToSubmenu called with day:', day, 'idx:', idx);
      
      const task = this.tasks[day][idx];
      const menuOptions = [
        {
          text: 'Back',
          icon: 'arrow_back',
          action: () => {
            console.log('Back button clicked - showing original menu content');
            // Cambiar directamente el contenido sin usar changeMenuContent
            this.restoreOriginalMenu(event, day, idx);
          },
          keepOpen: true // Asegurar que mantenga el menú abierto
        },
        {
          text: 'Top',
          icon: 'vertical_align_top',
          action: () => this.moveTaskToTop(day, idx)
        },
        {
          text: 'Bottom',
          icon: 'vertical_align_bottom',
          action: () => this.moveTaskToBottom(day, idx)
        },
        { separator: true }
      ];
      
      // Agregar opciones para cada día
      this.days.forEach(targetDay => {
        const isCurrentDay = targetDay === day;
        menuOptions.push({
          text: targetDay,
          icon: isCurrentDay ? 'check_circle' : 'radio_button_unchecked',
          action: () => this.moveTaskToDay(day, idx, targetDay),
          iconClass: isCurrentDay ? 'text-blue-600' : '',
          disabled: isCurrentDay
        });
      });
      
      console.log('Menu options created:', menuOptions);
      console.log('About to call changeMenuContent');
      
      // Cambiar el contenido del menú actual
      window.contextMenuManager.changeMenuContent(menuOptions, 'move-to-submenu');
    },
    
    // Restaurar el menú original directamente
    restoreOriginalMenu(event, day, idx) {
      console.log('restoreOriginalMenu called');
      
      if (!window.contextMenuManager.activeMenu) {
        console.log('No active menu found');
        return;
      }
      
      const task = this.tasks[day][idx];
      const menuOptions = [
        {
          text: 'Edit',
          icon: 'edit',
          action: () => this.editTask(day, idx)
        },
        {
          text: 'Duplicate',
          icon: 'content_copy',
          action: () => this.duplicateTask(day, idx)
        },
        {
          text: 'Delete',
          icon: 'delete',
          action: () => this.deleteTask(day, idx),
          iconClass: 'text-red-600'
        },
        { separator: true },
        {
          text: 'Move to',
          icon: 'swap_horiz',
          action: () => this.showMoveToSubmenu(event, day, idx),
          keepOpen: true // Mantener el menú abierto
        },
        {
          text: 'Add notes',
          icon: 'note_add',
          action: () => this.openModal(day, idx)
        },
        { separator: true },
        {
          text: task.completed ? 'Mark as incomplete' : 'Mark as complete',
          icon: task.completed ? 'radio_button_unchecked' : 'check_circle',
          action: () => this.toggleTaskCompletion(day, idx)
        }
      ];
      
      // Limpiar contenido actual
      window.contextMenuManager.activeMenu.innerHTML = '';
      
      // Crear nuevo contenido
      const newContent = window.contextMenuManager.createMenuContent(menuOptions);
      window.contextMenuManager.activeMenu.appendChild(newContent);
      
      // Actualizar configuración
      window.contextMenuManager.currentMenuId = 'task-menu';
      window.contextMenuManager.menus.set('task-menu', { 
        options: menuOptions, 
        element: window.contextMenuManager.activeMenu 
      });
      
      console.log('Original menu restored');
    },
    
    // Mover tarea a otro día
    moveTaskToDay(fromDay, idx, toDay) {
      if (fromDay === toDay) return;
      
      const task = this.tasks[fromDay][idx];
      this.tasks[fromDay].splice(idx, 1);
      this.tasks[toDay].push(task);
      
      // Cerrar el menú después de mover
      window.contextMenuManager.closeAll();
      
      this.showSuccessNotification(`Task moved to ${toDay}`);
    },
    
    // Mover tarea al principio de la lista
    moveTaskToTop(day, idx) {
      if (idx === 0) return; // Ya está en la primera posición
      
      const task = this.tasks[day][idx];
      this.tasks[day].splice(idx, 1);
      this.tasks[day].unshift(task); // Agregar al principio del array
      
      // Cerrar el menú después de mover
      window.contextMenuManager.closeAll();
      
      this.showSuccessNotification('Task moved to top');
    },
    
    // Mostrar menú contextual de colores
    showColorContextMenu(event, day, idx) {
      event.preventDefault();
      event.stopPropagation();
      
      // Detectar si es un evento táctil
      const isTouchEvent = event.type === 'touchstart' || event.type === 'touchend';
      
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
      const colorNames = ['Red', 'Yellow', 'Blue', 'Green', 'Purple'];
      const colorValues = ['#F36B6B', '#FFD86B', '#6B9AFF', '#7BE495', '#A963B0'];
      const colorClasses = ['color-red', 'color-yellow', 'color-blue', 'color-green', 'color-purple'];
      
      colorNames.forEach((name, colorIdx) => {
        const colorValue = colorValues[colorIdx];
        const colorClass = colorClasses[colorIdx];
        const isSelected = task.color === colorValue;
        menuOptions.push({
          text: name,
          icon: 'eraser_size_5',
          action: () => this.setColor(day, idx, colorValue),
          iconClass: colorClass, // Siempre usar la clase de color, nunca text-blue-600
          selected: () => isSelected
        });
      });
      
      // Registrar el menú si no existe
      if (!window.contextMenuManager.menus.has('color-menu')) {
        window.registerContextMenu('color-menu', menuOptions);
      } else {
        // Actualizar opciones si el menú ya existe
        window.contextMenuManager.menus.get('color-menu').options = menuOptions;
      }
      
      // Usar el elemento correcto para posicionar el menú
      const triggerElement = event.target.closest('.task-dot') || event.target;
      window.showContextMenu('color-menu', triggerElement, 'bottom-left');
    },
    
    // Mostrar menú contextual del header de la tabla
    showHeaderContextMenu(event, day) {
      event.preventDefault();
      event.stopPropagation();
      
      // Detectar si es un evento táctil
      const isTouchEvent = event.type === 'touchstart' || event.type === 'touchend';
      
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
      
      // Usar el elemento correcto para posicionar el menú
      const triggerElement = event.target.closest('button') || event.target;
      window.showContextMenu('header-menu', triggerElement, 'bottom-right');
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
        
        // Tutorial para Sunday
        this.tasks.Sunday.push({
          id: 'tutorial-4',
          title: 'Up here you can explore more options: fullscreen, light/dark mode, settings, project info..',
          desc: '',
          color: '#F36B6B',
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
        completed: false,
        icon: null,
        editing: false
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
    
    saveData() {
      // The data is automatically saved by Alpine.js watchers
      console.log('Data saved');
    },
    
    setColor(day, idx, color) {
      this.tasks[day][idx].color = color;
      if (!color) this.tasks[day][idx].bgFill = false;
      
      // Alpine.js will automatically re-render the icon with the new color
      console.log('Color updated for task:', this.tasks[day][idx]);
    },
    
    // Función para obtener el color del icono por defecto según el tema
    getDefaultIconColor() {
      const theme = this.currentTheme || (window.themeManager ? window.themeManager.getCurrentTheme() : 'default');
      return theme === 'dark' ? '#343434' : '#D1D2D5';
    },
    
    // Función para alternar entre temas
    toggleTheme() {
      const currentTheme = window.themeManager ? window.themeManager.getCurrentTheme() : 'default';
      const newTheme = currentTheme === 'dark' ? 'default' : 'dark';
      window.changeTheme(newTheme);
      
      // Actualizar la variable reactiva del tema
      this.currentTheme = newTheme;
    },
    
    // Función para mostrar el offcanvas de información
    showInfoOffcanvas() {
      // Disparar evento para abrir el offcanvas
      document.dispatchEvent(new CustomEvent('openInfoOffcanvas'));
    },
    
    // Función para exportar a PDF
    exportToPDF() {
      // Mostrar notificación de que se está generando el PDF
      this.showSuccessNotification('Generating PDF...');
      
      // Crear una copia del contenido para el PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.cssText = `
        width: 297mm;
        height: 210mm;
        padding: 20mm;
        background: white;
        color: black;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
        page-break-inside: avoid;
        overflow: hidden;
      `;
      
      // Crear el header del PDF
      const header = document.createElement('div');
      header.style.cssText = `
        text-align: left;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #333;
        font-size: 24px;
        font-weight: bold;
        color: #333;
      `;
      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span>WEEKDECK</span>
          <span style="color: #666; font-weight: normal;">/</span>
          <span style="font-size: 16px; font-weight: normal; color: #666;">
            ${this.pageTitle || 'Write a title'}
          </span>
        </div>
      `;
      pdfContent.appendChild(header);
      
      // Crear el contenido de las columnas
      const columnsContainer = document.createElement('div');
      columnsContainer.style.cssText = `
        display: flex;
        gap: 15px;
        height: calc(100% - 80px);
      `;
      
      // Iterar sobre los días
      this.days.forEach(day => {
        const column = document.createElement('div');
        column.style.cssText = `
          flex: 1;
          padding: 10px;
          min-height: 0;
          overflow: hidden;
        `;
        
        // Header del día
        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = `
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
          text-align: center;
          color: #333;
        `;
        dayHeader.textContent = day;
        column.appendChild(dayHeader);
        
        // Contenido de las tareas
        const tasksContainer = document.createElement('div');
        tasksContainer.style.cssText = `
          height: calc(100% - 40px);
          overflow-y: auto;
        `;
        
        if (this.tasks[day] && this.tasks[day].length > 0) {
          this.tasks[day].forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.style.cssText = `
              margin-bottom: 8px;
              padding: 8px;
              font-size: 11px;
              line-height: 1.3;
              word-wrap: break-word;
              ${task.completed ? 'text-decoration: line-through; color: #999;' : ''}
            `;
            
            // Icono de la tarea (más pequeño)
            const icon = document.createElement('span');
            icon.style.cssText = `
              display: inline-block;
              width: 8px;
              height: 8px;
              margin-right: 6px;
              background: ${task.color || '#ddd'};
              border-radius: 50%;
              vertical-align: middle;
            `;
            
            const taskText = document.createElement('span');
            taskText.textContent = task.title;
            
            taskElement.appendChild(icon);
            taskElement.appendChild(taskText);
            tasksContainer.appendChild(taskElement);
          });
        }
        
        column.appendChild(tasksContainer);
        columnsContainer.appendChild(column);
      });
      
      pdfContent.appendChild(columnsContainer);
      
      // Configuración del PDF
      const opt = {
        margin: 0,
        filename: `weekdeck-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape'
        }
      };
      
      // Generar el PDF
      html2pdf().set(opt).from(pdfContent).save().then(() => {
        this.showSuccessNotification('PDF exported successfully!');
      }).catch(error => {
        console.error('Error generating PDF:', error);
        this.showSuccessNotification('Error generating PDF');
      });
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
      
      // Guardar los cambios
      this.saveData();
      
      // Mostrar notificación
      const action = task.completed ? 'completed' : 'uncompleted';
      this.showSuccessNotification(`Task ${action}`);
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
  
  moveTaskToBottom(day, idx) {
    // Verificar que la tarea no esté ya en la última posición
    if (idx === this.tasks[day].length - 1) {
      console.log('La tarea ya está en la última posición');
      return;
    }
    
    // Obtener la tarea
    const task = this.tasks[day][idx];
    
    // Remover la tarea de su posición actual
    this.tasks[day].splice(idx, 1);
    
    // Insertar la tarea al final del array
    this.tasks[day].push(task);
    
    // Cerrar el menú después de mover
    window.contextMenuManager.closeAll();
    
    // Mostrar notificación
    this.showSuccessNotification('Task moved to bottom');
    
    // Mostrar notificación visual (opcional)
    console.log(`Tarea movida al final: "${task.title}"`);
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
      
      console.log('onDragOver called:', day, idx, this.dragData);
      
      if (!this.dragData || (this.dragData.fromDay === day && this.dragData.fromIdx === idx)) {
        console.log('Returning early - no dragData or same element');
        return;
      }
      
      // Limpiar todos los indicadores anteriores
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      // Si idx es null, estamos en la zona de drop al final de la tabla
      if (idx === null) {
        const dropZone = event.target.closest('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150');
        if (dropZone) {
          console.log('Adding drag-over to final zone');
          dropZone.classList.add('drag-over');
        }
        return;
      }
      
      // Para tareas individuales
      const targetElement = event.target.closest('.group');
      if (targetElement && !targetElement.classList.contains('dragging')) {
        console.log('Adding drag-over to task element');
        targetElement.classList.add('drag-over');
        console.log('Added drag-over class to:', targetElement);
      }
    },
    
    onDragLeave(day, idx, event) {
      const relatedTarget = event.relatedTarget;
      
      console.log('onDragLeave called:', day, idx, relatedTarget);
      
      // Si idx es null, estamos en la zona de drop al final de la tabla
      if (idx === null) {
        const currentElement = event.target.closest('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150');
        
        if (!relatedTarget || !currentElement.contains(relatedTarget)) {
          if (currentElement) {
            currentElement.classList.remove('drag-over');
            console.log('Removed drag-over from final zone');
          }
        }
        return;
      }
      
      // Para tareas individuales
      const currentElement = event.target.closest('.group');
      
      if (!relatedTarget || !currentElement.contains(relatedTarget)) {
        if (currentElement) {
          currentElement.classList.remove('drag-over');
          console.log('Removed drag-over from task element');
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
      
      console.log('onColumnDragOver called:', day, this.dragData);
      
      if (!this.dragData || this.dragData.fromDay === day) {
        console.log('Returning early - no dragData or same day');
        return;
      }
      
      const column = event.target.closest('div[class*="bg-white"]');
      if (!column) return;
      
      console.log('Adding drag-over to column:', column);
      
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
      console.log('Added drag-over class to column');
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
      const elements = document.querySelectorAll('.dragging, .drag-over, .drop-zone');
      elements.forEach(el => {
        el.classList.remove('dragging', 'drag-over', 'drop-zone');
      });
      
      // Limpiar específicamente la zona de drop al final
      const dropZones = document.querySelectorAll('.flex.items-center.min-h-\\[48px\\].px-2.transition-all.duration-150.drag-over');
      dropZones.forEach(el => {
        el.classList.remove('drag-over');
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
    },

    // Funciones para formato de texto
    handleTextFormatting(event, day, idx) {
      const input = event.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      
      // Detectar atajos de teclado
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        
        switch(event.key.toLowerCase()) {
          case 'b':
            this.applyFormat(input, start, end, text, '**', '**', day, idx);
            break;
          case 'i':
            this.applyFormat(input, start, end, text, '*', '*', day, idx);
            break;
          case 'u':
            this.applyFormat(input, start, end, text, '__', '__', day, idx);
            break;
        }
      }
    },

    applyFormat(input, start, end, text, prefix, suffix, day, idx) {
      const selectedText = text.substring(start, end);
      const beforeText = text.substring(0, start);
      const afterText = text.substring(end);
      
      let newText;
      let formatType = '';
      
      if (selectedText) {
        // Si hay texto seleccionado, aplicar formato
        newText = beforeText + prefix + selectedText + suffix + afterText;
        input.value = newText;
        input.selectionStart = start;
        input.selectionEnd = start + prefix.length + selectedText.length + suffix.length;
        formatType = 'aplicado a texto seleccionado';
      } else {
        // Si no hay texto seleccionado, insertar marcadores
        newText = beforeText + prefix + suffix + afterText;
        input.value = newText;
        input.selectionStart = start + prefix.length;
        input.selectionEnd = start + prefix.length;
        formatType = 'insertado marcadores';
      }
      
      // Actualizar el modelo de Alpine.js
      this.tasks[day][idx].title = newText;
      
      // Mostrar notificación breve
      const formatName = prefix === '**' ? 'Negrita' : prefix === '*' ? 'Cursiva' : 'Subrayado';
      this.showSuccessNotification(`${formatName} ${formatType}`);
    },

    // Función para renderizar markdown en el texto
    renderMarkdown(text) {
      if (!text) return '';
      
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>');
    }
  }
}

// Componente Alpine.js para el offcanvas de información
function infoOffcanvas() {
  return {
    isOpen: false,
    expandedSections: ['concept'], // La primera sección estará expandida por defecto
    sections: [
      {
        "id": "concept",
        "title": "Simple Weekly Planner",
        "icon": "calendar_month",
        "content": "WeekDeck is a minimalist weekly task organizer designed for simplicity and productivity. This local, private, and efficient week planner helps you organize your tasks visually with drag & drop functionality. Perfect for anyone seeking a clean, distraction-free approach to weekly planning without the complexity of traditional project management tools."
      },
      {
        "id": "privacy",
        "title": "Totally Private",
        "icon": "security",
        "content": "WeekDeck works entirely in your browser and on your computer. No data is uploaded to any server - everything runs locally, ensuring your privacy and data security."
      },
      {
        "id": "basics",
        "title": "How it works",
        "icon": "help",
        "content": "Drag and drop tasks between days to reorganize your week.",
        "saveLoad": {
          "title": "Save and Load",
          "description": "You can give each deck a custom name and save it as a .wdeck file. Use different files to load different types of weeks or projects."
        }
      },
      {
        "id": "about",
        "title": "The project",
        "icon": "person",
        "content": "WeekDeck is a project by Roberto Nieto, a designer, illustrator, and art director with 20 years of experience in digital projects.",
        "links": [
          {
            "name": "robertonieto.com",
            "url": "https://robertonieto.com"
          },
          {
            "name": "syntetyc.com",
            "url": "https://syntetyc.com"
          }
        ],
                  "technicalInfo": {
            "title": "Technical info",
            "description": "Built with Alpine.js, custom code and local storage. No external dependencies except for Material Design Icons."
          }
      },
      {
        "id": "support",
        "title": "Support",
        "icon": "favorite",
        "content": "If you'd like to support my work, you can visit my illustration stores:",
        "links": [
          {
            "name": "INPrnt",
            "description": "Gallery level giclee prints, shipments from United States",
            "url": "https://www.inprnt.com/gallery/syntetyc/"
          },
          {
            "name": "IDGaming",
            "description": "High Quality Gaming Mousepads",
            "url": "https://www.idgaming.co.uk/collections/syntetyc?ref=0-EwKOTfz30VZJ"
          },
          {
            "name": "Swapwear",
            "description": "Swappable graphic jackets",
            "url": "https://swapwear.com/collections/syntetyc"
          },
          {
            "name": "Displate",
            "description": "Amazing, vibrant and sharp metal posters",
            "url": "https://displate.com/syntetyc?art=5d99e7c06647f"
          },
          {
            "name": "Posterlounge",
            "description": "High quality posters, several formats, materials and frames",
            "url": "https://www.posterlounge.com/artists/syntetyc/"
          }
        ]
      },
      {
        "id": "contact",
        "title": "Contact",
        "icon": "email",
        "content": "If you have questions, queries, or improvement suggestions, you can contact:",
        "email": {
          "address": "info@robertonieto.com",
          "label": "Email Contact"
        }
      }
    ],
    
    init() {
      // Escuchar evento para abrir el offcanvas
      document.addEventListener('openInfoOffcanvas', () => {
        this.open();
      });
    },
    
    open() {
      this.isOpen = true;
      // No bloquear el scroll de la página
    },
    
    close() {
      this.isOpen = false;
      // No es necesario restaurar nada ya que no bloqueamos el scroll
    },
    
    toggleSection(sectionId) {
      const index = this.expandedSections.indexOf(sectionId);
      if (index > -1) {
        // Si está expandida, la contraemos
        this.expandedSections.splice(index, 1);
      } else {
        // Si está contraída, la expandimos
        this.expandedSections.push(sectionId);
      }
    }
  } }
