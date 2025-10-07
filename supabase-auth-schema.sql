-- Tabla para almacenar las credenciales del usuario único
CREATE TABLE IF NOT EXISTS user_credentials (
    id INTEGER PRIMARY KEY DEFAULT 1,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_user CHECK (id = 1)
);

-- Habilitar RLS
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso público (ya que es un solo usuario)
CREATE POLICY "Allow all operations on user_credentials" 
ON user_credentials FOR ALL USING (true);

-- Insertar credenciales iniciales (usuario: admin, contraseña: admin123)
-- Hash SHA-256 de "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO user_credentials (id, username, password_hash) 
VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (id) DO NOTHING;
