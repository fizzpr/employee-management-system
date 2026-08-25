import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import CalendarAdminClient from './calendar-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // 1. Fetch active employees
  const employees = await db.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, employeeId: true, designation: true },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch all attendance logs in the company
  const attendances = await db.attendance.findMany({});

  const serializedAttendances = attendances.map((a) => ({
    userId: a.userId,
    date: a.date,
    clockIn: a.clockIn.toISOString(),
    clockOut: a.clockOut ? a.clockOut.toISOString() : null,
    status: a.status,
    workingHours: a.workingHours,
    lateMinutes: a.lateMinutes,
    notes: a.notes,
  }));

  // 3. Fetch completed tasks in the company
  const completedTasks = await db.task.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      id: true,
      assignedToId: true,
      title: true,
      completedAt: true,
    },
  });

  const serializedTasks = completedTasks.map((t) => ({
    id: t.id,
    userId: t.assignedToId,
    title: t.title,
    completedAt: t.completedAt!.toISOString(),
  }));

  return (
    <CalendarAdminClient
      employees={employees}
      attendances={serializedAttendances}
      completedTasks={serializedTasks}
    />
  );
}
