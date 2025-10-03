# 🚀 Guía de Deployment - Cuaderno Inteligente

Esta guía te ayudará a desplegar tu aplicación en Vercel con Supabase paso a paso.

---

## 📋 **Pre-requisitos**

Antes de empezar, asegúrate de tener:

- [ ] Cuenta de GitHub (gratuita)
- [ ] Cuenta de Vercel (gratuita) - https://vercel.com
- [ ] Cuenta de Supabase (gratuita) - https://supabase.com
- [ ] Git instalado en tu computadora

---

## 🔧 **PASO 1: Preparar el Proyecto Localmente**

### 1.1 Inicializar Git (si aún no lo has hecho)

Abre la terminal en la carpeta de tu proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit - Cuaderno Inteligente"
```

### 1.2 Verificar archivos importantes

Asegúrate de que estos archivos existen en tu proyecto:
- ✅ `.gitignore` - Para no subir archivos sensibles
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `.env.example` - Ejemplo de variables de entorno

---

## 📦 **PASO 2: Subir a GitHub**

### 2.1 Crear repositorio en GitHub

1. Ve a https://github.com
2. Click en el botón **"+"** arriba a la derecha
3. Selecciona **"New repository"**
4. Nombre del repositorio: `cuaderno-inteligente`
5. Descripción: `Sistema inteligente de gestión de estudios`
6. Visibilidad: **Public** o **Private** (tu eliges)
7. **NO** marques "Initialize with README" (ya lo tienes)
8. Click en **"Create repository"**

### 2.2 Conectar tu proyecto local con GitHub

Copia los comandos que GitHub te muestra y ejecútalos:

```bash
git remote add origin https://github.com/TU-USUARIO/cuaderno-inteligente.git
git branch -M main
git push -u origin main
```

> ⚠️ **Importante**: Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub

---

## 🗄️ **PASO 3: Configurar Supabase**

### 3.1 Crear proyecto en Supabase

1. Ve a https://supabase.com
2. Click en **"Start your project"**
3. Inicia sesión con GitHub
4. Click en **"New project"**
5. Completa los datos:
   - **Name**: `cuaderno-inteligente`
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a ti
6. Click en **"Create new project"** (tarda 1-2 minutos)

### 3.2 Obtener las credenciales

Una vez creado el proyecto:

1. En el panel izquierdo, click en **⚙️ Project Settings**
2. Click en **API**
3. Copia estos datos:
   - **Project URL** (ejemplo: `https://abcdefgh.supabase.co`)
   - **Project API keys** → **`anon` `public`** (la clave anónima)

> 📝 **Guárdalos en un lugar seguro**, los necesitarás en el siguiente paso.

### 3.3 Crear las tablas necesarias

1. En el panel izquierdo, click en **🗄️ SQL Editor**
2. Click en **"New query"**
3. Copia y pega este SQL:

```sql
-- Tabla de usuarios (opcional, para futuras funcionalidades)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de páginas de estudio (donde se guarda el contenido del editor)
CREATE TABLE IF NOT EXISTS study_pages (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_study_pages_subject ON study_pages(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_pages_page ON study_pages(page_number);

-- Habilitar Row Level Security (seguridad)
ALTER TABLE study_pages ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones (puedes restringir después)
CREATE POLICY "Enable all operations for all users" ON study_pages
    FOR ALL USING (true) WITH CHECK (true);
```

4. Click en **"Run"** (abajo a la derecha)
5. Deberías ver: ✅ **"Success. No rows returned"**

---

## 🌐 **PASO 4: Desplegar en Vercel**

### 4.1 Conectar GitHub con Vercel

1. Ve a https://vercel.com
2. Click en **"Sign Up"** o **"Log In"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel acceder a tu cuenta de GitHub

### 4.2 Importar tu proyecto

1. En el dashboard de Vercel, click en **"Add New..."**
2. Selecciona **"Project"**
3. Busca tu repositorio: `cuaderno-inteligente`
4. Click en **"Import"**

### 4.3 Configurar el proyecto

En la pantalla de configuración:

1. **Project Name**: `cuaderno-inteligente` (o el nombre que quieras)
2. **Framework Preset**: **Other** (es un sitio estático)
3. **Root Directory**: `.` (dejar por defecto)
4. **Build Command**: dejar vacío o `echo "Static site"`
5. **Output Directory**: `.` (dejar por defecto)

### 4.4 Agregar variables de entorno

**⚠️ IMPORTANTE**: En la sección **"Environment Variables"**:

