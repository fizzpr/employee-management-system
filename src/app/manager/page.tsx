import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatTimeDisplay } from '@/lib/time-utils';

export const dynamic = 'force-dynamic';

import {
  Users,
  CheckCircle,
  Home,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export default async function ManagerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch Team Members reporting to Manager (or all if admin)
  const teamWhere = session.role === 'ADMIN' ? {} : { managerId: session.userId };
  
  const teamMembers = await db.user.findMany({
    where: teamWhere,
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      designation: true,
      department: { select: { name: true } },
      attendances: {
        where: { date: todayStr },
        take: 1,
      },
      assignedTasks: {
        select: { id: true, status: true, dueDate: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const totalTeamCount = teamMembers.length;
  const teamUserIds = teamMembers.map((m) => m.id);

  // Fetch Pending Approvals for team
  const pendingWfhCount = await db.wfhRequest.count({
    where: {
      userId: { in: teamUserIds },
      status: 'PENDING',
    },
  });

  const pendingLeaveCount = await db.leaveRequest.count({
    where: {
      userId: { in: teamUserIds },
      status: 'PENDING',
    },
  });

  const totalPendingApprovals = pendingWfhCount + pendingLeaveCount;

  // Task Stats for team
  const allTeamTasks = teamMembers.flatMap((m) => m.assignedTasks);
  const totalTasks = allTeamTasks.length;
  const completedTasks = allTeamTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = allTeamTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const overdueTasks = allTeamTasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;

  // Attendance Stats for today
  let presentCount = 0;
  let wfhCount = 0;
  let leaveCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  const teamRows = teamMembers.map((emp) => {
    const attendance = emp.attendances[0];
    let status = 'NOT_STARTED';
    let clockInStr = '--:--';
    let clockOutStr = '--:--';
    let workingHours = 0;

    if (attendance) {
      status = attendance.status;
      clockInStr = formatTimeDisplay(attendance.clockIn);
      if (attendance.clockOut) {
        clockOutStr = formatTimeDisplay(attendance.clockOut);
      }
      workingHours = attendance.workingHours || 0;

      if (status === 'PRESENT') presentCount++;
      else if (status === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (status === 'WFH') wfhCount++;
      else if (status === 'LEAVE') leaveCount++;
    } else {
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (!isWeekend) {
        status = 'ABSENT';
        absentCount++;
      }
    }

    const memberTotalTasks = emp.assignedTasks.length;
    const memberDoneTasks = emp.assignedTasks.filter((t) => t.status === 'COMPLETED').length;

    return {
      id: emp.id,
      name: emp.name,
      designation: emp.designation,
      employeeId: emp.employeeId,
      department: emp.department?.name || 'General',
      clockIn: clockInStr,
      clockOut: clockOutStr,
      workingHours,
      status,
      taskSummary: `${memberDoneTasks}/${memberTotalTasks}`,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-xs text-slate-500">Team roster status, approvals & task oversight</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/manager/team"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition touch-target"
          >
            Team Roster
          </Link>
          <Link
            href="/manager/tasks"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition touch-target"
          >
            Assign Task
          </Link>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">Team Size</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1">{totalTeamCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">Present Today</span>
          <p className="text-xl sm:text-2xl font-extrabold text-green-600 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">WFH Today</span>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-600 mt-1">{wfhCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">On Leave</span>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-1">{leaveCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">Late Today</span>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">{lateCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block truncate">Absent Today</span>
          <p className="text-xl sm:text-2xl font-extrabold text-red-600 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Grid: Approvals Box & Task stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approvals Action card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Pending Approvals</h3>
            <p className="text-xs text-slate-400">Applications awaiting your decision</p>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-semibold text-slate-600">WFH Requests</span>
                <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">{pendingWfhCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Leave Requests</span>
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">{pendingLeaveCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/manager/approvals"
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white shadow transition touch-target ${
                totalPendingApprovals > 0 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-indigo-600/80 hover:bg-indigo-700'
              }`}
            >
              Process Approvals ({totalPendingApprovals})
            </Link>
          </div>
        </div>

        {/* Task stats card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Team Task Productivity</h3>
            <p className="text-xs text-slate-400">Completion stats of reporting team</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Total Tasks</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{totalTasks}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Completed</span>
                <p className="text-lg font-bold text-green-600 mt-0.5">{completedTasks}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">In Progress</span>
                <p className="text-lg font-bold text-amber-600 mt-0.5">{inProgressTasks}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">Overdue</span>
                <p className="text-lg font-bold text-red-600 mt-0.5">{overdueTasks}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/manager/tasks"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage Team Tasks →
            </Link>
          </div>
        </div>
      </div>

      {/* Team Roster Status Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 sm:px-6 py-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">{"Today's Team Roster"}</h2>
          <p className="text-xs text-slate-400">Live attendance & task status of your team members</p>
        </div>

        <div className="overflow-x-auto table-wrapper">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-4 sm:px-6 py-3">Team Member</th>
                <th className="px-4 sm:px-6 py-3">Department</th>
                <th className="px-4 sm:px-6 py-3">Login</th>
                <th className="px-4 sm:px-6 py-3">Logout</th>
                <th className="px-4 sm:px-6 py-3">Hours</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Tasks (Done/Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {teamRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 sm:px-6 py-3.5">
                    <p className="font-bold text-slate-800">{row.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{row.designation} • {row.employeeId}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 text-slate-500">{row.department}</td>
                  <td className="px-4 sm:px-6 py-3.5">{row.clockIn}</td>
                  <td className="px-4 sm:px-6 py-3.5">{row.clockOut}</td>
                  <td className="px-4 sm:px-6 py-3.5">{row.workingHours > 0 ? `${row.workingHours}h` : '--'}</td>
                  <td className="px-4 sm:px-6 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        row.status === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-100' :
                        row.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        row.status === 'WFH' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                        row.status === 'LEAVE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        row.status === 'ABSENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 text-indigo-600 font-extrabold">{row.taskSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
