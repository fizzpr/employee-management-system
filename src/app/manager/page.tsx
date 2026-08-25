import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import {
  Users,
  CheckCircle,
  Home,
  Calendar,
  Clock,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  CheckSquare,
} from 'lucide-react';

export default async function ManagerDashboard() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const todayStr = new Date().toLocaleDateString('en-CA');

  // 1. Fetch team members reporting to this manager
  const team = await db.user.findMany({
    where: { managerId: session.userId },
    include: {
      attendances: {
        where: { date: todayStr },
      },
    },
  });

  const teamIds = team.map((t) => t.id);
  const totalTeamCount = team.length;

  // 2. Calculate Today's Team Statuses
  let presentCount = 0;
  let wfhCount = 0;
  let leaveCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  team.forEach((member) => {
    const attendance = member.attendances[0];
    if (attendance) {
      if (attendance.status === 'PRESENT') presentCount++;
      else if (attendance.status === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (attendance.status === 'WFH') wfhCount++;
      else if (attendance.status === 'LEAVE') leaveCount++;
    } else {
      // Check if weekend, if not weekend mark absent
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (!isWeekend) absentCount++;
    }
  });

  // 3. Fetch Pending Approvals count for team
  const pendingWfhCount = await db.wfhRequest.count({
    where: {
      userId: { in: teamIds },
      status: 'PENDING',
    },
  });

  const pendingLeaveCount = await db.leaveRequest.count({
    where: {
      userId: { in: teamIds },
      status: 'PENDING',
    },
  });

  const totalPendingApprovals = pendingWfhCount + pendingLeaveCount;

  // 4. Fetch Team Tasks stats
  const teamTasks = await db.task.findMany({
    where: { assignedToId: { in: teamIds } },
  });

  const tasksAssigned = teamTasks.length;
  const tasksCompleted = teamTasks.filter((t) => t.status === 'COMPLETED').length;
  const tasksPending = teamTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length;
  const tasksOverdue = teamTasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;

  // Completion Rate calculation
  const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

  return (
    <div className="space-y-8 p-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manager Console</h1>
          <p className="text-xs text-slate-500">Monitor team availability, progress tasks, and approve leaves</p>
        </div>
        <Link
          href="/manager/team"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          View Team Roster
          <ArrowUpRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Team</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalTeamCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Present Today</span>
          <p className="text-2xl font-extrabold text-green-600 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">WFH Today</span>
          <p className="text-2xl font-extrabold text-teal-600 mt-1">{wfhCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">On Leave Today</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{leaveCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Late Today</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{lateCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Absent Today</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Grid: Approvals Box & Task stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approvals Action card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Pending Approvals</h3>
            <p className="text-xs text-slate-400">Applications awaiting your decision</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-xs font-semibold text-slate-600">WFH Requests</span>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">{pendingWfhCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Leave requests</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{pendingLeaveCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/manager/approvals"
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white shadow transition ${
                totalPendingApprovals > 0 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed pointer-events-none'
              }`}
            >
              Process Approvals ({totalPendingApprovals})
            </Link>
          </div>
        </div>

        {/* Task stats card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Team Task Productivity</h3>
            <p className="text-xs text-slate-400">Completion stats of reporting team</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned</span>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5">{tasksAssigned}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                <p className="text-xl font-extrabold text-green-600 mt-0.5">{tasksCompleted}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
                <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{tasksPending}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Overdue</span>
                <p className="text-xl font-extrabold text-red-600 mt-0.5">{tasksOverdue}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <TrendingUp className="h-4.5 w-4.5" />
              Completion Rate: {completionRate}%
            </span>
            <Link href="/manager/tasks" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Assign a Task <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
