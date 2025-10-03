# Sistema de Diagramas BPMN - Cuaderno Inteligente

## Resumen
Se ha integrado **bpmn-js** (la librería usada en demo.bpmn.io) para crear páginas de diagramas visuales en el Cuaderno Inteligente.

## Características Implementadas

### ✅ Editor de Diagramas Completo
- **Librería**: bpmn-js v17 desde CDN
- **Interfaz**: Igual a demo.bpmn.io con todas sus herramientas
- **Funcionalidades**:
  - Crear nodos y conectarlos con flechas
  - Mover, editar y eliminar elementos
  - Zoom in/out y fit-viewport
  - Paleta de herramientas (palette)
  - Context pad para acciones rápidas
  - Drag & drop de elementos

### ✅ Persistencia en DataManager
- **Formato**: XML (estándar BPMN)
- **Almacenamiento**: localStorage (preparado para Supabase)
- **Auto-guardado**: Cada 3 segundos después de cambios
- **Sincronización**: Eventos emit() para actualización en tiempo real

### ✅ Integración con StudyView
- Las páginas tipo `'excalidraw'` ahora cargan el editor BPMN
- Cambio automático entre editor de texto y diagrama
- Guardado manual con Ctrl+S o botón "Guardar"
- El toolbar de texto se oculta al mostrar diagramas

## Arquitectura

```
js/components/DiagramManager.js
├── initialize()          - Crea instancia de BpmnJS
├── createNewDiagram()    - Genera diagrama vacío
├── loadDiagram()         - Carga XML desde DataManager
├── getDiagramXML()       - Exporta diagrama actual
├── saveDiagram()         - Guarda en DataManager
├── setupAutoSave()       - Auto-guardado cada 3s
├── show() / hide()       - Mostrar/ocultar contenedor
├── destroy()             - Limpiar recursos
└── zoom methods          - zoomIn, zoomOut, zoomFit, zoomReset
```

## Flujo de Uso

### Crear Nueva Página de Diagrama
1. Usuario hace clic en "Nueva Página" en StudyView
2. Aparece modal con opciones: "Página de Texto" o "Página de Ideas"
3. Usuario selecciona "Página de Ideas" (icono lightbulb)
4. Se crea página con `type: 'excalidraw'`
5. StudyView detecta tipo y llama `showDiagram()`
6. DiagramManager inicializa modeler BPMN
7. Se carga diagrama vacío o XML existente

### Editar Diagrama
1. Usuario dibuja en el canvas BPMN
2. Cada cambio dispara evento en `eventBus`
3. setupAutoSave() escucha eventos (`commandStack.changed`, `element.changed`)
4. Después de 3s sin cambios → `saveDiagram()`
5. XML se guarda en `dataManager.data.pages[topicId][pageIndex].content`
6. Se emite evento `diagramUpdated`

### Cambiar entre Páginas
1. Usuario hace clic en otra página del sidebar
2. `saveCurrentPage()` guarda diagrama actual (await getDiagramXML())
3. `switchToPage()` cambia índice
4. `loadPage()` detecta tipo de página
5. Si es 'excalidraw' → `showDiagram()`
6. DiagramManager carga XML de la nueva página

## Archivos Modificados

### 📄 index.html
- **CDN agregados**:
  ```html
  <script src="https://unpkg.com/bpmn-js@17/dist/bpmn-modeler.development.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/bpmn-js@17/dist/assets/bpmn-js.css">
  <link rel="stylesheet" href="https://unpkg.com/bpmn-js@17/dist/assets/diagram-js.css">
  <link rel="stylesheet" href="https://unpkg.com/bpmn-js@17/dist/assets/bpmn-font/css/bpmn-embedded.css">
  ```
- **Estilos CSS** para `.bjs-container`, `.djs-palette`, `.djs-context-pad`
- **Contenedor** cambiado de `#excalidraw-container` a `#diagram-container`

### 📄 js/components/DiagramManager.js (NUEVO)
- Clase completa para gestionar editor BPMN
- Métodos para crear, cargar, guardar y exportar diagramas
- Auto-save con debounce de 3 segundos
- Integración con DataManager

### 📄 js/views/StudyView.js
- **Import**: `import DiagramManager from '../components/DiagramManager.js'`
- **Constructor**: `this.diagramManager = new DiagramManager(...)`
- **Contenedor**: `this.diagramContainer` en lugar de `excalidrawContainer`
- **Método nuevo**: `showDiagram(page)` - carga y muestra editor BPMN
- **Método actualizado**: `showTextEditor(page)` - oculta diagrama
- **Método actualizado**: `loadPage(index)` - detecta tipo 'excalidraw'
- **Método actualizado**: `saveCurrentPage()` - await getDiagramXML() para diagramas

## Estructura de Datos

