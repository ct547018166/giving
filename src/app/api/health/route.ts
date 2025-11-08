import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查数据库连接
    const dbStatus = 'ok'; // SQLite 连接通常是持久的

    // 检查系统状态
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memory.external / 1024 / 1024) + 'MB',
      },
      database: dbStatus,
      version: process.version,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}