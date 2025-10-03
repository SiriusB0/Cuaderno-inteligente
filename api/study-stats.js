// API endpoint para gestión de estadísticas de estudio
// GET /api/study-stats?subjectId=X&date=Y - Obtener stats de una materia en una fecha
// POST /api/study-stats - Crear/actualizar estadísticas

import { getSupabaseAdmin, sendResponse, sendError } from './_supabase-admin.js';

export default async function handler(req, res) {
    const supabase = getSupabaseAdmin();

    try {
        if (req.method === 'GET') {
            const { subjectId, startDate, endDate } = req.query;
            if (!subjectId) return sendError(res, 400, 'subjectId es requerido');

            let query = supabase
                .from('study_stats')
                .select('*')
                .eq('subject_id', subjectId);

            if (startDate) query = query.gte('study_date', startDate);
            if (endDate) query = query.lte('study_date', endDate);

            const { data, error } = await query.order('study_date', { ascending: false });

            if (error) throw error;
            return sendResponse(res, 200, { success: true, stats: data || [] });
        }

        if (req.method === 'POST') {
            const { subjectId, studyDate, minutesStudied } = req.body;
            if (!subjectId || !studyDate || minutesStudied === undefined) {
                return sendError(res, 400, 'subjectId, studyDate y minutesStudied son requeridos');
            }

            // Upsert: si existe la combinación subject+date, suma los minutos
            const { data: existing } = await supabase
                .from('study_stats')
                .select('*')
                .eq('subject_id', subjectId)
                .eq('study_date', studyDate)
                .single();

            if (existing) {
                // Actualizar sumando minutos
                const { data, error } = await supabase
                    .from('study_stats')
                    .update({
                        minutes_studied: existing.minutes_studied + minutesStudied
                    })
                    .eq('id', existing.id)
                    .select().single();

                if (error) throw error;
                return sendResponse(res, 200, { success: true, stat: data });
            } else {
                // Crear nuevo
                const { data, error } = await supabase
                    .from('study_stats')
                    .insert({
                        subject_id: subjectId,
                        study_date: studyDate,
                        minutes_studied: minutesStudied,
                        created_at: new Date().toISOString()
                    })
                    .select().single();

                if (error) throw error;
                return sendResponse(res, 201, { success: true, stat: data });
            }
        }

        return sendError(res, 405, 'Método no permitido');
    } catch (error) {
        console.error('Error en study-stats:', error);
        return sendError(res, 500, 'Error interno del servidor', error.message);
    }
}
