# 🔐 Credenciales de Acceso

## Credenciales Iniciales

Para acceder a tu Cuaderno Inteligente por primera vez, usa:

```
Usuario: admin
Contraseña: Cuaderno2024!
```

---

## ⚙️ Cambiar Credenciales desde la Web

**¡Ahora es súper fácil!** No necesitas tocar código.

### Pasos:

1. **Inicia sesión** con las credenciales iniciales
2. En el Dashboard, haz clic en tu **foto de perfil** (círculo con tu inicial en la esquina superior derecha)
3. En el menú desplegable, selecciona **"Cambiar Credenciales"** (icono de llave 🔑)
4. Se abrirá un modal de configuración
5. Completa el formulario:
   - **Contraseña Actual**: Tu contraseña actual para verificar
   - **Nuevo Usuario**: Tu nuevo nombre de usuario (mínimo 3 caracteres)
   - **Nueva Contraseña**: Tu nueva contraseña (mínimo 8 caracteres)
   - **Confirmar Nueva Contraseña**: Repite la nueva contraseña
6. Haz clic en **"Guardar Cambios"**
7. ¡Listo! En el próximo inicio de sesión usa tus nuevas credenciales

---

## 🛡️ Seguridad

### ✅ Características de Seguridad

- **Contraseñas hasheadas**: Se usa SHA-256, las contraseñas nunca se guardan en texto plano
- **Validación de contraseña actual**: Necesitas tu contraseña actual para cambiarla
- **Almacenamiento local**: Las credenciales se guardan en localStorage del navegador
- **Sesión de 24 horas**: La sesión expira automáticamente después de 24 horas
- **Renovación automática**: La sesión se renueva cada 10 minutos mientras uses la app

### 🔒 Recomendaciones

**Contraseña fuerte:**
- Mínimo 8 caracteres (el sistema lo valida)
- Combina mayúsculas, minúsculas, números y símbolos
- Evita palabras comunes o información personal

**Ejemplos de contraseñas fuertes:**
```
✅ MiCuaderno#2024!
✅ Estudio$Seguro789
✅ Apuntes@Privados2024
✅ N0t4s_S3gur4s#2024
```

**Ejemplos de contraseñas débiles:**
```
❌ 12345678
❌ password
❌ admin123
❌ micuaderno
```

---

## 🔄 Recuperar Acceso

Si olvidaste tu contraseña, puedes resetearla:

### Opción 1: Limpiar localStorage (Recomendado)

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Escribe:
   ```javascript
   localStorage.removeItem('cuaderno_credentials');
   location.reload();
   ```
4. Presiona Enter
5. La página se recargará y podrás usar las credenciales iniciales:
   - Usuario: `admin`
   - Contraseña: `Cuaderno2024!`

### Opción 2: Limpiar todo el localStorage

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. En el menú lateral, busca **Local Storage**
4. Haz clic derecho en tu dominio y selecciona **Clear**
5. Recarga la página

⚠️ **Nota**: Esto también borrará tus materias y apuntes guardados localmente.

---

## 📱 Acceso desde Múltiples Dispositivos

Si accedes desde diferentes dispositivos:

- Cada dispositivo guarda las credenciales localmente
- Debes cambiar las credenciales en cada dispositivo por separado
- O usa las mismas credenciales en todos los dispositivos

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener múltiples usuarios?

No, el sistema actual está diseñado para **un solo usuario** (tú). Es un sistema de protección personal, no multiusuario.

### ¿Qué pasa si alguien accede a mi localStorage?

Si alguien tiene acceso físico a tu dispositivo y puede ver el localStorage, verá el hash de tu contraseña, pero **no puede obtener la contraseña original** del hash (SHA-256 es unidireccional).

### ¿Es seguro para uso personal?

Sí, es seguro para proteger tu cuaderno de accesos casuales. Para mayor seguridad en producción con datos sensibles, considera implementar autenticación con backend (Supabase Auth).

### ¿Cuánto dura la sesión?

La sesión dura **24 horas** desde el último login. Se renueva automáticamente cada 10 minutos mientras uses la aplicación.

### ¿Puedo cambiar solo el usuario o solo la contraseña?

No, por seguridad debes cambiar ambos al mismo tiempo. Pero puedes poner el mismo usuario o la misma contraseña si solo quieres cambiar uno.

---

## 🚀 Próximos Pasos

1. **Cambia las credenciales iniciales** lo antes posible
2. Usa una contraseña fuerte y única
3. Guarda tus credenciales en un lugar seguro (gestor de contraseñas)
4. Disfruta de tu Cuaderno Inteligente protegido 🎉

---

**¿Problemas?** Revisa la sección de Recuperar Acceso o contacta al soporte.
