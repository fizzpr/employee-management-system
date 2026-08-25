'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to list all dates in a range "YYYY-MM-DD"
function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toLocaleDateString('en-CA')); // YYYY-MM-DD
  }
  return dates;
}

export async function applyLeaveAction(
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string
) {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  if (!leaveType || !startDate || !endDate || !reason) {
    return { error: 'All fields are required.' };
  }

  try {
    // 1. Calculate duration (in days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return { error: 'End date cannot be before start date.' };
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 2. Fetch employee leave balance
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { annualLeaveAllowance: true, usedLeaveAllowance: true, managerId: true },
    });

    if (!user) {
      return { error: 'User details not found.' };
    }

    const remaining = user.annualLeaveAllowance - user.usedLeaveAllowance;
    if (durationDays > remaining) {
      return { error: `Insufficient leave balance. You requested ${durationDays} days but only have ${remaining} days left.` };
    }

    // 3. Check for overlaps
    const requestedDates = getDatesInRange(startDate, endDate);
    
    // Check overlapping approved/pending leaves
    const overlappingLeave = await db.leaveRequest.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlappingLeave) {
      return { error: 'You have an overlapping leave request for this date range.' };
    }

    // Check overlapping approved/pending WFHs
    const overlappingWfh = await db.wfhRequest.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['PENDING', 'APPROVED'] },
        date: { in: requestedDates },
      },
    });

    if (overlappingWfh) {
      return { error: 'You have a WFH request overlapping with this leave range.' };
    }

    // 4. Create request
    const request = await db.leaveRequest.create({
      data: {
        userId: session.userId,
        leaveType,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
      },
    });

    // 5. Notify manager
    if (user.managerId) {
      await db.notification.create({
        data: {
          userId: user.managerId,
          title: 'New Leave Application',
          message: `${session.name} applied for ${leaveType} leave from ${startDate} to ${endDate} (${durationDays} days).`,
          type: 'APPROVAL_REQUEST',
        },
      });
    }

    revalidatePath('/employee/leave');
    return { success: true, request };
  } catch (error) {
    console.error('Apply leave error:', error);
    return { error: 'Failed to apply for leave.' };
  }
}

export async function approveRejectLeaveAction(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
    return { error: 'Unauthorized.' };
  }

  try {
    const request = await db.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return { error: 'Request not found.' };
    }

    if (request.status !== 'PENDING') {
      return { error: 'Request has already been processed.' };
    }

    // Calculate duration
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (status === 'APPROVED') {
      // Re-verify leave balance
      const remaining = request.user.annualLeaveAllowance - request.user.usedLeaveAllowance;
      if (durationDays > remaining) {
        return { error: `Employee has insufficient leave balance (${remaining} days remaining). Cannot approve.` };
      }

      // 1. Deduct leave allowance
      await db.user.update({
        where: { id: request.userId },
        data: {
          usedLeaveAllowance: {
            increment: durationDays,
          },
        },
      });

      // 2. Insert Attendance place-holders for all dates in range
      const dates = getDatesInRange(request.startDate, request.endDate);
      const clockTime = new Date(`${request.startDate}T09:30:00Z`);
      
      for (const d of dates) {
        await db.attendance.upsert({
          where: {
            userId_date: {
              userId: request.userId,
              date: d,
            },
          },
          update: {
            status: 'LEAVE',
            clockIn: clockTime,
            clockOut: clockTime, // same as clock-in
            workingHours: 0,
            lateMinutes: 0,
            notes: `Approved Leave: ${request.leaveType}`,
          },
          create: {
            userId: request.userId,
            date: d,
            clockIn: clockTime,
            clockOut: clockTime,
            status: 'LEAVE',
            workingHours: 0,
            lateMinutes: 0,
            notes: `Approved Leave: ${request.leaveType}`,
          },
        });
      }
    }

    // Update request status
    const updatedRequest = await db.leaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedById: session.userId,
        comment: comment || null,
      },
    });

    // Notify employee
    await db.notification.create({
      data: {
        userId: request.userId,
        title: `Leave Request ${status.toLowerCase()}`,
        message: `Your leave request from ${request.startDate} to ${request.endDate} has been ${status.toLowerCase()}${
          comment ? `. Comment: ${comment}` : ''
        }.`,
        type: 'LEAVE_STATUS',
      },
    });

    revalidatePath('/manager/approvals');
    revalidatePath('/employee/leave');
    return { success: true, request: updatedRequest };
  } catch (error) {
    console.error('Process leave request error:', error);
    return { error: 'Failed to process request.' };
  }
}
