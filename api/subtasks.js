// API endpoint para gestión de subtareas
// GET /api/subtasks?topicId=X - Listar subtareas de un tema
// POST /api/subtasks - Crear subtarea
// PUT /api/subtasks - Actualizar subtarea (toggle completed)
// DELETE /api/subtasks - Eliminar subtarea

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        if (req.method === 'GET') {
            const { topicId } = req.query;
            if (!topicId) return sendError(res, 400, 'topicId es requerido');

            const { data, error } = await supabase
                .from('subtasks')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, subtasks: data || [] });
        }

        if (req.method === 'POST') {
            const { id, topicId, name, completed } = req.body;
            if (!id || !topicId || !name) {
                return sendError(res, 400, 'id, topicId y name son requeridos');
            }

            const { data, error } = await supabase
                .from('subtasks')
                .insert({
                    id,
                    topic_id: topicId,
                    name,
                    completed: completed || false,
                    created_at: new Date().toISOString()
                })
                .select().single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, subtask: data });
        }

        if (req.method === 'PUT') {
            const { id, name, completed } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (completed !== undefined) updates.completed = completed;

            const { data, error } = await supabase
                .from('subtasks')
                .update(updates)
                .eq('id', id)
                .select().single();

            if (error) throw error;
            return sendResponse(res, 200, { success: true, subtask: data });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const { error } = await supabase.from('subtasks').delete().eq('id', id);
            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Subtarea eliminada' });
        }

        return sendError(res, 405, 'Método no permitido');
    } catch (error) {
        console.error('Error en subtasks:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
