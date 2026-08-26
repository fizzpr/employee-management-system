import DashboardLayoutClient from '@/components/dashboard-layout-client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Fetch full details of admin including department
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (session.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <DashboardLayoutClient
      role="ADMIN"
      userName={session.name}
      designation={user?.designation || 'Administrator'}
      departmentName={user?.department?.name}
      userId={session.userId}
    >
      {children}
    </DashboardLayoutClient>
  );
}
