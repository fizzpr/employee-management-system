'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  userName: string;
  designation: string;
  departmentName?: string;
  userId: string;
}

export default function DashboardLayoutClient({
  children,
  role,
  userName,
  designation,
  departmentName,
  userId,
}: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar for both Desktop and Mobile Drawer */}
      <Sidebar
        role={role}
        userName={userName}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 pl-0 transition-all">
        <Topbar
          userName={userName}
          designation={designation}
          departmentName={departmentName}
          userId={userId}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="pt-16 min-h-screen p-4 sm:p-6 lg:p-8 pb-safe">{children}</main>
      </div>
    </div>
  );
}
