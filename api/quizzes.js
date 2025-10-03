// API endpoint para gestión de quizzes
// GET /api/quizzes?topicId=X - Listar colecciones de un tema
// POST /api/quizzes - Crear colección
// PUT /api/quizzes - Actualizar colección (preguntas, pin, etc.)
// DELETE /api/quizzes - Eliminar colección

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        if (req.method === 'GET') {
            const { topicId } = req.query;
            if (!topicId) return sendError(res, 400, 'topicId es requerido');

            const { data, error } = await supabase
                .from('quiz_collections')
                .select('*')
                .eq('topic_id', topicId)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, collections: data || [] });
        }

        if (req.method === 'POST') {
            const { id, topicId, name, description, questions } = req.body;
            if (!id || !topicId || !name) {
                return sendError(res, 400, 'id, topicId y name son requeridos');
            }

            const { data, error } = await supabase
                .from('quiz_collections')
                .insert({
                    id,
                    topic_id: topicId,
                    name,
                    description: description || '',
                    questions: questions || [],
                    is_pinned: false,
                    created_at: new Date().toISOString()
                })
                .select().single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, collection: data });
        }

        if (req.method === 'PUT') {
            const { id, name, description, questions, isPinned } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const updates = { updated_at: new Date().toISOString() };
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (questions !== undefined) updates.questions = questions;
            if (isPinned !== undefined) updates.is_pinned = isPinned;

            const { data, error } = await supabase
                .from('quiz_collections')
                .update(updates)
                .eq('id', id)
                .select().single();

            if (error) throw error;
            return sendResponse(res, 200, { success: true, collection: data });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const { error } = await supabase.from('quiz_collections').delete().eq('id', id);
            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Colección eliminada' });
        }

        return sendError(res, 405, 'Método no permitido');
    } catch (error) {
        console.error('Error en quizzes:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
