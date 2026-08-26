'use client';

import { useState, useEffect } from 'react';
import { Bell, Menu, X, Check, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePwa } from '@/components/pwa-install-provider';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface TopbarProps {
  userName: string;
  designation: string;
  departmentName?: string;
  userId: string;
  onOpenMobileMenu?: () => void;
}

export default function Topbar({ userName, designation, departmentName, userId, onOpenMobileMenu }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const router = useRouter();
  const { canInstall, promptInstall } = usePwa();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking all notifications as read', error);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-sm pt-safe">
      {/* Left Section: Mobile Menu Toggle & Greeting */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition touch-target"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        <div>
          <h1 className="text-base sm:text-xl font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-xs md:max-w-none">
            {getGreeting()}, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">{getFormattedDate()}</p>
        </div>
      </div>

      {/* Right Section: PWA Install, Notifications and Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* PWA Install Button in Header */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition shadow-xs"
            title="Install App"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition touch-target"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-30">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`flex gap-3 p-3.5 transition hover:bg-slate-50 ${
                        !item.read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`text-xs text-slate-800 ${!item.read ? 'font-bold' : 'font-medium'}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <button
                              onClick={() => handleMarkAsRead(item.id)}
                              className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* Profile Details */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{userName}</p>
            <p className="text-xs text-slate-500 truncate max-w-[140px]">
              {designation} {departmentName ? `• ${departmentName}` : ''}
            </p>
          </div>
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs sm:text-sm uppercase ring-2 ring-indigo-50 shrink-0">
            {userName ? userName.slice(0, 2) : 'US'}
          </div>
        </div>
      </div>
    </header>
  );
}
