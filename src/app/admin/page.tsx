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
  FileSpreadsheet,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch all active employees
  const employees = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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

  // Calculate headcount
  const totalEmployeesCount = employees.length;

  // Task Statistics
  const allTasks = employees.flatMap((e) => e.assignedTasks);
  const tasksAssigned = allTasks.length;
  const tasksCompleted = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const tasksOverdue = allTasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;

  // Today stats calculations
  let presentCount = 0;
  let wfhCount = 0;
  let leaveCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  // Populate row metrics for each employee
  const tableRows = employees.map((emp) => {
    const attendance = emp.attendances[0];
    let status = 'NOT_STARTED';
    let clockInStr = '--:--';
    let clockOutStr = '--:--';
    let workingHours = 0;
    let lateMinutes = 0;

    if (attendance) {
      status = attendance.status;
      clockInStr = new Date(attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (attendance.clockOut) {
        clockOutStr = new Date(attendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      workingHours = attendance.workingHours || 0;
      lateMinutes = attendance.lateMinutes || 0;

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

    const totalTasks = emp.assignedTasks.length;
    const completedTasks = emp.assignedTasks.filter((t) => t.status === 'COMPLETED').length;

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
      lateMinutes,
      taskSummary: `${completedTasks}/${totalTasks}`,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">Company-wide attendance status and workforce insights</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/employees"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition touch-target"
          >
            Manage Employees
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition touch-target"
          >
            Generate Reports
          </Link>
        </div>
      </div>

      {/* Grid Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Headcount</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-800">{totalEmployeesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Present</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-green-600">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">WFH</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-teal-600">{wfhCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Leave</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-blue-600">{leaveCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Absent</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-red-500">{absentCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Late</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-amber-500">{lateCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Assigned</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-indigo-600">{tasksAssigned}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Completed</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-green-600">{tasksCompleted}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">Overdue</span>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-red-600">{tasksOverdue}</p>
        </div>
      </div>

      {/* Today's Employee Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 sm:px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{"Today's Attendance Status"}</h2>
          <p className="text-xs text-slate-400">Overview of employee logs today</p>
        </div>

        <div className="overflow-x-auto table-wrapper">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-4 sm:px-6 py-3">Employee</th>
                <th className="px-4 sm:px-6 py-3">Department</th>
                <th className="px-4 sm:px-6 py-3">Login</th>
                <th className="px-4 sm:px-6 py-3">Logout</th>
                <th className="px-4 sm:px-6 py-3">Hours</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Late</th>
                <th className="px-4 sm:px-6 py-3">Tasks (Done/Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {tableRows.map((row) => (
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
                        row.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' :
                        row.status === 'WFH' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                        row.status === 'LEAVE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        row.status === 'ABSENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-3.5 ${row.lateMinutes > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {row.lateMinutes > 0 ? `${row.lateMinutes}m` : 'No'}
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
