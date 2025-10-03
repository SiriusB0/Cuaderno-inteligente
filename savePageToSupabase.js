// Función auxiliar para guardar páginas en Supabase de forma segura
// Usa Vercel Functions para proteger la service role key
async function savePageToSupabase(page) {
    if (!page || !page.topic_id) {
        console.error('Datos de página inválidos:', page);
        return null;
    }
    
    try {
        // Llamar a la API serverless en lugar de Supabase directamente
        const response = await fetch('/api/save-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topicId: page.topic_id,
                pageId: page.id, // Opcional, si existe es update
                content: page.content || '',
                title: page.title || 'Sin título',
                type: page.type || 'text'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error guardando página');
        }

        const result = await response.json();
        console.log('Página guardada exitosamente:', result.page);
        return result.page;
    } catch (error) {
        console.error('Error guardando página en Supabase:', error);
        return null;
    }
}

// Función auxiliar para listar páginas de un tema
async function listPagesFromSupabase(topicId) {
    if (!topicId) {
        console.error('topicId es requerido');
        return [];
    }
    
    try {
        const response = await fetch(`/api/list-pages?topicId=${topicId}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error obteniendo páginas');
        }

        const result = await response.json();
        return result.pages || [];
    } catch (error) {
        console.error('Error obteniendo páginas de Supabase:', error);
        return [];
    }
}

// Función auxiliar para eliminar una página
async function deletePageFromSupabase(pageId) {
    if (!pageId) {
        console.error('pageId es requerido');
        return false;
    }
    
    try {
        const response = await fetch('/api/delete-page', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pageId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error eliminando página');
        }

        const result = await response.json();
        console.log('Página eliminada exitosamente');
        return true;
    } catch (error) {
        console.error('Error eliminando página de Supabase:', error);
        return false;
    }
}