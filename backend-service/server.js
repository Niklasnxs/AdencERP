const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json({ limit: '20mb' }));
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx'];

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function sanitizeFilename(filename = '') {
  return filename.replace(/[^\w.\-() ]/g, '_');
}

function hasAllowedExtension(filename = '', allowedExtensions = []) {
  const lower = filename.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

function isMissingFeatureTableError(error) {
  return error?.code === '42P01';
}

function isMissingFeatureSchemaError(error) {
  return error?.code === '42P01' || error?.code === '42703';
}

const ONBOARDING_CHECKLIST_DEFAULT_ITEMS = [
  { key: 'mail_setup', label: 'Mail-Adresse eingerichtet' },
  { key: 'chat_setup', label: 'Chatprogramm (Handy & Desktop) eingerichtet' },
  { key: 'rules_read', label: 'Regeln gelesen und verstanden' },
  { key: 'timesheet_access', label: 'Zugang zur Stundenliste eingerichtet' },
  { key: 'personal_questionnaire', label: 'Personalfragebogen (falls nötig) eingereicht' },
  { key: 'documents_signed', label: 'Unternehmensdokumente unterschrieben' },
];

async function ensureChecklistRowsForUser(userId) {
  for (const item of ONBOARDING_CHECKLIST_DEFAULT_ITEMS) {
    await db.query(
      `INSERT INTO onboarding_checklist (user_id, item_key, item_label, completed)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (user_id, item_key) DO NOTHING`,
      [userId, item.key, item.label]
    );
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'adencerp-backend' });
});

// ===== AUTHENTICATION =====

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== USERS =====

const USER_SELECT_WITH_EMAIL_LOGIN = `
  SELECT id, email, full_name, role, address, birthday, employment_type,
         email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link, created_at
  FROM users
`;

const USER_SELECT_LEGACY = `
  SELECT id, email, full_name, role, address, birthday, employment_type,
         email_access, mattermost_url, zoom_link, stundenliste_link, created_at
  FROM users
`;

function buildLegacyEmailAccess(emailAccess, emailLogin, emailPassword) {
  if (emailAccess) return emailAccess;
  if (!emailLogin && !emailPassword) return null;
  return `LOGIN_EMAIL:${emailLogin || ''}\nLOGIN_PASSWORD:${emailPassword || ''}`;
}

function hydrateLegacyEmailFields(row) {
  if (!row) return row;
  if (row.email_login || row.email_password) return row;
  const raw = row.email_access || '';
  const loginMatch = raw.match(/LOGIN_EMAIL:(.*)/);
  const passwordMatch = raw.match(/LOGIN_PASSWORD:(.*)/);
  return {
    ...row,
    email_login: loginMatch ? loginMatch[1].trim() : null,
    email_password: passwordMatch ? passwordMatch[1].trim() : null,
  };
}

