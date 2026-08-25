'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to convert time string like "09:30 AM" to minutes since midnight
function timeStrToMinutes(timeStr: string): number {
  const [time, modifier] = timeStr.split(' ');
  let [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (hours === 12) {
    hours = modifier === 'AM' ? 0 : 12;
  } else if (modifier === 'PM') {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export async function clockInAction() {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  const now = new Date();
  // Get YYYY-MM-DD in local time
  const localDateStr = now.toLocaleDateString('en-CA'); 

  try {
    // 1. Check if user already clocked in today
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: localDateStr,
        },
      },
    });

    if (existing) {
      return { error: 'You have already clocked in today.' };
    }

    // 2. Check for approved Leave or WFH for today
    // (If approved WFH or Leave exists, it would have auto-created an Attendance placeholder or should block manual clock-in)
    const approvedWfh = await db.wfhRequest.findFirst({
      where: {
        userId: session.userId,
        date: localDateStr,
        status: 'APPROVED',
      },
    });

    if (approvedWfh) {
      return { error: 'Today is approved as WFH. Attendance is logged automatically.' };
    }

    const approvedLeave = await db.leaveRequest.findFirst({
      where: {
        userId: session.userId,
        startDate: { lte: localDateStr },
        endDate: { gte: localDateStr },
        status: 'APPROVED',
      },
    });

    if (approvedLeave) {
      return { error: 'You are on approved leave today.' };
    }

    // 3. Fetch Company settings for late calculation
    const settings = await db.companySettings.findUnique({
      where: { id: 'default' },
    });

    const officeStartTime = settings?.officeStartTime || '09:30 AM';
    const gracePeriod = settings?.gracePeriod || 15;

    // Calculate if late
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const officeStartMinutes = timeStrToMinutes(officeStartTime);
    const graceTimeMinutes = officeStartMinutes + gracePeriod;

    let status = 'PRESENT';
    let lateMinutes = 0;

    if (currentTotalMinutes > graceTimeMinutes) {
      status = 'LATE';
      lateMinutes = currentTotalMinutes - officeStartMinutes;
    }

    // 4. Create attendance record
    const attendance = await db.attendance.create({
      data: {
        userId: session.userId,
        date: localDateStr,
        clockIn: now,
        status,
        lateMinutes,
        notes: status === 'LATE' ? `Late by ${lateMinutes} minutes` : 'On time clock-in',
      },
    });

    // Create a notification for late clock-in
    if (status === 'LATE') {
      await db.notification.create({
        data: {
          userId: session.userId,
          title: 'Late Attendance Recorded',
          message: `You clocked in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, which is ${lateMinutes} minutes late.`,
          type: 'TASK_DEADLINE',
        },
      });
    }

    revalidatePath('/employee');
    return { success: true, attendance };
  } catch (error) {
    console.error('Clock in action error:', error);
    return { error: 'Failed to record clock-in.' };
  }
}

export async function clockOutAction() {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  const now = new Date();
  const localDateStr = now.toLocaleDateString('en-CA');

  try {
    // Find today's attendance
    const attendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: localDateStr,
        },
      },
    });

    if (!attendance) {
      return { error: 'No clock-in record found for today. Please clock in first.' };
    }

    if (attendance.clockOut) {
      return { error: 'You have already clocked out today.' };
    }

    // Calculate total hours
    const clockInTime = new Date(attendance.clockIn).getTime();
    const clockOutTime = now.getTime();
    const durationMs = clockOutTime - clockInTime;
    const workingHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100; // 2 decimal points

    // Update attendance record
    const updatedAttendance = await db.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        workingHours,
      },
    });

    revalidatePath('/employee');
    return { success: true, attendance: updatedAttendance };
  } catch (error) {
    console.error('Clock out action error:', error);
    return { error: 'Failed to record clock-out.' };
  }
}
