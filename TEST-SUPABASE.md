# 🧪 Prueba Automática de Supabase

## Pasos Súper Fáciles:

### 1. Sube el cambio a GitHub
- Abre **GitHub Desktop**
- Verás el archivo `api/test-connection.js` en Changes
- Commit message: `Add test endpoint`
- Click **Commit to main**
- Click **Push origin**

### 2. Espera el redeploy en Vercel (30 segundos)
- Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
- Verás "Building..." → espera a que diga "Ready"

### 3. Ejecuta la prueba
Abre tu sitio y en la consola (F12) ejecuta:

```javascript
fetch('/api/test-connection').then(r => r.json()).then(console.log)
```

### 4. Resultado esperado:

✅ **Si funciona:**
```javascript
{
  success: true,
  message: "✅ ¡Supabase funciona perfectamente!",
  tests: {
    1_subject_created: {...},
    2_topic_created: {...},
    3_page_created: {...},
    4_pages_read: [...]
  }
}
```

❌ **Si falla:**
- Verás el error específico
- Cópialo y pégamelo

### 5. Verificar en Supabase (opcional)
- Ve a Supabase → Table Editor
- Verás datos de prueba en `subjects`, `topics`, `pages`
- Puedes eliminarlos después si quieres

---

## ¿Listo?

1. Commit + Push en GitHub Desktop
2. Espera 30 segundos
3. Ejecuta el fetch
4. Dime qué sale
