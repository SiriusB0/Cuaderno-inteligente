-- =====================================================
-- SCHEMA COMPLETO PARA CUADERNO INTELIGENTE
-- Ejecuta este SQL en el SQL Editor de Supabase
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: subjects (Materias)
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    period VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLA: topics (Temas de una materia)
-- =====================================================
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: pages (Páginas de contenido de un tema)
-- =====================================================
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY DEFAULT 'page_' || floor(extract(epoch from now()) * 1000)::text,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content TEXT,
    title VARCHAR(500) DEFAULT 'Sin título',
    type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: subtasks (Subtareas de un tema)
-- =====================================================
CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: events (Eventos/entregas de una materia)
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: resources (Recursos adjuntos a una materia)
-- =====================================================
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_data TEXT, -- Base64 del archivo
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: study_stats (Estadísticas de estudio)
-- =====================================================
CREATE TABLE IF NOT EXISTS study_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    study_date DATE NOT NULL,
    minutes_studied INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, study_date)
);

-- =====================================================
-- ÍNDICES para mejorar performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_pages_topic ON pages(topic_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_topic ON subtasks(topic_id);
CREATE INDEX IF NOT EXISTS idx_events_subject ON events(subject_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_stats_subject ON study_stats(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_stats_date ON study_stats(study_date);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (Acceso público por ahora)
-- Puedes modificarlas según tus necesidades de seguridad
-- =====================================================

-- Políticas para subjects
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true);

-- Políticas para topics
CREATE POLICY "Allow all operations on topics" ON topics FOR ALL USING (true);

-- Políticas para pages
CREATE POLICY "Allow all operations on pages" ON pages FOR ALL USING (true);

-- Políticas para subtasks
CREATE POLICY "Allow all operations on subtasks" ON subtasks FOR ALL USING (true);

-- Políticas para events
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);

-- Políticas para resources
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true);

-- Políticas para study_stats
CREATE POLICY "Allow all operations on study_stats" ON study_stats FOR ALL USING (true);

-- =====================================================
-- DATOS DE EJEMPLO (Opcional)
-- Descomenta si quieres datos iniciales
-- =====================================================

/*
-- Insertar materias de ejemplo
INSERT INTO subjects (id, name, description, color, period) VALUES 
('subj_1', 'Cálculo I', 'Fundamentos de cálculo diferencial e integral', '#6366f1', 'Cuatrimestre 1 - 2025'),
('subj_2', 'Programación Orientada a Objetos', 'Conceptos de POO en profundidad', '#ec4899', 'Cuatrimestre 1 - 2025'),
('subj_3', 'Física de Ondas', 'Estudio de ondas mecánicas y electromagnéticas', '#22c55e', 'Cuatrimestre 1 - 2025');

-- Insertar temas de ejemplo
INSERT INTO topics (id, subject_id, name, description) VALUES 
('topic_1', 'subj_1', 'Derivadas', 'Concepto y aplicaciones de derivadas'),
('topic_2', 'subj_1', 'Integrales', 'Cálculo integral y sus aplicaciones'),
('topic_3', 'subj_2', 'Pilares de POO', 'Encapsulamiento, Herencia, Polimorfismo');

-- Insertar páginas de ejemplo
INSERT INTO pages (id, topic_id, content, title, type) VALUES 
('page_1', 'topic_1', '<h1>Concepto de la Derivada</h1><p>La derivada de una función matemática es la razón o velocidad de cambio de una función en un determinado punto.</p>', 'Introducción a Derivadas', 'text'),
('page_2', 'topic_1', '<h2>Reglas de Derivación</h2><ul><li>Regla de la potencia</li><li>Regla del producto</li><li>Regla del cociente</li></ul>', 'Reglas de Derivación', 'text');

-- Insertar subtareas de ejemplo
INSERT INTO subtasks (id, topic_id, name, completed) VALUES 
('subtask_1', 'topic_1', 'Estudiar concepto de límite', false),
('subtask_2', 'topic_1', 'Practicar regla de la cadena', false),
('subtask_3', 'topic_1', 'Resolver ejercicios del libro', false);

-- Insertar eventos de ejemplo
INSERT INTO events (id, subject_id, title, description, date, type, completed) VALUES 
('event_1', 'subj_1', 'Examen Final de Cálculo', 'Examen final que incluye derivadas e integrales', NOW() + INTERVAL '7 days', 'exam', false),
('event_2', 'subj_2', 'Entrega Proyecto POO', 'Sistema de gestión implementado en Java', NOW() + INTERVAL '14 days', 'assignment', false);
*/

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETADO
-- =====================================================
-- El schema está listo. Ahora puedes usar las API functions
-- para interactuar con estos datos de forma segura.
-- =====================================================
