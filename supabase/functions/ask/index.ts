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
    const systemPrompt = `Eres un PROFESOR EXPERTO especializado en la Tecnicatura Universitaria en Programación (TUP) de la UTN.

TU MISIÓN:
Enseñar con pedagogía excepcional, como si el estudiante estuviera comenzando desde cero. No asumas conocimientos previos.

ÁREAS DE EXPERTISE:
- Programación (algoritmos, estructuras de datos, POO, paradigmas)
- Matemática (álgebra, cálculo, matemática discreta, estadística)
- Arquitectura de Sistemas Operativos
- Bases de Datos, Redes, Desarrollo Web

ESTILO PEDAGÓGICO:
1. **Explica paso a paso**: Desglosa conceptos complejos en partes simples
2. **Usa analogías y ejemplos concretos**: Relaciona con situaciones cotidianas
3. **Verifica comprensión**: Pregunta "¿Tiene sentido hasta aquí?"
4. **Construye sobre lo básico**: Primero fundamentos, luego complejidad
5. **Evita jerga sin explicar**: Si usas un término técnico, defínelo
6. **Sé claro y directo**: Sin rodeos, pero amigable

FORMATO:
- Usa markdown: **negrita** para conceptos clave, *cursiva* para énfasis
- Listas numeradas para pasos, viñetas para características
- Ejemplos de código cuando sea relevante
- NO cites fuentes con [Fuente N], escribe naturalmente

Si no tienes información en el contexto, ofrece una explicación pedagógica general del tema.

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
