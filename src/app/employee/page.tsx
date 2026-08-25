import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ClockPanel from '@/components/clock-panel';
import Link from 'next/link';
import {
  Calendar,
  Briefcase,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

// Helper to count weekdays in the month up to a given day
function getWeekdaysUpTo(year: number, month: number, upToDay: number): number {
  let count = 0;
  for (let day = 1; day <= upToDay; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sat and Sun
      count++;
    }
  }
  return count;
}

export default async function EmployeeDashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthStr = String(currentMonth + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonthStr}`;

  // 1. Fetch Today's Details
  const todayAttendance = await db.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId,
        date: todayStr,
      },
    },
  });

  const hasWfhToday = await db.wfhRequest.findFirst({
    where: {
      userId: session.userId,
      date: todayStr,
      status: 'APPROVED',
    },
  }).then(res => !!res);

  const hasLeaveToday = await db.leaveRequest.findFirst({
    where: {
      userId: session.userId,
      startDate: { lte: todayStr },
      endDate: { gte: todayStr },
      status: 'APPROVED',
    },
  }).then(res => !!res);

  // 2. Fetch Monthly Logs for Stats
  const monthlyAttendances = await db.attendance.findMany({
    where: {
      userId: session.userId,
      date: { startsWith: monthPrefix },
    },
  });

  // Calculate Monthly Summary
  const presentDays = monthlyAttendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const wfhDays = monthlyAttendances.filter(a => a.status === 'WFH').length;
  const leaveDays = monthlyAttendances.filter(a => a.status === 'LEAVE').length;
  const lateDays = monthlyAttendances.filter(a => a.status === 'LATE').length;
  
  const totalWorkingHours = monthlyAttendances.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
  
  // Absent calculation: weekdays up to today minus (Present + WFH + Leave)
  const weekdaysUpToToday = getWeekdaysUpTo(currentYear, currentMonth, now.getDate());
  const loggedDays = presentDays + wfhDays + leaveDays;
  const absentDays = Math.max(0, weekdaysUpToToday - loggedDays);

  // 3. Fetch Tasks
  const allTasks = await db.task.findMany({
    where: { assignedToId: session.userId },
  });

  const tasksAssigned = allTasks.length;
  const tasksCompleted = allTasks.filter(t => t.status === 'COMPLETED').length;
  const tasksPending = allTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length;
  const tasksOverdue = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;

  // Active Tasks to display (limit 3)
  const activeTasks = allTasks
    .filter(t => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW'].includes(t.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 p-8">
      {/* Greetings Block */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {session.name} 👋</h1>
        <p className="text-xs text-slate-500">Employee ID: {session.employeeId}</p>
      </div>

      {/* Main Grid: Clock Panel & Quick Links */}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Quick Actions</h3>
            <p className="text-xs text-slate-400">Jump to actions directly</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/employee/wfh"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:bg-slate-100 hover:shadow-sm transition"
            >
              <Home className="h-6 w-6 text-teal-600" />
              <span className="text-xs font-bold text-slate-700">Request WFH</span>
            </Link>
            <Link
              href="/employee/leave"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:bg-slate-100 hover:shadow-sm transition"
            >
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Apply Leave</span>
            </Link>
            <Link
              href="/employee/tasks"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:bg-slate-100 hover:shadow-sm transition"
            >
              <Briefcase className="h-6 w-6 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">My Tasks</span>
            </Link>
            <Link
              href="/employee/calendar"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:bg-slate-100 hover:shadow-sm transition"
            >
              <Calendar className="h-6 w-6 text-amber-600" />
              <span className="text-xs font-bold text-slate-700">Calendar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-800">Monthly Summary — {now.toLocaleString('default', { month: 'long' })}</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Working Days</span>
            <p className="mt-1 text-2xl font-bold text-slate-800">{weekdaysUpToToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
            <p className="mt-1 text-2xl font-bold text-green-600">{presentDays}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">WFH</span>
            <p className="mt-1 text-2xl font-bold text-teal-600">{wfhDays}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Leave</span>
            <p className="mt-1 text-2xl font-bold text-blue-600">{leaveDays}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
            <p className="mt-1 text-2xl font-bold text-amber-600">{lateDays}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
            <p className="mt-1 text-2xl font-bold text-red-600">{absentDays}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Working Hours</span>
            <p className="mt-1 text-lg font-bold text-slate-800 leading-8">{Math.round(totalWorkingHours)}h</p>
          </div>
        </div>
      </div>

      {/* Task Performance Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Tasks Stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tasks Overview</h3>
          <p className="text-xs text-slate-400">Current work performance</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Completed</p>
                <p className="text-lg font-extrabold text-slate-800">{tasksCompleted}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <Clock className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Pending</p>
                <p className="text-lg font-extrabold text-slate-800">{tasksPending}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Overdue</p>
                <p className="text-lg font-extrabold text-slate-800">{tasksOverdue}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <FileText className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Total</p>
                <p className="text-lg font-extrabold text-slate-800">{tasksAssigned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Active Tasks List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Active Tasks</h3>
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
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition"
                >
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-bold text-slate-700">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400 truncate max-w-sm">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
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