async function queryUsersWithSchemaFallback(queryWithNewColumns, queryLegacyColumns, params = []) {
  try {
    const result = await db.query(queryWithNewColumns, params);
    result.rows = result.rows.map(hydrateLegacyEmailFields);
    return result;
  } catch (error) {
    // 42703 = undefined_column (e.g. servers where migration for email_login/email_password is not applied yet)
    if (error?.code === '42703') {
      const result = await db.query(queryLegacyColumns, params);
      result.rows = result.rows.map(hydrateLegacyEmailFields);
      return result;
    }
    throw error;
  }
}

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await queryUsersWithSchemaFallback(
      `${USER_SELECT_WITH_EMAIL_LOGIN} ORDER BY id`,
      `${USER_SELECT_LEGACY} ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const result = await queryUsersWithSchemaFallback(
      `${USER_SELECT_WITH_EMAIL_LOGIN} WHERE id = $1`,
      `${USER_SELECT_LEGACY} WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, full_name, role, address, birthday, employment_type, email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let result;
    try {
      result = await db.query(
        'INSERT INTO users (email, password, full_name, role, address, birthday, employment_type, email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, email, full_name, role, address, birthday, employment_type, email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link, created_at',
        [email, hashedPassword, full_name, role, address || null, birthday || null, employment_type || null, email_access || null, email_login || null, email_password || null, mattermost_url || null, zoom_link || null, stundenliste_link || null]
      );
    } catch (error) {
      if (error?.code !== '42703') throw error;
      result = await db.query(
        'INSERT INTO users (email, password, full_name, role, address, birthday, employment_type, email_access, mattermost_url, zoom_link, stundenliste_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, email, full_name, role, address, birthday, employment_type, email_access, mattermost_url, zoom_link, stundenliste_link, created_at',
        [
          email,
          hashedPassword,
          full_name,
          role,
          address || null,
          birthday || null,
          employment_type || null,
          buildLegacyEmailAccess(email_access, email_login, email_password),
          mattermost_url || null,
          zoom_link || null,
          stundenliste_link || null,
        ]
      );
    }

    res.status(201).json(hydrateLegacyEmailFields(result.rows[0]));
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, full_name, role, address, birthday, employment_type, email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    if (full_name) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address || null);
    }
    if (birthday !== undefined) {
      updates.push(`birthday = $${paramCount++}`);
      values.push(birthday || null);
    }
    if (employment_type !== undefined) {
      updates.push(`employment_type = $${paramCount++}`);
      values.push(employment_type || null);
    }
    if (email_access !== undefined) {
      updates.push(`email_access = $${paramCount++}`);
      values.push(email_access || null);
    }
    if (email_login !== undefined) {
      updates.push(`email_login = $${paramCount++}`);
      values.push(email_login || null);
    }
    if (email_password !== undefined) {
      updates.push(`email_password = $${paramCount++}`);
      values.push(email_password || null);
    }
    if (mattermost_url !== undefined) {
      updates.push(`mattermost_url = $${paramCount++}`);
      values.push(mattermost_url || null);
    }
    if (zoom_link !== undefined) {
      updates.push(`zoom_link = $${paramCount++}`);
      values.push(zoom_link || null);
    }
    if (stundenliste_link !== undefined) {
      updates.push(`stundenliste_link = $${paramCount++}`);
      values.push(stundenliste_link || null);
    }

    values.push(req.params.id);

    let result;
    try {
      result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, full_name, role, address, birthday, employment_type, email_access, email_login, email_password, mattermost_url, zoom_link, stundenliste_link, created_at`,
        values
      );
    } catch (error) {
      if (error?.code !== '42703') throw error;

      const legacyUpdates = [];
      const legacyValues = [];
      let legacyParam = 1;

      if (email) {
        legacyUpdates.push(`email = $${legacyParam++}`);
        legacyValues.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        legacyUpdates.push(`password = $${legacyParam++}`);
        legacyValues.push(hashedPassword);
      }
      if (full_name) {
        legacyUpdates.push(`full_name = $${legacyParam++}`);
        legacyValues.push(full_name);
      }
      if (role) {
        legacyUpdates.push(`role = $${legacyParam++}`);
        legacyValues.push(role);
      }
      if (address !== undefined) {
        legacyUpdates.push(`address = $${legacyParam++}`);
        legacyValues.push(address || null);
      }
      if (birthday !== undefined) {
        legacyUpdates.push(`birthday = $${legacyParam++}`);
        legacyValues.push(birthday || null);
      }
      if (employment_type !== undefined) {
        legacyUpdates.push(`employment_type = $${legacyParam++}`);
        legacyValues.push(employment_type || null);
      }
      if (email_access !== undefined || email_login !== undefined || email_password !== undefined) {
        legacyUpdates.push(`email_access = $${legacyParam++}`);
        legacyValues.push(buildLegacyEmailAccess(email_access, email_login, email_password));
      }
      if (mattermost_url !== undefined) {
        legacyUpdates.push(`mattermost_url = $${legacyParam++}`);
        legacyValues.push(mattermost_url || null);
      }
      if (zoom_link !== undefined) {
        legacyUpdates.push(`zoom_link = $${legacyParam++}`);
        legacyValues.push(zoom_link || null);
      }
      if (stundenliste_link !== undefined) {
        legacyUpdates.push(`stundenliste_link = $${legacyParam++}`);
        legacyValues.push(stundenliste_link || null);
      }

      legacyValues.push(req.params.id);
      result = await db.query(
        `UPDATE users SET ${legacyUpdates.join(', ')} WHERE id = $${legacyParam} RETURNING id, email, full_name, role, address, birthday, employment_type, email_access, mattermost_url, zoom_link, stundenliste_link, created_at`,
        legacyValues
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(hydrateLegacyEmailFields(result.rows[0]));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===== PROJECTS =====

// Get all projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
        COALESCE(
          json_agg(pa.user_id) FILTER (WHERE pa.user_id IS NOT NULL), 
          '[]'
        ) as assigned_user_ids
       FROM projects p
       LEFT JOIN project_assignments pa ON p.id = pa.project_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, is_active, assigned_user_ids } = req.body;

    const projectResult = await db.query(
      'INSERT INTO projects (name, is_active) VALUES ($1, $2) RETURNING *',
      [name, is_active !== false]
    );

    const project = projectResult.rows[0];

    if (assigned_user_ids && assigned_user_ids.length > 0) {
      for (const userId of assigned_user_ids) {
        await db.query(
          'INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2)',
          [project.id, userId]
        );
      }
    }

    project.assigned_user_ids = assigned_user_ids || [];
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, is_active, assigned_user_ids } = req.body;

    const result = await db.query(
      'UPDATE projects SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
      [name, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (assigned_user_ids) {
      await db.query('DELETE FROM project_assignments WHERE project_id = $1', [req.params.id]);
      
      for (const userId of assigned_user_ids) {
        await db.query(
          'INSERT INTO project_assignments (project_id, user_id) VALUES ($1, $2)',
          [req.params.id, userId]
        );
      }
    }

    const project = result.rows[0];
    project.assigned_user_ids = assigned_user_ids || [];
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ===== CUSTOMERS =====

// Get all customers
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, is_active, created_at FROM customers ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer
app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, is_active } = req.body;
    const result = await db.query(
      'INSERT INTO customers (name, is_active) VALUES ($1, $2) RETURNING id, name, is_active, created_at',
      [name, is_active ?? true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Customer already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, is_active } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id);

    const result = await db.query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, is_active, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// ===== TASKS =====

// Get all tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { project_id, assigned_to_user_id, title, description, status, attachments } = req.body;

    const result = await db.query(
      'INSERT INTO tasks (project_id, assigned_to_user_id, title, description, status, attachments) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, assigned_to_user_id || null, title, description || null, status || 'Offen', attachments || []]
    );

    // Create notification if assigned
    if (assigned_to_user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
        [assigned_to_user_id, 'task_assigned', `Neue Aufgabe zugewiesen: ${title}`]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { assigned_to_user_id, title, description, status, attachments } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (assigned_to_user_id !== undefined) {
      updates.push(`assigned_to_user_id = $${paramCount++}`);
      values.push(assigned_to_user_id);
    }
    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (attachments) {
      updates.push(`attachments = $${paramCount++}`);
      values.push(attachments);
    }

    values.push(req.params.id);

    const result = await db.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ===== TIME LOGS =====

// Get all time logs
app.get('/api/timelogs', authenticateToken, async (req, res) => {
  try {
    const { user_id, date, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM time_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND user_id = $${paramCount++}`;
      values.push(user_id);
    }
    if (date) {
      query += ` AND date = $${paramCount++}`;
      values.push(date);
    }
    if (start_date && end_date) {
      query += ` AND date BETWEEN $${paramCount++} AND $${paramCount++}`;
      values.push(start_date, end_date);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

// Create time log
app.post('/api/timelogs', authenticateToken, async (req, res) => {
  try {
    const { user_id, project_id, task_id, date, hours, notes, customer_name } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'customer_name is required' });
    }

    const result = await db.query(
      'INSERT INTO time_logs (user_id, project_id, task_id, customer_name, date, hours, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, project_id, task_id || null, customer_name, date, hours, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create time log error:', error);
    res.status(500).json({ error: 'Failed to create time log' });
  }
});

