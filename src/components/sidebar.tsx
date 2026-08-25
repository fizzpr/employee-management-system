'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  Home,
  Calendar as CalendarIcon,
  ListTodo,
  Users,
  FileSpreadsheet,
  Settings,
  Bell,
  LogOut,
  UserCheck,
  Building,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to check if link is active
  const isActive = (path: string) => {
    const baseDashboards = ['/admin', '/manager', '/employee'];
    if (baseDashboards.includes(path)) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    // Call server action or logout API route to clear cookies
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
      router.refresh();
    }
  };

  // Define sidebar items based on role
  const menuItems = [
    // Dashboard (For everyone, but maps to role path)
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: role === 'ADMIN' ? '/admin' : role === 'MANAGER' ? '/manager' : '/employee',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    // Attendance (Everyone has attendance, Admin sees all, employee sees self)
    {
      name: 'Attendance',
      icon: Clock,
      path: role === 'ADMIN' ? '/admin/attendance' : '/employee',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    // Team Management (Manager only)
    {
      name: 'Team Roster',
      icon: Users,
      path: '/manager/team',
      roles: ['MANAGER'],
    },
    // Approvals (Manager only)
    {
      name: 'Approvals',
      icon: UserCheck,
      path: '/manager/approvals',
      roles: ['MANAGER'],
    },
    // WFH (Admin & Employee)
    {
      name: 'WFH Requests',
      icon: Home,
      path: role === 'ADMIN' ? '/admin/wfh' : '/employee/wfh',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    // Leave (Admin & Employee)
    {
      name: 'Leave Management',
      icon: CalendarIcon,
      path: role === 'ADMIN' ? '/admin/leave' : '/employee/leave',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    // Tasks (For everyone: Manager assigns, Employee views, Admin sees everything)
    {
      name: 'Tasks',
      icon: ListTodo,
      path: role === 'ADMIN' ? '/admin/tasks' : role === 'MANAGER' ? '/manager/tasks' : '/employee/tasks',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    // Employees CRUD (Admin only)
    {
      name: 'Employees',
      icon: Users,
      path: '/admin/employees',
      roles: ['ADMIN'],
    },
    // Reports (Admin & Manager)
    {
      name: 'Reports',
      icon: FileSpreadsheet,
      path: role === 'ADMIN' ? '/admin/reports' : '/manager/reports',
      roles: ['ADMIN', 'MANAGER'],
    },
    // Calendar (Admin & Employee)
    {
      name: 'Calendar',
      icon: CalendarIcon,
      path: role === 'ADMIN' ? '/admin/calendar' : '/employee/calendar',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    // Settings (Admin only)
    {
      name: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-400">
      {/* Brand logo header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Building className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-bold text-white tracking-wide">Fizz PR Portal</span>
      </div>

      {/* Roster menu */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {filteredItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <ActiveIcon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer session details */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold uppercase">
            {userName ? userName.charAt(0) : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
            <p className="truncate text-xs font-medium text-slate-500 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-5 w-5 text-slate-500" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
