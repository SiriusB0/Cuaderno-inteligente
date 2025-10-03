// API endpoint para gestión de materias (subjects)
// GET /api/subjects - Listar todas
// POST /api/subjects - Crear nueva
// PUT /api/subjects - Actualizar
// DELETE /api/subjects - Eliminar

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        // GET - Listar todas las materias
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, subjects: data || [] });
        }

        // POST - Crear nueva materia
        if (req.method === 'POST') {
            const { id, name, description, color, period } = req.body;

            if (!id || !name) {
                return sendError(res, 400, 'id y name son requeridos');
            }

            const { data, error } = await supabase
                .from('subjects')
                .insert({
                    id,
                    name,
                    description: description || '',
                    color: color || '#6366f1',
                    period: period || 'Sin período',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return sendResponse(res, 201, { success: true, subject: data });
        }

        // PUT - Actualizar materia
        if (req.method === 'PUT') {
            const { id, name, description, color, period, lastAccessed } = req.body;

            if (!id) {
                return sendError(res, 400, 'id es requerido');
            }

            const updates = {
                updated_at: new Date().toISOString()
            };
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (color) updates.color = color;
            if (period) updates.period = period;
            if (lastAccessed) updates.last_accessed = lastAccessed;

            const { data, error } = await supabase
                .from('subjects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return sendResponse(res, 200, { success: true, subject: data });
        }

        // DELETE - Eliminar materia
        if (req.method === 'DELETE') {
            const { id } = req.body;

            if (!id) {
                return sendError(res, 400, 'id es requerido');
            }

            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return sendResponse(res, 200, { success: true, message: 'Materia eliminada' });
        }

        return sendError(res, 405, 'Método no permitido');

    } catch (error) {
        console.error('Error en subjects:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
