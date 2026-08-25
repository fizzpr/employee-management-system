import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
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

  // Allow MANAGER and ADMIN
  if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role="MANAGER" userName={session.name} />
      <div className="pl-64">
        <Topbar
          userName={session.name}
          designation={user?.designation || 'Manager'}
          departmentName={user?.department?.name}
          userId={session.userId}
        />
        <main className="pt-16 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
