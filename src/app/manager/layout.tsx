import DashboardLayoutClient from '@/components/dashboard-layout-client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <DashboardLayoutClient
      role="MANAGER"
      userName={session.name}
      designation={user?.designation || 'Manager'}
      departmentName={user?.department?.name}
      userId={session.userId}
    >
      {children}
    </DashboardLayoutClient>
  );
}
