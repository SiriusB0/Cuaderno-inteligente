# Arquitectura del Cuaderno Inteligente

## 📐 Estructura General

La aplicación sigue un patrón de arquitectura **MVC (Model-View-Controller)** adaptado con componentes modulares:

```
Cuaderno-inteligente/
├── index.html              # Punto de entrada HTML
├── js/
│   ├── core/               # CAPA DE LÓGICA CENTRAL
│   │   ├── DataManager.js      # Gestión de datos (Model)
│   │   ├── Router.js           # Sistema de navegación
│   │   └── StorageManager.js   # Persistencia en localStorage
│   │
│   ├── views/              # CAPA DE PRESENTACIÓN (Views)
│   │   ├── DashboardView.js    # Vista principal/dashboard
│   │   ├── SubjectsView.js     # Vista de materias
│   │   ├── TopicsView.js       # Vista de temas
│   │   ├── StudyView.js        # Vista de estudio/editor
│   │   └── PresentationView.js # Vista de presentaciones
│   │
│   ├── components/         # COMPONENTES REUTILIZABLES
│   │   ├── NotificationManager.js  # Sistema de notificaciones
│   │   ├── ResourceManager.js      # Gestión de archivos/recursos
│   │   ├── EventsManager.js        # Gestión de eventos/entregas
│   │   ├── PomodoroManager.js      # Timer Pomodoro
│   │   ├── DiagramManager.js       # Editor de diagramas
│   │   └── ExcalidrawManager.js    # Integración Excalidraw
│   │
│   └── utils/              # UTILIDADES
│       └── Validator.js        # Validación y sanitización
│
└── docs/                   # Documentación
    ├── ARQUITECTURA.md
    └── DIAGRAMAS-BPMN.md
```

---

## 🏛️ Principios de Diseño

### 1. **Separación de Responsabilidades**
- **Core**: Lógica de negocio y datos
- **Views**: Presentación e interacción con el usuario
- **Components**: Funcionalidades reutilizables
- **Utils**: Herramientas auxiliares

### 2. **Sistema de Eventos**
Comunicación desacoplada mediante eventos:
```javascript
// Emisión de eventos
dataManager.emit('subjectCreated', subject);

// Escucha de eventos
dataManager.on('subjectCreated', (subject) => {
    // Reaccionar al evento
});
```

### 3. **Inyección de Dependencias**
Las vistas reciben sus dependencias en el constructor:
```javascript
class DashboardView {
    constructor(dataManager, router, notifications, pomodoroManager) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        this.pomodoroManager = pomodoroManager;
    }
}
```

### 4. **Persistencia Automática**
- **Datos de usuario**: localStorage mediante `StorageManager`
- **Estado de navegación**: localStorage mediante `Router`
- **Auto-guardado**: cada 3 segundos (configurable)

---

## 🔄 Flujo de Datos

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Interacción
       ▼
┌─────────────┐
│    Views    │ ◄──── Renderiza UI
└──────┬──────┘
       │ Llama métodos
       ▼
┌─────────────┐
│ DataManager │ ◄──── Gestiona datos
└──────┬──────┘
       │ Guarda
       ▼
┌─────────────┐
│  Storage    │ ◄──── localStorage
└─────────────┘
       │
       │ Emite evento
       ▼
┌─────────────┐
│   Views     │ ◄──── Se actualizan automáticamente
└─────────────┘
```

---

## 📦 Módulos Principales

### **DataManager** (Core)
**Responsabilidad**: Gestión centralizada de datos
- CRUD de materias, temas, páginas
- Gestión de eventos y recursos
- Emisión de eventos para sincronización
- Validación de datos

**Métodos clave**:
```javascript
createSubject(data)     // Crear materia
getSubjects()           // Obtener todas las materias
createTopic(data)       // Crear tema
getTopics(subjectId)    // Obtener temas de una materia
save()                  // Guardar en localStorage
emit(event, data)       // Emitir evento
on(event, callback)     // Escuchar evento
```

### **Router** (Core)
**Responsabilidad**: Navegación y estado de rutas
- Cambio entre vistas
- **Persistencia de navegación** (nuevo)
- Restauración automática tras F5
- Gestión de breadcrumbs

**Métodos clave**:
```javascript
navigateTo(view, data)  // Navegar a vista
getCurrentView()        // Vista actual
goBack()                // Regresar
saveCurrentState()      // Guardar estado (nuevo)
restoreState()          // Restaurar estado (nuevo)
```

**Características de Persistencia**:
- Guarda la vista actual y datos serializados en localStorage
- Los datos se serializan para evitar referencias circulares
- Estado expira después de 24 horas
- Restaura automáticamente al recargar (F5)

### **Views** (Presentación)
**Responsabilidad**: Renderizar UI y manejar interacción

**Patrón común**:
```javascript
class ExampleView {
    constructor(dataManager, router, notifications) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        this.setupDataListeners();
    }
    
    render(data) {
        // Manejar datos serializados
        if (data && data.id && data.type) {
            data = this.loadFullData(data);
        }
        
        // Renderizar HTML
        this.container.innerHTML = `...`;
        
        // Actualizar iconos
        lucide.createIcons();
    }
    
    setupDataListeners() {
        // Reaccionar a cambios de datos
        this.dataManager.on('dataChanged', () => {
            this.render();
        });
    }
}
```

### **Components** (Reutilizables)
Componentes independientes que pueden ser usados en múltiples vistas:

- **NotificationManager**: Toasts y alertas
- **ResourceManager**: Upload y gestión de archivos
- **EventsManager**: Calendarios y entregas
- **PomodoroManager**: Timer y estadísticas

---

## 🔐 Seguridad y Validación

### **Validator** (Utils)
Sanitiza y valida datos antes de guardar:
```javascript
Validator.sanitizeAndValidate(data, type);
```

**Validaciones**:
- XSS prevention (sanitización HTML)
- Límites de longitud
- Tipos de datos requeridos
- Formatos específicos (emails, URLs)

---

## 🎨 Patrones de Diseño Utilizados

### 1. **Observer Pattern**
Sistema de eventos para comunicación desacoplada:
```javascript
// Publisher
dataManager.emit('subjectCreated', subject);

