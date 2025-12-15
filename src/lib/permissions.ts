import db from '@/lib/db';
import { auth } from '@/lib/auth';

export async function checkPermission(path: string): Promise<boolean> {
  const session = await auth();

  const settings = db.prepare("SELECT value FROM system_settings WHERE key = 'guest_permissions'").get() as any;
  const allowedRoutes: string[] = settings ? JSON.parse(settings.value) : [];

  // If no session, allow access only when route is listed for guests
  if (!session) {
    return allowedRoutes.includes(path);
  }

  if (session.user.role === 'admin') return true;

  return allowedRoutes.includes(path);
}
