import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadAttendancePhoto } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ status: 'Punch API endpoint active' });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const body = await req.json();
    const { photo, lat, lng, address } = body;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check existing attendance record for today
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: todayStr,
        },
      },
    });

    // Check if user has WFH or Leave today
    const wfhToday = await db.wfhRequest.findFirst({
      where: { userId: session.userId, date: todayStr, status: 'APPROVED' },
    });
    if (wfhToday) {
      return NextResponse.json({ error: 'You are on approved WFH today. Punching is disabled.' }, { status: 400 });
    }

    const leaveToday = await db.leaveRequest.findFirst({
      where: {
        userId: session.userId,
        status: 'APPROVED',
        startDate: { lte: todayStr },
        endDate: { gte: todayStr },
      },
    });
    if (leaveToday) {
      return NextResponse.json({ error: 'You are on approved Leave today. Punching is disabled.' }, { status: 400 });
    }

    // Determine Punch In vs Punch Out
    if (!existing || !existing.clockIn) {
      // PUNCH IN
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadAttendancePhoto(photo, session.userId, 'in');
      }

      // Check settings for office start time & grace period
      let lateMinutes = 0;
      let status = 'PRESENT';

      const companySettings = await db.companySettings.findUnique({ where: { id: 'default' } });
      const officeStartTimeStr = companySettings?.officeStartTime || '09:30 AM';
      const gracePeriod = companySettings?.gracePeriod ?? 15;

      const [timeStr, modifier] = officeStartTimeStr.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const officeStart = new Date(now);
      officeStart.setHours(hours, minutes, 0, 0);

      const diffMs = now.getTime() - officeStart.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes > gracePeriod) {
        status = 'LATE';
        lateMinutes = diffMinutes;
      }

      const attendance = await db.attendance.upsert({
        where: {
          userId_date: {
            userId: session.userId,
            date: todayStr,
          },
        },
        create: {
          userId: session.userId,
          date: todayStr,
          clockIn: now,
          status,
          lateMinutes,
          punchInPhoto: photoUrl || null,
          punchInLat: lat ? parseFloat(lat) : null,
          punchInLng: lng ? parseFloat(lng) : null,
          punchInAddress: address || null,
        },
        update: {
          clockIn: now,
          status,
          lateMinutes,
          punchInPhoto: photoUrl || null,
          punchInLat: lat ? parseFloat(lat) : null,
          punchInLng: lng ? parseFloat(lng) : null,
          punchInAddress: address || null,
        },
      });

      return NextResponse.json({ success: true, type: 'in', attendance });

    } else if (!existing.clockOut) {
      // PUNCH OUT
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadAttendancePhoto(photo, session.userId, 'out');
      }

      const clockInTime = new Date(existing.clockIn).getTime();
      const diffMs = now.getTime() - clockInTime;
      const workingHours = parseFloat((diffMs / 3600000).toFixed(2));

      const attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          clockOut: now,
          workingHours,
          punchOutPhoto: photoUrl || null,
          punchOutLat: lat ? parseFloat(lat) : null,
          punchOutLng: lng ? parseFloat(lng) : null,
          punchOutAddress: address || null,
        },
      });

      return NextResponse.json({ success: true, type: 'out', attendance });
    } else {
      return NextResponse.json({ error: "You have already completed today's attendance logs." }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in /api/attendance/punch:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