// Subscriber
view.on('subjectCreated', (subject) => { ... });
```

### 2. **Singleton Pattern**
Instancias únicas de managers:
```javascript
const app = new CuadernoInteligente(); // Una sola instancia
```

### 3. **Module Pattern**
Módulos ES6 para encapsulación:
```javascript
export default DataManager;
import DataManager from './core/DataManager.js';
```

### 4. **Strategy Pattern**
Diferentes estrategias de renderizado según la vista:
```javascript
switch (viewType) {
    case 'dashboard': return this.renderDashboard();
    case 'topics': return this.renderTopics();
}
```

---

## 🔄 Sistema de Persistencia Mejorado

### **Problema Resuelto**
Antes: Al refrescar (F5), siempre volvía al dashboard.
Ahora: Mantiene la vista y datos exactos donde estabas.

### **Implementación**

1. **Serialización de Datos**:
```javascript
// Router.js
serializeData(data) {
    // Subject individual
    if (data.id) {
        return { id: data.id, type: 'subject' };
    }
    
    // StudyView con subject y topic
    if (data.subject && data.topic) {
        return {
            subject: { id: data.subject.id, type: 'subject' },
            topic: { id: data.topic.id, type: 'topic' }
        };
    }
}
```

2. **Deserialización en Vistas**:
```javascript
// TopicsView.js
render(subject) {
    // Si es referencia serializada, cargar objeto completo
    if (subject.id && subject.type === 'subject') {
        subject = this.dataManager.getSubjects()
            .find(s => s.id === subject.id);
    }
    
    // Renderizar con datos completos
    this.renderContent(subject);
}
```

3. **Almacenamiento**:
```javascript
localStorage.setItem('cuaderno_route_state', JSON.stringify({
    view: 'topics',
    data: { id: 'subj_1', type: 'subject' },
    timestamp: '2025-10-01T20:00:00.000Z'
}));
```

---

## 📊 Flujo de Navegación con Persistencia

```
Usuario en StudyView
       │
       ├─► Presiona F5
       │
       ▼
Router.restoreState()
       │
       ├─► Lee localStorage
       │   └─► { view: 'study', data: { subject: {id}, topic: {id} } }
       │
       ▼
router.navigateTo('study', serializedData)
       │
       ▼
StudyView.render(serializedData)
       │
       ├─► Detecta datos serializados
       ├─► Carga subject completo desde DataManager
       ├─► Carga topic completo desde DataManager
       │
       ▼
Renderiza vista exacta donde estaba
```

---

## ✅ Ventajas de la Arquitectura Actual

1. **Modular**: Cada módulo tiene una responsabilidad clara
2. **Mantenible**: Fácil de encontrar y modificar código
3. **Escalable**: Agregar nuevas vistas o componentes es sencillo
4. **Testeable**: Componentes independientes facilitael testing
5. **Reutilizable**: Componentes pueden usarse en múltiples vistas
6. **Persistente**: Estado se mantiene tras recargas
7. **Desacoplada**: Comunicación mediante eventos

---

## 🚀 Mejoras Implementadas

### ✅ Persistencia de Navegación
- Estado se guarda automáticamente en cada navegación
- Se restaura al recargar la página (F5)
- Expira después de 24 horas
- Maneja datos complejos (subject + topic)

### ✅ Manejo de Datos Serializados
- Views detectan y reconstruyen datos serializados
- Fallback a dashboard si los datos no existen
- Navegación segura sin errores

### ✅ Arquitectura Limpia
- Separación clara de responsabilidades
- Sin código espagueti
- Patrón de diseño consistente
- Documentación completa

---

## 📝 Convenciones de Código

### Nombres de Clases
```javascript
PascalCase para clases: DataManager, TopicsView
```

### Nombres de Métodos
```javascript
camelCase para métodos: createSubject(), navigateTo()
```

### Nombres de Eventos
```javascript
camelCase: 'subjectCreated', 'navigationChanged'
```

### Comentarios
```javascript
/**
 * Descripción del método
 * @param {Type} param - Descripción
 * @returns {Type} Descripción
 */
```

---

## 🎯 Próximas Mejoras Sugeridas

1. **TypeScript**: Para tipado estático
2. **Testing**: Unit tests con Jest
3. **Build Tool**: Webpack o Vite para optimización
4. **PWA**: Service Workers para offline
5. **Sincronización**: Cloud sync (Firebase/Supabase)

---

**Versión**: 2.0.0  
**Última actualización**: 2025-10-01  
**Autor**: Sistema de Cuaderno Inteligente
