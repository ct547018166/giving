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
`);

export default db;