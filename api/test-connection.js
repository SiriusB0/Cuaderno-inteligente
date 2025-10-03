// Endpoint de prueba para verificar que Supabase funciona
// GET /api/test-connection

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    try {
        const supabase = getSupabaseAdmin();
        
        // Test 1: Crear subject de prueba
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .upsert({
                id: 'subj_test_auto',
                name: 'Materia de Prueba Automática',
                description: 'Creada por test-connection',
                color: '#10b981'
            })
            .select()
            .single();

        if (subjectError) throw new Error(`Error creando subject: ${subjectError.message}`);

        // Test 2: Crear topic de prueba
        const { data: topic, error: topicError } = await supabase
            .from('topics')
            .upsert({
                id: 'topic_test_auto',
                subject_id: 'subj_test_auto',
                name: 'Tema de Prueba Automática',
                description: 'Creado por test-connection'
            })
            .select()
            .single();

        if (topicError) throw new Error(`Error creando topic: ${topicError.message}`);

        // Test 3: Crear página de prueba
        const { data: page, error: pageError } = await supabase
            .from('pages')
            .insert({
                topic_id: 'topic_test_auto',
                content: '<h1>🎉 ¡Conexión Exitosa!</h1><p>Supabase está funcionando correctamente con Vercel Functions.</p>',
                title: 'Prueba Automática',
                type: 'text'
            })
            .select()
            .single();

        if (pageError) throw new Error(`Error creando page: ${pageError.message}`);

        // Test 4: Leer la página
        const { data: pages, error: readError } = await supabase
            .from('pages')
            .select('*')
            .eq('topic_id', 'topic_test_auto');

        if (readError) throw new Error(`Error leyendo pages: ${readError.message}`);

        // Todo funcionó
        return sendResponse(res, 200, {
            success: true,
            message: '✅ ¡Supabase funciona perfectamente!',
            tests: {
                '1_subject_created': subject,
                '2_topic_created': topic,
                '3_page_created': page,
                '4_pages_read': pages
            },
            instructions: 'Ve a Supabase → Table Editor para ver los datos de prueba. Puedes eliminarlos si quieres.'
        });

    } catch (error) {
        console.error('Error en test-connection:', error);
        return sendError(res, 500, 'Error en la prueba de conexión', error.message);
    }
}
