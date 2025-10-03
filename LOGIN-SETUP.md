# Sistema de Login con Supabase

## 🎨 Características del Login

- **Diseño minimalista y hermoso** con gradientes y animaciones
- **Autenticación con email y contraseña**
- **Autenticación con usuario y contraseña** (usa email como username)
- **Registro de nuevos usuarios**
- **Recuperación de contraseña**
- **Modo offline** (sin necesidad de cuenta)
- **Integración completa con Supabase**

## 📋 Configuración de Supabase

### Paso 1: Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto

### Paso 2: Obtener credenciales

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL** (URL del proyecto)
   - **anon/public key** (Clave anónima)

### Paso 3: Configurar la aplicación

Edita el archivo `supabase-config.js`:

```javascript
export const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co', // ← Pega tu URL aquí
    anonKey: 'tu-clave-anon-aqui', // ← Pega tu clave aquí
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};
```

### Paso 4: Configurar autenticación en Supabase

1. Ve a **Authentication** → **Providers** en tu dashboard de Supabase
2. Asegúrate de que **Email** esté habilitado
3. Configura las opciones:
   - **Enable email confirmations**: Opcional (recomendado para producción)
   - **Secure email change**: Opcional
   - **Enable phone confirmations**: Deshabilitado (no lo usamos)

### Paso 5: Configurar políticas de seguridad (opcional)

Si quieres guardar datos de usuario en Supabase, necesitarás crear tablas y políticas RLS.

Ejemplo de tabla de perfiles:

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

## 🚀 Uso del Sistema de Login

### Flujo de autenticación

1. **Con Supabase configurado:**
   - La aplicación muestra la pantalla de login al iniciar
   - Usuario puede iniciar sesión o registrarse
   - Después de autenticarse, accede al dashboard

2. **Sin Supabase configurado:**
   - La aplicación funciona en modo offline
   - No se muestra la pantalla de login
   - Los datos se guardan solo en localStorage

### Iniciar sesión

El usuario puede iniciar sesión de dos formas:

1. **Con email:**
   ```
   Email: usuario@example.com
   Contraseña: ********
   ```

2. **Con username:**
   ```
   Usuario: miusuario
   Contraseña: ********
   ```
   (Nota: Internamente usa el email, el username es metadata)

### Registrarse

1. Click en tab "Registrarse"
2. Completar formulario:
   - Nombre de usuario
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
   - Aceptar términos y condiciones
3. Click en "Crear Cuenta"
4. Verificar email (si está habilitado en Supabase)

### Recuperar contraseña

1. Click en "¿Olvidaste tu contraseña?"
2. Ingresar email
3. Revisar bandeja de entrada
4. Seguir enlace para restablecer contraseña

### Modo offline

1. Click en "Usar sin cuenta (Offline)"
2. Acceso directo al dashboard
3. Datos guardados solo en localStorage

## 🔧 Archivos del sistema de login

### Nuevos archivos creados:

- `js/core/AuthManager.js` - Gestor de autenticación
- `js/views/LoginView.js` - Vista de login con diseño hermoso
- `LOGIN-SETUP.md` - Este archivo de instrucciones

### Archivos modificados:

- `js/app.js` - Integración de AuthManager y LoginView
- `js/core/Router.js` - Soporte para vista de login
- `supabase-config.js` - Función para crear cliente de Supabase
- `index.html` - Script de Supabase agregado

## 🎨 Personalización del diseño

El login usa un diseño con:

- **Gradientes:** `from-slate-900 via-indigo-950 to-slate-900`
- **Partículas animadas** en el fondo
- **Glassmorphism:** `backdrop-blur-xl`
- **Animaciones suaves** en botones y transiciones
- **Responsive design** para móviles y desktop

Para personalizar colores, edita `LoginView.js` en la sección de clases CSS.

## 🔒 Seguridad

- Las contraseñas se manejan completamente por Supabase
- Nunca se almacenan contraseñas en localStorage
- Los tokens de sesión se refrescan automáticamente
- Row Level Security (RLS) protege los datos en Supabase

## 📱 Despliegue en Vercel

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno (opcional):
   ```
   SUPABASE_URL=tu-url
   SUPABASE_ANON_KEY=tu-clave
   ```
3. Despliega normalmente
4. La aplicación funcionará con las credenciales de `supabase-config.js`

## ❓ Troubleshooting

### El login no aparece

- Verifica que Supabase esté configurado en `supabase-config.js`
- Revisa la consola del navegador para errores
- Asegúrate de que el script de Supabase se cargó correctamente

### Error al iniciar sesión

- Verifica que las credenciales sean correctas
- Revisa que el usuario esté confirmado (si tienes email confirmation habilitado)
- Verifica la configuración de Authentication en Supabase

### La sesión no persiste

- Verifica que `persistSession: true` esté en la configuración
- Revisa que localStorage no esté bloqueado en el navegador
- Asegúrate de que no estés en modo incógnito

## 📚 Recursos adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**¡Listo!** Tu sistema de login está configurado y funcionando. 🎉
