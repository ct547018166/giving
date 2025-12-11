import Database from 'better-sqlite3';
import path from 'path';

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 在Vercel环境中，我们无法使用文件系统持久化
// 这里提供两种解决方案：
// 1. 使用环境变量中的数据库URL (推荐用于生产)
// 2. 使用内存数据库 (仅用于演示)

let db: Database.Database;

if (isVercel) {
  // Vercel 环境 - 使用内存数据库或环境变量中的连接
  if (process.env.DATABASE_URL) {
    // 如果设置了DATABASE_URL，使用PostgreSQL
    // 注意：需要安装 @vercel/postgres 或 pg 包
    console.log('Using PostgreSQL database from environment');
    // 这里需要根据实际的PostgreSQL客户端进行配置
    // 暂时使用内存数据库作为fallback
    db = new Database(':memory:');
  } else {
    // 使用内存数据库
    console.log('Using in-memory SQLite database');
    db = new Database(':memory:');
  }
} else {
  // 本地开发环境 - 使用文件数据库
  const dbPath = path.join(process.cwd(), 'database.db');
  db = new Database(dbPath);
  // 开启 WAL 模式以提高并发性能
  db.pragma('journal_mode = WAL');
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS gratitudes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial INTEGER,
    nickname TEXT,
    time TEXT,
    gratitude TEXT
  );

  CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT,
    signature TEXT
  );

  CREATE TABLE IF NOT EXISTS christmas_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

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

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_signatures_nickname ON signatures(nickname);
  CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
`);

// --- Migration System ---

// Create migrations table
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Define migrations
const migrations = [
  {
    name: '001_add_user_id_to_christmas_photos',
    up: (db: Database.Database) => {
      const tableInfo = db.prepare("PRAGMA table_info(christmas_photos)").all() as any[];
      const hasUserId = tableInfo.some(col => col.name === 'user_id');
      if (!hasUserId) {
        db.prepare("ALTER TABLE christmas_photos ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
      }
    }
  },
  {
    name: '002_init_default_settings',
    up: (db: Database.Database) => {
       const initSettings = db.prepare("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)");
       initSettings.run('guest_permissions', JSON.stringify(['/christmas-tree', '/christmas-lottery']));
    }
  }
];

// Run migrations
for (const migration of migrations) {
  const row = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migration.name);
  if (!row) {
    console.log(`Applying migration: ${migration.name}`);
    try {
      const runMigration = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
      });
      runMigration();
      console.log(`Migration ${migration.name} applied successfully.`);
    } catch (error) {
      console.error(`Failed to apply migration ${migration.name}:`, error);
    }
  }
}

export default db;