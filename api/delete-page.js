// API endpoint para eliminar una página
// DELETE /api/delete-page
// Body: { pageId }

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    // Solo permitir DELETE
    if (req.method !== 'DELETE') {
        return sendError(res, 405, 'Método no permitido');
    }

    try {
        const { pageId } = req.body;

        // Validar datos requeridos
        if (!pageId) {
            return sendError(res, 400, 'pageId es requerido');
        }

        const supabase = getSupabaseAdmin();

        // Eliminar página
        const { error } = await supabase
            .from('pages')
            .delete()
            .eq('id', pageId);

        if (error) {
            console.error('Error de Supabase:', error);
            return sendError(res, 500, 'Error eliminando página de Supabase', error.message);
        }

        return sendResponse(res, 200, {
            success: true,
            message: 'Página eliminada correctamente'
        });

    } catch (error) {
        console.error('Error en delete-page:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
