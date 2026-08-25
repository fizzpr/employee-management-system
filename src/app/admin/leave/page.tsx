import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import LeaveAdminClient from './leave-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminLeavePage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all Leave requests in company
  const requests = await db.leaveRequest.findMany({
    include: {
      user: {
        select: { name: true, designation: true, employeeId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedRequests = requests.map((item) => ({
    id: item.id,
    leaveType: item.leaveType,
    startDate: item.startDate,
    endDate: item.endDate,
    reason: item.reason,
    status: item.status,
    comment: item.comment,
    user: {
      name: item.user.name,
      designation: item.user.designation,
      employeeId: item.user.employeeId,
    },
  }));

  return <LeaveAdminClient leaveRequests={serializedRequests} />;
}
