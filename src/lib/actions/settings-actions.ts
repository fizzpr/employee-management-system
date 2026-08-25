'use server';

import { db } from '@/lib/db';
import { getSession, signJWT, setSessionCookie } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateCompanySettingsAction(
  companyName: string,
  officeStartTime: string,
  officeEndTime: string,
  gracePeriodStr: string,
  workingDays: string,
  carryForwardRules: string
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized. Admin settings panel.' };
  }

  if (!companyName || !officeStartTime || !officeEndTime || !gracePeriodStr || !workingDays) {
    return { error: 'All primary fields are required.' };
  }

  try {
    const gracePeriod = parseInt(gracePeriodStr, 10);
    if (isNaN(gracePeriod)) {
      return { error: 'Grace period must be a valid number.' };
    }

    const settings = await db.companySettings.upsert({
      where: { id: 'default' },
      update: {
        companyName,
        officeStartTime,
        officeEndTime,
        gracePeriod,
        workingDays,
        carryForwardRules,
      },
      create: {
        id: 'default',
        companyName,
        officeStartTime,
        officeEndTime,
        gracePeriod,
        workingDays,
        carryForwardRules,
      },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/employee');
    return { success: true, settings };
  } catch (error) {
    console.error('Update company settings error:', error);
    return { error: 'Failed to update company settings.' };
  }
}

export async function updateAdminCredentialsAction(
  email: string,
  name: string,
  password?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  if (!email || !name) {
    return { error: 'Name and Email are required.' };
  }

  try {
    // Check email collision
    if (email !== session.email) {
      const collision = await db.user.findUnique({ where: { email } });
      if (collision) {
        return { error: 'Email address is already in use.' };
      }
    }

    const updateData: any = {
      name,
      email,
    };

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' };
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    // Sign new JWT session token and update cookie
    const token = await signJWT({
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
      employeeId: updatedUser.employeeId,
    });
    await setSessionCookie(token);

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Update credentials error:', error);
    return { error: 'Failed to update credentials.' };
  }
}
