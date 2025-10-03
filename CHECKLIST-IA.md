# ✅ Checklist de Implementación IA

Usa este archivo para verificar que todo está configurado correctamente.

## 📋 Pre-requisitos

- [ ] Cuenta OpenAI creada
- [ ] API Key de OpenAI obtenida ($5 de crédito mínimo recomendado)
- [ ] Cuenta Supabase creada (gratis)
- [ ] Cuenta Vercel creada (gratis)
- [ ] Node.js 18+ instalado
- [ ] Git instalado

## 🔧 Configuración Inicial

### Variables de Entorno

- [ ] Archivo `.env` creado (copiar de `.env.example`)
- [ ] `OPENAI_API_KEY` configurada
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_ANON_KEY` configurada

Verifica con:
```bash
cat .env  # Linux/Mac
type .env  # Windows
```

### Dependencias del Script

- [ ] Navegado a carpeta `scripts/`
- [ ] Ejecutado `npm install`
- [ ] Verificado que se instalaron: `pdf-parse`, `openai`, `dotenv`

```bash
cd scripts
npm install
ls node_modules  # Debe mostrar las carpetas de dependencias
```

## 📚 Generar Primer Índice (Prueba)

### Crear archivo de prueba

- [ ] Creada carpeta `recursos/`
- [ ] Creado archivo de prueba `recursos/test.txt` con contenido educativo

```bash
mkdir recursos
echo "La teoría de conjuntos es una rama de las matemáticas. Un conjunto A contiene elementos. La unión se denota A ∪ B." > recursos/test.txt
```

### Generar índice

- [ ] Ejecutado el script de generación
- [ ] Verificado que se creó `public/indices/matematicas/teoria-de-conjuntos.json`
- [ ] El JSON contiene arrays con `id`, `text`, `embedding`, etc.

```bash
cd scripts
node generate-index.js matematicas teoria-de-conjuntos ../recursos/test.txt
```

Verifica:
```bash
ls ../public/indices/matematicas/
cat ../public/indices/matematicas/teoria-de-conjuntos.json | head -20
```

## ☁️ Desplegar Backend (Supabase)

### Instalar CLI

- [ ] Supabase CLI instalado globalmente

```bash
npm install -g supabase
supabase --version
```

### Configurar proyecto

- [ ] Login en Supabase CLI
- [ ] Proyecto linkeado
- [ ] Secreto `OPENAI_API_KEY` configurado

```bash
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Desplegar Edge Function

- [ ] Edge Function `ask` desplegada
- [ ] Verificado que aparece en dashboard de Supabase

```bash
supabase functions deploy ask
supabase functions list
```

### Probar Edge Function

- [ ] Ejecutado curl de prueba
- [ ] Recibida respuesta (no error 500)

```bash
curl -i --location --request POST \
  'https://TU-PROYECTO.supabase.co/functions/v1/ask' \
  --header 'Authorization: Bearer TU-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"subjectId":"test","topicId":"test","query":"Hola","topChunks":[]}'
```

## 🎨 Configurar Frontend

### Actualizar AIChatModal.js

- [ ] Abierto `js/components/AIChatModal.js`
- [ ] Línea 18: `SUPABASE_URL` reemplazada con tu URL real
- [ ] Línea 19: `SUPABASE_ANON_KEY` reemplazada con tu key real
- [ ] Guardado el archivo

```javascript
// Antes:
this.SUPABASE_URL = 'https://your-project.supabase.co';
this.SUPABASE_ANON_KEY = 'your-anon-key';

// Después:
this.SUPABASE_URL = 'https://abcdefghijklmn.supabase.co';
this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 🚀 Desplegar a Vercel

### Primera vez

- [ ] Vercel CLI instalado
- [ ] Login en Vercel
- [ ] Proyecto desplegado

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Verificaciones post-deploy

- [ ] App accesible en `https://tu-app.vercel.app`
- [ ] Índice JSON accesible: `https://tu-app.vercel.app/indices/matematicas/teoria-de-conjuntos.json`

```bash
curl https://tu-app.vercel.app/indices/matematicas/teoria-de-conjuntos.json
```