// Update time log
app.put('/api/timelogs/:id', authenticateToken, async (req, res) => {
  try {
    const { project_id, task_id, date, hours, notes, customer_name } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (project_id !== undefined) {
      updates.push(`project_id = $${paramCount++}`);
      values.push(project_id || null);
    }
    if (task_id !== undefined) {
      updates.push(`task_id = $${paramCount++}`);
      values.push(task_id || null);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }

    if (hours !== undefined) {
      updates.push(`hours = $${paramCount++}`);
      values.push(hours);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (customer_name !== undefined) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(customer_name);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    const result = await db.query(
      `UPDATE time_logs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update time log error:', error);
    res.status(500).json({ error: 'Failed to update time log' });
  }
});

// Delete time log
app.delete('/api/timelogs/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM time_logs WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({ error: 'Failed to delete time log' });
  }
});

// ===== ABSENCES =====

// Get all absences
app.get('/api/absences', authenticateToken, async (req, res) => {
  try {
    const { user_id, date, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM absences WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND user_id = $${paramCount++}`;
      values.push(user_id);
    }
    if (date) {
      query += ` AND date = $${paramCount++}`;
      values.push(date);
    }
    if (start_date && end_date) {
      query += ` AND date BETWEEN $${paramCount++} AND $${paramCount++}`;
      values.push(start_date, end_date);
    }

    query += ' ORDER BY date DESC';

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get absences error:', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

// Create absence
app.post('/api/absences', authenticateToken, async (req, res) => {
  try {
    const { user_id, date, reason, type } = req.body;

    const result = await db.query(
      'INSERT INTO absences (user_id, date, reason, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, date, reason || null, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create absence error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Absence already exists for this date' });
    }
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

// Update absence
app.put('/api/absences/:id', authenticateToken, async (req, res) => {
  try {
    const { reason, type } = req.body;
    
    const result = await db.query(
      'UPDATE absences SET reason = COALESCE($1, reason), type = COALESCE($2, type) WHERE id = $3 RETURNING *',
      [reason, type, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Absence not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update absence error:', error);
    res.status(500).json({ error: 'Failed to update absence' });
  }
});

// Delete absence
app.delete('/api/absences/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM absences WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Absence not found' });
    }

    res.json({ message: 'Absence deleted successfully' });
  } catch (error) {
    console.error('Delete absence error:', error);
    res.status(500).json({ error: 'Failed to delete absence' });
  }
});

// Delete absences by user and date
app.delete('/api/absences/user/:user_id/date/:date', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM absences WHERE user_id = $1 AND date = $2 RETURNING id',
      [req.params.user_id, req.params.date]
    );

    res.json({ message: 'Absences deleted successfully', count: result.rowCount });
  } catch (error) {
    console.error('Delete absences error:', error);
    res.status(500).json({ error: 'Failed to delete absences' });
  }
});

