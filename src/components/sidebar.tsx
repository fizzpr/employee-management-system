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
  X,
  Download,
} from 'lucide-react';
import { usePwa } from '@/components/pwa-install-provider';

interface SidebarProps {
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  userName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, userName, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canInstall, promptInstall } = usePwa();

  // Helper to check if link is active
  const isActive = (path: string) => {
    const baseDashboards = ['/admin', '/manager', '/employee'];
    if (baseDashboards.includes(path)) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
      router.refresh();
    }
  };

  // Define sidebar items based on role
  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: role === 'ADMIN' ? '/admin' : role === 'MANAGER' ? '/manager' : '/employee',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      name: 'Attendance',
      icon: Clock,
      path: role === 'ADMIN' ? '/admin/attendance' : '/employee',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    {
      name: 'Team Roster',
      icon: Users,
      path: '/manager/team',
      roles: ['MANAGER'],
    },
    {
      name: 'Approvals',
      icon: UserCheck,
      path: '/manager/approvals',
      roles: ['MANAGER'],
    },
    {
      name: 'WFH Requests',
      icon: Home,
      path: role === 'ADMIN' ? '/admin/wfh' : '/employee/wfh',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    {
      name: 'Leave Management',
      icon: CalendarIcon,
      path: role === 'ADMIN' ? '/admin/leave' : '/employee/leave',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    {
      name: 'Tasks',
      icon: ListTodo,
      path: role === 'ADMIN' ? '/admin/tasks' : role === 'MANAGER' ? '/manager/tasks' : '/employee/tasks',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      name: 'Employees',
      icon: Users,
      path: '/admin/employees',
      roles: ['ADMIN'],
    },
    {
      name: 'Reports',
      icon: FileSpreadsheet,
      path: role === 'ADMIN' ? '/admin/reports' : '/manager/reports',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      name: 'Calendar',
      icon: CalendarIcon,
      path: role === 'ADMIN' ? '/admin/calendar' : '/employee/calendar',
      roles: ['ADMIN', 'EMPLOYEE'],
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-400">
      {/* Brand logo header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
            <img src="/logo.png" alt="Fizz PR" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">Fizz PR Portal</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        )}
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
              onClick={() => onClose && onClose()}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 touch-target ${
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

      {/* PWA Install Button inside sidebar if installable */}
      {canInstall && (
        <div className="px-4 py-2 border-t border-slate-800">
          <button
            onClick={() => {
              promptInstall();
              if (onClose) onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:from-indigo-600 hover:to-indigo-700 transition"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        </div>
      )}

      {/* Footer session details */}
      <div className="border-t border-slate-800 p-4 pb-safe">
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
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all duration-150 touch-target"
        >
          <LogOut className="h-5 w-5 text-slate-500" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Backdrop */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 shadow-2xl animate-slideInLeft">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
