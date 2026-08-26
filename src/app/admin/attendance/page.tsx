import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AttendanceAdminClient from './attendance-admin-client';

export const dynamic = 'force-dynamic';

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
    role: log.user.role,
    departmentName: log.user.department?.name || 'General',
    date: log.date,
    clockIn: log.clockIn.toISOString(),
    clockOut: log.clockOut ? log.clockOut.toISOString() : null,
    workingHours: log.workingHours,
    status: log.status,
    lateMinutes: log.lateMinutes,
    notes: log.notes,
    punchInPhoto: log.punchInPhoto || null,
    punchInLat: log.punchInLat || null,
    punchInLng: log.punchInLng || null,
    punchInAddress: log.punchInAddress || null,
    punchOutPhoto: log.punchOutPhoto || null,
    punchOutLat: log.punchOutLat || null,
    punchOutLng: log.punchOutLng || null,
    punchOutAddress: log.punchOutAddress || null,
  }));

  return (
    <AttendanceAdminClient
      attendances={serializedLogs}
      departments={departments}
    />
  );
}