// ===== DOCUMENT UPLOADS =====

app.post('/api/document-uploads', authenticateToken, (req, res) => {
  (async () => {
    try {
      const category = (req.body?.category || '').trim();
      const file = req.body?.file;

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }
      if (!category) {
        return res.status(400).json({ error: 'Category is required' });
      }

      const originalName = sanitizeFilename(file?.name || '');
      const mimeType = file?.type || '';
      const size = Number(file?.size || 0);
      const dataBase64 = file?.dataBase64 || '';

      if (!originalName || !mimeType || !size || !dataBase64) {
        return res.status(400).json({ error: 'Invalid file payload' });
      }

      if (!ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType) || !hasAllowedExtension(originalName, ALLOWED_DOCUMENT_EXTENSIONS)) {
        return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' });
      }
      if (size > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ error: 'Maximum file size is 10 MB' });
      }

      const buffer = Buffer.from(dataBase64, 'base64');
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ error: 'Maximum file size is 10 MB' });
      }

      const result = await db.query(
        `INSERT INTO document_uploads
          (user_id, category, original_filename, mime_type, file_size, file_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, category, original_filename, mime_type, file_size, created_at`,
        [req.user.id, category, originalName, mimeType, size, buffer]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create document upload error:', error);
      if (isMissingFeatureTableError(error)) {
        return res.status(503).json({ error: 'Uploads are not initialized yet. Please run database migration.' });
      }
      return res.status(500).json({ error: 'Failed to upload document' });
    }
  })();
});

