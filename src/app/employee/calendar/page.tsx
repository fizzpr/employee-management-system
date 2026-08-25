import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import CalendarClient from './calendar-client';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // 1. Fetch all attendance records for employee
  const attendances = await db.attendance.findMany({
    where: { userId: session.userId },
  });

  const serializedAttendances = attendances.map((a) => ({
    date: a.date,
    clockIn: a.clockIn.toISOString(),
    clockOut: a.clockOut ? a.clockOut.toISOString() : null,
    status: a.status,
    workingHours: a.workingHours,
    lateMinutes: a.lateMinutes,
    notes: a.notes,
  }));

  // 2. Fetch completed tasks for this employee to show task completion events
  const completedTasks = await db.task.findMany({
    where: {
      assignedToId: session.userId,
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      completedAt: true,
    },
  });

  const serializedTasks = completedTasks.map((t) => ({
    id: t.id,
    title: t.title,
    completedAt: t.completedAt!.toISOString(),
  }));

  return (
    <CalendarClient
      attendances={serializedAttendances}
      completedTasks={serializedTasks}
    />
  );
}