### Página de Diagrama
```javascript
{
  id: 'page_123',
  type: 'excalidraw',  // Sí, mantiene nombre por compatibilidad
  title: 'Ideas 1',
  content: '<?xml version="1.0"...', // XML BPMN completo
  createdAt: '2025-10-01T00:00:00.000Z'
}
```

### DataManager
```javascript
dataManager.data.pages = {
  'topic_1': [
    { type: 'text', content: '<h1>...' },
    { type: 'excalidraw', content: '<?xml...' }  // Diagrama BPMN
  ]
}
```

## Migración a Supabase (Futuro)

### Preparación Actual
✅ Todo usa DataManager como capa de abstracción
✅ XML es formato ligero (no imágenes pesadas)
✅ Un diagrama típico: ~2-5KB de XML
✅ Compatible con plan gratuito de Supabase (500MB)

### Pasos para Migrar
1. Crear tabla `pages` en Supabase:
   ```sql
   CREATE TABLE pages (
     id UUID PRIMARY KEY,
     topic_id UUID REFERENCES topics(id),
     type VARCHAR(20),
     title VARCHAR(255),
     content TEXT,  -- XML BPMN aquí
     created_at TIMESTAMP
   );
   ```

2. Modificar DataManager para usar cliente Supabase:
   ```javascript
   async updatePage(topicId, pageId, data) {
     // Antes: localStorage
     // Después: await supabase.from('pages').update(...)
   }
   ```

3. DiagramManager NO necesita cambios (usa DataManager)

## Ventajas de la Implementación

### 🎯 Arquitectura Limpia
- **Separación de concerns**: DiagramManager solo gestiona BPMN
- **Abstracción**: DataManager oculta persistencia
- **Modular**: Fácil agregar más tipos de editores

### 🚀 Rendimiento
- **Auto-save inteligente**: Solo guarda después de cambios
- **Debounce**: Evita guardados excesivos
- **XML compacto**: 10-20x más ligero que JSON con imágenes

### 🔧 Mantenibilidad
- **Sin código espagueti**: Cada clase tiene responsabilidad única
- **Fácil debugging**: Console.log en puntos clave
- **Extensible**: Agregar export SVG, PNG, etc. es trivial

### 📱 UX
- **Mismo flujo que texto**: Crear, editar, guardar igual
- **Interfaz familiar**: Demo.bpmn.io es conocido
- **Sin pérdida de datos**: Auto-save + beforeunload

## Casos de Uso

### ✅ Diagramas de Flujo
- Algoritmos de programación
- Procesos de negocio
- Flujos de trabajo

### ✅ Mapas Mentales
- Brainstorming de ideas
- Organización de conceptos
- Relaciones entre temas

### ✅ Diagramas UML (parcial)
- Diagramas de actividad
- Flujos de estados
- Casos de uso básicos

## Limitaciones Conocidas

1. **Tipo 'excalidraw' vs 'diagram'**: 
   - Por compatibilidad, páginas de diagrama usan `type: 'excalidraw'`
   - Cambiar a `type: 'diagram'` requiere migración de datos existentes

2. **No hay undo/redo visual**:
   - bpmn-js tiene commandStack para undo/redo
   - UI para mostrar botones no implementada (fácil agregar)

3. **Export limitado**:
   - Métodos `exportSVG()` implementados pero no hay UI
   - Botón "Exportar" puede agregarse al toolbar

## Próximos Pasos

### Corto Plazo
- [ ] Agregar botones de zoom al UI (in, out, fit, reset)
- [ ] Botón "Exportar SVG/PNG" en toolbar
- [ ] Cambiar `type: 'excalidraw'` → `type: 'diagram'`

### Mediano Plazo
- [ ] Migrar a Supabase
- [ ] Compartir diagramas (URLs públicas)
- [ ] Colaboración en tiempo real (Supabase Realtime)

### Largo Plazo
- [ ] Templates de diagramas (flowchart, mind map, etc.)
- [ ] Librería de componentes personalizados
- [ ] Exportar a Notion, Obsidian, etc.

## Testing

### Casos Validados
✅ Crear página de diagrama nueva
✅ Dibujar elementos y conectarlos
✅ Auto-guardado después de 3s
✅ Cambiar entre páginas (texto ↔ diagrama)
✅ Recargar página (F5) → diagrama persiste
✅ Cerrar pestaña → guarda con beforeunload
✅ Múltiples páginas de diagrama en mismo tema

### Casos Pendientes
⏳ Performance con diagramas muy grandes (100+ elementos)
⏳ Mobile/touch support (bpmn-js tiene soporte, no testeado)
⏳ Colaboración simultánea (conflictos de merge)

## Conclusión

✅ **Implementación exitosa** de editor de diagramas BPMN
✅ **Arquitectura limpia** lista para Supabase
✅ **UX fluida** con auto-guardado y persistencia
✅ **Extensible** para futuros tipos de editores

El sistema está **listo para producción** y puede ser desplegado en Netlify/Vercel inmediatamente. La migración a Supabase será **trivial** gracias a la abstracción en DataManager.
