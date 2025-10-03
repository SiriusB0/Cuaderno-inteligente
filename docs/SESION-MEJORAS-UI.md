# Sesión de Mejoras UI - 02/10/2025

## Resumen de Cambios Implementados

Esta sesión se enfocó en mejorar la experiencia de usuario mediante la implementación de botones de eliminación, modales de confirmación profesionales, y ajustes al sistema de notificaciones.

---

## 1. Sistema de Eliminación con Botones de Papelera

### 1.1 TopicsView - Botones de Eliminación

**Archivos modificados:**
- `js/views/TopicsView.js`

**Elementos con botón de papelera:**

#### Temas (Acordeones)
```javascript
// Ubicación: Header del acordeón (summary)
<button class="delete-topic-btn opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-700 hover:text-red-400" 
        title="Eliminar tema" 
        data-topic-id="${topic.id}" 
        onclick="event.stopPropagation();">
    <i data-lucide="trash-2" class="w-4 h-4 text-slate-400"></i>
</button>
```

**Funcionalidad:**
- Aparece solo en hover sobre el tema
- Modal de confirmación muestra cantidad de subtareas que se eliminarán
- Elimina el tema y todas sus subtareas asociadas

#### Subtareas
```javascript
// Ubicación: Al lado derecho de cada subtarea
<button class="delete-subtask-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700 hover:text-red-400" 
        data-subtask-id="${subtask.id}" 
        title="Eliminar subtarea" 
        onclick="event.stopPropagation();">
    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
</button>
```

**Funcionalidad:**
- Visible en hover sobre la subtarea
- Modal de confirmación con nombre de la subtarea
- Actualiza progreso automáticamente

#### Recursos
```javascript
// Ubicación: Al lado de cada recurso
<button class="delete-resource-btn opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 hover:text-red-400 transition-all" 
        data-resource-id="${resource.id}" 
        title="Eliminar recurso" 
        onclick="event.stopPropagation();">
    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
</button>
```

**Funcionalidad:**
- Visible en hover
- Elimina archivo y actualiza ambas vistas (TopicsView y StudyView)

#### Eventos
```javascript
// Ubicación: En la lista de próximas entregas
<button class="delete-event-btn opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 hover:text-red-400 transition-all" 
        data-event-id="${event.id}" 
        title="Eliminar evento" 
        onclick="event.stopPropagation();">
    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
</button>
```

**Funcionalidad:**
- Los eventos completados se tachan visualmente pero permanecen en la lista
- Solo se eliminan permanentemente con el botón de papelera
- Modal de confirmación antes de eliminar

### 1.2 DashboardView - Botones de Eliminación

**Archivos modificados:**
- `js/views/DashboardView.js`

#### Períodos
```javascript
// Ubicación: Al lado del nombre del período
<button id="delete-period-btn" 
        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 hover:text-red-400 rounded transition-all" 
        title="Eliminar período">
    <i data-lucide="trash-2" class="w-4 h-4 text-slate-400"></i>
</button>
```

**Funcionalidad:**
- Muestra cantidad de materias que se eliminarán
- Elimina el período y todas las materias asociadas
- Actualiza al siguiente período disponible

**Corrección aplicada:**
- Se eliminó `style="position: relative; z-index: 200;"` del selector de período que causaba que quedara visible sobre otros elementos

---

## 2. Menú Dropdown para Materias

**Archivo:** `js/views/DashboardView.js`

### Estructura del Menú

```javascript
<div class="relative subject-menu-container">
    <button class="subject-menu-btn p-1 hover:bg-slate-700 rounded" 
            data-subject-id="${subject.id}" 
            onclick="event.stopPropagation();">
        <i data-lucide="more-vertical" class="text-slate-500 w-5 h-5"></i>
    </button>
    <div class="subject-dropdown hidden absolute right-0 top-full mt-1 bg-slate-700 rounded-lg shadow-2xl border border-slate-600 py-1 z-50 min-w-[140px]">
        <button class="edit-subject-btn w-full px-4 py-2 text-left hover:bg-slate-600 transition-colors flex items-center gap-2 text-slate-200">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
            <span class="text-sm">Editar</span>
        </button>
        <button class="delete-subject-btn w-full px-4 py-2 text-left hover:bg-slate-600 transition-colors flex items-center gap-2 text-red-400">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span class="text-sm">Eliminar</span>
        </button>
    </div>
</div>
```

