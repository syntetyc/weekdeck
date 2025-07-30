// Sistema de gestión de temas para WeekDeck

class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
    this.availableThemes = ['default', 'dark'];
    
    this.init();
  }
  
  init() {
    // Asegurar que la clase del tema por defecto esté aplicada
    document.documentElement.classList.add('theme-default');
    
    // Cargar tema guardado o usar default
    const savedTheme = localStorage.getItem('weekdeck-theme');
    if (savedTheme && this.availableThemes.includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('default');
    }
  }
  
  setTheme(themeName) {
    if (!this.availableThemes.includes(themeName)) {
      console.error(`Tema "${themeName}" no disponible`);
      return false;
    }
    
    // Remover clase del tema anterior
    document.documentElement.classList.remove(`theme-${this.currentTheme}`);
    
    // Agregar clase del nuevo tema
    document.documentElement.classList.add(`theme-${themeName}`);
    
    // Guardar en localStorage
    localStorage.setItem('weekdeck-theme', themeName);
    
    // Actualizar variable global
    this.currentTheme = themeName;
    
    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeName }
    }));
    
    console.log(`Tema cambiado a: ${themeName}`);
    return true;
  }
  
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  getAvailableThemes() {
    return [...this.availableThemes];
  }
  
  // Método para agregar nuevos temas dinámicamente
  addTheme(themeName, cssPath) {
    if (!this.availableThemes.includes(themeName)) {
      this.availableThemes.push(themeName);
      console.log(`Tema "${themeName}" agregado`);
    }
  }
  
  // Método para cambiar al siguiente tema
  nextTheme() {
    const currentIndex = this.availableThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    const nextTheme = this.availableThemes[nextIndex];
    this.setTheme(nextTheme);
    return nextTheme;
  }
  
  // Método para cambiar al tema anterior
  prevTheme() {
    const currentIndex = this.availableThemes.indexOf(this.currentTheme);
    const prevIndex = currentIndex === 0 ? this.availableThemes.length - 1 : currentIndex - 1;
    const prevTheme = this.availableThemes[prevIndex];
    this.setTheme(prevTheme);
    return prevTheme;
  }
}

// Crear instancia global
window.themeManager = new ThemeManager();

// Función helper para cambiar tema desde Alpine.js con transición fade
window.changeTheme = function(themeName, triggerElement = null) {
  // Verificar si View Transitions API está disponible y el usuario no prefiere movimiento reducido
  if (!document.startViewTransition || 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return window.themeManager.setTheme(themeName);
  }

  // Si no hay elemento trigger, hacer cambio normal
  if (!triggerElement) {
    return window.themeManager.setTheme(themeName);
  }

  // Implementar transición fade
  const performFadeTransition = async () => {
    try {
      // Iniciar transición de vista
      const transition = document.startViewTransition(() => {
        // Cambiar el tema
        window.themeManager.setTheme(themeName);
      });

      // Esperar a que la transición esté lista
      await transition.ready;

      // Aplicar animación fade
      document.documentElement.animate(
        {
          opacity: [0, 1],
        },
        {
          duration: 300,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );

    } catch (error) {
      console.error('Error en transición fade:', error);
      // Fallback: cambiar tema sin transición
      window.themeManager.setTheme(themeName);
    }
  };

  performFadeTransition();
  return true;
};

// Función helper para obtener tema actual
window.getCurrentTheme = function() {
  return window.themeManager.getCurrentTheme();
};

// Función helper para cambiar al siguiente tema
window.nextTheme = function() {
  return window.themeManager.nextTheme();
};

// Función helper para cambiar al tema anterior
window.prevTheme = function() {
  return window.themeManager.prevTheme();
};

// Función helper para agregar nuevos temas con transición fade automática
window.addThemeWithFade = function(themeName, cssPath, displayName, icon) {
  // Agregar el tema al manager
  window.themeManager.addTheme(themeName);
  
  // Crear el archivo CSS del tema si no existe
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
  
  // Agregar opción al menú de temas dinámicamente
  const themeMenu = window.contextMenuManager?.menus.get('theme-menu');
  if (themeMenu) {
    const newOption = {
      text: displayName || themeName,
      icon: icon || 'palette',
      action: (event) => {
        const triggerElement = event.target.closest('.context-menu-item');
        window.changeTheme(themeName, triggerElement);
      },
      selected: () => window.getCurrentTheme() === themeName
    };
    
    // Agregar al final de las opciones
    themeMenu.options.push(newOption);
    
    console.log(`Tema "${themeName}" agregado con transición fade automática`);
  }
  
  return true;
}; 

// Función de prueba para verificar el sistema
window.testThemeSystem = function() {
  console.log('=== PRUEBA DEL SISTEMA DE TEMAS ===');
  console.log('Tema actual:', window.getCurrentTheme());
  console.log('Temas disponibles:', window.themeManager.getAvailableThemes());
  console.log('Clases en html:', document.documentElement.className);
  console.log('CSS variables:', getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'));
  
  // Probar cambio de tema
  const currentTheme = window.getCurrentTheme();
  const nextTheme = currentTheme === 'default' ? 'dark' : 'default';
  
  console.log('Cambiando de', currentTheme, 'a', nextTheme);
  window.changeTheme(nextTheme);
  
  setTimeout(() => {
    console.log('Después del cambio:');
    console.log('Tema actual:', window.getCurrentTheme());
    console.log('Clases en html:', document.documentElement.className);
    console.log('CSS variables:', getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'));
  }, 100);
}; 