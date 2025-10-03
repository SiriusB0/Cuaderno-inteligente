// Configuración de Supabase
// INSTRUCCIONES PARA CONFIGURAR SUPABASE:
// 
// 1. Ve a https://supabase.com y crea una cuenta gratuita
// 2. Crea un nuevo proyecto
// 3. Ve a Settings > API en tu dashboard de Supabase
// 4. Copia la URL del proyecto y la clave anónima (anon key)
// 5. Reemplaza los valores de ejemplo a continuación con tus credenciales reales
// 6. Ejecuta el siguiente SQL en el editor SQL de Supabase para crear las tablas necesarias:

/*
-- Crear tabla de materias
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de temas
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de páginas
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    content TEXT,
    tags TEXT[],
    page_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de recursos
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso público (puedes modificar esto según tus necesidades)
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all operations on topics" ON topics FOR ALL USING (true);
CREATE POLICY "Allow all operations on pages" ON pages FOR ALL USING (true);
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true);

-- Insertar datos de ejemplo
INSERT INTO subjects (name, image_url) VALUES 
('Cálculo I', 'https://placehold.co/600x400/6366f1/ffffff?text=Cálculo'),
('Programación Orientada a Objetos', 'https://placehold.co/600x400/ec4899/ffffff?text=POO'),
('Física de Ondas', 'https://placehold.co/600x400/22c55e/ffffff?text=Física');

INSERT INTO topics (subject_id, name, image_url) VALUES 
(1, 'Derivadas', 'https://placehold.co/600x400/818cf8/ffffff?text=f''(x)'),
(1, 'Integrales', 'https://placehold.co/600x400/a78bfa/ffffff?text=∫f(x)dx'),
(2, 'Pilares de POO', 'https://placehold.co/600x400/f472b6/ffffff?text=Herencia');

INSERT INTO pages (topic_id, content, tags, page_order) VALUES 
(1, '<h1>Concepto de la Derivada</h1><p>La derivada de una función matemática es la razón o velocidad de cambio de una función en un determinado punto.</p>', ARRAY['matemáticas', 'cálculo'], 0),
(1, '<h2>Reglas de Derivación</h2><ul><li>Regla de la potencia</li><li>Regla del producto</li></ul>', ARRAY['reglas', 'fórmulas'], 1),
(2, '<h1>Integrales Definidas</h1><p>Una integral definida es...</p>', ARRAY['integrales'], 0),
(3, '<h1>Encapsulamiento</h1><p>El encapsulamiento es...</p>', ARRAY['poo', 'conceptos'], 0);
*/

// CONFIGURACIÓN - Credenciales de Supabase
// IMPORTANTE: Solo usamos la anon key aquí (segura para el frontend)
// La service role key NUNCA debe estar en el frontend
export const SUPABASE_CONFIG = {
    // URL de tu proyecto de Supabase
    url: 'https://zsbbqvykdudzgjruqzyu.supabase.co',
    
    // Clave anónima de Supabase (segura para el frontend)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYmJxdnlrZHVkemdqcnVxenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTUzMTgsImV4cCI6MjA3NTAzMTMxOH0.T32vVA6oc6gZf6U4ekNPoFiKcu7Ea-STXH_95ISHTEE',
    
    // Configuración adicional (opcional)
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// Función para verificar si Supabase está configurado correctamente
export function isSupabaseConfigured() {
    return SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey &&
           SUPABASE_CONFIG.url.includes('supabase.co');
}

// Función para mostrar instrucciones de configuración
export function showConfigurationInstructions() {
    return `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 class="text-lg font-semibold text-yellow-800 mb-2">⚠️ Configuración de Supabase Requerida</h3>
            <p class="text-yellow-700 mb-3">Para usar la funcionalidad online, necesitas configurar Supabase:</p>
            <ol class="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                <li>Ve a <a href="https://supabase.com" target="_blank" class="underline">supabase.com</a> y crea una cuenta</li>
                <li>Crea un nuevo proyecto</li>
                <li>Ve a Settings > API y copia tus credenciales</li>
                <li>Edita el archivo <code>supabase-config.js</code> con tus credenciales</li>
                <li>Ejecuta el SQL proporcionado en el editor SQL de Supabase</li>
            </ol>
            <p class="text-xs text-yellow-600 mt-2">Mientras tanto, la aplicación funcionará con datos de ejemplo locales.</p>
        </div>
    `;
}

// Inicializar cliente de Supabase
export function createSupabaseClient() {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase no está configurado. Usando modo offline.');
        return null;
    }

    // Verificar que la librería de Supabase esté cargada
    if (typeof window.supabase === 'undefined') {
        console.error('La librería de Supabase no está cargada. Agrega el script en index.html');
        return null;
    }

    try {
        const client = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            SUPABASE_CONFIG.options
        );
        return client;
    } catch (error) {
        console.error('Error al crear cliente de Supabase:', error);
        return null;
    }
}