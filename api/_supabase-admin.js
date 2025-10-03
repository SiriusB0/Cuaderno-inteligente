// Utilidad para crear cliente Supabase con privilegios de admin
// Este archivo solo se ejecuta en el servidor (Vercel Functions)
// NUNCA expongas la service role key en el frontend

import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

/**
 * Crea y retorna un cliente Supabase con privilegios de administrador
 * Usa las variables de entorno para mantener las credenciales seguras
 */
export function getSupabaseAdmin() {
    if (supabaseAdmin) {
        return supabaseAdmin;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error(
            'Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas en Vercel'
        );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return supabaseAdmin;
}

/**
 * Utilidad para manejar respuestas consistentes
 */
export function sendResponse(res, statusCode, data) {
    return res.status(statusCode).json(data);
}

/**
 * Utilidad para manejar errores
 */
export function sendError(res, statusCode, message, details = null) {
    return res.status(statusCode).json({
        error: message,
        details
    });
}