1. Click en **"Add"**
2. Agrega estas variables:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
   | `SUPABASE_ANON_KEY` | `tu-clave-anonima-aqui` |

3. **Importante**: Usa las credenciales que copiaste en el PASO 3.2

### 4.5 Desplegar

1. Click en **"Deploy"** (abajo)
2. Espera 1-2 minutos mientras Vercel despliega tu sitio
3. ✅ Cuando termine, verás: **"Congratulations! 🎉"**

---

## 🔗 **PASO 5: Actualizar la Configuración de Supabase en el Código**

### 5.1 Actualizar supabase-config.js

1. Abre el archivo `supabase-config.js` en tu proyecto
2. Localiza estas líneas:

```javascript
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY';
```

3. Reemplaza con tus credenciales:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = 'tu-clave-anonima-aqui';
```

### 5.2 Subir los cambios

```bash
git add supabase-config.js
git commit -m "Actualizar credenciales de Supabase"
git push origin main
```

> ⚡ **Vercel detectará el cambio automáticamente** y volverá a desplegar (tarda 30 segundos)

---

## ✅ **PASO 6: Verificar que Todo Funciona**

### 6.1 Acceder a tu sitio

1. En Vercel, click en **"Visit"** o copia la URL
2. Tu sitio estará en: `https://cuaderno-inteligente.vercel.app`

### 6.2 Probar funcionalidades

Verifica que todo funciona:

1. ✅ Página de login carga correctamente
2. ✅ Puedes crear materias
3. ✅ Puedes crear temas y subtareas
4. ✅ Puedes entrar a StudyView y escribir
5. ✅ Al guardar, los datos se guardan en Supabase

### 6.3 Verificar Supabase

1. Ve a tu proyecto en Supabase
2. Click en **🗄️ Table Editor**
3. Selecciona la tabla `study_pages`
4. Deberías ver tus datos guardados allí

---

## 🎨 **PASO 7: Configurar Dominio Personalizado (Opcional)**

Si quieres usar tu propio dominio:

### 7.1 En Vercel

1. Ve a tu proyecto en Vercel
2. Click en **"Settings"**
3. Click en **"Domains"**
4. Click en **"Add"**
5. Escribe tu dominio: `midominio.com`
6. Vercel te dará instrucciones DNS

### 7.2 En tu proveedor de dominio

1. Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.)
2. Busca **"DNS Settings"** o **"Manage DNS"**
3. Agrega un registro **CNAME**:
   - **Name/Host**: `@` o `www`
   - **Value/Points to**: `cname.vercel-dns.com`
4. Guarda los cambios
5. Espera 5-10 minutos (propagación DNS)

---

## 🔄 **Actualizaciones Futuras**

Cada vez que hagas cambios en tu código:

```bash
# 1. Guardar cambios
git add .
git commit -m "Descripción de los cambios"

# 2. Subir a GitHub
git push origin main

# 3. ¡Listo! Vercel detecta y despliega automáticamente
```

---

## 🐛 **Solución de Problemas**

### Error: "No se puede conectar a Supabase"

**Solución:**
1. Verifica que las credenciales en `supabase-config.js` sean correctas
2. Verifica que las variables de entorno en Vercel estén configuradas
3. Asegúrate de que las políticas RLS en Supabase permitan acceso

### Error: "Build failed" en Vercel

**Solución:**
1. Verifica que no haya errores de sintaxis en JavaScript
2. Revisa los logs en Vercel para ver el error específico
3. Asegúrate de que `vercel.json` esté correctamente configurado

### La página carga pero no guarda datos

**Solución:**
1. Abre las **DevTools** del navegador (F12)
2. Ve a la pestaña **Console**
3. Busca errores de red o de JavaScript
4. Verifica que Supabase esté recibiendo las peticiones

---

## 📞 **Soporte**

Si tienes problemas:

1. **Vercel Docs**: https://vercel.com/docs
2. **Supabase Docs**: https://supabase.com/docs
3. **GitHub Issues**: Crea un issue en tu repositorio

---

## 🎉 **¡Felicidades!**

Tu **Cuaderno Inteligente** está ahora desplegado y funcionando en producción.

**URLs importantes:**
- 🌐 **Tu sitio**: `https://cuaderno-inteligente.vercel.app`
- 📦 **GitHub**: `https://github.com/TU-USUARIO/cuaderno-inteligente`
- 🗄️ **Supabase**: `https://app.supabase.com/project/tu-proyecto`

---

**¿Necesitas ayuda con algún paso específico?** ¡Avísame y te guiaré!
