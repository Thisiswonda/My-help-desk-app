import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = typeof process !== 'undefined' && typeof __dirname !== 'undefined' ? '' : fileURLToPath(import.meta.url);
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename);

// Extend SessionData for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const DB_PATH = process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/helpdesk.db' : 'helpdesk.db');
const db = new Database(DB_PATH);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Super Admin', 'Help Desk Staff', 'Technician', 'Viewer', 'admin', 'staff')) DEFAULT 'Help Desk Staff',
    department_id INTEGER,
    department TEXT,
    email TEXT,
    FOREIGN KEY(department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    staff_name TEXT NOT NULL,
    department TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent', 'Critical')) NOT NULL,
    status TEXT CHECK(status IN ('Open', 'New', 'Pending', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    assigned_staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolution_time_minutes INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(assigned_staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    user_id INTEGER,
    sender_name TEXT,
    text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  
  -- Insert default departments
  INSERT OR IGNORE INTO departments (name) VALUES ('IT Support'), ('HR'), ('Finance'), ('Operations'), ('General');
`);

// Ensure messages table is created
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    user_id INTEGER,
    sender_name TEXT,
    text TEXT NOT NULL,
    type TEXT CHECK(type IN ('Direct', 'Broadcast')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Ensure default admin user exists with 'Super Admin' role
const adminUser: any = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminUser) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'Super Admin');
} else {
  // Always ensure 'admin' user has 'Super Admin' role and a department
  db.prepare("UPDATE users SET role = 'Super Admin', department = 'Directorate' WHERE username = 'admin'").run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.set('trust proxy', 1);
  app.use(session({
    secret: 'it-help-desk-secret',
    resave: true,
    saveUninitialized: true,
    name: 'helpdesk.sid',
    proxy: true,
    cookie: { 
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 
    }
  }));

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Session ID: ${req.sessionID} - User: ${req.session.userId || 'Guest'}`);
    next();
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as any;
    res.json({ 
      status: 'ok', 
      authenticated: !!req.session.userId, 
      databaseTickets: ticketCount.count 
    });
  });

  // Auth Middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    // Check session cookie first
    if (req.session.userId) return next();
    
    // Check for authorization header fallback (Bearer username:password_hash_part)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const [username, userId] = token.split(':');
      if (username && userId) {
        req.session.userId = parseInt(userId);
        return next();
      }
    }

    console.warn(`Unauthorized access attempt to ${req.url}`);
    res.status(401).json({ error: 'Unauthorized. Please login.' });
  };

  // Auth Routes
  app.post('/api/auth/register', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only administrators can register new personnel.' });
    }

    const { username, password, role = 'staff', department } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password_hash, role, department) VALUES (?, ?, ?, ?)').run(username, hash, role, department || null);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (user && bcrypt.compareSync(password, user.password_hash)) {
        req.session.userId = user.id;
        const token = `${user.username}:${user.id}`;
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, department: user.department }, token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    let userId = req.session.userId;
    const authHeader = req.headers.authorization;
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = token.split(':');
      userId = parseInt(decoded[1]);
    }

    if (userId) {
      const user: any = db.prepare('SELECT id, username, role, department FROM users WHERE id = ?').get(userId);
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Department Routes
  app.get('/api/departments', isAuthenticated, (req, res) => {
    try {
      const departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
      res.json(departments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/departments', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Department name is required' });
    }

    try {
      const result = db.prepare('INSERT INTO departments (name) VALUES (?)').run(name.trim());
      res.json({ success: true, department: { id: result.lastInsertRowid, name: name.trim() } });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Department already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/departments/:id', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    try {
      // Check if any users are in this department
      const usersInDept = db.prepare('SELECT count(*) as count FROM users WHERE department_id = ?').get(id) as any;
      if (usersInDept.count > 0) {
        return res.status(400).json({ error: 'Cannot delete department currently assigned to users.' });
      }

      db.prepare('DELETE FROM departments WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ticket Routes
  app.post('/api/tickets', (req, res) => {
    const { description, priority, category, department: manualDept } = req.body;
    let userId = req.session.userId;
    const authHeader = req.headers.authorization;
    
    // Auth fallback for headless/mobile preview
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = authHeader.split(' ')[1].split(':');
      userId = parseInt(decoded[1]);
    }
 
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
 
    try {
      const user: any = db.prepare('SELECT username, department FROM users WHERE id = ?').get(userId);
      const staff_name = user ? user.username : 'Unknown';
      const department = manualDept || (user && user.department ? user.department : 'General');
 
      const result = db.prepare(`
        INSERT INTO tickets (user_id, staff_name, department, category, description, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, staff_name, department, category || 'General', description, priority || 'Low');
      
      res.json({ success: true, ticketId: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/tickets', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
      res.json(tickets);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/my-tickets', isAuthenticated, (req, res) => {
    try {
      const tickets = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
      res.json(tickets);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Messaging Routes
  app.post('/api/messages', isAuthenticated, (req, res) => {
    const { ticket_id, text, type } = req.body;
    const userId = req.session.userId;
    try {
      const user: any = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      const sender_name = user ? user.username : 'Unknown';

      const result = db.prepare(`
        INSERT INTO messages (ticket_id, user_id, sender_name, text, type)
        VALUES (?, ?, ?, ?, ?)
      `).run(ticket_id || null, userId, sender_name, text, type || 'Direct');
      res.json({ success: true, messageId: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/messages/broadcast', (req, res) => {
    try {
      const messages = db.prepare("SELECT * FROM messages WHERE type = 'Broadcast' AND created_at > datetime('now', '-5 minutes') ORDER BY created_at DESC LIMIT 5").all();
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const ticketsByStatus = db.prepare(`SELECT status, count(*) as count FROM tickets GROUP BY status`).all();
      const ticketsByDepartment = db.prepare(`SELECT department, count(*) as count FROM tickets GROUP BY department`).all();
      const ticketsByPriority = db.prepare(`SELECT priority, count(*) as count FROM tickets GROUP BY priority`).all();
      
      const totalUsers = db.prepare('SELECT count(*) as count FROM users').get();
      const totalTickets = db.prepare('SELECT count(*) as count FROM tickets').get();
      
      res.json({
         ticketsByStatus,
         ticketsByDepartment,
         ticketsByPriority,
         totalUsers: (totalUsers as any).count,
         totalTickets: (totalTickets as any).count
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/logs', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const logs = db.prepare(`
        SELECT m.id, m.created_at, 'New message added: ' || m.text as action, u.username as user, 'Message' as type, m.ticket_id as reference_id
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        UNION ALL 
        SELECT t.id, t.created_at, 'Ticket created (' || t.priority || ') in ' || t.department as action, t.staff_name as user, 'Ticket' as type, t.id as reference_id
        FROM tickets t
        ORDER BY created_at DESC LIMIT 50
      `).all();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User Management Routes
  app.get('/api/users', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') return res.status(403).json({ error: 'Access denied' });

    try {
      const users = db.prepare('SELECT id, username, role, department FROM users').all();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users/:id/password', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const authHeader = req.headers.authorization;
    
    // Auth fallback for headless/mobile preview
    let currentRequesterId = userId;
    if (!currentRequesterId && authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = authHeader.split(' ')[1].split(':');
      currentRequesterId = parseInt(decoded[1]);
    }

    const requester: any = db.prepare('SELECT role FROM users WHERE id = ?').get(currentRequesterId);
    const targetUserId = parseInt(req.params.id);
    const { newPassword } = req.body;

    // Admin can reset anyone's password. Users can only reset their own.
    if (requester?.role !== 'admin' && requester?.role !== 'Super Admin' && currentRequesterId !== targetUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password too short' });
    }

    try {
      const hash = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetUserId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/messages/ticket/:ticketId', (req, res) => {
    try {
      const messages = db.prepare('SELECT * FROM messages WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.ticketId);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/tickets/:id/status', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.session.userId;
    
    try {
      const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
      const ticket: any = db.prepare('SELECT status, created_at, resolved_at, resolution_time_minutes, user_id FROM tickets WHERE id = ?').get(id);
      
      if (!ticket) return res.status(404).json({ error: 'Incident record not found.' });
      
      // Strict rule: Once Closed, it's immutable
      if (ticket.status === 'Closed') {
        return res.status(403).json({ error: 'This incident transmission is officially closed and verified. No further modifications are permitted.' });
      }

      // Role-based restrictions
      const isAdmin = user.role === 'admin' || user.role === 'Super Admin';
      
      if (status === 'Resolved' && !isAdmin) {
        return res.status(403).json({ error: 'Only technical administrators can mark incidents as resolved.' });
      }

      if (status === 'Closed' && isAdmin) {
        return res.status(403).json({ error: 'Verification must be performed by the reporting staff member.' });
      }

      if (status === 'Closed' && !isAdmin && ticket.user_id !== userId) {
        return res.status(403).json({ error: 'Verification must be performed by the reporting staff member.' });
      }

      if (status === 'In Progress' && !isAdmin) {
        return res.status(403).json({ error: 'Only technical administrators can process incidents.' });
      }

      if (status === 'Resolved' || status === 'Closed') {
        let resolvedAt = ticket.resolved_at;
        let resolutionTimeMinutes = ticket.resolution_time_minutes;

        // Only set metrics if moving from Open -> Resolved
        if (!resolvedAt || status === 'Resolved') {
          const now = new Date();
          resolvedAt = now.toISOString();
          const createdAt = new Date(ticket.created_at);
          resolutionTimeMinutes = Math.round((now.getTime() - createdAt.getTime()) / 60000);
        }

        db.prepare(`
          UPDATE tickets 
          SET status = ?, resolved_at = ?, resolution_time_minutes = ? 
          WHERE id = ?
        `).run(status, resolvedAt, resolutionTimeMinutes, id);
      } else {
        // Only admin can re-open (if not Closed)
        if (!isAdmin && status !== 'Closed') {
           return res.status(403).json({ error: 'Unauthorized status reversal.' });
        }
        db.prepare('UPDATE tickets SET status = ?, resolved_at = NULL, resolution_time_minutes = NULL WHERE id = ?')
          .run(status, id);
      }

      if (status === 'In Progress' || status === 'Resolved') {
        const notifyMsg = status === 'Resolved' ? `Your ticket #${id} has been resolved.` : `Your ticket #${id} is now in progress.`;
        db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)').run(ticket.user_id, `Ticket #${id} Update`, notifyMsg);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('Status update failed:', err);
      res.status(500).json({ error: 'Database synchronization failure.' });
    }
  });

  app.patch('/api/tickets/bulk/status', isAuthenticated, (req, res) => {
    const { ids, status } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs must be an array' });
    
    try {
      const updateStmt = db.prepare('UPDATE tickets SET status = ?, resolved_at = ?, resolution_time_minutes = ? WHERE id = ?');
      const resetStmt = db.prepare('UPDATE tickets SET status = ?, resolved_at = NULL, resolution_time_minutes = NULL WHERE id = ?');
      const getStmt = db.prepare('SELECT created_at, resolved_at, resolution_time_minutes, user_id FROM tickets WHERE id = ?');
      const notifyStmt = db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)');

      const transaction = db.transaction(() => {
        for (const id of ids) {
          const ticket: any = getStmt.get(id);
          if (!ticket) continue;

          if (status === 'Resolved' || status === 'Closed') {
            let resolvedAt = ticket.resolved_at;
            let resolutionTimeMinutes = ticket.resolution_time_minutes;

            if (!resolvedAt) {
              const now = new Date();
              resolvedAt = now.toISOString();
              const createdAt = new Date(ticket.created_at);
              resolutionTimeMinutes = Math.round((now.getTime() - createdAt.getTime()) / 60000);
            }
            updateStmt.run(status, resolvedAt, resolutionTimeMinutes, id);
          } else {
            resetStmt.run(status, id);
          }
          
          if (status === 'In Progress' || status === 'Resolved') {
            const notifyMsg = status === 'Resolved' ? `Your ticket #${id} has been resolved.` : `Your ticket #${id} is now in progress.`;
            notifyStmt.run(ticket.user_id, `Ticket #${id} Update`, notifyMsg);
          }
        }
      });

      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/tickets/bulk/priority', isAuthenticated, (req, res) => {
    const { ids, priority } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs must be an array' });

    try {
      const stmt = db.prepare('UPDATE tickets SET priority = ? WHERE id = ?');
      const transaction = db.transaction(() => {
        for (const id of ids) {
          stmt.run(priority, id);
        }
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/tickets/:id/priority', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    try {
      db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(priority, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/tickets/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);

    // Only admin can delete tickets, or maybe the owner can if it's still open? 
    // Usually, deletion is an admin privilege for audit reasons.
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete records.' });
    }

    try {
      // Delete associated messages first
      db.prepare('DELETE FROM messages WHERE ticket_id = ?').run(id);
      db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    const user: any = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);

    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only administrators can delete personnel.' });
    }

    if (parseInt(id) === userId) {
      return res.status(400).json({ error: 'Cannot delete your own administrative account.' });
    }

    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notifications Routes
  app.get('/api/notifications', isAuthenticated, (req, res) => {
    try {
      const notes = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.session.userId);
      res.json(notes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, (req, res) => {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, (req, res) => {
    try {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
