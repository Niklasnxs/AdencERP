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
    mattermost_url TEXT,
    zoom_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_access TEXT,
ADD COLUMN IF NOT EXISTS mattermost_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT;

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
    type VARCHAR(50) NOT NULL CHECK (type IN ('Krankheit', 'Urlaub', 'Schule', 'Termin', 'Sonstiges', 'Homeoffice', 'Unentschuldigt')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

ALTER TABLE absences DROP CONSTRAINT IF EXISTS absences_type_check;
ALTER TABLE absences
ADD CONSTRAINT absences_type_check
CHECK (type IN ('Krankheit', 'Urlaub', 'Schule', 'Termin', 'Sonstiges', 'Homeoffice', 'Unentschuldigt'));

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

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, full_name, role) 
VALUES ('admin@adenc.de', '$2b$10$4hBu7tQKsXoFiAqxfra5.ur8W1TNndCi/fE9tkdDByJoVDtIwVyV6', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default employees (password: emp123)
INSERT INTO users (email, password, full_name, role) 
VALUES 
    ('max.mueller@adenc.de', '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG', 'Max Müller', 'employee'),
    ('anna.schmidt@adenc.de', '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG', 'Anna Schmidt', 'employee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, full_name, role, address, birthday, employment_type, email_access, mattermost_url, zoom_link)
VALUES
    ('lena.hartmann@adenc.de', '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG', 'Lena Hartmann', 'employee', 'Elbchaussee 98, 22763 Hamburg', '1994-11-03', 'full_time', 'lena.hartmann@adenc.de', 'https://mattermost.adenc.de/team/lena', 'https://zoom.us/j/88300033333'),
    ('jannik.weber@adenc.de', '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG', 'Jannik Weber', 'employee', 'Fischertwiete 2, 20095 Hamburg', '1988-01-29', 'full_time', 'jannik.weber@adenc.de', 'https://mattermost.adenc.de/team/jannik', 'https://zoom.us/j/88300044444')
ON CONFLICT (email) DO NOTHING;

WITH project_seed AS (
    SELECT 'Nordlicht Digital Relaunch'::text AS name
    UNION ALL SELECT 'AI Campaign Optimizer'
    UNION ALL SELECT 'Influencer Analytics Hub'
),
insert_projects AS (
    INSERT INTO projects (name, is_active)
    SELECT ps.name, true
    FROM project_seed ps
    WHERE NOT EXISTS (
        SELECT 1 FROM projects p WHERE p.name = ps.name
    )
    RETURNING id, name
),
projects_all AS (
    SELECT id, name FROM insert_projects
    UNION ALL
    SELECT id, name FROM projects
    WHERE name IN ('Nordlicht Digital Relaunch', 'AI Campaign Optimizer', 'Influencer Analytics Hub')
),
task_seed AS (
    SELECT 'Branding-Workshop vorbereiten'::text AS title,
           'Agenda, Fragenkatalog und Moodboards für den Kickoff erstellen.'::text AS description
    UNION ALL SELECT 'Landingpage Wireframes', 'Low-Fidelity Wireframes für die Hauptseiten erstellen.'
    UNION ALL SELECT 'SEO Content Plan', 'Keyword-Recherche und Inhaltsstruktur planen.'
    UNION ALL SELECT 'Tracking Setup', 'GTM Container und Events für Marketingkampagnen definieren.'
    UNION ALL SELECT 'Launch-Checklist', 'Quality Gate und Deployment-Checkliste erstellen.'
)
INSERT INTO tasks (project_id, assigned_to_user_id, title, description, status, attachments)
SELECT p.id, NULL, t.title, t.description, 'Offen', NULL
FROM projects_all p
CROSS JOIN task_seed t
WHERE NOT EXISTS (
    SELECT 1 FROM tasks existing
    WHERE existing.project_id = p.id
      AND existing.title = t.title
);

WITH target_projects AS (
    SELECT
        (SELECT id FROM projects WHERE name = 'Nordlicht Digital Relaunch' LIMIT 1) AS p1,
        (SELECT id FROM projects WHERE name = 'AI Campaign Optimizer' LIMIT 1) AS p2
),
date_series AS (
    SELECT generate_series('2026-01-01'::date, '2026-01-31'::date, interval '1 day')::date AS work_date
),
user_seed AS (
    SELECT id, email FROM users
    WHERE email IN ('lena.hartmann@adenc.de', 'jannik.weber@adenc.de')
),
time_seed AS (
    SELECT
        u.id AS user_id,
        d.work_date AS date,
        CASE WHEN EXTRACT(DAY FROM d.work_date)::int % 2 = 1 THEN tp.p1 ELSE tp.p2 END AS project_id,
        CASE WHEN u.email = 'lena.hartmann@adenc.de' THEN 6.5 ELSE 7.5 END AS hours,
        CASE WHEN u.email = 'lena.hartmann@adenc.de' THEN 'Content- und Design-Sprints' ELSE 'Analyse und KPI-Review' END AS notes
    FROM user_seed u
    CROSS JOIN date_series d
    CROSS JOIN target_projects tp
)
INSERT INTO time_logs (user_id, project_id, task_id, customer_name, date, hours, notes)
SELECT ts.user_id, ts.project_id, NULL, 'Seed-Kunde', ts.date, ts.hours, ts.notes
FROM time_seed ts
WHERE ts.project_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM time_logs tl
      WHERE tl.user_id = ts.user_id
        AND tl.date = ts.date
  );