### Funcionalidades

**Editar Materia:**
- Modal con campos de nombre y descripción
- Valores pre-cargados
- Validación de nombre requerido

**Eliminar Materia:**
- Modal de confirmación
- Muestra cantidad de temas que se eliminarán
- Elimina materia con todo su contenido

---

## 3. Sistema de Modales de Confirmación

**Archivos modificados:**
- `js/views/TopicsView.js`
- `js/views/DashboardView.js`
- `js/views/StudyView.js`
- `js/views/SubjectsView.js`

### Método Unificado

```javascript
showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-white mb-3">${title}</h3>
                <p class="text-sm text-slate-300 mb-6">${message}</p>
                
                <div class="flex justify-end gap-3">
                    <button class="cancel-modal-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button class="accept-modal-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    // ... event listeners
}
```

### Características
- Diseño consistente en toda la aplicación
- Backdrop con blur
- Focus automático en botón "Cancelar"
- Click fuera del modal = Cancelar
- Botón "Eliminar" en rojo para advertencia visual

### Reemplazos Realizados

**Eliminados todos los `prompt()` y `confirm()` nativos:**
- ✅ Crear período → Modal con input
- ✅ Crear tarea → Modal con input
- ✅ Eliminar tarea → Modal de confirmación
- ✅ Eliminar período → Modal de confirmación
- ✅ Eliminar materia → Modal de confirmación
- ✅ Eliminar tema → Modal de confirmación
- ✅ Eliminar subtarea → Modal de confirmación
- ✅ Eliminar recurso → Modal de confirmación
- ✅ Eliminar evento → Modal de confirmación
- ✅ Eliminar página → Modal de confirmación
- ✅ Resetear datos → Doble modal de confirmación

---

## 4. Mejoras en Gestión de Eventos

**Archivo:** `js/views/TopicsView.js`

### Cambios en Visualización

**Antes:**
- Solo mostraba eventos no completados
- Desaparecían al marcarlos como completados

**Ahora:**
- Muestra TODOS los eventos (completados y pendientes)
- Eventos completados se tachan visualmente
- Permanecen en la lista hasta eliminación manual

```javascript
// Renderizado con estilos de tachado
<li class="flex items-center gap-3 group ${isCompleted ? 'opacity-60' : ''}">
    <div class="flex-1">
        <h4 class="font-semibold text-sm text-white ${isCompleted ? 'line-through' : ''}">
            ${event.title}
        </h4>
        <p class="text-xs text-slate-400 ${isCompleted ? 'line-through' : ''}">
            ${this.getEventTypeName(event.type)}
        </p>
    </div>
    <div class="flex items-center gap-2">
        <input type="checkbox" class="event-checkbox" ${isCompleted ? 'checked' : ''}>
        <button class="delete-event-btn opacity-0 group-hover:opacity-100">
            <i data-lucide="trash-2"></i>
        </button>
    </div>
</li>
```

### Icono del Botón de Gestión

**Cambio:** `plus` → `settings` (engranaje)

```javascript
<button id="manage-events-btn" title="Gestionar eventos">
    <i data-lucide="settings" class="w-4 h-4"></i>
</button>
```

**Funcionalidad:**
- Abre modal de gestión de eventos
- Permite crear, ver y eliminar eventos

---

## 5. Corrección del Botón "Añadir Recurso"

**Archivo:** `js/views/TopicsView.js`

### Problema Original
El botón intentaba hacer click en un input que no existía en el DOM.

### Solución Implementada

```javascript
showAddResourceModal() {
    // Crear input de archivo dinámicamente
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf,.txt,audio/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tamaño (20MB)
        if (file.size > 20 * 1024 * 1024) {
            this.notifications.error('El archivo es demasiado grande. Máximo 20MB');
            return;
        }
        
        // Convertir a base64 y guardar
        const reader = new FileReader();
        reader.onload = (event) => {
            const resource = {
                id: `resource_${Date.now()}`,
                name: file.name,
                type: this.getFileType(file.type),
                data: event.target.result,
                size: file.size,
                createdAt: new Date().toISOString()
            };
            
            // Guardar y emitir evento
            this.dataManager.data.resources[this.currentSubject.id].push(resource);
            this.dataManager.save();
            this.dataManager.emit('resourceAdded', { subjectId: this.currentSubject.id, resource });
            
            this.render(this.currentSubject);
            this.notifications.success('Recurso añadido correctamente');
        };
        reader.readAsDataURL(file);
    });
    
    fileInput.click();
}

getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
}
```

