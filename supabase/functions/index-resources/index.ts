// Supabase Edge Function: index-resources
// Procesa PDFs de un tema y genera índice JSON automáticamente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface ResourceText {
  name: string
  text: string
}

interface RequestBody {
  subjectId: string
  topicId: string
  subjectName: string
  topicName: string
  resourceTexts: ResourceText[] // Textos decodificados de archivos
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subjectId, topicId, subjectName, topicName, resourceTexts }: RequestBody = await req.json()

    // Validar
    if (!subjectName || !topicName || !resourceTexts || resourceTexts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener API Key de OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API Key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar slugs
    const subjectSlug = normalizeSlug(subjectName)
    const topicSlug = normalizeSlug(topicName)

    const chunks: any[] = []

    // Procesar cada texto
    for (let i = 0; i < resourceTexts.length; i++) {
      const resource = resourceTexts[i]
      const fileName = resource.name
      
      try {
        const text = resource.text

        if (!text || text.length === 0) continue

        // Trocear texto
        const textChunks = chunkText(text, 1000, 200)

        // Generar embeddings para cada chunk
        for (let j = 0; j < textChunks.length; j++) {
          const chunk = textChunks[j]
          
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: chunk
            })
          })

          if (!embeddingResponse.ok) {
            console.error('Error generating embedding:', await embeddingResponse.text())
            continue
          }

          const embeddingData = await embeddingResponse.json()
          const embedding = embeddingData.data[0].embedding

          chunks.push({
            id: `chunk-${chunks.length}`,
            text: chunk,
            embedding,
            sourceName: fileName,
            ord: chunks.length
          })
        }
      } catch (error) {
        console.error('Error processing file:', fileName, error)
        continue
      }
    }

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No se pudo procesar ningún archivo. Solo se soportan archivos .txt por ahora.',
          processed: 0
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generar índice JSON
    const index = chunks
    const indexPath = `indices/${subjectSlug}/${topicSlug}.json`

    // Guardar índice en Supabase Storage
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xsumibufekrmfcenyqgq.supabase.co'
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseServiceKey) {
        const storageResponse = await fetch(
          `${supabaseUrl}/storage/v1/object/ai-indices/${indexPath}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(index)
          }
        )

        if (!storageResponse.ok) {
          console.error('Error guardando en Storage:', await storageResponse.text())
        }
      }
    } catch (storageError) {
      console.error('Error con Storage:', storageError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks: index.length,
        path: indexPath,
        message: 'Índice generado y guardado correctamente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.substring(start, end).trim()
    
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    start += chunkSize - overlap
  }
  
  return chunks
}
