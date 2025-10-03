# Guía de Uso - Editor de Diagramas

## 🎯 Cómo Crear una Página de Diagramas

### Paso 1: Ir a StudyView
1. Abre tu **Cuaderno Inteligente**
2. Selecciona una **materia**
3. Selecciona un **tema**
4. Entrarás a la vista de estudio (StudyView)

### Paso 2: Crear Nueva Página
1. En el **sidebar izquierdo**, busca el botón **"Nueva Página"** (abajo)
2. Haz clic en **"Nueva Página"**
3. Aparecerá un modal con 2 opciones:
   - 📄 **Página de Texto** - Editor de texto rico
   - 💡 **Página de Ideas** - Diagramas y mapas mentales

### Paso 3: Seleccionar Tipo Diagrama
1. Haz clic en **"Página de Ideas"** (💡)
2. Se creará automáticamente la página
3. El editor de diagramas se abrirá instantáneamente

## 🛠️ Herramientas del Editor

### Paleta de Herramientas (Izquierda)
Al abrir el editor de diagramas, verás una **paleta** en el lado izquierdo con:

- **Create StartEvent** - Evento de inicio (círculo)
- **Create Task** - Tarea (rectángulo)
- **Create EndEvent** - Evento de fin (círculo grueso)
- **Create Gateway** - Decisión (rombo)
- **Create Subprocess** - Subproceso
- **Create DataObject** - Objeto de datos
- **Create Pool/Lane** - Contenedores

### Cómo Usar las Herramientas

#### Agregar Elementos
1. **Arrastra** un elemento desde la paleta
2. **Suéltalo** en el canvas
3. El elemento aparecerá donde lo soltaste

#### Conectar Elementos
1. **Haz clic** en un elemento
2. Aparecerá el **context pad** (menú circular)
3. **Arrastra** desde el icono de flecha
4. **Conecta** al siguiente elemento

#### Editar Texto
1. **Doble clic** en cualquier elemento
2. **Escribe** el nombre/descripción
3. **Clic afuera** para confirmar

#### Mover Elementos
1. **Haz clic** en un elemento
2. **Arrastra** a nueva posición
3. Las conexiones se actualizan automáticamente

#### Eliminar Elementos
1. **Haz clic** en un elemento para seleccionarlo
2. Presiona **Delete** o **Backspace**
3. O usa el icono 🗑️ del context pad

### Context Pad (Menú Rápido)
Al hacer clic en un elemento, aparece un menú con:
- ➕ **Agregar elemento conectado**
- 🔗 **Crear conexión**
- 🗑️ **Eliminar**
- ⚙️ **Cambiar tipo**

## 💾 Guardado Automático

### Auto-guardado
- ✅ Se guarda **automáticamente cada 3 segundos**
- ✅ Solo se activa **después de hacer cambios**
- ✅ **No necesitas hacer nada**, es transparente

### Guardado Manual
- **Ctrl + S** - Guarda inmediatamente
- **Botón "Guardar"** - En el toolbar superior

### Persistencia
- ✅ Al **cambiar de página** → guarda automáticamente
- ✅ Al **recargar (F5)** → tu diagrama persiste
- ✅ Al **cerrar pestaña** → se guarda antes de cerrar

## 🔍 Zoom y Navegación

### Métodos de Zoom
1. **Rueda del mouse** sobre el canvas
   - Scroll arriba = Zoom in
   - Scroll abajo = Zoom out

2. **Ctrl + Scroll** (alternativa)
   - Más preciso

3. **Teclado** (próximamente)
   - `Ctrl + +` = Zoom in
   - `Ctrl + -` = Zoom out
   - `Ctrl + 0` = Resetear zoom

### Mover el Canvas
1. **Clic derecho + arrastrar**
2. O **Espacio + arrastrar** (próximamente)
3. El canvas se mueve, los elementos quedan fijos

### Ajustar Vista
- El canvas se **centra automáticamente** al crear nuevo diagrama
- Usa zoom out para ver todo el diagrama

## 📋 Atajos de Teclado

