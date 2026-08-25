import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import LeaveClient from './leave-client';

export default async function LeavePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // 1. Fetch user leave allowance
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { annualLeaveAllowance: true, usedLeaveAllowance: true },
  });

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch history
  const history = await db.leaveRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  const serializedHistory = history.map((item) => ({
    id: item.id,
    leaveType: item.leaveType,
    startDate: item.startDate,
    endDate: item.endDate,
    reason: item.reason,
    status: item.status,
    comment: item.comment,
  }));

  return (
    <LeaveClient
      history={serializedHistory}
      annualAllowance={user.annualLeaveAllowance}
      usedAllowance={user.usedLeaveAllowance}
    />
  );
}
