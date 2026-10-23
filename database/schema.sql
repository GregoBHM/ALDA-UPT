-- ENUMS para Roles de Usuario
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuración del Sistema (API Keys, Parámetros, Base de Conocimiento RAG)
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Laboratorios / Retos de Programación
-- Cada laboratorio es un reto independiente creado por un docente
CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',  -- easy, medium, hard
    chromadb_doc_id VARCHAR(255),
    is_exam BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Casos de Prueba para evaluar código automáticamente
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laboratory_id UUID REFERENCES laboratories(id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    evaluation_type VARCHAR(20) DEFAULT 'exact',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historial de Intentos de Código (Interacciones con el Tutor Socrático)
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    laboratory_id UUID REFERENCES laboratories(id) ON DELETE CASCADE,
    code_snapshot TEXT NOT NULL,
    student_intention TEXT,
    ai_feedback TEXT,
    attempt_number INTEGER DEFAULT 1,
    ai_rating INTEGER,
    ai_rating_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuraciones iniciales por defecto (vacías o predeterminadas)
INSERT INTO system_settings (key, value) VALUES 
('GEMINI_API_KEY', ''),
('OPENAI_API_KEY', ''),
('ACTIVE_MODEL', 'gemini-2.5-flash')
ON CONFLICT (key) DO NOTHING;

-- Tabla de Lista Blanca de Correos (Accesos Especiales)
CREATE TABLE allowed_emails (
    email VARCHAR(255) PRIMARY KEY,
    note TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Anuncios (Mensajes de los docentes)
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
