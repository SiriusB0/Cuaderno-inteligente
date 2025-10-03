# 🤖 Setup de Asistente IA con RAG

Este documento explica cómo configurar y usar el asistente de IA integrado en el Cuaderno Inteligente.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Requisitos](#requisitos)
3. [Configuración Inicial](#configuración-inicial)
4. [Generar Índices](#generar-índices)
5. [Desplegar Backend](#desplegar-backend)
6. [Configurar Frontend](#configurar-frontend)
7. [Uso](#uso)
8. [Costos Estimados](#costos-estimados)
9. [Troubleshooting](#troubleshooting)

---

## Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                   NAVEGADOR (Cliente)                    │
├─────────────────────────────────────────────────────────┤
│ 1. Usuario hace pregunta desde el tema                  │
│ 2. AIChatModal carga índice JSON del tema desde Vercel  │
│ 3. Calcula similitud coseno (top-5 chunks)              │
│ 4. Envía query + chunks + apuntes a Edge Function       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            SUPABASE EDGE FUNCTION (ask)                  │
├─────────────────────────────────────────────────────────┤
│ 1. Recibe: query, topChunks, extraContext               │
│ 2. Construye prompt con contexto                        │
│ 3. Llama a OpenAI GPT-4o-mini                          │
│ 4. Devuelve respuesta + fuentes citadas                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  OPENAI API                              │
├─────────────────────────────────────────────────────────┤
│ Modelo: gpt-4o-mini (barato y rápido)                  │
│ Max tokens: 500 (controla costos)                       │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
PDFs/Textos → [Script Offline] → Índices JSON → Vercel CDN
                     ↓
              Embeddings (OpenAI)
                     
Usuario → Pregunta → [Cliente] → Similitud → Top chunks
                          ↓
                   Edge Function → GPT-4o-mini → Respuesta
```

---

## Requisitos

### Software

- **Node.js** 18+ (para scripts de ingesta)
- **OpenAI API Key** (para embeddings y GPT-4o-mini)
- **Supabase Account** (gratuito, solo para Edge Function)
- **Vercel Account** (gratuito, para hosting)

### Costos

- **OpenAI**: ~$3 USD/mes con uso moderado
  - Embeddings: $0.00002 / 1K tokens (text-embedding-3-small)
  - Chat: $0.00015 / 1K tokens input, $0.0006 / 1K tokens output (gpt-4o-mini)
- **Supabase**: $0 (Free tier suficiente)
- **Vercel**: $0 (Free tier suficiente)

---

## Configuración Inicial

### 1. Obtener API Keys

#### OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API Key
3. Copia la clave (empieza con `sk-`)

#### Supabase

1. Ve a https://supabase.com/dashboard
2. Crea un nuevo proyecto (si no tienes uno)
3. Ve a **Settings → API**
4. Copia:
   - `Project URL` (tu SUPABASE_URL)
   - `anon public` key (tu SUPABASE_ANON_KEY)

### 2. Configurar Variables de Entorno

```bash
# En la raíz del proyecto
cp .env.example .env
```

Edita `.env`:

```env
# Supabase (para Edge Function)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (para embeddings y GPT)
OPENAI_API_KEY=sk-proj-...
```

### 3. Instalar Dependencias del Script

```bash
cd scripts
npm install
```

---

## Generar Índices

Los índices JSON contienen los chunks de texto con sus embeddings para cada tema.

### Preparar Recursos

1. Crea carpeta para tus recursos:

```bash
mkdir -p recursos/matematicas
```

2. Coloca tus PDFs o archivos de texto ahí:

```
recursos/
  matematicas/
    teoria-de-conjuntos.pdf
    algebra-lineal.pdf
  fisica/
    mecanica-clasica.pdf
```

### Generar Índice para un Tema

```bash
cd scripts
node generate-index.js <materia> <tema> <archivo>
```

**Ejemplo:**

```bash
node generate-index.js matematicas teoria-de-conjuntos ../recursos/matematicas/teoria-de-conjuntos.pdf
```

Esto generará:

```
public/indices/matematicas/teoria-de-conjuntos.json
```

### Estructura del Índice JSON

```json
[
  {
    "id": "chunk-0",
    "text": "Teoría de Conjuntos\n\nUn conjunto es una colección de objetos...",
    "embedding": [0.123, -0.456, 0.789, ...], // 1536 dimensiones
    "sourceName": "teoria-de-conjuntos.pdf",
    "sourceUrl": null,
    "ord": 0
  },
  ...
]
```

### Generar Múltiples Índices

Crea un script bash/PowerShell:

```bash
# generate-all.sh
node generate-index.js matematicas teoria-de-conjuntos recursos/matematicas/conjuntos.pdf
node generate-index.js matematicas algebra-lineal recursos/matematicas/algebra.pdf
node generate-index.js fisica mecanica-clasica recursos/fisica/mecanica.pdf
```

---

## Desplegar Backend

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login

```bash
supabase login
```

### 3. Link al Proyecto

```bash
supabase link --project-ref tu-proyecto-id
```

### 4. Configurar Secretos

Añade tu API Key de OpenAI como secreto:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-tu-clave-aqui
```

### 5. Desplegar Edge Function

```bash
supabase functions deploy ask
```

### 6. Verificar Deployment

```bash
curl -i --location --request POST \
  'https://tu-proyecto.supabase.co/functions/v1/ask' \
  --header 'Authorization: Bearer TU-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"subjectId":"test","topicId":"test","query":"Hola","topChunks":[]}'
```

---

## Configurar Frontend

### 1. Actualizar AIChatModal.js

Edita `js/components/AIChatModal.js`:

```javascript
// Líneas 18-19
this.SUPABASE_URL = 'https://tu-proyecto.supabase.co'; // Reemplaza
this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUz...'; // Reemplaza
```

### 2. Desplegar a Vercel

```bash
# Si aún no has inicializado Vercel
npm install -g vercel
vercel login

# Desplegar
vercel

# O para producción
vercel --prod
```

Los índices JSON estarán disponibles en:

```
https://tu-app.vercel.app/indices/matematicas/teoria-de-conjuntos.json
```

---

## Uso

### 1. Flujo del Usuario

1. Abre tu app en Vercel
2. Navega a una materia (ej: Matemáticas)
3. Entra a un tema (ej: Teoría de Conjuntos)
4. Haz clic en el botón **"Chat IA"** en el header
5. Escribe tu pregunta
6. (Opcional) Activa "Incluir apuntes del editor" si quieres que use tu texto
7. Envía y recibe la respuesta

### 2. Ejemplo de Preguntas

**Sin recursos (solo apuntes):**

- "Resume mis apuntes en 3 puntos clave"
- "¿Qué temas he cubierto hasta ahora?"

**Con recursos indexados:**

- "¿Qué es un conjunto según el material?"
- "Dame un ejemplo de la ley de De Morgan con solución"
- "Explica la diferencia entre unión e intersección"

### 3. Interpretación de Respuestas

- **[Fuente N]**: Indica que la información viene de tus recursos indexados
- **Chips de fuentes**: Aparecen abajo de la respuesta mostrando qué documentos se usaron

---

## Costos Estimados

### Embeddings (una sola vez por documento)

| Documento | Tamaño | Tokens | Costo |
|-----------|--------|--------|-------|
| PDF 10 páginas | ~20,000 chars | ~5,000 tokens | $0.0001 |
| PDF 50 páginas | ~100,000 chars | ~25,000 tokens | $0.0005 |
| Libro completo | ~500,000 chars | ~125,000 tokens | $0.0025 |

### Inferencia (por pregunta)

Asumiendo:
- 5 chunks de 300 tokens cada uno = 1,500 tokens de contexto
- 100 tokens de pregunta + sistema
- 200 tokens de respuesta

**Costo por pregunta**: ~$0.0004 USD

**Con 200 preguntas/mes**: ~$0.08 USD

### Total Mensual Estimado

- **Indexar 10 documentos**: $0.005
- **200 preguntas**: $0.08
- **Total**: **~$0.10 USD/mes** (muy por debajo de tu límite de $3)

---

## Troubleshooting

### ❌ "Índice no encontrado"

**Causa**: El índice JSON no existe para ese tema.

**Solución**:

1. Verifica que generaste el índice:
   ```bash
   ls public/indices/matematicas/
   ```

2. Asegúrate de que los slugs coincidan (sin acentos, minúsculas):
   - Materia: `"Matemáticas"` → slug: `matematicas`
   - Tema: `"Teoría de Conjuntos"` → slug: `teoria-de-conjuntos`

3. Redespliega a Vercel si acabas de generar el índice

### ❌ "Error del servidor: 500"

**Causa**: La Edge Function no está configurada correctamente.

**Solución**:

1. Verifica que `OPENAI_API_KEY` está en los secretos de Supabase:
   ```bash
   supabase secrets list
   ```

2. Revisa los logs de la función:
   ```bash
   supabase functions logs ask
   ```

3. Verifica que desplegaste la función:
   ```bash
   supabase functions list
   ```

### ❌ "Modo Demo"

**Causa**: No configuraste SUPABASE_URL y SUPABASE_ANON_KEY en `AIChatModal.js`.

**Solución**: Edita las líneas 18-19 de `js/components/AIChatModal.js` con tus credenciales reales.

### ⚠️ Respuestas genéricas (no usa tus recursos)

**Causa**: El índice JSON está vacío o la similitud no encuentra chunks relevantes.

**Posibles soluciones**:

1. Regenera el índice con más solape:
   ```javascript
   // En generate-index.js, línea 18
   const CHUNK_OVERLAP = 300; // Aumentar de 200 a 300
   ```

2. Verifica que el PDF tiene texto extraíble (no imágenes escaneadas)

3. Usa preguntas más específicas relacionadas con el contenido del documento

### 🔄 "Embeddings simulados"

**Causa**: En `AIChatModal.js`, la función `getQueryEmbedding()` usa embeddings simulados.

**Para producción real**:

1. Crea una segunda Edge Function `embed` que llame a OpenAI embeddings API
2. O implementa la llamada directa en el cliente (expone API key, no recomendado)

**Versión simplificada (demo actual)**: Funciona pero con menor precisión en la búsqueda.

---

## Mejoras Futuras

### 1. Embeddings reales en el cliente

Llamar a una Edge Function `embed` para obtener el embedding del query:

```javascript
async getQueryEmbedding(query) {
    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/embed`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: query })
    });
    
    const data = await response.json();
    return data.embedding;
}
```

### 2. Base de datos vectorial (si escala)

Si tienes >50 temas con índices grandes, migra a Supabase + pgvector:

- Mejor rendimiento en búsquedas
- Filtrado por materia/tema más eficiente
- Actualizaciones incrementales

### 3. Cache de conversaciones

Guardar historial de chat en localStorage para continuar conversaciones.

### 4. Respuestas en streaming

Usar `stream: true` en OpenAI para mostrar respuestas palabra por palabra.

---

## Soporte

- **Documentación OpenAI**: https://platform.openai.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Embeddings Guide**: https://platform.openai.com/docs/guides/embeddings

---

## Licencia

Este módulo es parte del Cuaderno Inteligente. Uso educativo y personal.
