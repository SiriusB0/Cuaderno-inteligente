# 🔐 Configurar Credenciales de Acceso

Este documento explica cómo cambiar el usuario y contraseña de acceso a tu Cuaderno Inteligente.

## 📋 Credenciales Actuales (Por Defecto)

```
Usuario: admin
Contraseña: MiCuadernoSeguro2024
```

⚠️ **IMPORTANTE**: Cambia estas credenciales antes de desplegar tu aplicación.

---

## 🔧 Cómo Cambiar las Credenciales

### Opción 1: Usando el Generador de Hash (Recomendado)

1. Abre tu navegador y presiona **F12** para abrir la consola de desarrollador
2. Ve a la pestaña **Console**
3. Copia y pega este código (reemplaza `TU_NUEVA_CONTRASEÑA` con tu contraseña deseada):

```javascript
async function generarHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Hash SHA-256:', hashHex);
    return hashHex;
}

// Cambia "TU_NUEVA_CONTRASEÑA" por tu contraseña deseada
generarHash("TU_NUEVA_CONTRASEÑA");
```

4. Presiona **Enter** y copia el hash que aparece en la consola
5. Abre el archivo `js/auth.js`
6. Busca las líneas 10-14:

```javascript
this.CREDENTIALS = {
    username: 'admin',
    // Hash SHA-256 de "MiCuadernoSeguro2024"
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
};
```

7. Reemplaza:
   - `username`: Tu nuevo nombre de usuario (ej: `'micuaderno'`)
   - `passwordHash`: El hash que copiaste de la consola

8. Guarda el archivo

**Ejemplo:**

```javascript
this.CREDENTIALS = {
    username: 'micuaderno',
    // Hash SHA-256 de "MiSuperClaveSegura123!"
    passwordHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'
};
```

---

### Opción 2: Usando Node.js (Alternativa)

Si tienes Node.js instalado:

1. Crea un archivo temporal `generar-hash.js`:

```javascript
const crypto = require('crypto');

const password = 'TU_NUEVA_CONTRASEÑA'; // Cambia esto
const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('Hash SHA-256:', hash);
```

2. Ejecuta en terminal:

```bash
node generar-hash.js
```

3. Copia el hash y actualiza `js/auth.js` como se explicó arriba

---

## 🛡️ Recomendaciones de Seguridad

### ✅ Buenas Prácticas

- **Contraseña fuerte**: Mínimo 12 caracteres, combina mayúsculas, minúsculas, números y símbolos
- **No compartas**: Nunca compartas tu contraseña con nadie
- **Cambia periódicamente**: Actualiza tu contraseña cada 3-6 meses
- **No reutilices**: Usa una contraseña única para tu cuaderno

### ❌ Evita

- Contraseñas comunes: `123456`, `password`, `admin123`
- Información personal: Nombres, fechas de nacimiento, etc.
- Palabras del diccionario
- Contraseñas cortas (menos de 8 caracteres)

### 📝 Ejemplos de Contraseñas Fuertes

```
✅ MiCuaderno#2024!Seguro
✅ Estudio$Matematicas789
✅ Apuntes@Privados2024!
✅ N0t4s_S3gur4s#2024

❌ admin
❌ 123456
❌ password
❌ micuaderno
```

---

## 🔄 Recuperar Acceso (Si Olvidaste tu Contraseña)

Si olvidaste tu contraseña, puedes resetearla:

1. Abre `js/auth.js`
2. Reemplaza las credenciales con las predeterminadas:

```javascript
this.CREDENTIALS = {
    username: 'admin',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
};
```

3. Guarda el archivo
4. Recarga la aplicación
5. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: `MiCuadernoSeguro2024`
6. Luego cambia las credenciales siguiendo los pasos anteriores

---

## 🚀 Despliegue en Producción

### Antes de Desplegar a Vercel

1. **Cambia las credenciales predeterminadas**
2. Verifica que el archivo `js/auth.js` tenga tu nuevo hash
3. **NO subas** archivos con contraseñas en texto plano
4. Despliega normalmente:

```bash
vercel --prod
```

### Seguridad Adicional

Para mayor seguridad en producción, considera:

- **Variables de entorno**: Mover credenciales a variables de entorno de Vercel
- **Autenticación OAuth**: Integrar Google/GitHub login
- **2FA**: Implementar autenticación de dos factores
- **Rate limiting**: Limitar intentos de login fallidos

---

## 📊 Tabla de Hashes Comunes (Solo para Referencia)

| Contraseña | Hash SHA-256 |
|-----------|--------------|
| `admin` | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |
| `password` | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8` |
| `MiCuadernoSeguro2024` | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |

⚠️ **Nunca uses estas contraseñas en producción** - Son solo ejemplos.

---

## 🧪 Probar tus Credenciales

Después de cambiar las credenciales:

1. Cierra sesión (si estás logueado)
2. Recarga la página
3. Intenta iniciar sesión con tus nuevas credenciales
4. Verifica que funcione correctamente

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener múltiples usuarios?

El sistema actual está diseñado para **un solo usuario**. Para múltiples usuarios, necesitarías implementar Supabase Auth con base de datos.

### ¿Es seguro guardar el hash en el código?

El hash SHA-256 es **unidireccional** (no se puede revertir a la contraseña original). Es seguro para uso personal, pero para producción con múltiples usuarios, usa una base de datos.

### ¿Qué pasa si alguien ve mi código?

Si alguien accede a tu archivo `js/auth.js`, verá el hash pero **no puede obtener tu contraseña** a partir del hash (a menos que sea una contraseña muy débil y use fuerza bruta).

### ¿Cuánto dura la sesión?

La sesión dura **24 horas** desde el último login. Se renueva automáticamente cada 10 minutos mientras uses la aplicación.

---

## 📞 Soporte

Si tienes problemas configurando las credenciales, revisa:

1. La consola del navegador (F12) para errores
2. Que el hash esté completo (64 caracteres hexadecimales)
3. Que no haya espacios extra en el username o hash

---

**¡Listo!** Ya sabes cómo proteger tu Cuaderno Inteligente con credenciales personalizadas. 🎉
