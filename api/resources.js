// API endpoint para gestión de recursos (archivos adjuntos)
// GET /api/resources?subjectId=X - Listar recursos de una materia
// POST /api/resources - Crear recurso
// DELETE /api/resources - Eliminar recurso

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        if (req.method === 'GET') {
            const { subjectId } = req.query;
            if (!subjectId) return sendError(res, 400, 'subjectId es requerido');

            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('subject_id', subjectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, resources: data || [] });
        }

        if (req.method === 'POST') {
            const { id, subjectId, name, fileData, fileType, fileSize } = req.body;
            if (!id || !subjectId || !name) {
                return sendError(res, 400, 'id, subjectId y name son requeridos');
            }

            const { data, error } = await supabase
                .from('resources')
                .insert({
                    id,
                    subject_id: subjectId,
                    name,
                    file_data: fileData || '',
                    file_type: fileType || 'application/octet-stream',
                    file_size: fileSize || 0,
                    created_at: new Date().toISOString()
                })
                .select().single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, resource: data });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const { error } = await supabase.from('resources').delete().eq('id', id);
            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Recurso eliminado' });
        }

        return sendError(res, 405, 'Método no permitido');
    } catch (error) {
        console.error('Error en resources:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
