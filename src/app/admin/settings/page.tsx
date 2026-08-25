import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // 1. Fetch settings from db
  let settings = await db.companySettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    // Fallback if not seeded
    settings = {
      id: 'default',
      companyName: 'Fizz PR Agency',
      companyLogo: null,
      workingDays: 'MON,TUE,WED,THU,FRI',
      officeStartTime: '09:30 AM',
      officeEndTime: '06:30 PM',
      gracePeriod: 15,
      halfDayRules: 'Clock in after 1:00 PM counts as half-day',
      leaveTypes: 'CASUAL,SICK,EARNED,EMERGENCY,OTHER',
      leaveAllowance: 12,
      carryForwardRules: 'Up to 5 unused leaves can be carried forward',
      taskStatuses: 'ASSIGNED,IN_PROGRESS,REVIEW,COMPLETED,OVERDUE',
      priorityLevels: 'LOW,MEDIUM,HIGH,URGENT',
    };
  }

  // 2. Fetch logged in admin details
  const adminUser = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  return (
    <SettingsClient
      settings={settings}
      adminName={adminUser?.name || ''}
      adminEmail={adminUser?.email || ''}
    />
  );
}
