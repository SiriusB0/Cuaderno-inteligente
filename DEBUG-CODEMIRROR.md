# 🔍 DEBUG - CodeMirror No Muestra Colores

## 📋 Checklist de Verificación

### 1. Abre la Consola del Navegador (F12)

**Presiona F12** → Pestaña **Console**

Busca errores como:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
Failed to load resource: the server responded with a status of 404
Unknown mode: javascript
Cannot find mode: clike
```

### 2. Verifica que CodeMirror Esté Cargado

En la consola, escribe:
```javascript
CodeMirror
```

**Debería mostrar**: `ƒ CodeMirror(place, options)`

Si muestra `undefined`, CodeMirror NO está cargado.

### 3. Verifica los Modos

En la consola, escribe:
```javascript
CodeMirror.modes
```

**Debería mostrar un objeto con**:
```javascript
{
  javascript: {...},
  python: {...},
  clike: {...},
  htmlmixed: {...},
  css: {...},
  // etc.
}
```

Si está **vacío** `{}`, los modos NO se cargaron.

### 4. Verifica el Tema Dracula

En la consola, escribe:
```javascript
document.querySelector('link[href*="dracula"]')
```

**Debería mostrar**: `<link rel="stylesheet" href="...dracula.min.css">`

Si muestra `null`, el CSS del tema NO está cargado.

## 🔧 Soluciones Según el Error

### ❌ Si CodeMirror es `undefined`

**Problema**: El script de CodeMirror no se cargó.

**Solución**:
1. Verifica que esté en el HTML:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
```

2. Intenta cambiar la versión a 5.65.5 o 5.65.0

3. Verifica en la pestaña **Network** (F12 → Network) si se cargó el archivo

### ❌ Si CodeMirror.modes está vacío

**Problema**: Los scripts de modos no se cargaron.

**Solución**:
1. Asegúrate de que los scripts estén DESPUÉS del script principal de CodeMirror
2. Verifica en **Network** si se descargaron
3. Prueba con URLs alternativas:
```html
<!-- Cambia cdnjs por unpkg -->
<script src="https://unpkg.com/codemirror@5.65.16/mode/javascript/javascript.js"></script>
<script src="https://unpkg.com/codemirror@5.65.16/mode/clike/clike.js"></script>
```

### ❌ Si el CSS de Dracula no está

**Problema**: El tema no se cargó.

**Solución**:
1. Verifica en **Elements** (F12 → Elements) si el `<link>` está presente
2. Verifica en **Network** si se descargó
3. Intenta URL alternativa:
```html
<link rel="stylesheet" href="https://unpkg.com/codemirror@5.65.16/theme/dracula.css">
```

## 🧪 Test Manual en la Consola

Copia y pega esto en la consola:

```javascript
// Crear un bloque de prueba
const testDiv = document.createElement('div');
testDiv.style.position = 'fixed';
testDiv.style.top = '50px';
testDiv.style.left = '50px';
testDiv.style.width = '600px';
testDiv.style.height = '400px';
testDiv.style.zIndex = '99999';
testDiv.style.background = 'white';
testDiv.style.border = '2px solid red';
document.body.appendChild(testDiv);

const textarea = document.createElement('textarea');
textarea.value = `#include <iostream>
int main() {
    cout << "Hola" << endl;
    return 0;
}`;
testDiv.appendChild(textarea);

const editor = CodeMirror.fromTextArea(textarea, {
    mode: 'text/x-c++src',
    theme: 'dracula',
    lineNumbers: true,
    tabSize: 4
});

console.log('Editor creado:', editor);
```

**Si esto funciona**: El problema está en tu código de `StudyView.js`

**Si NO funciona**: El problema está en las dependencias

## 🚨 Problema Común: AdBlockers

**Los bloqueadores de anuncios pueden bloquear CDNs**

1. **Desactiva temporalmente AdBlock** en la página
2. Recarga (Ctrl+Shift+R para limpiar cache)
3. Prueba de nuevo

## 🔄 Solución Rápida: Descargar Local

Si los CDNs están bloqueados:

1. Descarga CodeMirror: https://codemirror.net/5/codemirror-5.65.16.zip
2. Extrae en tu proyecto: `/libs/codemirror/`
3. Cambia los `<script>` y `<link>` a rutas locales:

```html
<link rel="stylesheet" href="libs/codemirror/lib/codemirror.css">
<link rel="stylesheet" href="libs/codemirror/theme/dracula.css">
<script src="libs/codemirror/lib/codemirror.js"></script>
<script src="libs/codemirror/mode/javascript/javascript.js"></script>
<!-- etc. -->
```

## 📊 Logs que Deberías Ver

Abre la consola y busca estos logs de tu código:

```
[CodeBlock] Inicializando editor para code-block-xyz...
[CodeBlock] ✅ Bloque encontrado
[CodeBlock] Elementos: {editorContainer: true, languageSelector: true, ...}
[CodeBlock] Creando instancia de CodeMirror...
[CodeBlock] Modo inicial: text/x-c++src
[CodeBlock] ✅ CodeMirror creado exitosamente
```

Si **NO ves estos logs**, el método `initializeCodeEditor` no se está ejecutando.

## 🎯 Prueba Final Definitiva

**Copia este código COMPLETO en un archivo `test.html`**:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css">
</head>
<body style="background: #1e1e1e; color: white; padding: 2rem;">
  <h1>Test CodeMirror</h1>
  <button id="btn">Insertar Código</button>
  <div id="container"></div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/clike/clike.min.js"></script>
  
  <script>
    document.getElementById('btn').onclick = () => {
      const textarea = document.createElement('textarea');
      textarea.value = '#include <iostream>\nint main() {\n    cout << "Hola" << endl;\n    return 0;\n}';
      container.appendChild(textarea);
      
      const cm = CodeMirror.fromTextArea(textarea, {
        mode: 'text/x-c++src',
        theme: 'dracula',
        lineNumbers: true
      });
      
      console.log('CodeMirror creado:', cm);
    };
  </script>
</body>
</html>
```

**Abre ese archivo en el navegador**:
- Si FUNCIONA → El problema está en `StudyView.js`
- Si NO funciona → El problema son las dependencias bloqueadas

## 📸 ¿Qué Deberías Ver?

Con el tema Dracula funcionando correctamente:

- **Fondo del editor**: Gris oscuro azulado (#282a36)
- **`#include`, `int`, `return`**: Rosa (#ff79c6)
- **`"Hola"`**: Amarillo (#f1fa8c)
- **`0`**: Morado (#bd93f9)
- **Números de línea**: Azul grisáceo (#6272a4)

Si ves todo en **blanco y negro**, el tema NO está funcionando.