## 🧪 Probar la Funcionalidad Completa

### En la app web

- [ ] Navegado a tu app en Vercel
- [ ] Creada materia "Matemáticas"
- [ ] Creado tema "Teoría de Conjuntos" (sin acentos, minúsculas)
- [ ] Entrado al tema
- [ ] Botón "Chat IA" visible en el header (morado, con icono sparkles)
- [ ] Click en "Chat IA" → Modal se abre
- [ ] Contexto mostrado: "Matemáticas › Teoría de Conjuntos (con recursos)"
- [ ] Estado del índice: "✅ X fragmentos cargados"

### Hacer pregunta de prueba

- [ ] Escrita pregunta: "¿Qué es un conjunto?"
- [ ] Click en botón enviar (icono de enviar)
- [ ] Mensaje del usuario aparece en el chat
- [ ] Loading spinner visible
- [ ] Respuesta de IA recibida
- [ ] Fuentes citadas aparecen (chips con nombre del archivo)
- [ ] Respuesta relevante al contenido de tu archivo de prueba

### Probar con apuntes del editor

- [ ] Escrito algo en el editor de texto del tema
- [ ] Toggle "Incluir apuntes del editor" activado
- [ ] Pregunta: "Resume mis apuntes"
- [ ] Respuesta menciona contenido del editor

## 🐛 Troubleshooting

### ❌ "Índice no encontrado"

**Revisa:**
- [ ] Slug de materia: debe ser `matematicas` (sin acento, minúscula)
- [ ] Slug de tema: debe ser `teoria-de-conjuntos` (sin acento, con guiones)
- [ ] Archivo existe: `public/indices/matematicas/teoria-de-conjuntos.json`
- [ ] Redesplegado a Vercel después de generar el índice

### ❌ "Modo Demo"

**Revisa:**
- [ ] `SUPABASE_URL` en `AIChatModal.js` NO contiene "your-project"
- [ ] `SUPABASE_ANON_KEY` en `AIChatModal.js` NO contiene "your-anon-key"
- [ ] Archivo guardado y redesplegado a Vercel

### ❌ "Error del servidor: 500"

**Revisa:**
- [ ] Secreto `OPENAI_API_KEY` configurado en Supabase
- [ ] Edge Function desplegada correctamente
- [ ] Logs de la función: `supabase functions logs ask`

### ⚠️ "Sin índice - usando solo apuntes"

**Es normal si:**
- [ ] No has generado índice para ese tema específico
- [ ] El slug no coincide exactamente

**El chat funcionará** pero solo con contexto de tus apuntes del editor.

## 📊 Monitoreo de Costos

### OpenAI Dashboard

- [ ] Visitado https://platform.openai.com/usage
- [ ] Verificado uso de embeddings (model: text-embedding-3-small)
- [ ] Verificado uso de chat (model: gpt-4o-mini)
- [ ] Configurado límite de gasto (recomendado: $5/mes)

### Estimaciones

Con tu índice de prueba (~200 tokens):
- **Costo de indexación**: ~$0.000004 USD ✅
- **Costo por pregunta**: ~$0.0003 USD ✅
- **200 preguntas**: ~$0.06/mes ✅

## 🎯 Siguientes Pasos

Una vez que todo funcione con el archivo de prueba:

- [ ] Generar índices de tus PDFs reales
- [ ] Crear script batch/shell para indexar múltiples archivos
- [ ] Probar con preguntas más complejas
- [ ] Ajustar `CHUNK_SIZE` si es necesario
- [ ] Explorar mejoras (embeddings reales, cache, etc.)

## 📝 Notas

**Fecha de implementación**: _____________

**URLs importantes**:
- App: https://_______________.vercel.app
- Supabase: https://_______________.supabase.co
- OpenAI Usage: https://platform.openai.com/usage

**Costos actuales**:
- Indexación total: $__________
- Uso mensual: $__________

---

**¿Todo funcionando?** 🎉 ¡Felicidades! Ya tienes un asistente IA personal.

**¿Problemas?** Revisa [docs/IA-SETUP.md](docs/IA-SETUP.md) sección Troubleshooting.
