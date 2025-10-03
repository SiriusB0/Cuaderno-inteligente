// Supabase Edge Function: index-resources
// Procesa PDFs de un tema y genera índice JSON automáticamente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  subjectId: string
  topicId: string
  subjectName: string
  topicName: string
  resourceUrls: string[] // URLs de PDFs en Supabase Storage
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subjectId, topicId, subjectName, topicName, resourceUrls }: RequestBody = await req.json()

    // Validar
    if (!subjectName || !topicName || !resourceUrls || resourceUrls.length === 0) {
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

    // Procesar cada PDF
    for (let i = 0; i < resourceUrls.length; i++) {
      const url = resourceUrls[i]
      
      // Solo procesar PDFs y TXTs
      if (!url.endsWith('.pdf') && !url.endsWith('.txt')) {
        continue
      }

      try {
        // Descargar archivo
        const fileResponse = await fetch(url)
        if (!fileResponse.ok) continue

        const fileBuffer = await fileResponse.arrayBuffer()
        const fileName = url.split('/').pop() || `resource-${i}`

        // Extraer texto (simplificado - solo para TXT por ahora)
        let text = ''
        if (url.endsWith('.txt')) {
          text = new TextDecoder().decode(fileBuffer)
        } else if (url.endsWith('.pdf')) {
          // Para PDFs, necesitaríamos una librería de parsing
          // Por ahora, saltamos PDFs y solo procesamos TXT
          // En producción, usar pdf-parse o similar
          continue
        }

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
            sourceUrl: url,
            ord: chunks.length
          })
        }
      } catch (error) {
        console.error('Error processing file:', url, error)
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

    // Aquí normalmente guardarías el índice en Storage de Supabase
    // Por simplicidad, lo devolvemos al cliente para que lo guarde
    // En producción, guardar en: /indices/${subjectSlug}/${topicSlug}.json

    return new Response(
      JSON.stringify({
        success: true,
        chunks: index.length,
        index,
        path: `indices/${subjectSlug}/${topicSlug}.json`
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
