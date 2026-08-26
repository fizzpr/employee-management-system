import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ClockPanel from '@/components/clock-panel';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

import {
  Calendar,
  Briefcase,
  Home,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export default async function EmployeeDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day and last day of current month
  const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

  // 1. Fetch Today's Attendance
  const todayAttendance = await db.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId,
        date: todayStr,
      },
    },
  });

  // 2. Fetch WFH Request for Today
  const todayWfh = await db.wfhRequest.findFirst({
    where: {
      userId: session.userId,
      date: todayStr,
      status: 'APPROVED',
    },
  });

  // 3. Fetch Leave Request for Today
  const todayLeave = await db.leaveRequest.findFirst({
    where: {
      userId: session.userId,
      startDate: { lte: todayStr },
      endDate: { gte: todayStr },
      status: 'APPROVED',
    },
  });

  // 4. Fetch Monthly Attendance Stats
  const monthlyLogs = await db.attendance.findMany({
    where: {
      userId: session.userId,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
    orderBy: { date: 'desc' },
  });

  // Calculate Monthly Metrics
  const daysPresent = monthlyLogs.filter((log) => log.status === 'PRESENT' || log.status === 'LATE').length;
  const daysLate = monthlyLogs.filter((log) => log.status === 'LATE').length;
  const daysWfh = monthlyLogs.filter((log) => log.status === 'WFH').length;
  const daysLeave = monthlyLogs.filter((log) => log.status === 'LEAVE').length;
  const totalHours = monthlyLogs.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

  // Total weekdays elapsed in month up to today
  let weekdaysUpToToday = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) {
      weekdaysUpToToday++;
    }
  }

  // Absent days calculation
  const recordedDays = daysPresent + daysWfh + daysLeave;
  const daysAbsent = Math.max(0, weekdaysUpToToday - recordedDays);

  // Average Working Hours
  const avgHours = daysPresent > 0 ? (totalHours / daysPresent).toFixed(1) : '0';

  // 5. Fetch Recent Tasks
  const activeTasks = await db.task.findMany({
    where: {
      assignedToId: session.userId,
      status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'OVERDUE'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  const hasWfhToday = !!todayWfh;
  const hasLeaveToday = !!todayLeave;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Clock Panel */}
        <div className="lg:col-span-2">
          <ClockPanel
            todayAttendance={todayAttendance}
            hasWfhToday={hasWfhToday}
            hasLeaveToday={hasLeaveToday}
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Quick Actions</h3>
            <p className="text-xs text-slate-400">Jump to actions directly</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/employee/wfh"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4 text-center hover:bg-slate-100 hover:shadow-xs transition touch-target"
            >
              <Home className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              <span className="text-xs font-bold text-slate-700">Request WFH</span>
            </Link>
            <Link
              href="/employee/leave"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4 text-center hover:bg-slate-100 hover:shadow-xs transition touch-target"
            >
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Apply Leave</span>
            </Link>
            <Link
              href="/employee/tasks"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4 text-center hover:bg-slate-100 hover:shadow-xs transition touch-target"
            >
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">My Tasks</span>
            </Link>
            <Link
              href="/employee/calendar"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4 text-center hover:bg-slate-100 hover:shadow-xs transition touch-target"
            >
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              <span className="text-xs font-bold text-slate-700">Calendar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Monthly Summary — {now.toLocaleString('default', { month: 'long' })}</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Working Days</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-800">{weekdaysUpToToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Days Present</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-green-600">{daysPresent}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">WFH Days</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-teal-600">{daysWfh}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Leaves Taken</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-blue-600">{daysLeave}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Days Late</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-500">{daysLate}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Absences</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-red-500">{daysAbsent}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Avg Hours/Day</span>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-indigo-600">{avgHours}h</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Logs & Active Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Attendance Logs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Recent Attendance Logs</h3>
              <span className="text-xs font-medium text-slate-400">Last 5 Logs</span>
            </div>
            <p className="text-xs text-slate-400">Your recent clock-in & clock-out history</p>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {monthlyLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-8">
                No attendance records found for this month.
              </div>
            ) : (
              monthlyLogs.slice(0, 5).map((log) => {
                const clockInTime = new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const clockOutTime = log.clockOut
                  ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 sm:p-4 hover:border-slate-200 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{log.date}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        In: {clockInTime} • Out: {clockOutTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">
                        {log.workingHours ? `${log.workingHours}h` : '--'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          log.status === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-100' :
                          log.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          log.status === 'WFH' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                          log.status === 'LEAVE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Tasks Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Active Tasks</h3>
              <Link href="/employee/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-400">Tasks requiring immediate attention</p>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {activeTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-8">
                No active tasks. Good job!
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 sm:p-4 hover:border-slate-200 transition"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="truncate text-xs sm:text-sm font-bold text-slate-700">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400 truncate max-w-xs">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right shrink-0">
                    <div>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                        task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">Due: {task.dueDate}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