**Características:**
- ✅ Crea input dinámicamente
- ✅ Valida tamaño (20MB)
- ✅ Convierte a Base64
- ✅ Guarda en dataManager
- ✅ Emite eventos para sincronización
- ✅ Actualiza vista automáticamente

---

## 6. Sistema de Notificaciones - Configuración Avanzada

**Archivos modificados:**
- `js/components/NotificationManager.js`
- `index.html` (animación CSS)

### Problema Encontrado

Las notificaciones no se actualizaban debido a:
1. Caché del navegador guardaba versión antigua del JavaScript
2. Clases CSS no se forzaban a actualizar si el contenedor ya existía

### Solución Implementada: Estilos Inline

**Por qué estilos inline:**
- Tienen máxima prioridad en CSS
- No pueden ser sobrescritos por caché
- Se aplican directamente al elemento
- Garantizan que los cambios se vean inmediatamente

### Código de Notificaciones Discretas

```javascript
createNotification(id, message, type, actions) {
    const notification = document.createElement('div');
    notification.id = id;
    
    // ESTILOS INLINE - No afectados por caché
    notification.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 200px;
        background: rgba(156, 163, 175, 0.25);
        backdrop-filter: blur(4px);
        border-radius: 6px;
        border-left: 1px solid rgba(156, 163, 175, 0.3);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        padding: 6px;
        font-size: 9px;
        color: #6b7280;
        opacity: 0.5;
        transition: opacity 0.2s;
        transform: translateY(-100%);
        animation: slideDown 0.3s forwards;
    `;
    
    // Hover aumenta opacidad
    notification.onmouseenter = () => notification.style.opacity = '0.9';
    notification.onmouseleave = () => notification.style.opacity = '0.5';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="${typeConfig.icon}" style="width: 10px; height: 10px;"></i>
            <p style="flex: 1; margin: 0; font-size: 9px; font-weight: 300; line-height: 1.2; color: #6b7280;">
                ${message}
            </p>
            <button class="notification-close" style="background: none; border: none; padding: 0; cursor: pointer; color: #9ca3af; width: 10px; height: 10px;">
                <i data-lucide="x" style="width: 10px; height: 10px;"></i>
            </button>
        </div>
    `;
    
    return notification;
}
```

### Contenedor Forzado

```javascript
createContainer() {
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // FORZAR actualización de clases (incluso si ya existía)
    container.className = 'fixed bottom-4 right-4 z-50 space-y-1.5 w-full max-w-[200px]';
    
    return container;
}
```

### Animación CSS (index.html)

```css
@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 0.5;
    }
}
```

### Características de las Notificaciones

**Tamaño:**
- Ancho máximo: 200px
- Padding: 6px
- Texto: 9px
- Iconos: 10px

