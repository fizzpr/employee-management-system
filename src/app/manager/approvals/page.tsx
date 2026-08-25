import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ApprovalsClient from './approvals-client';

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  // 1. Fetch team members reporting to this manager
  const team = await db.user.findMany({
    where: { managerId: session.userId },
    select: { id: true },
  });

  const teamIds = team.map((t) => t.id);

  // 2. Fetch pending WFH requests
  const wfhRequests = await db.wfhRequest.findMany({
    where: {
      userId: { in: teamIds },
      status: 'PENDING',
    },
    include: {
      user: {
        select: { name: true, designation: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const serializedWfh = wfhRequests.map((item) => ({
    id: item.id,
    date: item.date,
    duration: item.duration,
    reason: item.reason,
    user: {
      name: item.user.name,
      designation: item.user.designation,
    },
  }));

  // 3. Fetch pending Leave requests
  const leaveRequests = await db.leaveRequest.findMany({
    where: {
      userId: { in: teamIds },
      status: 'PENDING',
    },
    include: {
      user: {
        select: { name: true, designation: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const serializedLeaves = leaveRequests.map((item) => ({
    id: item.id,
    leaveType: item.leaveType,
    startDate: item.startDate,
    endDate: item.endDate,
    reason: item.reason,
    user: {
      name: item.user.name,
      designation: item.user.designation,
    },
  }));

  return <ApprovalsClient wfhRequests={serializedWfh} leaveRequests={serializedLeaves} />;
}
