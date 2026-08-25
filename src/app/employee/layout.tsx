import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="EMPLOYEE" userName={session.name} />
      <div className="pl-64">
        <Topbar
          userName={session.name}
          designation={user?.designation || 'Employee'}
          departmentName={user?.department?.name}
          userId={session.userId}
        />
        <main className="pt-16 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
