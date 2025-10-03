# 🚀 Guía Completa: Configuración Segura Supabase + Vercel

Esta guía te lleva paso por paso para conectar tu aplicación con Supabase de forma **100% SEGURA**, sin exponer tu service role key en el frontend.

---

## 📋 Resumen de la Arquitectura Segura

### ✅ Lo que está en el Frontend (PÚBLICO)
- **SUPABASE_URL**: `https://zsbbqvykdudzgjruqzyu.supabase.co` (ya configurada)
- **SUPABASE_ANON_KEY**: Tu anon key (ya configurada en `supabase-config.js`)

### 🔒 Lo que está en el Backend (PRIVADO)
- **SUPABASE_SERVICE_ROLE_KEY**: Solo en variables de entorno de Vercel
- Nunca aparece en el código del frontend
- Solo accesible desde las funciones serverless en `/api`

### 🎯 Flujo de Datos
```
Frontend → /api/save-page (Vercel Function) → Supabase
         ↑                                    ↑
   Solo anon key                    Service role key
```

---

## 🛠️ PASO 1: Configurar Tablas en Supabase

### 1.1 Accede al SQL Editor
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **SQL Editor** en el menú lateral izquierdo
3. Click en **New Query**

### 1.2 Ejecuta el Schema Completo
1. Abre el archivo `supabase-schema.sql` de este proyecto
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Click en **RUN** (esquina inferior derecha)
5. Deberías ver: ✅ **Success. No rows returned**

### 1.3 Verifica las Tablas
1. Ve a **Table Editor** en el menú lateral
2. Deberías ver estas tablas creadas:
   - ✅ `subjects` (materias)
   - ✅ `topics` (temas)
   - ✅ `pages` (páginas de contenido)
   - ✅ `subtasks` (subtareas)
   - ✅ `events` (eventos/entregas)
   - ✅ `resources` (recursos adjuntos)
   - ✅ `study_stats` (estadísticas de estudio)

---

## 🔑 PASO 2: Obtener tu Service Role Key

### 2.1 Accede a las Credenciales
1. En tu proyecto de Supabase, ve a **Settings** (⚙️)
2. Click en **API** en el menú lateral
3. Busca la sección **Project API keys**

### 2.2 Copia la Service Role Key
1. Busca **service_role** (tiene un candado 🔒)
2. Click en el ícono de copiar
3. **⚠️ IMPORTANTE**: No la pegues en ningún archivo de código
4. La usaremos solo en Vercel

### 2.3 ¿Qué NO hacer?
❌ No la pegues en `supabase-config.js`
❌ No la subas a GitHub
❌ No la compartas por chat/email
✅ Solo la pegarás en las variables de entorno de Vercel

---

## 🌐 PASO 3: Configurar Variables en Vercel

### 3.1 Conecta el Repositorio a Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Add New** → **Project**
3. Importa tu repositorio de GitHub
4. Click en **Deploy** (por ahora sin variables)

### 3.2 Agrega Variables de Entorno
1. Una vez desplegado, ve a **Settings** del proyecto
2. Click en **Environment Variables** en el menú lateral
3. Agrega estas 3 variables:

#### Variable 1: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: `https://zsbbqvykdudzgjruqzyu.supabase.co`
- **Environment**: Production, Preview, Development (selecciona todos)

#### Variable 2: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: [Pega aquí tu service role key copiada en el paso 2.2]
- **Environment**: Production, Preview, Development (selecciona todos)
- **⚠️ CRÍTICO**: Esta es la clave secreta, nunca la expongas

