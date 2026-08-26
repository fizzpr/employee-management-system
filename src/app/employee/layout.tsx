import DashboardLayoutClient from '@/components/dashboard-layout-client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function EmployeeLayout({
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

  return (
    <DashboardLayoutClient
      role="EMPLOYEE"
      userName={session.name}
      designation={user?.designation || 'Employee'}
      departmentName={user?.department?.name}
      userId={session.userId}
    >
      {children}
    </DashboardLayoutClient>
  );
}
