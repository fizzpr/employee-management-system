'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface EmployeeListItem {
  id: string;
  name: string;
  employeeId: string;
  departmentId: string | null;
  departmentName: string;
  designation: string;
}

interface DepartmentItem {
  id: string;
  name: string;
}

interface AttendanceLogItem {
  id: string;
  userId: string;
  userName: string;
  userEmployeeId: string;
  departmentName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  workingHours: number | null;
  status: string;
  lateMinutes: number;
  notes: string | null;
}

interface TaskListItem {
  id: string;
  assignedToId: string;
  status: string;
  dueDate: string;
}

interface ReportsClientProps {
  employees: EmployeeListItem[];
  departments: DepartmentItem[];
  attendances: AttendanceLogItem[];
  tasks: TaskListItem[];
  role: 'ADMIN' | 'MANAGER';
}

export default function ReportsClient({
  employees,
  departments,
  attendances,
  tasks,
  role,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'MONTHLY'>('LOGS');

  // Logs filters
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');
  const [logEmployeeId, setLogEmployeeId] = useState('ALL');
  const [logDeptId, setLogDeptId] = useState('ALL');
  const [logStatus, setLogStatus] = useState('ALL');

  // Monthly summary filters
  const [monthlyEmployeeId, setMonthlyEmployeeId] = useState(employees[0]?.id || 'ALL');
  const [monthlyMonth, setMonthlyMonth] = useState('2026-08'); // default to August 2026

  // 1. Filter raw attendance logs
  const filteredLogs = attendances.filter((log) => {
    const matchesStartDate = !logStartDate || log.date >= logStartDate;
    const matchesEndDate = !logEndDate || log.date <= logEndDate;
    const matchesEmployee = logEmployeeId === 'ALL' || log.userId === logEmployeeId;
    
    // Find employee's department matching filter
    const emp = employees.find((e) => e.id === log.userId);
    const matchesDept = logDeptId === 'ALL' || emp?.departmentId === logDeptId;
    const matchesStatus = logStatus === 'ALL' || log.status === logStatus;

    return matchesStartDate && matchesEndDate && matchesEmployee && matchesDept && matchesStatus;
  });

  // 2. Calculate Monthly Employee Performance
  const selectedEmployee = employees.find((e) => e.id === monthlyEmployeeId);
  const employeeLogs = attendances.filter(
    (log) => log.userId === monthlyEmployeeId && log.date.startsWith(monthlyMonth)
  );

  const empPresent = employeeLogs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length;
  const empWfh = employeeLogs.filter((l) => l.status === 'WFH').length;
  const empLeave = employeeLogs.filter((l) => l.status === 'LEAVE').length;
  const empLateDays = employeeLogs.filter((l) => l.status === 'LATE').length;
  const empLateMinutes = employeeLogs.reduce((acc, curr) => acc + curr.lateMinutes, 0);
  const empWorkingHours = employeeLogs.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

  // Absent calculation: weekdays in the month up to now, minus logs.
  // For simplicity let's count total weekdays in that month
  const getWeekdaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let weekdays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month, day).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) weekdays++;
    }
    return weekdays;
  };
  const [y, m] = monthlyMonth.split('-').map(Number);
  const totalMonthWorkDays = monthlyMonth ? getWeekdaysInMonth(y, m - 1) : 0;
  const empAbsent = Math.max(0, totalMonthWorkDays - (empPresent + empWfh + empLeave));

  // Employee tasks performance
  const employeeTasks = tasks.filter((t) => t.assignedToId === monthlyEmployeeId);
  const empTasksAssigned = employeeTasks.length;
  const empTasksCompleted = employeeTasks.filter((t) => t.status === 'COMPLETED').length;
  const empTasksPending = employeeTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length;
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const empTasksOverdue = employeeTasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;
  
  const empCompletionRate = empTasksAssigned > 0 ? Math.round((empTasksCompleted / empTasksAssigned) * 1000) / 10 : 0;

  // 3. Export CSV Helpers
  const exportLogsToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Clock In', 'Clock Out', 'Working Hours', 'Status', 'Late Minutes'];
    const rows = filteredLogs.map((log) => [
      log.userName,
      log.userEmployeeId,
      log.departmentName,
      log.date,
      log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      log.workingHours || 0,
      log.status,
      log.lateMinutes,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Logs_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMonthlySummaryToCSV = () => {
    if (!selectedEmployee) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Employee Name', selectedEmployee.name],
      ['Employee ID', selectedEmployee.employeeId],
      ['Department', selectedEmployee.departmentName],
      ['Designation', selectedEmployee.designation],
      ['Month', monthlyMonth],
      ['Working Days in Month', totalMonthWorkDays],
      ['Present Days', empPresent],
      ['WFH Days', empWfh],
      ['Leave Days', empLeave],
      ['Absent Days', empAbsent],
      ['Late Days', empLateDays],
      ['Total Late Minutes', empLateMinutes],
      ['Total Working Hours', `${Math.round(empWorkingHours)}h`],
      ['Tasks Assigned', empTasksAssigned],
      ['Tasks Completed', empTasksCompleted],
      ['Tasks Pending', empTasksPending],
      ['Tasks Overdue', empTasksOverdue],
      ['Task Completion Rate', `${empCompletionRate}%`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Summary_Report_${selectedEmployee.name.replace(' ', '_')}_${monthlyMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports Console</h1>
        <p className="text-xs text-slate-500">Filter attendance logs, review employee monthly performance, and download CSV reports</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'LOGS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Daily Attendance Logs
        </button>
        <button
          onClick={() => setActiveTab('MONTHLY')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'MONTHLY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Monthly Employee Summary
        </button>
      </div>

      {activeTab === 'LOGS' ? (
        <>
          {/* Logs Filter Panel */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Start Date</label>
              <input
                type="date"
                value={logStartDate}
                onChange={(e) => setLogStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">End Date</label>
              <input
                type="date"
                value={logEndDate}
                onChange={(e) => setLogEndDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Employee</label>
              <select
                value={logEmployeeId}
                onChange={(e) => setLogEmployeeId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none bg-white focus:border-indigo-500"
              >
                <option value="ALL">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            {role === 'ADMIN' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Department</label>
                <select
                  value={logDeptId}
                  onChange={(e) => setLogDeptId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none bg-white focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Status</label>
              <select
                value={logStatus}
                onChange={(e) => setLogStatus(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none bg-white focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="WFH">WFH</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Daily Logs Summary ({filteredLogs.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">Filter criteria logs</p>
              </div>
              <button
                onClick={exportLogsToCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Login</th>
                    <th className="px-6 py-3">Logout</th>
                    <th className="px-6 py-3">Hours</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Late Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-750">
                  {filteredLogs.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{row.userName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{row.userEmployeeId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{row.departmentName}</td>
                      <td className="px-6 py-4">{row.date}</td>
                      <td className="px-6 py-4">
                        {row.clockIn ? new Date(row.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="px-6 py-4">
                        {row.clockOut ? new Date(row.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="px-6 py-4">{row.workingHours ? `${row.workingHours}h` : '--'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            row.status === 'PRESENT' ? 'bg-green-50 text-green-700 border-green-100' :
                            row.status === 'LATE' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                            row.status === 'WFH' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${row.lateMinutes > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                        {row.lateMinutes > 0 ? `${row.lateMinutes}m` : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Monthly Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-white p-4 border border-slate-200 shadow-xs max-w-2xl">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Select Employee</label>
              <select
                value={monthlyEmployeeId}
                onChange={(e) => setMonthlyEmployeeId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2.5 px-3 text-xs outline-none bg-white focus:border-indigo-500"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Select Month</label>
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Monthly Employee Performance Display */}
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Profile Details Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg uppercase">
                    {selectedEmployee.name.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{selectedEmployee.name}</h2>
                    <p className="text-xs text-slate-500">{selectedEmployee.designation} • {selectedEmployee.departmentName} • ID: {selectedEmployee.employeeId}</p>
                  </div>
                </div>

                <button
                  onClick={exportMonthlySummaryToCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition sm:self-center self-start"
                >
                  <Download className="h-4 w-4" />
                  Export Monthly CSV
                </button>
              </div>

              {/* Attendance metrics */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Working Days</span>
                  <p className="mt-1 text-xl font-extrabold text-slate-850">{totalMonthWorkDays}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Present</span>
                  <p className="mt-1 text-xl font-extrabold text-green-600">{empPresent}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">WFH</span>
                  <p className="mt-1 text-xl font-extrabold text-teal-600">{empWfh}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Leave</span>
                  <p className="mt-1 text-xl font-extrabold text-blue-600">{empLeave}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Absent</span>
                  <p className="mt-1 text-xl font-extrabold text-red-500">{empAbsent}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Late Days</span>
                  <p className="mt-1 text-xl font-extrabold text-amber-500">{empLateDays}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Working Hours</span>
                  <p className="mt-1 text-xl font-extrabold text-slate-800 leading-7">{Math.round(empWorkingHours)}h</p>
                </div>
              </div>

              {/* Grid: Late minutes and tasks performance */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Late attendance detail card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Late Attendance History</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Late Days</span>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-100">{empLateDays} Days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Total Late Minutes</span>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-100">{empLateMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Avg. Late Time per Late day</span>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-100">
                        {empLateDays > 0 ? Math.round(empLateMinutes / empLateDays) : 0} Minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task productivity detail card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Monthly Task Performance</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-xs font-semibold">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">Assigned</span>
                      <span className="text-slate-800 font-extrabold">{empTasksAssigned}</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">Completed</span>
                      <span className="text-green-600 font-extrabold">{empTasksCompleted}</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">Pending</span>
                      <span className="text-indigo-600 font-extrabold">{empTasksPending}</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">Overdue</span>
                      <span className="text-red-650 font-extrabold">{empTasksOverdue}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-indigo-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Completion Rate: {empCompletionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400 py-12">No employee selected.</div>
          )}
        </>
      )}
    </div>
  );
}
