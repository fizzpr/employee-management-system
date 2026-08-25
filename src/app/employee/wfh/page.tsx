import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import WfhClient from './wfh-client';

export default async function WfhPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Fetch history
  const history = await db.wfhRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  // Convert history items to JSON-safe structures (specifically converting dates)
  const serializedHistory = history.map((item) => ({
    id: item.id,
    date: item.date,
    duration: item.duration,
    reason: item.reason,
    status: item.status,
    managerComment: item.managerComment,
  }));

  // 2. Fetch total approved days in the current month
  const wfhApprovedCount = await db.attendance.count({
    where: {
      userId: session.userId,
      date: { startsWith: currentMonthPrefix },
      status: 'WFH',
    },
  });

  return <WfhClient history={serializedHistory} totalApprovedDays={wfhApprovedCount} />;
}
