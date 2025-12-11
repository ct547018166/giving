const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(process.cwd(), 'database.db');
  console.log('Opening database at:', dbPath);
  const db = new Database(dbPath);
  console.log('Database opened successfully.');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));
  
  const users = db.prepare("SELECT * FROM users").all();
  console.log('Users count:', users.length);
} catch (error) {
  console.error('Database error:', error);
}
