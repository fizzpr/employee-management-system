import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import WfhAdminClient from './wfh-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminWfhPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all WFH requests in company
  const requests = await db.wfhRequest.findMany({
    include: {
      user: {
        select: { name: true, designation: true, employeeId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedRequests = requests.map((item) => ({
    id: item.id,
    date: item.date,
    duration: item.duration,
    reason: item.reason,
    status: item.status,
    managerComment: item.managerComment,
    user: {
      name: item.user.name,
      designation: item.user.designation,
      employeeId: item.user.employeeId,
    },
  }));

  return <WfhAdminClient wfhRequests={serializedRequests} />;
}
