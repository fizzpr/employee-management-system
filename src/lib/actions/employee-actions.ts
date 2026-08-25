'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function addEmployeeAction(
  name: string,
  email: string,
  role: string,
  employeeId: string,
  designation: string,
  departmentId: string,
  managerId?: string,
  joiningDateStr?: string,
  annualLeaveAllowance: number = 12,
  password?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized. Admins only.' };
  }

  if (!name || !email || !role || !employeeId || !designation || !departmentId) {
    return { error: 'All fields are required.' };
  }

  try {
    // Check if email or employeeId exists
    const emailExists = await db.user.findUnique({ where: { email } });
    if (emailExists) return { error: 'Email already registered.' };

    const idExists = await db.user.findUnique({ where: { employeeId } });
    if (idExists) return { error: 'Employee ID already exists.' };

    const rawPassword = password && password.trim() ? password.trim() : 'Password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const joiningDate = joiningDateStr ? new Date(joiningDateStr) : new Date();

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        employeeId,
        designation,
        departmentId: departmentId || null,
        managerId: managerId || null,
        joiningDate,
        annualLeaveAllowance,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/admin/employees');
    return { success: true, user };
  } catch (error) {
    console.error('Add employee error:', error);
    return { error: 'Failed to create employee.' };
  }
}

export async function editEmployeeAction(
  id: string,
  name: string,
  email: string,
  role: string,
  employeeId: string,
  designation: string,
  departmentId: string,
  managerId?: string,
  annualLeaveAllowance: number = 12,
  password?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  try {
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return { error: 'Employee not found.' };

    // Check email uniqueness
    if (email !== existing.email) {
      const emailExists = await db.user.findUnique({ where: { email } });
      if (emailExists) return { error: 'Email is already used by another account.' };
    }

    // Check employee ID uniqueness
    if (employeeId !== existing.employeeId) {
      const idExists = await db.user.findUnique({ where: { employeeId } });
      if (idExists) return { error: 'Employee ID is already used by another account.' };
    }

    const updateData: any = {
      name,
      email,
      role,
      employeeId,
      designation,
      departmentId: departmentId || null,
      managerId: managerId || null,
      annualLeaveAllowance,
    };

    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/employees');
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Edit employee error:', error);
    return { error: 'Failed to update employee.' };
  }
}

export async function toggleEmployeeStatusAction(id: string, currentStatus: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  try {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedUser = await db.user.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath('/admin/employees');
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Toggle status error:', error);
    return { error: 'Failed to update employee status.' };
  }
}

export async function deleteEmployeeAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  try {
    // 1. Remove reporting links
    await db.user.updateMany({
      where: { managerId: id },
      data: { managerId: null },
    });

    // 2. Remove department manager links
    await db.department.updateMany({
      where: { managerId: id },
      data: { managerId: null },
    });

    // 3. Delete attendance, WFH, leaves, tasks, notifications
    await db.notification.deleteMany({ where: { userId: id } });
    await db.taskComment.deleteMany({ where: { userId: id } });
    
    // Cascading deletes for tasks assigned or created by user
    await db.task.deleteMany({
      where: {
        OR: [
          { assignedToId: id },
          { assignedById: id }
        ]
      }
    });

    await db.leaveRequest.deleteMany({ where: { userId: id } });
    await db.wfhRequest.deleteMany({ where: { userId: id } });
    await db.attendance.deleteMany({ where: { userId: id } });

    // 4. Finally delete user
    await db.user.delete({ where: { id } });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Delete employee error:', error);
    return { error: 'Failed to delete employee.' };
  }
}

export async function createDepartmentAction(name: string, managerId?: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  if (!name || name.trim() === '') {
    return { error: 'Department name is required.' };
  }

  try {
    const existing = await db.department.findUnique({
      where: { name },
    });

    if (existing) {
      return { error: 'Department name already exists.' };
    }

    const dept = await db.department.create({
      data: {
        name,
        managerId: managerId || null,
      },
    });

    // If a manager is assigned, update their departmentId too
    if (managerId) {
      await db.user.update({
        where: { id: managerId },
        data: { departmentId: dept.id },
      });
    }

    revalidatePath('/admin/employees');
    return { success: true, department: dept };
  } catch (error) {
    console.error('Create department error:', error);
    return { error: 'Failed to create department.' };
  }
}