#### Variable 3: SUPABASE_ANON_KEY (opcional)
- **Name**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYmJxdnlrZHVkemdqcnVxenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTUzMTgsImV4cCI6MjA3NTAzMTMxOH0.T32vVA6oc6gZf6U4ekNPoFiKcu7Ea-STXH_95ISHTEE`
- **Environment**: Production, Preview, Development (selecciona todos)

### 3.3 Redeploy
1. Ve a **Deployments** en el menú superior
2. Click en el último deployment
3. Click en **⋯** (tres puntos) → **Redeploy**
4. Marca **Use existing Build Cache**
5. Click en **Redeploy**

**⚠️ IMPORTANTE**: Las variables de entorno solo se aplican después de un redeploy.

---

## ✅ PASO 4: Verificar que Todo Funciona

### 4.1 Prueba la Conexión
1. Abre tu sitio desplegado en Vercel
2. Ve al Dashboard
3. Crea una nueva materia
4. Entra a la materia y crea un tema
5. Dentro del tema, crea una página de notas
6. Escribe algo y espera 3 segundos (auto-save)

### 4.2 Verifica en Supabase
1. Ve a **Table Editor** en Supabase
2. Click en la tabla `pages`
3. Deberías ver tu página guardada con:
   - `topic_id`
   - `content` (tu texto)
   - `title`
   - `created_at`

### 4.3 Si NO Funciona
1. Ve a tu proyecto en Vercel → **Functions**
2. Click en `/api/save-page`
3. Click en **Logs** para ver errores
4. Busca mensajes como:
   - ❌ "Faltan variables de entorno" → Revisa paso 3.2
   - ❌ "Error de Supabase" → Verifica que las tablas existan (paso 1)
   - ❌ "Cannot find module" → Redeploy con npm install

---

## 📦 PASO 5: Instalar Dependencias en Vercel

Vercel debería instalarlas automáticamente, pero si falla:

### 5.1 Verifica package.json en /api
Ya está creado en `api/package.json`:
```json
{
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

### 5.2 Si Hay Errores de Build
1. Ve a **Settings** → **General** en Vercel
2. En **Build & Development Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `cd api && npm install`
   - **Output Directory**: `.`
   - **Install Command**: `cd api && npm install`

---

## 🧪 PASO 6: Probar Endpoints Localmente (Opcional)

Si quieres probar antes de desplegar:

### 6.1 Instala Vercel CLI
```bash
npm install -g vercel
```

### 6.2 Configura Variables Locales
Crea `.env` en la raíz del proyecto:
```env
SUPABASE_URL=https://zsbbqvykdudzgjruqzyu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key-aquí]
```

**⚠️ IMPORTANTE**: Agrega `.env` a `.gitignore`:
```gitignore
.env
.env.local
```

### 6.3 Inicia Servidor Local
```bash
vercel dev
```

Esto iniciará un servidor local en `http://localhost:3000` con las funciones serverless funcionando.

---

## 🔒 Seguridad: ¿Por Qué Este Setup es Seguro?

### ✅ Service Role Key Protegida
- Nunca aparece en el código del frontend
- Solo existe en variables de entorno de Vercel
- Solo accesible desde las funciones serverless

### ✅ Validación en el Backend
Las funciones en `/api` validan todos los datos antes de guardar:
```javascript
// En api/save-page.js
if (!topicId || !content) {
    return sendError(res, 400, 'Datos inválidos');
}
```

### ✅ RLS Habilitadas
Row Level Security está activada en Supabase, permitiendo control granular de acceso.

### ✅ Frontend Limitado
El frontend solo tiene acceso a la `anonKey`, que tiene permisos limitados configurables en Supabase.

---

## 📚 Archivos Creados/Modificados

### Nuevos Archivos
- ✅ `api/_supabase-admin.js` - Utilidad para crear cliente admin
- ✅ `api/save-page.js` - Endpoint para guardar páginas
- ✅ `api/list-pages.js` - Endpoint para listar páginas
- ✅ `api/delete-page.js` - Endpoint para eliminar páginas
- ✅ `api/package.json` - Dependencias de las funciones
- ✅ `supabase-schema.sql` - Schema completo de la base de datos
- ✅ `SUPABASE-VERCEL-SETUP.md` - Esta guía

### Archivos Modificados
- ✅ `vercel.json` - Configuración para excluir `/api/*` del rewrite
- ✅ `supabase-config.js` - Credenciales actualizadas (solo anon key)
- ✅ `savePageToSupabase.js` - Refactorizado para usar API segura

---

## 🚨 Troubleshooting Común

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución**: 
1. Ve a Vercel → Settings → General
2. Cambia Build Command a: `cd api && npm install`
3. Redeploy

### Error: "Faltan variables de entorno"
**Solución**:
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas
3. Asegúrate de seleccionar todos los environments
4. Redeploy

### Error: "relation 'pages' does not exist"
**Solución**:
1. Ve al SQL Editor de Supabase
2. Ejecuta nuevamente `supabase-schema.sql`
3. Verifica en Table Editor que las tablas existan

### Las páginas no se guardan
**Solución**:
1. Abre DevTools (F12) → Console
2. Busca errores de red (Network tab)
3. Verifica que `/api/save-page` retorne 200
4. Si retorna 500, revisa los logs en Vercel → Functions → Logs

---

## 🎉 ¡Listo!

Tu aplicación ahora está conectada de forma **100% segura** a Supabase:

✅ Service role key protegida en Vercel
✅ Frontend solo con anon key
✅ Todas las operaciones "sensibles" via API
✅ Validación en el backend
✅ RLS habilitadas en Supabase

### Próximos Pasos
- Agrega más endpoints según necesites (subjects, topics, events, etc.)
- Configura RLS más estrictas en Supabase si lo deseas
- Implementa autenticación de usuarios con Supabase Auth (opcional)

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en Vercel → Functions
2. Verifica que las tablas existan en Supabase
3. Confirma que las variables de entorno estén configuradas
4. Asegúrate de haber hecho redeploy después de configurar las variables

**¡Todo está listo para funcionar de forma segura!** 🎊
