const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  const row = db.prepare('SELECT COUNT(DISTINCT nickname) as count FROM gratitudes').get();
  console.log(`感恩抽奖数据库中共有 ${row.count} 个不同的昵称`);
} catch (error) {
  console.error('Error querying database:', error);
}