**Colores:**
- Fondo: Gris 25% opacidad
- Texto: Gris (#6b7280)
- Sin colores llamativos

**Comportamiento:**
- Opacidad base: 50% (casi invisible)
- Hover: 90% (legible)
- Posición: Esquina inferior derecha
- Duración: 2.5 segundos
- Animación: Desliza desde arriba

### Cómo Modificar las Notificaciones

**Para cambiar el tamaño:**
```javascript
notification.style.cssText = `
    max-width: 250px;  // Cambiar ancho
    padding: 8px;      // Cambiar padding
    font-size: 11px;   // Cambiar tamaño de texto
`;
```

**Para cambiar la opacidad:**
```javascript
opacity: 0.7;  // Cambiar opacidad base (0.0 a 1.0)

notification.onmouseenter = () => notification.style.opacity = '1.0';  // Hover
```

**Para cambiar la posición:**
```javascript
// En createContainer()
container.className = 'fixed top-4 right-4 z-50 ...';  // Arriba derecha
container.className = 'fixed bottom-4 left-4 z-50 ...';  // Abajo izquierda
container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 ...';  // Arriba centro
```

**Para cambiar la duración:**
```javascript
// En constructor
this.defaultDuration = 3000;  // 3 segundos
```

**Para cambiar los colores:**
```javascript
background: rgba(59, 130, 246, 0.3);  // Azul
color: #3b82f6;  // Texto azul
```

**Para deshabilitar completamente:**
```javascript
// En método show()
show(message, type = 'info', duration = null, actions = null) {
    return null;  // No mostrar nada
}
```

---

## 7. Archivos Modificados - Resumen

### Vistas
- `js/views/TopicsView.js` - Botones de eliminación, modales, eventos, recursos
- `js/views/DashboardView.js` - Menú dropdown, modales, eliminación de períodos y tareas
- `js/views/StudyView.js` - Modal de confirmación para páginas
- `js/views/SubjectsView.js` - Modal de confirmación para resetear datos

### Componentes
- `js/components/NotificationManager.js` - Sistema de notificaciones con estilos inline

### HTML
- `index.html` - Animación CSS para notificaciones

---

## 8. Patrón de Diseño Utilizado

### Hover para Mostrar Acciones

Todos los botones de eliminación usan el patrón:
```css
opacity-0 group-hover:opacity-100
```

**Ventajas:**
- Interfaz limpia sin botones visibles todo el tiempo
- Acciones disponibles al pasar el mouse
- Reduce clutter visual

### Modales Consistentes

Todos los modales comparten:
- Mismo diseño (slate-800, rounded-xl)
- Mismo backdrop (black/80 con blur)
- Mismos botones (Cancelar gris, Acción principal indigo/rojo)
- Mismo comportamiento (click fuera = cancelar)

---

## 9. Buenas Prácticas Aplicadas

1. **Confirmación antes de eliminar** - Previene eliminaciones accidentales
2. **Mensajes descriptivos** - Muestran qué se eliminará exactamente
3. **Feedback visual** - Hover, transiciones, animaciones
4. **Estilos inline para críticos** - Garantiza que se apliquen siempre
5. **Event listeners con stopPropagation** - Previene clicks no deseados
6. **Validaciones** - Tamaño de archivos, campos requeridos
7. **Sincronización** - Eventos emitidos para actualizar múltiples vistas
8. **Diseño consistente** - Mismos patrones en toda la aplicación

---

## 10. Solución de Problemas

### Si las notificaciones no se actualizan:

1. **Hard Refresh:**
   - Ctrl + Shift + R
   - O Ctrl + F5

2. **Limpiar caché:**
   - F12 → Network → Disable cache
   - Click derecho en recargar → "Empty Cache and Hard Reload"

3. **Cerrar y reabrir navegador:**
   - Cierra todas las pestañas
   - Abre de nuevo la aplicación

### Si los botones de papelera no aparecen:

1. Verificar que el elemento padre tenga clase `group`
2. Verificar que el botón tenga `group-hover:opacity-100`
3. Verificar que Lucide icons esté cargado

### Si los modales no funcionan:

1. Verificar que el método `showConfirmModal` esté definido en la vista
2. Verificar que los event listeners estén conectados
3. Revisar consola del navegador para errores

---

---

## 11. Mejoras en el Chat IA - 03/10/2025

### 11.1 Posición de Notificaciones

**Archivo modificado:** `js/components/NotificationManager.js`

**Cambio:**
- Notificaciones movidas de esquina superior derecha a esquina superior izquierda
- `fixed top-4 right-4` → `fixed top-4 left-4`

### 11.2 Corrección de Botones del Chat IA

**Archivo modificado:** `js/components/AIChatModal.js`

**Problema:**
- Los botones de cerrar y limpiar chat no funcionaban debido a selectores incorrectos

**Solución:**
```javascript
// Antes (incorrecto)
const closeBtn = this.modal.querySelector('#ai-chat-close-btn');
const clearBtn = this.modal.querySelector('#ai-chat-clear-btn');

// Después (correcto)
const closeBtn = this.modal.querySelector('#ai-close-btn');
const clearBtn = this.modal.querySelector('#ai-clear-chat-btn');
```

### 11.3 Checkboxes de Fuentes de Búsqueda

**Archivo modificado:** `js/components/AIChatModal.js`

**Nueva funcionalidad:**
Tres checkboxes para controlar dónde busca el asistente IA:

1. **Apuntes** (checked por defecto)
   - Busca en el contenido del editor de texto actual
   - Limita a 2000 caracteres para optimizar

2. **Recursos** (checked por defecto)
   - Busca en los índices JSON de PDFs, documentos, etc.
   - Usa similitud coseno para encontrar fragmentos relevantes

3. **Web externa** (unchecked por defecto)
   - Permite que GPT-4o-mini use su conocimiento general
   - Útil cuando no hay recursos locales sobre el tema

**Validaciones implementadas:**
```javascript
// Debe haber al menos una fuente seleccionada
if (!includeNotes && !includeResources && !includeWeb) {
    throw new Error('Debes seleccionar al menos una fuente de búsqueda');
}

// Si no hay datos locales y web está deshabilitada, informar
if (!includeWeb && topChunks.length === 0 && !editorContext) {
    throw new Error('No hay información disponible en las fuentes seleccionadas...');
}
```

### 11.4 Formato Markdown Mejorado

**Archivo modificado:** `js/components/AIChatModal.js`

**Problema:**
Los títulos markdown (`###`) se mostraban como texto plano con símbolos `###`

**Solución:**
Función `formatMarkdown()` mejorada con soporte completo:

```javascript
formatMarkdown(text) {
    let html = this.escapeHtml(text);
    
    // Títulos con estilos
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-purple-300 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-purple-300 mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h1>');
    
    // Negrita y cursiva con colores
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-200">$1</em>');
    
    // Código inline
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded text-purple-300 text-xs font-mono">$1</code>');
    
    // Listas con viñetas
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-200">• $1</li>');
    
    return html;
}
```

**Resultado:**
- Los títulos ahora se muestran en morado con tamaños diferenciados
- El código inline tiene fondo oscuro y color morado
- Las listas tienen viñetas visibles
- Todo el texto es legible y estéticamente agradable

### 11.5 Prompt del Sistema Mejorado

**Archivo modificado:** `supabase/functions/ask/index.ts`

**Mejoras en la personalidad del profesor:**

```typescript
const systemPrompt = `Eres un PROFESOR EXPERTO y AMIGABLE especializado en la TUP de la UTN.

TU PERSONALIDAD:
- Eres como ese profesor que también es tu amigo: cercano, empático y motivador
- Usas emojis ocasionalmente para hacer el aprendizaje más ameno (pero sin exagerar)
- Tienes sentido del humor sutil que ayuda a relajar el ambiente
- Celebras los pequeños logros y animas cuando algo es difícil
- Hablas en un tono conversacional, como si estuvieras tomando un café con el estudiante

ESTILO PEDAGÓGICO:
7. **Empatiza**: Reconoce cuando algo es difícil
8. **Motiva**: Usa frases como "¡Vas muy bien!", "Esto es importante, presta atención 👀"

FORMATO:
- Emojis estratégicos: 💡 para tips, ⚠️ para advertencias, ✅ para confirmaciones, 🎯 para objetivos
```

**Áreas de expertise ampliadas:**
- Agregado: Álgebra de Boole, Lógica, Matemática Discreta

**Parámetros de OpenAI optimizados:**
```typescript
{
  temperature: 0.8,        // Más creativo y conversacional (antes: 0.7)
  max_tokens: 800,         // Respuestas más completas (antes: 500)
  frequency_penalty: 0.3,  // Evita repeticiones
  presence_penalty: 0.2    // Fomenta variedad
}
```

### 11.6 Validación en Backend

**Archivo modificado:** `supabase/functions/ask/index.ts`

**Nueva validación:**
```typescript
// Si no se permite web y no hay contexto, retornar error
if (!allowWeb && (!topChunks || topChunks.length === 0) && !extraContext) {
  return new Response(
    JSON.stringify({ 
      error: 'No hay información disponible en las fuentes seleccionadas',
      message: 'Activa "Web externa" para obtener respuestas generales...'
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 11.7 Flujo de Uso

**Escenario 1: Solo recursos locales**
- Usuario: ✅ Apuntes, ✅ Recursos, ❌ Web externa
- Resultado: Respuestas basadas únicamente en sus apuntes y PDFs indexados

**Escenario 2: Tema sin recursos**
- Usuario: ✅ Apuntes, ✅ Recursos, ❌ Web externa
- No hay apuntes ni recursos sobre el tema
- Resultado: Error informativo sugiriendo activar "Web externa"

**Escenario 3: Aprendizaje general**
- Usuario: ❌ Apuntes, ❌ Recursos, ✅ Web externa
- Resultado: GPT-4o-mini responde con su conocimiento general, estilo pedagógico

**Escenario 4: Combinado (recomendado)**
- Usuario: ✅ Apuntes, ✅ Recursos, ✅ Web externa
- Resultado: Respuesta enriquecida con contexto local + conocimiento general

---

**Fin del documento**
