# 📝 Guía de Bloques de Código con CodeMirror

## ✨ Características Implementadas

### 🎨 Interfaz Estilo VSCode Dark
- **Diseño profesional** con colores exactos de VSCode
- **Barra superior** con selector de lenguaje y botones de acción
- **Resaltado de sintaxis** según el lenguaje seleccionado
- **Números de línea** visibles
- **Auto-indentación** inteligente

### 🔧 Funcionalidades

#### 1. **Insertar Bloque de Código**
- Haz clic en el botón **"Insertar código"** (icono `</>`) en la toolbar
- Se inserta un bloque editable con CodeMirror
- Por defecto viene con JavaScript seleccionado

#### 2. **Cambiar Lenguaje**
- Usa el **dropdown** en la esquina superior izquierda del bloque
- Lenguajes disponibles:
  - JavaScript
  - Python
  - C++
  - HTML
  - CSS
  - Java
  - PHP
  - SQL
  - Ruby
  - Go
  - C#
  - TypeScript
  - Kotlin
  - Swift
  - XML
  - Texto Plano

#### 3. **Copiar Código**
- Haz clic en el **icono de copiar** (📋) en la barra superior
- El código se copia al portapapeles
- Aparece un ✅ confirmando que se copió exitosamente

#### 4. **Eliminar Bloque**
- Haz clic en el **icono de eliminar** (🗑️) en la barra superior
- Confirma la acción
- El bloque se elimina completamente

#### 5. **Guardado Automático**
- Cada vez que escribes código, **se guarda automáticamente**
- Usa `editor.getValue()` internamente para obtener el contenido
- Los cambios se sincronizan con Supabase (si está configurado)

## 🎯 Cómo Funciona

### Estructura del Código

```javascript
// 1. Al hacer clic en "Insertar código"
insertCodeBlock() {
    // Genera ID único
    // Inserta HTML con estructura
    // Inyecta estilos CSS
    // Inicializa CodeMirror
}

// 2. Inicializa CodeMirror
initializeCodeEditor(blockId) {
    // Obtiene el bloque por ID
    // Crea instancia de CodeMirror
    // Configura event listeners
    // Guarda referencia en block.codeMirrorInstance
}
```

### Recuperación de Código

Cada bloque tiene una referencia a su instancia de CodeMirror:

```javascript
// Obtener el código de un bloque específico
const block = document.getElementById('code-block-xyz');
const code = block.codeMirrorInstance.getValue();
```

### Persistencia

Los bloques se guardan automáticamente:
- Al escribir código → `editor.on('change')`
- Al cambiar lenguaje → `languageSelector.change`
- Se integra con `handleTextChange()` para sincronizar con Supabase

## 🎨 Tema VSCode Dark

### Colores Utilizados

- **Fondo editor**: `#1E1E1E`
- **Barra superior**: `#252526`
- **Texto**: `#D4D4D4`
- **Keywords**: `#569CD6` (azul)
- **Strings**: `#CE9178` (naranja)
- **Numbers**: `#B5CEA8` (verde)
- **Comments**: `#6A9955` (verde oliva)
- **Variables**: `#9CDCFE` (cyan)
- **Functions**: `#DCDCAA` (amarillo)

## 🔑 Atajos de Teclado

- **Tab**: Insertar 4 espacios
- **Shift + Tab**: Reducir indentación
- Los corchetes, paréntesis y comillas se cierran automáticamente

## 📦 Dependencias

- **CodeMirror 5.x** (ya incluido en tu proyecto)
- **Modos de lenguaje** cargados dinámicamente
- **TailwindCSS** para estilos base

## ✅ Ventajas de esta Implementación

1. **Modular**: Código limpio y fácil de mantener
2. **Escalable**: Fácil agregar más lenguajes
3. **Profesional**: Diseño idéntico a VSCode
4. **Eficiente**: Inyecta estilos una sola vez
5. **Integrado**: Se guarda automáticamente con el resto del contenido
6. **Accesible**: Fácil de usar con interfaz intuitiva

## 🚀 Próximas Mejoras Sugeridas

- [ ] Autocompletado de código
- [ ] Fold/unfold de bloques de código
- [ ] Búsqueda dentro del código
- [ ] Tema claro/oscuro toggle
- [ ] Exportar código a archivo
- [ ] Resaltado de errores de sintaxis
