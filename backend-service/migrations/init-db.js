const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create database file in the backend-service directory
const dbPath = path.join(__dirname, '..', process.env.DB_FILE || 'adencerp.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔧 Initializing SQLite database...');
console.log(`📁 Database location: ${dbPath}`);

// Create tables
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    address TEXT,
    birthday TEXT,
    employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'internship', 'minijob')),
    email_access TEXT,
    mattermost_url TEXT,
    zoom_link TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Project assignments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('Offen', 'In Bearbeitung', 'Erledigt')),
    attachments TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    reason TEXT,
    type TEXT NOT NULL CHECK (type IN ('Krankheit', 'Urlaub', 'Schule', 'Termin', 'Sonstiges')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_logs_project ON time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_absences_user_date ON absences(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`;

try {
  // Execute schema
  db.exec(schema);
  console.log('✅ Database schema created successfully');

  // Check if admin user exists
  const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?');
  const adminExists = checkAdmin.get('admin@adenc.de');

  if (!adminExists) {
    console.log('👤 Creating default users...');

    // Insert default admin user (password: admin123)
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare(
      'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)'
    );
    insertAdmin.run('admin@adenc.de', adminPassword, 'Admin User', 'admin');
    console.log('   ✓ Admin user created (admin@adenc.de / admin123)');

    // Insert default employees (password: emp123)
    const empPassword = bcrypt.hashSync('emp123', 10);
    const insertEmployee = db.prepare(
      `INSERT INTO users (email, password, full_name, role, address, birthday, employment_type, email_access, mattermost_url, zoom_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertEmployee.run(
      'max.mueller@adenc.de',
      empPassword,
      'Max Müller',
      'employee',
      'Mühlenstraße 12, 20457 Hamburg',
      '1990-03-12',
      'full_time',
      'max.mueller@adenc.de',
      'https://mattermost.adenc.de/team/max',
      'https://zoom.us/j/88300011111'
    );
    insertEmployee.run(
      'anna.schmidt@adenc.de',
      empPassword,
      'Anna Schmidt',
      'employee',
      'Schanzenstraße 45, 20357 Hamburg',
      '1993-07-21',
      'part_time',
      'anna.schmidt@adenc.de',
      'https://mattermost.adenc.de/team/anna',
      'https://zoom.us/j/88300022222'
    );
    insertEmployee.run(
      'lena.hartmann@adenc.de',
      empPassword,
      'Lena Hartmann',
      'employee',
      'Elbchaussee 98, 22763 Hamburg',
      '1994-11-03',
      'full_time',
      'lena.hartmann@adenc.de',
      'https://mattermost.adenc.de/team/lena',
      'https://zoom.us/j/88300033333'
    );
    insertEmployee.run(
      'jannik.weber@adenc.de',
      empPassword,
      'Jannik Weber',
      'employee',
      'Fischertwiete 2, 20095 Hamburg',
      '1988-01-29',
      'full_time',
      'jannik.weber@adenc.de',
      'https://mattermost.adenc.de/team/jannik',
      'https://zoom.us/j/88300044444'
    );
    console.log('   ✓ Employee users created (emp123 for all)');

    const users = db.prepare('SELECT id, email FROM users WHERE role = ?').all('employee');
    const userIdByEmail = users.reduce((acc, user) => {
      acc[user.email] = user.id;
      return acc;
    }, {});

    console.log('📁 Creating demo projects and tasks...');
    const insertProject = db.prepare('INSERT INTO projects (name, is_active) VALUES (?, ?)');
    const insertTask = db.prepare(
      'INSERT INTO tasks (project_id, assigned_to_user_id, title, description, status, attachments) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const projectIds = [];
    projectIds.push(insertProject.run('Nordlicht Digital Relaunch', 1).lastInsertRowid);
    projectIds.push(insertProject.run('AI Campaign Optimizer', 1).lastInsertRowid);
    projectIds.push(insertProject.run('Influencer Analytics Hub', 1).lastInsertRowid);

    const taskTemplates = [
      [
        'Branding-Workshop vorbereiten',
        'Agenda, Fragenkatalog und Moodboards für den Kickoff erstellen.'
      ],
      [
        'Landingpage Wireframes',
        'Low-Fidelity Wireframes für die Hauptseiten erstellen.'
      ],
      [
        'SEO Content Plan',
        'Keyword-Recherche und Inhaltsstruktur planen.'
      ],
      [
        'Tracking Setup',
        'GTM Container und Events für Marketingkampagnen definieren.'
      ],
      [
        'Launch-Checklist',
        'Quality Gate und Deployment-Checkliste erstellen.'
      ],
    ];

    projectIds.forEach((projectId) => {
      taskTemplates.forEach((task) => {
        insertTask.run(
          projectId,
          null,
          task[0],
          task[1],
          'Offen',
          null
        );
      });
    });

    console.log('🕒 Creating January time logs for new employees...');
    const insertTimeLog = db.prepare(
      'INSERT INTO time_logs (user_id, project_id, task_id, date, hours, notes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const januaryDates = Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
    const januaryProjectIds = projectIds.slice(0, 2);

    const timeLogUsers = [
      userIdByEmail['lena.hartmann@adenc.de'],
      userIdByEmail['jannik.weber@adenc.de'],
    ];

    timeLogUsers.forEach((userId, idx) => {
      januaryDates.forEach((date, dateIndex) => {
        const projectId = januaryProjectIds[dateIndex % januaryProjectIds.length];
        insertTimeLog.run(
          userId,
          projectId,
          null,
          date,
          idx === 0 ? 6.5 : 7.5,
          idx === 0 ? 'Content- und Design-Sprints' : 'Analyse und KPI-Review'
        );
      });
    });
  } else {
    console.log('👤 Default users already exist');
  }

  console.log('');
  console.log('🎉 Database initialization complete!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Admin:  admin@adenc.de / admin123');
  console.log('  Employees: max.mueller@adenc.de / emp123');
  console.log('             anna.schmidt@adenc.de / emp123');
  console.log('             lena.hartmann@adenc.de / emp123');
  console.log('             jannik.weber@adenc.de / emp123');
  
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}
