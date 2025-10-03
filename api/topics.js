// API endpoint para gestión de temas (topics)
// GET /api/topics?subjectId=X - Listar temas de una materia
// POST /api/topics - Crear nuevo tema
// PUT /api/topics - Actualizar tema
// DELETE /api/topics - Eliminar tema

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        // GET - Listar temas de una materia
        if (req.method === 'GET') {
            const { subjectId } = req.query;

            if (!subjectId) {
                return sendError(res, 400, 'subjectId es requerido');
            }

            const { data, error } = await supabase
                .from('topics')
                .select('*')
                .eq('subject_id', subjectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, topics: data || [] });
        }

        // POST - Crear nuevo tema
        if (req.method === 'POST') {
            const { id, subjectId, name, description } = req.body;

            if (!id || !subjectId || !name) {
                return sendError(res, 400, 'id, subjectId y name son requeridos');
            }

            const { data, error } = await supabase
                .from('topics')
                .insert({
                    id,
                    subject_id: subjectId,
                    name,
                    description: description || '',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, topic: data });
        }

        // PUT - Actualizar tema
        if (req.method === 'PUT') {
            const { id, name, description } = req.body;

            if (!id) {
                return sendError(res, 400, 'id es requerido');
            }

            const updates = {
                updated_at: new Date().toISOString()
            };
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;

            const { data, error } = await supabase
                .from('topics')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return sendResponse(res, 200, { success: true, topic: data });
        }

        // DELETE - Eliminar tema
        if (req.method === 'DELETE') {
            const { id } = req.body;

            if (!id) {
                return sendError(res, 400, 'id es requerido');
            }

            const { error } = await supabase
                .from('topics')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Tema eliminado' });
        }

        return sendError(res, 405, 'Método no permitido');

    } catch (error) {
        console.error('Error en topics:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
