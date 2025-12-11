'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const [usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/settings')
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    fetchData();
  };

  const handlePermissionChange = async (path: string, checked: boolean) => {
    const currentPermissions = settings.guest_permissions || [];
    let newPermissions;
    if (checked) {
      newPermissions = [...currentPermissions, path];
    } else {
      newPermissions = currentPermissions.filter((p: string) => p !== path);
    }

    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'guest_permissions', value: newPermissions }),
    });
    fetchData();
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  const availableRoutes = [
    '/christmas-tree',
    '/christmas-lottery',
    '/maintenance',
    '/upload',
    '/gratitude-display'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">管理员控制台</h1>

        <div className="bg-white/10 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold mb-4">访客权限配置</h2>
          <div className="space-y-2">
            {availableRoutes.map(route => (
              <label key={route} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.guest_permissions?.includes(route)}
                  onChange={(e) => handlePermissionChange(route, e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>{route}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">用户管理</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-3">ID</th>
                  <th className="p-3">用户名</th>
                  <th className="p-3">角色</th>
                  <th className="p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="p-3">{user.id}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-black/30 rounded px-2 py-1"
                      >
                        <option value="guest">Guest</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
