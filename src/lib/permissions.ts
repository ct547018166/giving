import db from '@/lib/db';
import { auth } from '@/lib/auth';

export async function checkPermission(path: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  
  if (session.user.role === 'admin') return true;

  const settings = db.prepare("SELECT value FROM system_settings WHERE key = 'guest_permissions'").get() as any;
  if (!settings) return false;

  const allowedRoutes = JSON.parse(settings.value);
  return allowedRoutes.includes(path);
}
