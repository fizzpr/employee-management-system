import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AttendanceAdminClient from './attendance-admin-client';

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // 1. Fetch departments
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch all attendance logs
  const logs = await db.attendance.findMany({
    include: {
      user: {
        include: { department: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.user.name,
    userEmployeeId: log.user.employeeId,
    designation: log.user.designation,
    departmentName: log.user.department?.name || 'General',
    date: log.date,
    clockIn: log.clockIn.toISOString(),
    clockOut: log.clockOut ? log.clockOut.toISOString() : null,
    workingHours: log.workingHours,
    status: log.status,
    lateMinutes: log.lateMinutes,
    notes: log.notes,
  }));

  return (
    <AttendanceAdminClient
      attendances={serializedLogs}
      departments={departments}
    />
  );
}
