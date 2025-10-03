// Supabase Edge Function: ask
// Recibe query + chunks relevantes + contexto extra y consulta a GPT-4o-mini

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  subjectId: string
  topicId: string
  query: string
  topChunks: Array<{
    text: string
    source: string
    url?: string
  }>
  extraContext?: string
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subjectId, topicId, query, topChunks, extraContext }: RequestBody = await req.json()

    // Validar datos de entrada
    if (!query || !subjectId || !topicId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, subjectId, topicId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener API Key de OpenAI desde variables de entorno
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API Key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir contexto a partir de los chunks relevantes
    const chunksContext = topChunks && topChunks.length > 0
      ? topChunks.map((chunk, idx) => 
          `[Fuente ${idx + 1}: ${chunk.source}]\n${chunk.text}`
        ).join('\n\n')
      : 'No se encontraron recursos relevantes.'

    // Construir el prompt
    const systemPrompt = `Eres un asistente de estudio inteligente. Ayudas a estudiantes a comprender mejor sus materias.

IMPORTANTE:
- Responde de forma clara, concisa y educativa (máximo 200-250 palabras).
- Usa el contexto proporcionado de los recursos y apuntes del estudiante.
- NO cites fuentes en el texto. NO uses el formato [Fuente N].
- Escribe de forma natural y fluida, sin referencias entre corchetes.
- Si no tienes suficiente información en el contexto, di "No encuentro esa información en tus recursos" y ofrece una respuesta general breve.
- Usa markdown para formato: **negrita**, *cursiva*, listas, etc.

Contexto de estudio:
- Materia: ${subjectId}
- Tema: ${topicId}`

    const userMessage = `RECURSOS DISPONIBLES:
${chunksContext}

${extraContext ? `\nAPUNTES DEL EDITOR:\n${extraContext}\n` : ''}

PREGUNTA DEL ESTUDIANTE:
${query}`

    // Llamar a OpenAI API
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500, // Limitar para mantener costos bajos
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API Error:', errorData)
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error', 
          details: errorData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await openaiResponse.json()
    const answer = data.choices[0]?.message?.content || 'No se pudo generar una respuesta.'

    // Extraer las fuentes mencionadas en la respuesta
    const mentionedSources = topChunks
      .map((chunk, idx) => ({
        id: `source-${idx}`,
        name: chunk.source,
        snippet: chunk.text.substring(0, 150) + '...',
        url: chunk.url
      }))
      .filter((_, idx) => answer.includes(`[Fuente ${idx + 1}]`))

    // Respuesta final
    return new Response(
      JSON.stringify({
        answer,
        sources: mentionedSources,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
