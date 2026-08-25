import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import EmployeesClient from './employees-client';

export const dynamic = 'force-dynamic';

export default async function AdminEmployeesPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // 1. Fetch all users
  const employees = await db.user.findMany({
    include: {
      department: { select: { name: true } },
      manager: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const serializedEmployees = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    role: emp.role,
    employeeId: emp.employeeId,
    designation: emp.designation,
    joiningDate: emp.joiningDate.toISOString(),
    status: emp.status,
    annualLeaveAllowance: emp.annualLeaveAllowance,
    departmentId: emp.departmentId,
    managerId: emp.managerId,
    department: emp.department,
    manager: emp.manager,
  }));

  // 2. Fetch departments
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // 3. Fetch potential managers (Managers or Admins)
  const managers = await db.user.findMany({
    where: {
      role: { in: ['MANAGER', 'ADMIN'] },
      status: 'ACTIVE',
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  return (
    <EmployeesClient
      employees={serializedEmployees}
      departments={departments}
      managers={managers}
    />
  );
}
