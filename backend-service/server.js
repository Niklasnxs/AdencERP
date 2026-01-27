const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
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

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, address, birthday, employment_type, created_at FROM users ORDER BY id'
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
    const result = await db.query(
      'SELECT id, email, full_name, role, address, birthday, employment_type, created_at FROM users WHERE id = $1',
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

    const { email, password, full_name, role, address, birthday, employment_type } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (email, password, full_name, role, address, birthday, employment_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, role, address, birthday, employment_type, created_at',
      [email, hashedPassword, full_name, role, address || null, birthday || null, employment_type || null]
    );

    res.status(201).json(result.rows[0]);
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

    const { email, password, full_name, role, address, birthday, employment_type } = req.body;
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

    values.push(req.params.id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, full_name, role, address, birthday, employment_type, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
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
    const { user_id, project_id, task_id, date, hours, notes } = req.body;

    const result = await db.query(
      'INSERT INTO time_logs (user_id, project_id, task_id, date, hours, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, project_id, task_id || null, date, hours, notes || null]
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
    const { hours, notes } = req.body;
    
    const result = await db.query(
      'UPDATE time_logs SET hours = COALESCE($1, hours), notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
      [hours, notes, req.params.id]
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
