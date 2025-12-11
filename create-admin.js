const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

async function createAdmin() {
  const username = 'Y2645';
  const password = '12345678aA..'; // Change this!
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create users table if not exists (in case the app hasn't run yet)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        image TEXT,
        provider TEXT,
        provider_id TEXT,
        role TEXT DEFAULT 'guest',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const stmt = db.prepare("INSERT INTO users (name, password, role, provider) VALUES (?, ?, ?, ?)");
    stmt.run(username, hashedPassword, 'admin', 'credentials');
    console.log(`Admin user created successfully.`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();
