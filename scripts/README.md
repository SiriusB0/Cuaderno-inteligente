# 📚 Scripts de Ingesta - Generador de Índices

Este directorio contiene scripts para generar índices JSON que alimentan el sistema RAG del asistente IA.

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar API Key

Crea un archivo `.env` en la raíz del proyecto:

```env
OPENAI_API_KEY=sk-proj-tu-clave-aqui
```

### 3. Generar tu primer índice

```bash
node generate-index.js matematicas teoria-de-conjuntos ../recursos/conjuntos.pdf
```

## 📖 Uso

### Sintaxis

```bash
node generate-index.js <materia> <tema> <archivo>
```

### Parámetros

- **materia**: Slug de la materia (sin espacios, sin acentos, minúsculas)
  - ✅ `matematicas`, `fisica`, `programacion`
  - ❌ `Matemáticas`, `Física Cuántica`

- **tema**: Slug del tema (sin espacios, sin acentos, minúsculas, con guiones)
  - ✅ `teoria-de-conjuntos`, `mecanica-clasica`
  - ❌ `Teoría de Conjuntos`, `mecánica clásica`

- **archivo**: Ruta al PDF o TXT
  - ✅ `../recursos/matematicas/conjuntos.pdf`
  - ✅ `./apuntes.txt`

### Ejemplos

```bash
# PDF de matemáticas
node generate-index.js matematicas algebra-lineal recursos/algebra.pdf

# Archivo de texto
node generate-index.js fisica mecanica-clasica apuntes/mecanica.txt

# Múltiples archivos (un tema puede tener varios archivos)
node generate-index.js programacion javascript recursos/js-basico.pdf
node generate-index.js programacion javascript recursos/js-avanzado.pdf
# Nota: El segundo comando REEMPLAZARÁ el índice. Para combinar, necesitas modificar el script.
```

## 📊 Proceso

1. **Extracción**: Lee el PDF/TXT y extrae el texto plano
2. **Chunking**: Divide el texto en fragmentos de ~1000 caracteres con solape de 200
3. **Embeddings**: Genera vector de 1536 dimensiones para cada chunk (OpenAI text-embedding-3-small)
4. **Guardado**: Crea JSON en `public/indices/<materia>/<tema>.json`

## 💰 Costos

| Documento | Caracteres | Tokens | Costo |
|-----------|------------|--------|-------|
| 1 página | ~2,000 | ~500 | $0.00001 |
| 10 páginas | ~20,000 | ~5,000 | $0.0001 |
| 50 páginas | ~100,000 | ~25,000 | $0.0005 |

**Modelo**: `text-embedding-3-small` a $0.00002 / 1K tokens

## 🗂️ Estructura de Salida

```json
[
  {
    "id": "chunk-0",
    "text": "Contenido del fragmento...",
    "embedding": [0.123, -0.456, ...], // 1536 números
    "sourceName": "conjuntos.pdf",
    "sourceUrl": null,
    "ord": 0
  },
  {
    "id": "chunk-1",
    "text": "Siguiente fragmento...",
    "embedding": [0.789, -0.321, ...],
    "sourceName": "conjuntos.pdf",
    "sourceUrl": null,
    "ord": 1
  }
]
```

## ⚙️ Configuración Avanzada

### Ajustar tamaño de chunks

Edita `generate-index.js`:

```javascript
const CHUNK_SIZE = 1200; // Aumentar para chunks más grandes
const CHUNK_OVERLAP = 300; // Aumentar para más contexto entre chunks
```

### Añadir URLs a las fuentes

Edita el script para incluir URLs:

```javascript
index.push({
    id: `chunk-${i}`,
    text: chunks[i],
    embedding: embedding,
    sourceName: fileName,
    sourceUrl: 'https://example.com/recurso.pdf', // ← Añadir aquí
    ord: i
});
```

## 🔧 Troubleshooting

### Error: "pdf-parse" no funciona

Algunos PDFs escaneados no tienen texto extraíble. Usa OCR primero:

```bash
# Con Tesseract OCR
tesseract documento-escaneado.pdf salida pdf
```

### Costo muy alto

Reduce `CHUNK_SIZE` o filtra el texto antes de procesar (quitar índices, páginas en blanco, etc.).

### Embeddings lentos

El script hace una pausa de 100ms entre chunks para no saturar la API. Si tienes tier pago de OpenAI, reduce:

```javascript
// Línea ~96 en generate-index.js
await new Promise(resolve => setTimeout(resolve, 50)); // Reducir de 100 a 50
```

## 📚 Recursos

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pdf-parse docs](https://www.npmjs.com/package/pdf-parse)
