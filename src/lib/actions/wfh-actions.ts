'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function applyWfhAction(date: string, duration: string, reason: string) {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  if (!date || !reason) {
    return { error: 'Date and reason are required.' };
  }

  try {
    // 1. Check if WFH or Leave already exists for this date
    const existingWfh = await db.wfhRequest.findFirst({
      where: {
        userId: session.userId,
        date: date,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingWfh) {
      return { error: 'You already have a WFH request for this date.' };
    }

    const existingLeave = await db.leaveRequest.findFirst({
      where: {
        userId: session.userId,
        startDate: { lte: date },
        endDate: { gte: date },
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingLeave) {
      return { error: 'You are on leave or have a pending leave request for this date.' };
    }

    // Get manager ID to notify
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { managerId: true },
    });

    // 2. Create WFH Request
    const request = await db.wfhRequest.create({
      data: {
        userId: session.userId,
        date,
        duration,
        reason,
        status: 'PENDING',
      },
    });

    // 3. Notify manager
    if (user?.managerId) {
      await db.notification.create({
        data: {
          userId: user.managerId,
          title: 'New WFH Request',
          message: `${session.name} has requested WFH for ${date} (${duration} day).`,
          type: 'APPROVAL_REQUEST',
        },
      });
    }

    revalidatePath('/employee/wfh');
    return { success: true, request };
  } catch (error) {
    console.error('Apply WFH error:', error);
    return { error: 'Failed to submit WFH request.' };
  }
}

export async function approveRejectWfhAction(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
    return { error: 'Unauthorized.' };
  }

  try {
    const request = await db.wfhRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return { error: 'Request not found.' };
    }

    if (request.status !== 'PENDING') {
      return { error: 'This request has already been processed.' };
    }

    // Update request
    const updatedRequest = await db.wfhRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedById: session.userId,
        managerComment: comment || null,
      },
    });

    // If approved, create/update attendance record for that date
    if (status === 'APPROVED') {
      const clockTime = new Date(`${request.date}T09:30:00Z`);
      const clockOutTime = new Date(`${request.date}T18:30:00Z`);

      await db.attendance.upsert({
        where: {
          userId_date: {
            userId: request.userId,
            date: request.date,
          },
        },
        update: {
          status: 'WFH',
          clockIn: clockTime,
          clockOut: clockOutTime,
          workingHours: request.duration === 'HALF' ? 4 : 8,
          lateMinutes: 0,
          notes: `Approved WFH (${request.duration} day)`,
        },
        create: {
          userId: request.userId,
          date: request.date,
          clockIn: clockTime,
          clockOut: clockOutTime,
          status: 'WFH',
          workingHours: request.duration === 'HALF' ? 4 : 8,
          lateMinutes: 0,
          notes: `Approved WFH (${request.duration} day)`,
        },
      });
    }

    // Notify employee
    await db.notification.create({
      data: {
        userId: request.userId,
        title: `WFH Request ${status.toLowerCase()}`,
        message: `Your WFH request for ${request.date} has been ${status.toLowerCase()}${
          comment ? `. Comment: ${comment}` : ''
        }.`,
        type: 'WFH_STATUS',
      },
    });

    revalidatePath('/manager/approvals');
    revalidatePath('/employee/wfh');
    return { success: true, request: updatedRequest };
  } catch (error) {
    console.error('Process WFH request error:', error);
    return { error: 'Failed to process request.' };
  }
}
