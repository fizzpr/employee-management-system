import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ReportsClient from '@/components/reports-client';

export default async function ManagerReportsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  // 1. Fetch team members reporting to this manager
  const team = await db.user.findMany({
    where: { managerId: session.userId, status: 'ACTIVE' },
    include: { department: true },
    orderBy: { name: 'asc' },
  });

  const teamIds = team.map((t) => t.id);

  const serializedEmployees = team.map((e) => ({
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

  // 3. Fetch attendance logs for team members only
  const logs = await db.attendance.findMany({
    where: {
      userId: { in: teamIds },
    },
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

  // 4. Fetch tasks assigned to team members
  const tasks = await db.task.findMany({
    where: {
      assignedToId: { in: teamIds },
    },
    select: { id: true, assignedToId: true, status: true, dueDate: true },
  });

  return (
    <ReportsClient
      employees={serializedEmployees}
      departments={departments}
      attendances={serializedLogs}
      tasks={tasks}
      role="MANAGER"
    />
  );
}
