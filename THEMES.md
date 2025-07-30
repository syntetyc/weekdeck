# Sistema de Temas - WeekDeck

## Estructura del Sistema

```
themes/
├── default.css    # Tema por defecto (actual)
├── dark.css       # Tema oscuro
└── blue.css       # Tema azul

theme-manager.js   # Sistema de gestión de temas
```

## Cómo Funciona

### 1. **Variables CSS**
Cada tema define sus propias variables CSS en `:root`:
- `--primary-color`: Color principal
- `--bg-primary`: Fondo principal
- `--text-primary`: Texto principal
- etc.

### 2. **Carga Dinámica**
El `ThemeManager` carga archivos CSS dinámicamente:
```javascript
themeManager.setTheme('dark'); // Carga themes/dark.css
```

### 3. **Persistencia**
Los temas se guardan en `localStorage` y se restauran automáticamente.

## Uso

### Cambiar Tema desde JavaScript
```javascript
// Cambiar a tema específico
window.changeTheme('dark');

// Cambiar al siguiente tema
window.nextTheme();

// Obtener tema actual
window.getCurrentTheme();
```

### Cambiar Tema desde Alpine.js
```html
<button @click="nextTheme()">Next Theme</button>
<button @click="changeTheme('dark')">Dark Theme</button>
```

### Escuchar Cambios de Tema
```javascript
document.addEventListener('themeChanged', (event) => {
  console.log('Tema cambiado a:', event.detail.theme);
});
```

## Crear Nuevos Temas

### 1. Crear archivo CSS
```css
/* themes/mi-tema.css */
:root {
  --primary-color: #tu-color;
  --bg-primary: #tu-fondo;
  /* ... más variables */
}
```

### 2. Agregar al sistema
```javascript
themeManager.addTheme('mi-tema');
```

### 3. Usar
```javascript
themeManager.setTheme('mi-tema');
```

## Temas Disponibles

### Default
- Fondo claro
- Header negro
- Acentos azules

### Dark
- Fondo oscuro
- Header negro
- Acentos azules claros

### Blue
- Fondo azul claro
- Header azul oscuro
- Acentos azules

## Ventajas del Sistema

✅ **Modular**: Cada tema en archivo separado
✅ **Dinámico**: Cambio instantáneo sin recargar
✅ **Persistente**: Se recuerda la selección
✅ **Escalable**: Fácil agregar nuevos temas
✅ **Estandarizado**: Usa variables CSS
✅ **Compatible**: Funciona con Tailwind CSS

## Mejores Prácticas

1. **Siempre usar variables CSS** en lugar de colores hardcodeados
2. **Mantener consistencia** en nombres de variables
3. **Probar todos los componentes** con cada tema
4. **Documentar cambios** en nuevos temas
5. **Usar transiciones suaves** para cambios de tema 