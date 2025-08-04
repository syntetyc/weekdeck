// Sistema dinámico de menús contextuales para WeekDeck

class ContextMenuManager {
  constructor() {
    this.activeMenu = null;
    this.menus = new Map();
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.menuHistory = []; // Historial de menús para navegación interna
    this.currentMenuId = null; // ID del menú actual
    this.init();
  }

  init() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('[data-context-menu]')) {
        this.closeAll();
      }
    });

    if (this.isTouchDevice) {
      document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.context-menu') && !e.target.closest('[data-context-menu]')) {
          this.closeAll();
        }
      }, { passive: true });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });

    document.addEventListener('scroll', () => {
      this.closeAll();
    });

    window.addEventListener('resize', () => {
      this.closeAll();
    });
  }

  // Registrar menú
  registerMenu(menuId, options) {
    this.menus.set(menuId, { options, element: null });
  }

  // Mostrar menú con soporte para submenús internos
  showMenu(menuId, triggerElement, position = 'bottom-right') {
    const menuConfig = this.menus.get(menuId);
    if (!menuConfig) return;

    this.closeAll();

    const menuElement = this.createMenuElement(menuId, menuConfig.options);
    this.positionMenu(menuElement, triggerElement, position);

    document.body.appendChild(menuElement);
    this.activeMenu = menuElement;
    menuConfig.element = menuElement;
    this.currentMenuId = menuId;

    // Guardar en el historial
    this.menuHistory.push({ menuId, options: menuConfig.options });

    requestAnimationFrame(() => {
      menuElement.classList.add('show');
    });
  }

  // Cambiar contenido del menú actual (para submenús internos)
  changeMenuContent(newOptions, newMenuId = null) {
    if (!this.activeMenu) return;

    console.log('changeMenuContent called with newMenuId:', newMenuId);
    console.log('Current menu ID:', this.currentMenuId);

    // Guardar el estado actual en el historial solo si no es una navegación hacia atrás
    if (this.currentMenuId && newMenuId !== this.currentMenuId) {
      const currentConfig = this.menus.get(this.currentMenuId);
      if (currentConfig) {
        console.log('Saving current menu to history:', this.currentMenuId);
        this.menuHistory.push({ 
          menuId: this.currentMenuId, 
          options: currentConfig.options 
        });
      }
    }

    // Limpiar contenido actual
    this.activeMenu.innerHTML = '';
    
    // Crear nuevo contenido
    const newContent = this.createMenuContent(newOptions);
    this.activeMenu.appendChild(newContent);

    // Actualizar configuración
    if (newMenuId) {
      this.currentMenuId = newMenuId;
      this.menus.set(newMenuId, { options: newOptions, element: this.activeMenu });
    }

    // Animar el cambio
    this.activeMenu.style.opacity = '0';
    requestAnimationFrame(() => {
      this.activeMenu.style.opacity = '1';
    });
  }

  // Volver al menú anterior
  goBack() {
    console.log('goBack called, history length:', this.menuHistory.length);
    if (this.menuHistory.length === 0) {
      console.log('No history to go back to');
      return;
    }

    const previousMenu = this.menuHistory.pop();
    console.log('Previous menu:', previousMenu);
    
    if (previousMenu && this.activeMenu) {
      // Limpiar contenido actual
      this.activeMenu.innerHTML = '';
      
      // Crear contenido del menú anterior
      const previousContent = this.createMenuContent(previousMenu.options);
      this.activeMenu.appendChild(previousContent);
      
      // Actualizar configuración
      this.currentMenuId = previousMenu.menuId;
      this.menus.set(previousMenu.menuId, { 
        options: previousMenu.options, 
        element: this.activeMenu 
      });
      
      // Animar el cambio
      this.activeMenu.style.opacity = '0';
      requestAnimationFrame(() => {
        this.activeMenu.style.opacity = '1';
      });
    }
  }

  // Crear contenido del menú
  createMenuContent(options) {
    const content = document.createElement('div');
    content.className = 'context-menu-content';

    options.forEach(option => {
      if (option.separator) {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        content.appendChild(separator);
      } else {
        const item = this.createMenuItem(option);
        content.appendChild(item);
      }
    });

    return content;
  }

  // Crear elemento de menú
  createMenuItem(option) {
    const item = document.createElement('div');
    item.className = 'context-menu-item';
    
    if (option.disabled) {
      item.classList.add('disabled');
    }

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    if (option.iconClass) {
      icon.classList.add(option.iconClass);
      console.log('Icon class added:', option.iconClass, 'for text:', option.text);
    }
    if (option.iconStyle) {
      icon.style.cssText = option.iconStyle;
      console.log('Icon style added:', option.iconStyle, 'for text:', option.text);
    }
    icon.textContent = option.icon || '';

    const text = document.createElement('span');
    text.textContent = option.text;

    item.appendChild(icon);
    item.appendChild(text);

    if (option.action) {
      const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        console.log('Menu item clicked:', option.text);
        console.log('keepOpen:', option.keepOpen);
        
        // Solo cerrar el menú si la opción no tiene keepOpen: true
        if (!option.keepOpen) {
          console.log('Closing menu for:', option.text);
          this.closeAll();
          setTimeout(() => { option.action(e); }, 10);
        } else {
          console.log('Keeping menu open for:', option.text);
          // Para acciones que mantienen el menú abierto
          option.action(e);
        }
      };
      item.addEventListener('click', handleAction);
      if (this.isTouchDevice) {
        item.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
        item.addEventListener('touchend', (e) => { e.preventDefault(); handleAction(e); }, { passive: false });
      }
    }

    return item;
  }

  // Crear elemento del menú
  createMenuElement(menuId, options) {
    const menuElement = document.createElement('div');
    menuElement.className = 'context-menu';
    menuElement.setAttribute('data-menu-id', menuId);
    
    const content = this.createMenuContent(options);
    menuElement.appendChild(content);
    
    return menuElement;
  }

  // Posicionar menú
  positionMenu(menuElement, triggerElement, position) {
    let triggerRect;
    
    // Si el trigger element es válido, usar sus coordenadas
    if (triggerElement && triggerElement.getBoundingClientRect) {
      triggerRect = triggerElement.getBoundingClientRect();
    } else {
      // Si no hay trigger element válido, usar coordenadas del centro de la pantalla
      triggerRect = {
        top: window.innerHeight / 2,
        bottom: window.innerHeight / 2 + 50,
        left: window.innerWidth / 2,
        right: window.innerWidth / 2 + 50
      };
    }
    
    let top, left;
    
    // Detectar si estamos en un dispositivo móvil
    const isMobile = window.innerWidth <= 1023;
    
    if (isMobile) {
      // En móviles, centrar el menú en la pantalla
      const menuWidth = 210; // Ancho fijo del menú
      const menuHeight = 150; // Altura estimada del menú
      
      // Centrar horizontalmente
      left = (window.innerWidth - menuWidth) / 2;
      
      // Centrar verticalmente
      top = (window.innerHeight - menuHeight) / 2;
      
      // Asegurar que no se salga de la pantalla
      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }
      if (top < 10) top = 10;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
    } else {
      // En desktop, usar el posicionamiento original
      switch (position) {
        case 'bottom-right':
          top = triggerRect.bottom + 5;
          left = triggerRect.right - 210; // Ancho fijo del menú + 30px adicionales
          break;
        case 'bottom-left':
          top = triggerRect.bottom + 5;
          left = triggerRect.left;
          break;
        case 'top-right':
          top = triggerRect.top - 5;
          left = triggerRect.right - 180;
          break;
        case 'top-left':
          top = triggerRect.top - 5;
          left = triggerRect.left;
          break;
        default:
          top = triggerRect.bottom + 5;
          left = triggerRect.right - 180;
      }
      
      // Asegurar que no se salga de la pantalla
      if (left < 10) left = 10;
      if (left + 210 > window.innerWidth - 10) {
        left = window.innerWidth - 220;
      }
      if (top < 10) {
        top = triggerRect.top - 5;
      }
      if (top + 150 > window.innerHeight - 10) {
        top = window.innerHeight - 160;
      }
    }
    
    menuElement.style.top = `${top}px`;
    menuElement.style.left = `${left}px`;
  }

  // Cerrar todos los menús
  closeAll() {
    if (this.activeMenu) {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
    
    this.menus.forEach(menu => {
      if (menu.element) {
        menu.element.remove();
        menu.element = null;
      }
    });
    
    this.menuHistory = [];
    this.currentMenuId = null;
  }
}

// Crear instancia global
window.contextMenuManager = new ContextMenuManager();

// Función helper para mostrar menú
window.showContextMenu = function(menuId, triggerElement, position) {
  return window.contextMenuManager.showMenu(menuId, triggerElement, position);
};

// Función helper para registrar menú
window.registerContextMenu = function(menuId, options) {
  return window.contextMenuManager.registerMenu(menuId, options);
}; 