### Navegación
- `Ctrl + S` - Guardar
- `Delete` / `Backspace` - Eliminar elemento seleccionado
- `Esc` - Deseleccionar

### Edición (próximamente)
- `Ctrl + Z` - Deshacer
- `Ctrl + Y` - Rehacer
- `Ctrl + C` - Copiar
- `Ctrl + V` - Pegar

## 🎨 Tipos de Diagramas que Puedes Crear

### 1. Diagramas de Flujo
- **Uso**: Algoritmos, procesos paso a paso
- **Elementos**: Tareas (rectángulos), Decisiones (rombos), Flechas
- **Ejemplo**: Algoritmo de ordenamiento

### 2. Mapas Mentales
- **Uso**: Brainstorming, organizar ideas
- **Elementos**: Nodos centrales + nodos conectados
- **Ejemplo**: Plan de estudio para examen

### 3. Diagramas de Procesos
- **Uso**: Flujos de trabajo, procedimientos
- **Elementos**: Inicio, Tareas, Decisiones, Fin
- **Ejemplo**: Proceso de inscripción universitaria

### 4. Diagramas UML (Actividad)
- **Uso**: Modelar comportamiento de sistemas
- **Elementos**: Actividades, decisiones, joins/forks
- **Ejemplo**: Login de usuario

## 🐛 Solución de Problemas

### El editor no carga
1. **Recarga la página** (F5)
2. **Abre la consola** (F12) y busca errores
3. Verifica que estés **conectado a internet** (carga CDN)

### No veo la paleta de herramientas
1. La paleta aparece **a la izquierda** del canvas
2. Si no aparece, **recarga** (F5)
3. Verifica que el contenedor tenga altura suficiente

### Los cambios no se guardan
1. Espera **3 segundos** después de hacer cambios
2. O presiona **Ctrl + S** para guardar manualmente
3. Verifica la consola (F12) para errores

### El diagrama aparece cortado
1. **Zoom out** con la rueda del mouse
2. O presiona el botón **"Ajustar vista"** (próximamente)
3. Los elementos fuera del viewport se pueden alcanzar con zoom

### No puedo conectar elementos
1. **Haz clic** en el elemento de origen
2. Aparecerá el **context pad** (menú)
3. **Arrastra** desde el icono de **flecha**
4. **Conecta** al elemento de destino

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Dispositivos
- ✅ Desktop (recomendado)
- ⚠️ Tablet (funciona, pero menos cómodo)
- ❌ Mobile (no recomendado para edición)

## 🚀 Próximas Funcionalidades

### Corto Plazo
- [ ] Botones de zoom visibles (in, out, fit)
- [ ] Exportar como imagen (PNG/SVG)
- [ ] Templates de diagramas

### Mediano Plazo
- [ ] Deshacer/Rehacer (undo/redo)
- [ ] Copiar/pegar elementos
- [ ] Cambiar colores de elementos

### Largo Plazo
- [ ] Colaboración en tiempo real
- [ ] Compartir diagramas públicos
- [ ] Importar/exportar archivos .bpmn

## 💡 Consejos y Trucos

### 1. Organización
- **Usa Pools y Lanes** para separar responsabilidades
- **Agrupa elementos relacionados** visualmente
- **Mantén distancia** entre elementos para claridad

### 2. Claridad
- **Escribe nombres cortos** en las tareas
- **Usa decisiones (rombos)** para bifurcaciones
- **Conecta de izquierda a derecha** (flujo natural)

### 3. Rendimiento
- **No sobrecargues** un solo diagrama (max 50 elementos)
- Si necesitas más, **crea múltiples páginas**
- **Usa subprocesos** para ocultar complejidad

### 4. Persistencia
- **No te preocupes por guardar**, el auto-save lo hace
- **Cambia de página libremente**, se guarda automáticamente
- **F5 es seguro**, todo persiste en localStorage

## 📞 Soporte

Si encuentras algún problema:
1. **Recarga** la página (F5)
2. **Revisa la consola** (F12 → Console)
3. **Copia el error** y repórtalo
4. **Describe los pasos** para reproducir el problema

---

**¡Feliz creación de diagramas! 🎨✨**
