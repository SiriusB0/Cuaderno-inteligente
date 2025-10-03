// API endpoint para gestión de eventos/entregas
// GET /api/events?subjectId=X - Listar eventos de una materia
// POST /api/events - Crear evento
// PUT /api/events - Actualizar evento
// DELETE /api/events - Eliminar evento

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        if (req.method === 'GET') {
            const { subjectId } = req.query;
            if (!subjectId) return sendError(res, 400, 'subjectId es requerido');

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('subject_id', subjectId)
                .order('date', { ascending: true });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, events: data || [] });
        }

        if (req.method === 'POST') {
            const { id, subjectId, title, description, date, type, completed } = req.body;
            if (!id || !subjectId || !title || !date) {
                return sendError(res, 400, 'id, subjectId, title y date son requeridos');
            }

            const { data, error } = await supabase
                .from('events')
                .insert({
                    id, subject_id: subjectId, title,
                    description: description || '',
                    date, type: type || 'general',
                    completed: completed || false,
                    created_at: new Date().toISOString()
                })
                .select().single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, event: data });
        }

        if (req.method === 'PUT') {
            const { id, title, description, date, type, completed } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const updates = {};
            if (title) updates.title = title;
            if (description !== undefined) updates.description = description;
            if (date) updates.date = date;
            if (type) updates.type = type;
            if (completed !== undefined) updates.completed = completed;

            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select().single();

            if (error) throw error;
            return sendResponse(res, 200, { success: true, event: data });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) return sendError(res, 400, 'id es requerido');

            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Evento eliminado' });
        }

        return sendError(res, 405, 'Método no permitido');
    } catch (error) {
        console.error('Error en events:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
