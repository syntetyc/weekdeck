// Sistema de gestión de temas para WeekDeck

class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
    this.availableThemes = ['default', 'dark'];
    this.themeLink = null;
    
    this.init();
  }
  
  init() {
    // Crear elemento link para cargar temas dinámicamente
    this.themeLink = document.createElement('link');
    this.themeLink.rel = 'stylesheet';
    this.themeLink.id = 'theme-stylesheet';
    document.head.appendChild(this.themeLink);
    
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
    
    // Cargar archivo CSS del tema
    this.themeLink.href = `themes/${themeName}.css`;
    
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

// Función helper para cambiar tema desde Alpine.js
window.changeTheme = function(themeName) {
  return window.themeManager.setTheme(themeName);
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