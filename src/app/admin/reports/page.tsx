import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ReportsClient from '@/components/reports-client';

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // 1. Fetch active employees
  const employees = await db.user.findMany({
    where: { status: 'ACTIVE' },
    include: { department: true },
    orderBy: { name: 'asc' },
  });

  const serializedEmployees = employees.map((e) => ({
    id: e.id,
    name: e.name,
    employeeId: e.employeeId,
    departmentId: e.departmentId,
    departmentName: e.department?.name || 'General',
    designation: e.designation,
  }));

  // 2. Fetch departments
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // 3. Fetch all attendance logs
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
    departmentName: log.user.department?.name || 'General',
    date: log.date,
    clockIn: log.clockIn.toISOString(),
    clockOut: log.clockOut ? log.clockOut.toISOString() : null,
    workingHours: log.workingHours,
    status: log.status,
    lateMinutes: log.lateMinutes,
    notes: log.notes,
  }));

  // 4. Fetch all tasks
  const tasks = await db.task.findMany({
    select: { id: true, assignedToId: true, status: true, dueDate: true },
  });

  return (
    <ReportsClient
      employees={serializedEmployees}
      departments={departments}
      attendances={serializedLogs}
      tasks={tasks}
      role="ADMIN"
    />
  );
}
