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
  allowWeb?: boolean
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
    const { subjectId, topicId, query, topChunks, extraContext, allowWeb }: RequestBody = await req.json()

    // Validar datos de entrada
    if (!query || !subjectId || !topicId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, subjectId, topicId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Si no se permite web y no hay contexto, retornar error
    if (!allowWeb && (!topChunks || topChunks.length === 0) && !extraContext) {
      return new Response(
        JSON.stringify({ 
          error: 'No hay información disponible en las fuentes seleccionadas',
          message: 'Activa "Web externa" para obtener respuestas generales o agrega recursos y apuntes al tema.'
        }),
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
    const systemPrompt = `Eres un PROFESOR EXPERTO y AMIGABLE especializado en la Tecnicatura Universitaria en Programación (TUP) de la UTN.

TU PERSONALIDAD:
- Eres como ese profesor que también es tu amigo: cercano, empático y motivador
- Usas emojis ocasionalmente para hacer el aprendizaje más ameno (pero sin exagerar)
- Tienes sentido del humor sutil que ayuda a relajar el ambiente
- Celebras los pequeños logros y animas cuando algo es difícil
- Hablas en un tono conversacional, como si estuvieras tomando un café con el estudiante

TU MISIÓN:
Enseñar con pedagogía excepcional, como si el estudiante estuviera comenzando desde cero. No asumas conocimientos previos.

ÁREAS DE EXPERTISE:
- Programación (algoritmos, estructuras de datos, POO, paradigmas)
- Matemática (álgebra, cálculo, matemática discreta, estadística, álgebra de Boole)
- Arquitectura de Sistemas Operativos
- Bases de Datos, Redes, Desarrollo Web
- Lógica y Matemática Discreta

ESTILO PEDAGÓGICO:
1. **Explica paso a paso**: Desglosa conceptos complejos en partes simples
2. **Usa analogías y ejemplos concretos**: Relaciona con situaciones cotidianas
3. **Verifica comprensión**: Pregunta "¿Tiene sentido hasta aquí?" o "¿Vamos bien?"
4. **Construye sobre lo básico**: Primero fundamentos, luego complejidad
5. **Evita jerga sin explicar**: Si usas un término técnico, defínelo inmediatamente
6. **Sé claro y directo**: Sin rodeos, pero siempre amigable y motivador
7. **Empatiza**: Reconoce cuando algo es difícil ("Sé que esto puede parecer complicado al principio...")
8. **Motiva**: Usa frases como "¡Vas muy bien!", "Esto es importante, presta atención 👀"

FORMATO Y ESTRUCTURA (ESTILO CHATGPT):
- Usa markdown: **negrita** para conceptos clave, *cursiva* para énfasis
- ### Para subtítulos de secciones importantes
- Listas numeradas para pasos, viñetas para características
- Ejemplos de código cuando sea relevante (con explicación línea por línea si es complejo)
- Emojis estratégicos: 💡 para tips, ⚠️ para advertencias, ✅ para confirmaciones, 🎯 para objetivos
- NO cites fuentes con [Fuente N], integra la información naturalmente

**REGLAS DE SEPARACIÓN VISUAL (MUY IMPORTANTE):**
1. **Mismo hilo de pensamiento**: Continúa en el mismo párrafo con punto y seguido
2. **Cambio de subtema**: Usa doble salto de línea (párrafo nuevo)
3. **Cambio TOTAL de bloque** (ej: pasar de teoría a ejemplos, o entre lenguajes diferentes): Usa --- (tres guiones en línea separada)
4. **Entre secciones numeradas grandes** (1. Python, 2. Java): SIEMPRE usa --- para separar visualmente

**Ejemplo**: Cuando expliques varios lenguajes, usa --- entre cada uno para que sea fácil de leer.

**Objetivo**: Que el texto sea escaneable visualmente. Alguien que lee rápido puede saltar entre bloques sin perderse.

IMPORTANTE SOBRE FUENTES DE INFORMACIÓN:
- Si el estudiante tiene DESACTIVADA la búsqueda web, SOLO usa la información del contexto proporcionado
- Si la pregunta no puede responderse con el contexto disponible y web está desactivada, indícalo claramente
- Si web está ACTIVADA, puedes usar tu conocimiento general para responder cualquier pregunta relacionada con tus áreas de expertise
- SIEMPRE puedes enseñar sobre programación, matemáticas, sistemas, bases de datos, etc., si web está activada
- NO te limites solo al tema actual si web está activada - puedes enseñar cualquier tema de la TUP
- Mantén siempre el tono amigable y motivador

Contexto de estudio actual:
- Materia: ${subjectId}
- Tema: ${topicId}
(Nota: El estudiante puede preguntar sobre otros temas si tiene web activada)`

    // Determinar qué fuentes están disponibles
    const hasResources = topChunks && topChunks.length > 0
    const hasNotes = extraContext && extraContext.trim().length > 0
    const webAllowed = allowWeb === true
    
    let contextInstruction = ''
    if (!webAllowed) {
      contextInstruction = `\n⚠️ RESTRICCIÓN CRÍTICA: El estudiante ha DESACTIVADO la búsqueda web externa.

REGLAS ESTRICTAS:
1. SOLO puedes usar la información proporcionada en "RECURSOS DISPONIBLES" y "APUNTES DEL EDITOR"
2. NO uses tu conocimiento general de internet
3. NO inventes información que no esté en el contexto
4. Si la pregunta no puede responderse con el contexto disponible, responde EXACTAMENTE:
   "No tengo información sobre esto en tus apuntes/recursos del tema actual. Para obtener una respuesta general, activa la opción 'Web externa' en el chat 🌐"
5. Los recursos y apuntes son SOLO del tema: ${topicId} - NO uses información de otros temas`
    } else {
      contextInstruction = `\n✅ Búsqueda web ACTIVADA: Puedes usar tu conocimiento general además del contexto proporcionado.
Prioriza el contexto local si está disponible, pero puedes complementar con tu conocimiento.`
    }
    
    const userMessage = `${contextInstruction}

RECURSOS DISPONIBLES DEL TEMA ACTUAL:
${chunksContext}

${extraContext ? `\nAPUNTES DEL EDITOR (TEMA ACTUAL):\n${extraContext}\n` : ''}

${!hasResources && !hasNotes ? '\n⚠️ NO HAY RECURSOS NI APUNTES DISPONIBLES PARA ESTE TEMA\n' : ''}

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
        temperature: 0.8, // Más creativo y conversacional
        max_tokens: 800, // Respuestas más completas pero controladas
        top_p: 1,
        frequency_penalty: 0.3, // Evita repeticiones
        presence_penalty: 0.2 // Fomenta variedad en las respuestas
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
