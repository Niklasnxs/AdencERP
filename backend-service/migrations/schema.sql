-- AdencERP Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
    address TEXT,
    birthday DATE,
    employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'internship', 'minijob')),
    email_access TEXT,
    email_login TEXT,
    email_password TEXT,
    mattermost_url TEXT,
    zoom_link TEXT,
    stundenliste_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_access TEXT,
ADD COLUMN IF NOT EXISTS email_login TEXT,
ADD COLUMN IF NOT EXISTS email_password TEXT,
ADD COLUMN IF NOT EXISTS mattermost_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS stundenliste_link TEXT;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project assignments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Offen', 'In Bearbeitung', 'Erledigt')),
    attachments TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure new column exists on existing installations
ALTER TABLE time_logs
ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Kunde';

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Krank', 'Krankheit', 'Krank und unentschuldigt', 'Urlaub', 'Schule', 'Termin', 'Anwesenheit Homeoffice', 'Homeoffice', 'Arbeitsende', 'Sonstiges', 'Unentschuldigt')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

ALTER TABLE absences DROP CONSTRAINT IF EXISTS absences_type_check;
ALTER TABLE absences
ADD CONSTRAINT absences_type_check
CHECK (type IN ('Krank', 'Krankheit', 'Krank und unentschuldigt', 'Urlaub', 'Schule', 'Termin', 'Anwesenheit Homeoffice', 'Homeoffice', 'Arbeitsende', 'Sonstiges', 'Unentschuldigt'));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_logs_project ON time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_absences_user_date ON absences(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Dokument-Uploads (für Bildungsträger, Urlaub, Krankheit etc.)
CREATE TABLE IF NOT EXISTS document_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    file_data BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_uploads_user ON document_uploads(user_id);

-- Interner Briefkasten
CREATE TABLE IF NOT EXISTS suggestion_box_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    category VARCHAR(100),
    image_filename VARCHAR(255),
    image_mime_type VARCHAR(100),
    image_size INTEGER,
    image_data BYTEA,
    status VARCHAR(30) NOT NULL DEFAULT 'Neu' CHECK (status IN ('Neu', 'In Bearbeitung', 'Erledigt')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestion_box_status ON suggestion_box_entries(status);
CREATE INDEX IF NOT EXISTS idx_suggestion_box_user ON suggestion_box_entries(user_id);

-- Onboarding-Checkliste pro Nutzer
CREATE TABLE IF NOT EXISTS onboarding_checklist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_key VARCHAR(100) NOT NULL,
    item_label TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_user ON onboarding_checklist(user_id);

-- Einmalige Einwilligung Regelwerk
CREATE TABLE IF NOT EXISTS rules_acceptances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: Adence#123)
INSERT INTO users (email, password, full_name, role) 
VALUES ('niklas.schindhelm@adence.de', '$2b$10$cmhKIeDmeHMzfld563gqkOYXsJas8k8s.tVcV1aInyIYc3lu2j2US', 'Niklas Schindhelm', 'admin')
ON CONFLICT (email) DO NOTHING;
