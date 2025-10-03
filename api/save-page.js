// API endpoint para guardar/actualizar páginas de forma segura
// POST /api/save-page
// Body: { topicId, pageId?, content, title?, type? }

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return sendError(res, 405, 'Método no permitido');
    }

    try {
        const { topicId, pageId, content, title, type } = req.body;

        // Validar datos requeridos
        if (!topicId) {
            return sendError(res, 400, 'topicId es requerido');
        }

        if (!content && content !== '') {
            return sendError(res, 400, 'content es requerido');
        }

        const supabase = getSupabaseAdmin();

        // Preparar datos para upsert
        const pageData = {
            topic_id: topicId,
            content: content,
            title: title || 'Sin título',
            type: type || 'text',
            updated_at: new Date().toISOString()
        };

        // Si hay pageId, es una actualización
        if (pageId) {
            pageData.id = pageId;
        } else {
            // Es una nueva página
            pageData.created_at = new Date().toISOString();
        }

        // Upsert en Supabase
        const { data, error } = await supabase
            .from('pages')
            .upsert(pageData)
            .select()
            .single();

        if (error) {
            console.error('Error de Supabase:', error);
            return sendError(res, 500, 'Error guardando página en Supabase', error.message);
        }

        return sendResponse(res, 200, {
            success: true,
            page: data
        });

    } catch (error) {
        console.error('Error en save-page:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
