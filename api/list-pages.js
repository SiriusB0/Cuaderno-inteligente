// API endpoint para listar páginas de un tema
// GET /api/list-pages?topicId=topic_123

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    // Solo permitir GET
    if (req.method !== 'GET') {
        return sendError(res, 405, 'Método no permitido');
    }

    try {
        const { topicId } = req.query;

        // Validar datos requeridos
        if (!topicId) {
            return sendError(res, 400, 'topicId es requerido');
        }

        const supabase = getSupabaseAdmin();

        // Obtener páginas del tema
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error de Supabase:', error);
            return sendError(res, 500, 'Error obteniendo páginas de Supabase', error.message);
        }

        return sendResponse(res, 200, {
            success: true,
            pages: data || []
        });

    } catch (error) {
        console.error('Error en list-pages:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
