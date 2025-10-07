# 🔐 Configuración del Sistema de Login

## Paso 1: Ejecutar SQL en Supabase

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el contenido del archivo `supabase-auth-schema.sql`

Esto creará:
- Tabla `user_credentials` para almacenar el usuario y contraseña
- Credenciales iniciales:
  - **Usuario**: `admin`
  - **Contraseña**: `admin123`

## Paso 2: Usar la Aplicación

### Iniciar Sesión
1. Abre tu aplicación en Vercel
2. Ingresa las credenciales iniciales:
   - Usuario: `admin`
   - Contraseña: `admin123`

### Cambiar Credenciales

1. **Haz clic en tu foto de perfil** (círculo de colores en la esquina superior derecha)
2. Selecciona **"Cambiar Credenciales"**
3. En el modal puedes:
   - **Solo cambiar usuario**: Completa solo el campo "Nuevo Usuario"
   - **Solo cambiar contraseña**: Completa solo los campos de contraseña
   - **Cambiar ambos**: Completa todos los campos

4. Haz clic en **"Guardar"**
5. Se cerrará la sesión automáticamente para que inicies con tus nuevas credenciales

### Cerrar Sesión

1. **Haz clic en tu foto de perfil** (círculo de colores en la esquina superior derecha)
2. Selecciona **"Cerrar Sesión"**
3. Confirma la acción

## Seguridad

✅ **Contraseñas encriptadas**: Se usa SHA-256 para hashear las contraseñas
✅ **Almacenamiento seguro**: Las credenciales están en Supabase, no en el código
✅ **Sesión temporal**: Usa `sessionStorage`, se cierra al cerrar el navegador
✅ **Usuario único**: Solo un usuario puede acceder a la aplicación

## Cambiar Credenciales desde Supabase

Si olvidas tu contraseña, puedes resetearla directamente en Supabase:

1. Ve al **Table Editor** en Supabase
2. Abre la tabla `user_credentials`
3. Edita el registro con `id = 1`
4. Para generar un nuevo hash de contraseña, usa esta herramienta online:
   https://emn178.github.io/online-tools/sha256.html
5. Ingresa tu nueva contraseña y copia el hash
6. Pega el hash en el campo `password_hash`

## Ejemplo de Hash

Contraseña: `admin123`
Hash SHA-256: `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