app.get('/api/document-uploads/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    try {
      const result = await db.query(
        `SELECT
           u.id AS user_id,
           u.full_name,
           u.email,
           COUNT(du.id)::int AS upload_count,
           MAX(du.created_at) AS latest_upload_at,
           COUNT(du.id) FILTER (WHERE du.id IS NOT NULL AND dv.id IS NULL)::int AS unseen_count
         FROM users u
         LEFT JOIN document_uploads du ON du.user_id = u.id
         LEFT JOIN document_upload_views dv
           ON dv.upload_id = du.id
          AND dv.admin_user_id = $1
         GROUP BY u.id, u.full_name, u.email
         ORDER BY unseen_count DESC, latest_upload_at DESC NULLS LAST, u.full_name ASC`,
        [req.user.id]
      );
      return res.json(
        result.rows.map((row) => ({
          ...row,
          has_unseen: Number(row.unseen_count || 0) > 0,
        }))
      );
    } catch (innerError) {
      if (!isMissingFeatureSchemaError(innerError)) throw innerError;
      const fallback = await db.query(
        `SELECT
           u.id AS user_id,
           u.full_name,
           u.email,
           COUNT(du.id)::int AS upload_count,
           MAX(du.created_at) AS latest_upload_at,
           0::int AS unseen_count
         FROM users u
         LEFT JOIN document_uploads du ON du.user_id = u.id
         GROUP BY u.id, u.full_name, u.email
         ORDER BY latest_upload_at DESC NULLS LAST, u.full_name ASC`
      );
      return res.json(
        fallback.rows.map((row) => ({
          ...row,
          has_unseen: false,
        }))
      );
    }
  } catch (error) {
    console.error('Get document upload overview error:', error);
    if (isMissingFeatureSchemaError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch upload overview' });
  }
});

app.get('/api/document-uploads/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, user_id, category, original_filename, mime_type, file_size, created_at
       FROM document_uploads
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.params.userId]
    );

    try {
      await db.query(
        `INSERT INTO document_upload_views (upload_id, admin_user_id)
         SELECT du.id, $1
         FROM document_uploads du
         WHERE du.user_id = $2
         ON CONFLICT (upload_id, admin_user_id) DO NOTHING`,
        [req.user.id, req.params.userId]
      );
    } catch (markSeenError) {
      if (!isMissingFeatureSchemaError(markSeenError)) {
        throw markSeenError;
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get user document uploads error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch user uploads' });
  }
});

app.get('/api/document-uploads/unseen-count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    try {
      const result = await db.query(
        `SELECT COUNT(du.id)::int AS unseen_count
         FROM document_uploads du
         LEFT JOIN document_upload_views dv
           ON dv.upload_id = du.id
          AND dv.admin_user_id = $1
         WHERE dv.id IS NULL`,
        [req.user.id]
      );
      return res.json({ unseen_count: Number(result.rows[0]?.unseen_count || 0) });
    } catch (innerError) {
      if (!isMissingFeatureSchemaError(innerError)) throw innerError;
      return res.json({ unseen_count: 0 });
    }
  } catch (error) {
    console.error('Get unseen upload count error:', error);
    if (isMissingFeatureSchemaError(error)) {
      return res.json({ unseen_count: 0 });
    }
    res.status(500).json({ error: 'Failed to fetch unseen upload count' });
  }
});

