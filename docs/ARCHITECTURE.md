# 📚 Arquitectura del Cuaderno Inteligente

## 📋 Índice
1. [Visión General](#visión-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Flujo de Datos](#flujo-de-datos)
4. [Componentes Principales](#componentes-principales)
5. [Vistas](#vistas)
6. [Gestión de Estado](#gestión-de-estado)
7. [Convenciones de Código](#convenciones-de-código)

---

## 🎯 Visión General

**Cuaderno Inteligente** es una aplicación SPA (Single Page Application) para gestión de estudios con las siguientes características:

- ✅ Gestión de materias y temas
- ✅ Editor de texto enriquecido
- ✅ Sistema de recursos (PDFs, imágenes, audio)
- ✅ Técnica Pomodoro integrada
- ✅ Calendario de eventos
- ✅ Dashboard con estadísticas
- ✅ Modo presentación

---

## 📁 Estructura de Archivos

```
Cuaderno-inteligente/
│
├── index.html                 # Punto de entrada único
├── css/
│   └── styles-new.css        # Estilos globales
│
├── js/
│   ├── app.js                # Inicialización de la aplicación
│   │
│   ├── core/                 # 🔷 NÚCLEO DEL SISTEMA
│   │   ├── Router.js         # Navegación entre vistas
│   │   ├── DataManager.js    # Gestión centralizada de datos
│   │   └── StorageManager.js # Persistencia en localStorage
│   │
│   ├── views/                # 🖼️ VISTAS PRINCIPALES
│   │   ├── DashboardView.js  # Vista inicial con resumen
│   │   ├── SubjectsView.js   # Lista de materias
│   │   ├── TopicsView.js     # Temas de una materia
│   │   ├── StudyView.js      # Editor de texto (VISTA PRINCIPAL)
│   │   └── PresentationView.js # Modo presentación
│   │
│   ├── components/           # 🧩 COMPONENTES REUTILIZABLES
│   │   ├── EventsManager.js     # Gestión de eventos/entregas
│   │   ├── ResourceManager.js   # Gestión de recursos
│   │   ├── PomodoroManager.js   # Técnica Pomodoro
│   │   └── NotificationManager.js # Sistema de notificaciones
│   │
│   └── utils/                # 🛠️ UTILIDADES
│       └── [utilidades futuras]
│
└── assets/                   # 📦 RECURSOS ESTÁTICOS
    └── [imágenes, iconos]
```

---

## 🔄 Flujo de Datos

### 1️⃣ **Arquitectura de Capas**

```
┌─────────────────────────────────────────┐
│           CAPA DE VISTA                 │
│  (DashboardView, TopicsView, etc.)      │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│        CAPA DE COMPONENTES              │
│  (EventsManager, ResourceManager, etc.)  │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│         CAPA DE DATOS                   │
│         (DataManager)                   │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      CAPA DE PERSISTENCIA               │
│       (StorageManager)                  │
└─────────────────────────────────────────┘
```

### 2️⃣ **Sistema de Eventos**

**DataManager** actúa como Event Bus:

```javascript
// Emisión de evento
dataManager.emit('resourceAdded', { resourceId, topicId });

// Escucha de evento
dataManager.on('resourceAdded', (event) => {
    // Reaccionar al cambio
});
```

**Eventos Principales:**
- `resourceAdded` / `resourceDeleted` - Cambios en recursos
- `eventCreated` / `eventUpdated` / `eventDeleted` - Cambios en eventos
- `progressUpdated` - Actualización de progreso
- `topicCreated` / `topicUpdated` / `topicDeleted` - Cambios en temas

---

## 🧩 Componentes Principales

### 📋 EventsManager
**Propósito:** Gestión de eventos y entregas

**Responsabilidades:**
- Crear/editar/eliminar eventos
- Mostrar widget en header de StudyView
- Sincronizar con TopicsView sidebar
- Filtrar eventos completados

**Archivo:** `js/components/EventsManager.js`

---

### 📦 ResourceManager
**Propósito:** Gestión de recursos (PDFs, imágenes, audio)

**Responsabilidades:**
- Subir archivos (máx 20MB)
- Mostrar recursos en sidebar
- Abrir visualizadores (PDF, imagen, audio)
- Reproductor de audio minimizable
- Sincronización entre TopicsView y StudyView

**Archivo:** `js/components/ResourceManager.js`

---

### 🍅 PomodoroManager
**Propósito:** Técnica Pomodoro para sesiones de estudio

**Responsabilidades:**
- Configurar tiempos de trabajo/descanso
- Timer con cuenta regresiva
- Música de fondo personalizable
- Alarma al finalizar
- Widget flotante y pestaña lateral
- Guardar estadísticas de estudio

**Archivo:** `js/components/PomodoroManager.js`

---

### 🔔 NotificationManager
**Propósito:** Sistema de notificaciones visuales

**Responsabilidades:**
- Mostrar notificaciones (success, error, warning, info)
- Auto-cierre configurable
- Animaciones de entrada/salida
- Centradas en la parte superior

**Archivo:** `js/components/NotificationManager.js`

---

## 🖼️ Vistas

### 🏠 DashboardView
**Ruta:** `/dashboard`

**Funcionalidad:**
- Vista inicial de la aplicación
- Resumen de materias con progreso
- "Continuar donde lo dejaste"
- Próximas entregas
- Gráfico de estudio semanal

---

### 📚 SubjectsView
**Ruta:** `/subjects`

**Funcionalidad:**
- Lista/Grid de materias
- Crear nueva materia
- Editar/eliminar materias
- Navegar a TopicsView

---

### 📖 TopicsView
**Ruta:** `/topics/:subjectId`

**Funcionalidad:**
- Lista de temas de una materia
- Crear/editar/eliminar temas
- Subtareas por tema
- Sidebar con recursos y eventos
- Botón "Iniciar Sesión" / "Entrar"

---

### ✍️ StudyView (PRINCIPAL)
**Ruta:** `/study/:subjectId/:topicId`

**Funcionalidad:**
- Editor de texto enriquecido (ContentEditable)
- Toolbar con formato (negrita, cursiva, listas, etc.)
- Páginas múltiples (texto, Excalidraw, tabla)
- Sidebar izquierdo: Lista de páginas
- Sidebar derecho: Recursos
- Header con eventos y botones
- Carrusel de acciones (Pomodoro, paneles, etc.)
- Modo sin distracciones (ocultar header)
- Timer de sesión de estudio
- Auto-guardado

**Archivo:** `js/views/StudyView.js` (⚠️ 146KB - NECESITA REFACTORIZACIÓN)

---

### 🎥 PresentationView
**Ruta:** `/presentation/:subjectId/:topicId`

**Funcionalidad:**
- Modo presentación fullscreen
- Navegar entre páginas con flechas
- Salir con Esc

---

## 🗄️ Gestión de Estado

### DataManager
**Archivo:** `js/core/DataManager.js`

**Estructura de datos:**
```javascript
{
    userName: 'Usuario',
    
    subjects: [
        {
            id: 'subj_xxx',
            name: 'Cálculo I',
            description: 'Derivadas e integrales',
            color: 'indigo',
            lastAccessed: '2025-01-15T10:30:00'
        }
    ],
    
    topics: {
        'subj_xxx': [
            {
                id: 'topic_xxx',
                name: 'Derivadas',
                pages: [
                    {
                        id: 'page_xxx',
                        type: 'text', // 'text' | 'excalidraw' | 'table'
                        content: '...',
                        order: 0
                    }
                ]
            }
        ]
    },
    
    subtasks: {
        'topic_xxx': [
            {
                id: 'subtask_xxx',
                name: 'Resolver ejercicios',
                completed: false
            }
        ]
    },
    
    events: {
        'subj_xxx': [
            {
                id: 'event_xxx',
                title: 'Examen Final',
                description: 'Incluye todo el semestre',
                date: '2025-10-07T15:15:00',
                type: 'exam', // 'exam' | 'assignment' | 'presentation' | 'class'
                completed: false
            }
        ]
    },
    
    resources: {
        'subj_xxx': [
            {
                id: 'res_xxx',
                name: 'Práctica 1.pdf',
                type: 'pdf', // 'image' | 'pdf' | 'text' | 'audio'
                data: 'data:application/pdf;base64,...',
                size: 684870,
                uploadedAt: '2025-09-30T15:00:00'
            }
        ]
    },
    
    studyStats: {
        '2025-01-15': {
            'subj_xxx': 45 // minutos estudiados
        }
    },
    
    activeStudySession: {
        subjectId: 'subj_xxx',
        startTime: '2025-01-15T10:00:00',
        pausedTime: 0,
        totalTime: 0
    }
}
```

---

## 📝 Convenciones de Código

### 🎨 Estilos CSS

```css
/* ===================================
   SECCIÓN: Descripción de la sección
   =================================== */

/* Subsección específica */
.clase-especifica {
    /* Propiedad con comentario si es complejo */
    property: value;
}
```

### 🔧 JavaScript

```javascript
/**
 * Descripción de la clase/método
 * 
 * @param {Type} paramName - Descripción del parámetro
 * @returns {Type} Descripción del retorno
 */
class MiClase {
    /**
     * Constructor
     */
    constructor(param) {
        // Inicialización
    }
    
    // ==================== SECCIÓN ====================
    
    /**
     * Método público
     */
    metodoPublico() {
        // Implementación
    }
    
    /**
     * Método privado (por convención)
     */
    _metodoPrivado() {
        // Implementación
    }
}
```

### 📦 Nomenclatura

- **Archivos:** PascalCase para clases (`StudyView.js`)
- **Clases:** PascalCase (`class StudyView`)
- **Métodos:** camelCase (`renderContent()`)
- **Variables:** camelCase (`currentSubject`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **IDs HTML:** kebab-case (`study-content-grid`)
- **Eventos custom:** camelCase (`resourceAdded`)

---

## ⚠️ Áreas que Necesitan Refactorización

### 🔴 CRÍTICO: StudyView.js (146KB)

**Problema:** Archivo demasiado grande, múltiples responsabilidades

**Solución propuesta:**
```
StudyView.js (coordinador principal)
├── TextEditor.js (lógica del editor)
├── PageManager.js (gestión de páginas)
├── ExcalidrawManager.js (canvas de dibujo)
├── TableManager.js (tablas)
└── ToolbarManager.js (toolbar del editor)
```

### 🟡 MEDIO: PomodoroManager.js (43KB)

**Problema:** Muchas funciones mezcladas

**Solución propuesta:**
```
PomodoroManager.js (coordinador)
├── PomodoroTimer.js (lógica del timer)
├── PomodoroWidget.js (UI del widget)
└── PomodoroAudio.js (música y alarmas)
```

### 🟢 BUENO: El resto de archivos están bien organizados

---

## 🚀 Próximos Pasos de Mejora

1. ✅ **Documentar código existente** (comentarios claros)
2. 🔄 **Refactorizar StudyView.js** (dividir en módulos)
3. 🔄 **Refactorizar PomodoroManager.js**
4. 📊 **Agregar tests unitarios**
5. 🎨 **Crear guía de estilos visual**
6. 📚 **Documentación de usuario**

---

## 📞 Contacto y Contribución

Para contribuir al proyecto:
1. Seguir las convenciones establecidas
2. Documentar todo código nuevo
3. Mantener la modularidad
4. Escribir código limpio y legible

---

**Última actualización:** 2025-09-30
**Versión:** 1.0.0
