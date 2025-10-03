# 🔧 Troubleshooting - Solución de Problemas

Soluciones a los problemas más comunes durante el deployment.

---

## 🚨 Problemas con Git/GitHub

### ❌ Error: "remote origin already exists"

**Causa:** Ya existe una conexión remota configurada.

**Solución:**
```bash
# Ver remotos existentes
git remote -v

# Eliminar remoto existente
git remote remove origin

# Agregar el nuevo
git remote add origin https://github.com/TU-USUARIO/cuaderno-inteligente.git
```

---

### ❌ Error: "Permission denied (publickey)"

**Causa:** SSH no configurado o credenciales incorrectas.

**Solución:** Usa HTTPS en lugar de SSH:
```bash
git remote set-url origin https://github.com/TU-USUARIO/cuaderno-inteligente.git
```

---

### ❌ Error: "failed to push some refs"

**Causa:** Hay cambios en GitHub que no tienes localmente.

**Solución:**
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## 🗄️ Problemas con Supabase

### ❌ Error: "relation 'study_pages' does not exist"

**Causa:** La tabla no fue creada correctamente.

**Solución:**
1. Ve a Supabase → **SQL Editor**
2. Ejecuta el SQL nuevamente
3. Verifica en **Table Editor** que la tabla existe

---

### ❌ Error: "permission denied for table study_pages"

**Causa:** Políticas RLS mal configuradas.

**Solución:**
```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable all operations" ON study_pages;

-- Recrear política permisiva
CREATE POLICY "Enable all operations for all users" ON study_pages
    FOR ALL USING (true) WITH CHECK (true);
```

---

### ❌ Error: "Invalid API key"

**Causa:** La API key es incorrecta o expiró.

**Solución:**
1. Ve a Supabase → **Project Settings** → **API**
2. Copia la **anon public** key de nuevo
3. Actualiza en:
   - `supabase-config.js`
   - Variables de entorno en Vercel

---

## 🌐 Problemas con Vercel

### ❌ Error: "Build failed"

**Causa:** Error de sintaxis en el código.

**Solución:**
1. Ve a Vercel → **Deployments** → click en el deployment fallido
2. Lee el error en los logs
3. Corrige el error localmente
4. Push de nuevo a GitHub

---

### ❌ Error: "404 Page Not Found"

**Causa:** Configuración de routing incorrecta.

**Solución:** Verifica que `vercel.json` tenga:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### ❌ Variables de entorno no funcionan

**Causa:** Las variables no están siendo leídas.

**Solución:**
1. Vercel → **Project Settings** → **Environment Variables**
2. Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas
3. **Importante:** Después de agregar variables, haz un **Redeploy**
4. Ve a **Deployments** → **...** (tres puntos) → **Redeploy**

---

## 💻 Problemas en el Navegador

### ❌ Error: "Supabase is not defined"

**Causa:** El script de Supabase no cargó correctamente.

**Solución:**
1. Abre DevTools (F12) → **Console**
2. Verifica que no haya errores de red
3. Verifica que `supabase-config.js` esté cargando
4. Verifica la conexión a internet

---

### ❌ Error: "CORS policy blocked"

**Causa:** Supabase no permite requests desde tu dominio.

**Solución:**
1. Ve a Supabase → **Project Settings** → **API**
2. Scroll hasta **Authentication**
3. Agrega tu dominio de Vercel en **Site URL**
4. Agrega `https://*.vercel.app` en **Redirect URLs**

---

### ❌ Datos no se guardan

**Causa:** Error en la conexión con Supabase.

**Solución:**
1. Abre DevTools (F12) → **Network**
2. Intenta guardar algo
3. Busca requests a `supabase.co`
4. Si son **rojos**, revisa el error
5. Verifica credenciales en `supabase-config.js`

---

## 🔐 Problemas de Seguridad

### ⚠️ API Keys expuestas en el código

**Problema:** Las API keys están hardcodeadas en `supabase-config.js`.

**Solución Temporal:**
- Para desarrollo, está OK (la anon key es pública)
- Las políticas RLS protegen los datos

**Solución Profesional:**
1. Crea un backend simple (Node.js/Express)
2. Mueve las operaciones de Supabase al backend
3. El frontend solo llama a tu API

---

## 🔄 Problemas de Cache

### ❌ Cambios no se reflejan en el sitio

**Causa:** Cache del navegador o CDN.

**Solución:**
```bash
# En tu navegador
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Limpiar cache completo
F12 → Network → Disable cache ✅
```

En Vercel:
1. Ve a **Deployments**
2. Último deployment → **...** → **Redeploy**

---

## 📊 Verificación de Estado

### ✅ Checklist de diagnóstico

Verifica cada punto:

**GitHub:**
- [ ] El repositorio existe
- [ ] El código está actualizado
- [ ] No hay archivos grandes (>100MB)

**Supabase:**
- [ ] El proyecto está activo
- [ ] Las tablas existen
- [ ] Las políticas RLS están configuradas
- [ ] Las credenciales son correctas

**Vercel:**
- [ ] El proyecto está desplegado
- [ ] No hay errores en los logs
- [ ] Las variables de entorno están configuradas
- [ ] El dominio apunta correctamente

**Código:**
- [ ] `supabase-config.js` tiene las credenciales correctas
- [ ] No hay errores en la consola del navegador
- [ ] Los archivos estáticos cargan (CSS, JS, imágenes)

---

## 🆘 Último Recurso

Si nada funciona:

### Opción 1: Empezar de nuevo

```bash
# 1. Eliminar repositorio de GitHub
# 2. Eliminar proyecto en Vercel
# 3. Eliminar proyecto en Supabase (opcional)
# 4. Seguir DEPLOYMENT.md desde el inicio
```

### Opción 2: Deployment local

```bash
# Servir localmente para testear
python server.py
# Abre: http://localhost:8000
```

---

## 📞 Obtener Ayuda

1. **Logs de Vercel**: Revisar errores específicos
2. **Console del navegador**: Ver errores JavaScript
3. **Network tab**: Ver requests fallidas
4. **Supabase Logs**: Ver errores de base de datos

---

## 🔍 Comandos Útiles de Diagnóstico

```bash
# Ver configuración de Git
git config --list

# Ver remotos
git remote -v

# Ver último commit
git log -1

# Ver estado
git status

# Ver diferencias
git diff
```

---

**¿Solucionaste tu problema?** ¡Genial! 🎉

**¿Aún tienes problemas?** Anota el error exacto y busca en:
- Stack Overflow
- Documentación oficial
- GitHub Issues del proyecto
