// Sistema dinámico de menús contextuales para WeekDeck

class ContextMenuManager {
  constructor() {
    this.activeMenu = null;
    this.menus = new Map();
    this.init();
  }
  
  init() {
    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('[data-context-menu]')) {
        this.closeAll();
      }
    });
    
    // Cerrar menús con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });
  }
  
  // Registrar un nuevo menú
  registerMenu(menuId, options) {
    this.menus.set(menuId, {
      options: options,
      element: null
    });
  }
  
  // Crear y mostrar menú
  showMenu(menuId, triggerElement, position = 'bottom-right') {
    const menuConfig = this.menus.get(menuId);
    if (!menuConfig) {
      console.error(`Menú "${menuId}" no encontrado`);
      return;
    }
    
    // Cerrar menús activos
    this.closeAll();
    
    // Crear elemento del menú
    const menuElement = this.createMenuElement(menuId, menuConfig.options);
    
    // Posicionar menú
    this.positionMenu(menuElement, triggerElement, position);
    
    // Agregar al DOM
    document.body.appendChild(menuElement);
    
    // Guardar referencia
    this.activeMenu = menuElement;
    menuConfig.element = menuElement;
    
    // Animar entrada
    requestAnimationFrame(() => {
      menuElement.classList.add('show');
    });
  }
  
  // Crear elemento del menú
  createMenuElement(menuId, options) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.setAttribute('data-menu-id', menuId);
    
    const menuContent = document.createElement('div');
    menuContent.className = 'context-menu-content';
    
    options.forEach(option => {
      const item = this.createMenuItem(option);
      menuContent.appendChild(item);
    });
    
    menu.appendChild(menuContent);
    return menu;
  }
  
  // Crear elemento de menú individual
  createMenuItem(option) {
    const item = document.createElement('div');
    item.className = 'context-menu-item';
    
    if (option.separator) {
      item.className += ' context-menu-separator';
      return item;
    }
    
    if (option.icon) {
      const icon = document.createElement('span');
      icon.className = `material-symbols-outlined ${option.iconClass || ''}`;
      icon.textContent = option.icon;
      item.appendChild(icon);
    }
    
    const text = document.createElement('span');
    text.textContent = option.text;
    item.appendChild(text);
    
    if (option.subtext) {
      const subtext = document.createElement('span');
      subtext.className = 'context-menu-subtext';
      subtext.textContent = option.subtext;
      item.appendChild(subtext);
    }
    
    if (option.action) {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        option.action();
        this.closeAll();
      });
    }
    
    if (option.disabled) {
      item.classList.add('disabled');
    }
    
    // Agregar clase selected si la opción está seleccionada
    if (option.selected && option.selected()) {
      item.classList.add('selected');
    }
    
    return item;
  }
  
  // Posicionar menú
  positionMenu(menuElement, triggerElement, position) {
    const triggerRect = triggerElement.getBoundingClientRect();
    
    let top, left;
    
    switch (position) {
      case 'bottom-right':
        top = triggerRect.bottom + 5;
        left = triggerRect.right - 180; // Ancho fijo del menú
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
    if (left + 180 > window.innerWidth - 10) {
      left = window.innerWidth - 190;
    }
    if (top < 10) {
      top = triggerRect.top - 5;
    }
    if (top + 150 > window.innerHeight - 10) {
      top = window.innerHeight - 160;
    }
    
    menuElement.style.top = `${top}px`;
    menuElement.style.left = `${left}px`;
  }
  
  // Cerrar todos los menús
  closeAll() {
    if (this.activeMenu) {
      this.activeMenu.classList.remove('show');
      setTimeout(() => {
        if (this.activeMenu && this.activeMenu.parentNode) {
          this.activeMenu.parentNode.removeChild(this.activeMenu);
        }
      }, 200);
      this.activeMenu = null;
    }
  }
  
  // Cerrar menú específico
  closeMenu(menuId) {
    const menuConfig = this.menus.get(menuId);
    if (menuConfig && menuConfig.element) {
      menuConfig.element.classList.remove('show');
      setTimeout(() => {
        if (menuConfig.element && menuConfig.element.parentNode) {
          menuConfig.element.parentNode.removeChild(menuConfig.element);
        }
      }, 200);
      menuConfig.element = null;
    }
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