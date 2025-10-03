/**
 * Script de ingesta offline - Genera índices JSON para RAG
 * 
 * Uso:
 *   node scripts/generate-index.js <materia> <tema> <archivo.pdf|archivo.txt>
 * 
 * Ejemplo:
 *   node scripts/generate-index.js matematicas "teoria-de-conjuntos" recursos/conjuntos.pdf
 * 
 * Requisitos:
 *   npm install pdf-parse openai dotenv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Configuración
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHUNK_SIZE = 1000; // Caracteres por chunk
const CHUNK_OVERLAP = 200; // Solape entre chunks
const EMBEDDING_MODEL = 'text-embedding-3-small';

if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY no encontrada en .env');
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Extrae texto de un archivo
 */
async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
        // Importación dinámica de pdf-parse para evitar errores de inicialización
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text;
    } else if (ext === '.txt' || ext === '.md') {
        return fs.readFileSync(filePath, 'utf-8');
    } else {
        throw new Error(`Formato no soportado: ${ext}`);
    }
}

/**
 * Trocea texto en chunks con solape
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.substring(start, end).trim();
        
        if (chunk.length > 0) {
            chunks.push(chunk);
        }
        
        start += chunkSize - overlap;
    }
    
    return chunks;
}

/**
 * Genera embedding para un texto
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text
        });
        
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generando embedding:', error.message);
        throw error;
    }
}

/**
 * Procesa un archivo y genera índice
 */
async function processFile(filePath, subjectSlug, topicSlug) {
    console.log(`\n📄 Procesando: ${filePath}`);
    
    // 1. Extraer texto
    console.log('   Extrayendo texto...');
    const text = await extractText(filePath);
    console.log(`   ✓ ${text.length} caracteres extraídos`);
    
    // 2. Trocear
    console.log('   Troceando texto...');
    const chunks = chunkText(text);
    console.log(`   ✓ ${chunks.length} chunks generados`);
    
    // 3. Generar embeddings
    console.log('   Generando embeddings...');
    const index = [];
    const fileName = path.basename(filePath);
    
    for (let i = 0; i < chunks.length; i++) {
        process.stdout.write(`\r   Procesando chunk ${i + 1}/${chunks.length}...`);
        
        const embedding = await generateEmbedding(chunks[i]);
        
        index.push({
            id: `chunk-${i}`,
            text: chunks[i],
            embedding: embedding,
            sourceName: fileName,
            sourceUrl: null, // Opcional: URL si el recurso está online
            ord: i
        });
        
        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n   ✓ Embeddings generados');
    
    // 4. Guardar índice JSON
    const outputDir = path.join(__dirname, '..', 'public', 'indices', subjectSlug);
    const outputPath = path.join(outputDir, `${topicSlug}.json`);
    
    // Crear directorios si no existen
    fs.mkdirSync(outputDir, { recursive: true });
    
    fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
    console.log(`\n✅ Índice guardado en: ${outputPath}`);
    console.log(`   Total: ${index.length} fragmentos indexados`);
    
    return index;
}

/**
 * Calcula costo estimado
 */
function estimateCost(text) {
    // text-embedding-3-small: $0.00002 / 1K tokens
    // Aproximación: 1 token ≈ 4 caracteres
    const tokens = Math.ceil(text.length / 4);
    const cost = (tokens / 1000) * 0.00002;
    return { tokens, cost };
}

/**
 * Main
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log(`
📚 Generador de Índices para RAG

Uso:
  node scripts/generate-index.js <materia> <tema> <archivo>

Argumentos:
  <materia>  Nombre de la materia (ej: matematicas)
  <tema>     Nombre del tema (ej: teoria-de-conjuntos)
  <archivo>  Ruta al archivo PDF o TXT

Ejemplo:
  node scripts/generate-index.js matematicas teoria-de-conjuntos recursos/conjuntos.pdf

Nota: Asegúrate de tener OPENAI_API_KEY en tu archivo .env
        `);
        process.exit(1);
    }
    
    const [subjectSlug, topicSlug, filePath] = args;
    
    // Validar archivo
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: Archivo no encontrado: ${filePath}`);
        process.exit(1);
    }
    
    console.log(`
╔════════════════════════════════════════════════╗
║     Generador de Índices - RAG Ligero         ║
╚════════════════════════════════════════════════╝

📖 Materia: ${subjectSlug}
📑 Tema:    ${topicSlug}
📄 Archivo: ${filePath}
    `);
    
    try {
        // Estimar costo
        const text = await extractText(filePath);
        const { tokens, cost } = estimateCost(text);
        console.log(`💰 Costo estimado: ~${tokens.toLocaleString()} tokens (~$${cost.toFixed(4)} USD)\n`);
        
        // Procesar
        const index = await processFile(filePath, subjectSlug, topicSlug);
        
        console.log(`
╔════════════════════════════════════════════════╗
║              ✨ PROCESO COMPLETADO             ║
╚════════════════════════════════════════════════╝

📊 Estadísticas:
   - Fragmentos: ${index.length}
   - Dimensiones: ${index[0].embedding.length}
   - Modelo: ${EMBEDDING_MODEL}

📁 Ubicación:
   public/indices/${subjectSlug}/${topicSlug}.json

🚀 Próximos pasos:
   1. Despliega a Vercel (el índice estará en /indices/${subjectSlug}/${topicSlug}.json)
   2. Configura SUPABASE_URL y SUPABASE_ANON_KEY en AIChatModal.js
   3. Despliega la Edge Function 'ask' en Supabase
   4. ¡Listo! Abre el tema en tu app y prueba el chat IA
        `);
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

main();
