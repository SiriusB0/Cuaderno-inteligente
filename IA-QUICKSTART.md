# 🚀 Quickstart: Asistente IA en 10 minutos

Guía rápida para tener el chat IA funcionando.

## ✅ Checklist

- [ ] Cuenta OpenAI con API Key
- [ ] Cuenta Supabase (gratis)
- [ ] Cuenta Vercel (gratis)
- [ ] Node.js 18+ instalado

## 📝 Pasos

### 1️⃣ Configurar Variables de Entorno (2 min)

```bash
# En la raíz del proyecto
cp .env.example .env
```

Edita `.env` con tus claves:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
```

**Dónde conseguir las claves:**

- **OpenAI**: https://platform.openai.com/api-keys
- **Supabase**: Dashboard → Settings → API

### 2️⃣ Generar un Índice de Prueba (3 min)

```bash
cd scripts
npm install

# Crea un archivo de prueba
echo "La teoría de conjuntos estudia colecciones de objetos. Un conjunto A puede contener elementos. La unión de A y B se denota A ∪ B." > test.txt

# Genera el índice
node generate-index.js matematicas teoria-de-conjuntos test.txt
```

✅ Deberías ver: `public/indices/matematicas/teoria-de-conjuntos.json`

### 3️⃣ Desplegar Edge Function (3 min)

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref TU-PROJECT-REF

# Configurar secreto
supabase secrets set OPENAI_API_KEY=sk-proj-tu-clave

# Desplegar
supabase functions deploy ask
```

✅ Verifica: https://tu-proyecto.supabase.co/functions/v1/ask

### 4️⃣ Configurar Frontend (1 min)

Edita `js/components/AIChatModal.js` líneas 18-19:

```javascript
this.SUPABASE_URL = 'https://tu-proyecto.supabase.co'; // ← Cambiar
this.SUPABASE_ANON_KEY = 'eyJhbGc...'; // ← Cambiar
```

### 5️⃣ Desplegar a Vercel (1 min)

```bash
npm install -g vercel
vercel --prod
```

✅ Tu app estará en: https://tu-app.vercel.app

## 🎉 Probar

1. Abre tu app en Vercel
2. Crea una materia "Matemáticas"
3. Crea un tema "Teoría de Conjuntos"
4. Entra al tema y haz clic en **"Chat IA"** (botón morado en header)
5. Pregunta: "¿Qué es un conjunto?"

**Deberías recibir una respuesta citando tu archivo de prueba.**

## 🔄 Siguiente: Indexar tus propios PDFs

```bash
# Coloca tus PDFs en recursos/
mkdir -p recursos/matematicas
# Copia tus PDFs ahí

# Genera índice
cd scripts
node generate-index.js matematicas algebra-lineal ../recursos/matematicas/algebra.pdf

# Redespliega
cd ..
vercel --prod
```

## 📚 Documentación Completa

- **Setup detallado**: [docs/IA-SETUP.md](docs/IA-SETUP.md)
- **Scripts**: [scripts/README.md](scripts/README.md)

## 💰 Costos

Con **200 preguntas/mes** y **10 PDFs indexados**:

- Embeddings (una vez): ~$0.005
- Chat (GPT-4o-mini): ~$0.08/mes
- **Total**: **~$0.10/mes** ✅ Muy por debajo de tu límite de $3

## 🐛 Problemas Comunes

### "Índice no encontrado"

El slug del tema no coincide. Verifica:

```bash
ls public/indices/matematicas/
# Debe mostrar: teoria-de-conjuntos.json
```

### "Modo Demo"

No configuraste SUPABASE_URL en `AIChatModal.js`. Vuelve al paso 4️⃣.

### "Error 500"

La Edge Function no tiene OPENAI_API_KEY. Ejecuta:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-tu-clave
supabase functions deploy ask
```

## 🎯 Tips

- **Usa slugs sin acentos**: `matematicas`, no `matemáticas`
- **Temas específicos**: Un índice por tema (ej: `algebra-lineal`, `calculo-diferencial`)
- **PDFs limpios**: Si es un escaneo, usa OCR primero
- **Prueba primero con TXT**: Más rápido para testing

## ✨ Listo

Ya tienes un asistente IA personal que:

- ✅ Lee tus PDFs y apuntes
- ✅ Responde preguntas contextualizadas
- ✅ Cita las fuentes
- ✅ Cuesta centavos al mes

¡Disfruta estudiando con IA! 🚀
