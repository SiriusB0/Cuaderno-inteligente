# Solución al Problema de F5 - Routing con History API

## 🔴 Problema Original

Al presionar F5 o recargar el navegador, **siempre regresaba al Dashboard** sin importar en qué página estabas.

### ¿Por qué pasaba?

1. El router solo **mostraba/ocultaba divs** pero NO cambiaba la URL del navegador
2. La URL siempre era `file:///...../index.html`
3. Al refrescar, el navegador cargaba `index.html` → Router iniciaba → Siempre iba a Dashboard

---

## ✅ Solución Implementada

### 1. **History API del Navegador**

Ahora el router **actualiza la URL** cada vez que navegas:

```javascript
// ANTES (no funcionaba)
navigateTo('topics', subject);
// URL seguía siendo: /index.html

// AHORA (funciona)
navigateTo('topics', subject);
// URL cambia a: /subject/subj_1
window.history.pushState(state, '', url);
```

### 2. **URLs Amigables**

Las URLs ahora son semánticas y reflejan el estado de la app:

```
Dashboard:     /
Topics:        /subject/subj_1
Study:         /study/subj_1/topic_1
```

### 3. **Parseo de URL al Cargar**

Cuando la página carga (o refrescas con F5), el router **lee la URL** y navega:

```javascript
initialize() {
    // Lee la URL actual: /subject/subj_1
    this.parseUrlAndNavigate();
    // Resultado: Navega a Topics con subj_1
}
```

### 4. **Botones Atrás/Adelante del Navegador**

Los botones del navegador ahora funcionan:

```javascript
window.addEventListener('popstate', (event) => {
    // Usuario presionó ← o →
    this.navigateTo(event.state.view, event.state.data, false);
});
```

---

## 📁 Archivos Modificados

### `js/core/Router.js`

**Nuevos métodos**:

1. **`buildUrl(viewName, data)`**
   - Construye URLs amigables según la vista
   - Ejemplos: `/`, `/subject/subj_1`, `/study/subj_1/topic_1`

2. **`setupHistoryListener()`**
   - Escucha eventos `popstate` (botones ←/→)
   - Navega sin duplicar historial

3. **`parseUrlAndNavigate()`**
   - Lee la URL actual al cargar la página
   - Extrae IDs de subject/topic
   - Navega a la vista correcta

**Método modificado**:

4. **`navigateTo(viewName, data, updateHistory = true)`**
   - Nuevo parámetro `updateHistory`
   - Llama `window.history.pushState()` para actualizar URL
   - Guarda estado en `history.state`

### `.htaccess` (Nuevo)

Archivo para servidores Apache:

```apache
# Si el archivo existe, servirlo
# Si NO existe, servir index.html (para rutas de SPA)
RewriteRule ^(.*)$ index.html [L,QSA]
```

**Nota**: Solo necesario si subes la app a un servidor web.

---

## 🚀 Cómo Funciona Ahora

### Flujo Normal de Navegación

```
1. Usuario hace click en una materia "Cálculo I"
   ├─► Router.navigateTo('topics', { id: 'subj_1' })
   ├─► URL cambia a: /subject/subj_1
   ├─► history.pushState({ view: 'topics', data: {...} })
   └─► Vista renderiza

2. Usuario presiona F5 (RECARGA)
   ├─► Navegador carga la página desde /subject/subj_1
   ├─► index.html se carga
   ├─► Router.initialize()
   ├─► Router.parseUrlAndNavigate()
   ├─► Lee URL: /subject/subj_1
   ├─► Extrae: subjectId = 'subj_1'
   ├─► Router.navigateTo('topics', { id: 'subj_1' }, false)
   └─► ✅ VUELVE A LA MISMA VISTA
```

### Flujo con Botones Navegador

```
Usuario presiona ← (ATRÁS)
   ├─► Evento 'popstate' se dispara
   ├─► Router lee history.state
   ├─► Router.navigateTo(state.view, state.data, false)
   └─► ✅ Navega sin duplicar historial
```

---

## 🔧 Desarrollo Local (Sin Servidor)

### Problema con `file://`

Si abres el archivo directamente (`file:///C:/...`), la History API **no funciona correctamente** porque:
- `pushState()` no puede cambiar rutas en protocolo `file://`
- El navegador bloquea la navegación por seguridad

### Solución: Servidor Local

Debes usar un servidor HTTP local. Opciones:

#### 1️⃣ **Live Server (VS Code/Windsurf)**

```bash
# Instalar extensión "Live Server"
# Click derecho en index.html → Open with Live Server
# URL: http://localhost:5500
```

#### 2️⃣ **Python**

```bash
# Python 3
cd Cuaderno-inteligente
python -m http.server 8000

# Abrir: http://localhost:8000
```

#### 3️⃣ **Node.js (http-server)**

```bash
npm install -g http-server
cd Cuaderno-inteligente
http-server -p 8000

# Abrir: http://localhost:8000
```

#### 4️⃣ **PHP**

```bash
cd Cuaderno-inteligente
php -S localhost:8000

# Abrir: http://localhost:8000
```

---

## ⚙️ Configuración para Producción

### Apache

Crear `.htaccess` (ya incluido):

```apache
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L,QSA]
```

### Nginx

Editar configuración:

```nginx
location / {
  try_files $uri /index.html;
}
```

### Netlify / Vercel

Crear `_redirects` (Netlify):

```
/*    /index.html   200
```

O `vercel.json` (Vercel):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🧪 Cómo Probar

### 1. Inicia un servidor local

```bash
python -m http.server 8000
```

### 2. Abre en navegador

```
http://localhost:8000
```

### 3. Navega a una materia

- Click en cualquier materia
- URL cambia a: `http://localhost:8000/subject/subj_1`

### 4. Presiona F5

✅ **Debe mantenerse en la misma materia**

### 5. Presiona ← (Atrás)

✅ **Debe volver al Dashboard**

### 6. Presiona → (Adelante)

✅ **Debe volver a la materia**

---

## 📊 Comparación

### ANTES

| Acción | URL | Al refrescar F5 |
|--------|-----|-----------------|
| Dashboard | `/index.html` | ✅ Dashboard |
| Ver materia | `/index.html` | ❌ Dashboard (perdía contexto) |
| Estudiar tema | `/index.html` | ❌ Dashboard (perdía contexto) |

### AHORA

| Acción | URL | Al refrescar F5 |
|--------|-----|-----------------|
| Dashboard | `/` | ✅ Dashboard |
| Ver materia | `/subject/subj_1` | ✅ Materia (mantiene contexto) |
| Estudiar tema | `/study/subj_1/topic_1` | ✅ Tema (mantiene contexto) |

---

## 🎯 Beneficios

1. **✅ F5 mantiene la página**: Ya no vuelve al dashboard
2. **✅ URLs compartibles**: Puedes copiar y pegar la URL
3. **✅ Botones ←/→ funcionan**: Navegación del navegador
4. **✅ Marcadores**: Puedes guardar páginas específicas
5. **✅ Experiencia de usuario mejorada**: Comportamiento esperado de una web moderna

---

## ⚠️ Importante

### En Desarrollo Local

- **DEBES usar servidor HTTP** (no `file://`)
- Usa Live Server, Python, Node.js, etc.
- La URL debe ser `http://localhost:XXXX`

### Sin Servidor

Si abres directamente `index.html`:
- ❌ History API no funcionará
- ✅ Pero el **localStorage sigue funcionando** como backup
- ✅ Al menos no perderás datos

---

**Versión**: 2.1.0  
**Fecha**: 2025-10-01  
**Autor**: Sistema de Cuaderno Inteligente