app.get('/api/document-uploads/:id/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, original_filename, mime_type, file_data
       FROM document_uploads
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const file = result.rows[0];
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(file.original_filename)}"`);
    res.send(file.file_data);
  } catch (error) {
    console.error('Download document upload error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.status(503).json({ error: 'Uploads are not initialized yet. Please run database migration.' });
    }
    res.status(500).json({ error: 'Failed to download upload' });
  }
});

// ===== SUGGESTION BOX =====

app.post('/api/briefkasten', authenticateToken, (req, res) => {
  (async () => {
    try {
      const message = (req.body?.message || '').trim();
      const category = (req.body?.category || '').trim();
      const isAnonymous = Boolean(req.body?.is_anonymous);
      const image = req.body?.image || null;

      if (!message && !category && !image) {
        return res.status(400).json({ error: 'At least one field (text, category, image) is required' });
      }

      let imageFilename = null;
      let imageMimeType = null;
      let imageSize = null;
      let imageBuffer = null;

      if (image) {
        imageFilename = sanitizeFilename(image?.name || '');
        imageMimeType = image?.type || '';
        imageSize = Number(image?.size || 0);
        const dataBase64 = image?.dataBase64 || '';

        if (!imageFilename || !imageMimeType || !imageSize || !dataBase64) {
          return res.status(400).json({ error: 'Invalid image payload' });
        }
        if (!ALLOWED_IMAGE_MIME_TYPES.has(imageMimeType)) {
          return res.status(400).json({ error: 'Only image files are allowed (PNG, JPG, WEBP, GIF)' });
        }
        if (imageSize > MAX_UPLOAD_BYTES) {
          return res.status(400).json({ error: 'Maximum image size is 10 MB' });
        }

        imageBuffer = Buffer.from(dataBase64, 'base64');
        if (imageBuffer.length > MAX_UPLOAD_BYTES) {
          return res.status(400).json({ error: 'Maximum image size is 10 MB' });
        }
      }

      const result = await db.query(
        `INSERT INTO suggestion_box_entries
          (user_id, is_anonymous, message, category, image_filename, image_mime_type, image_size, image_data, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Neu')
         RETURNING id, user_id, is_anonymous, message, category, status, created_at, updated_at`,
        [
          req.user.id,
          isAnonymous,
          message || null,
          category || null,
          imageFilename,
          imageMimeType,
          imageSize,
          imageBuffer,
        ]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create suggestion error:', error);
      if (isMissingFeatureTableError(error)) {
        return res.status(503).json({ error: 'Mailbox is not initialized yet. Please run database migration.' });
      }
      return res.status(500).json({ error: 'Failed to create suggestion entry' });
    }
  })();
});

app.get('/api/briefkasten', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT
         s.id,
         s.user_id,
         s.is_anonymous,
         s.message,
         s.category,
         s.status,
         s.created_at,
         s.updated_at,
         (s.image_data IS NOT NULL) AS has_image,
         s.image_filename,
         u.full_name,
         u.email
       FROM suggestion_box_entries s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get suggestions error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch suggestion entries' });
  }
});

app.get('/api/briefkasten/:id/image', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT image_filename, image_mime_type, image_data
       FROM suggestion_box_entries
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const row = result.rows[0];
    if (!row.image_data) {
      return res.status(404).json({ error: 'No image for this entry' });
    }

    res.setHeader('Content-Type', row.image_mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(row.image_filename || 'briefkasten-bild')}"`);
    res.send(row.image_data);
  } catch (error) {
    console.error('Download suggestion image error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.status(503).json({ error: 'Mailbox is not initialized yet. Please run database migration.' });
    }
    res.status(500).json({ error: 'Failed to download image' });
  }
});

app.put('/api/briefkasten/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowedStatuses = new Set(['Neu', 'In Bearbeitung', 'Erledigt']);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE suggestion_box_entries
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update suggestion status error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.status(503).json({ error: 'Mailbox is not initialized yet. Please run database migration.' });
    }
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ===== ONBOARDING CHECKLIST =====

app.get('/api/onboarding-checklist/me', authenticateToken, async (req, res) => {
  try {
    await ensureChecklistRowsForUser(req.user.id);
    const result = await db.query(
      `SELECT id, user_id, item_key, item_label, completed, completed_at, updated_at
       FROM onboarding_checklist
       WHERE user_id = $1
       ORDER BY item_key ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get own onboarding checklist error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch onboarding checklist' });
  }
});

app.put('/api/onboarding-checklist/me/:itemKey', authenticateToken, async (req, res) => {
  try {
    const itemKey = req.params.itemKey;
    const completed = Boolean(req.body?.completed);
    const templateItem = ONBOARDING_CHECKLIST_DEFAULT_ITEMS.find((item) => item.key === itemKey);

    if (!templateItem) {
      return res.status(400).json({ error: 'Unknown checklist item' });
    }

    await ensureChecklistRowsForUser(req.user.id);
    const result = await db.query(
      `UPDATE onboarding_checklist
       SET completed = $1,
           completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND item_key = $3
       RETURNING id, user_id, item_key, item_label, completed, completed_at, updated_at`,
      [completed, req.user.id, itemKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update own onboarding checklist error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.status(503).json({ error: 'Checklist is not initialized yet. Please run database migration.' });
    }
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

app.get('/api/onboarding-checklist/admin-overview', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    await db.query(
      `INSERT INTO onboarding_checklist (user_id, item_key, item_label, completed)
       SELECT u.id, v.item_key, v.item_label, false
       FROM users u
       CROSS JOIN (
         VALUES
           ('mail_setup', 'Mail-Adresse eingerichtet'),
           ('chat_setup', 'Chatprogramm (Handy & Desktop) eingerichtet'),
           ('rules_read', 'Regeln gelesen und verstanden'),
           ('timesheet_access', 'Zugang zur Stundenliste eingerichtet'),
           ('personal_questionnaire', 'Personalfragebogen (falls nötig) eingereicht'),
           ('documents_signed', 'Unternehmensdokumente unterschrieben')
       ) AS v(item_key, item_label)
       ON CONFLICT (user_id, item_key) DO NOTHING`
    );

    const result = await db.query(
      `SELECT
         u.id AS user_id,
         u.full_name,
         u.email,
         COUNT(c.id)::int AS total_items,
         COUNT(c.id) FILTER (WHERE c.completed = true)::int AS completed_items
       FROM users u
       LEFT JOIN onboarding_checklist c ON c.user_id = u.id
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get onboarding admin overview error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch onboarding overview' });
  }
});

// ===== RULES ACCEPTANCE =====

app.get('/api/rules/acceptance/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT accepted_at
       FROM rules_acceptances
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ accepted: false, accepted_at: null });
    }

    return res.json({ accepted: true, accepted_at: result.rows[0].accepted_at });
  } catch (error) {
    console.error('Get rules acceptance error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.json({ accepted: false, accepted_at: null });
    }
    res.status(500).json({ error: 'Failed to fetch rules acceptance' });
  }
});

app.post('/api/rules/acceptance/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `INSERT INTO rules_acceptances (user_id)
       VALUES ($1)
       ON CONFLICT (user_id)
       DO UPDATE SET accepted_at = rules_acceptances.accepted_at
       RETURNING accepted_at`,
      [req.user.id]
    );

    res.status(201).json({ accepted: true, accepted_at: result.rows[0].accepted_at });
  } catch (error) {
    console.error('Create rules acceptance error:', error);
    if (isMissingFeatureTableError(error)) {
      return res.status(503).json({ error: 'Rules acceptance is not initialized yet. Please run database migration.' });
    }
    res.status(500).json({ error: 'Failed to save rules acceptance' });
  }
});

// ===== NOTIFICATIONS =====

// Get notifications for user
app.get('/api/notifications/:user_id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AdencERP Backend API running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🔐 JWT Auth: ${process.env.JWT_SECRET ? 'Configured' : 'Using default (INSECURE!)'}`);
});
