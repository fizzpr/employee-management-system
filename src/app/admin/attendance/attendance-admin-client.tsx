'use client';

import { useState } from 'react';
import { Search, Calendar, Filter, Clock, Users, ArrowUpRight } from 'lucide-react';

interface DepartmentItem {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmployeeId: string;
  designation: string;
  departmentName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  workingHours: number | null;
  status: string;
  lateMinutes: number;
  notes: string | null;
}

interface AttendanceAdminClientProps {
  attendances: AttendanceRecord[];
  departments: DepartmentItem[];
}

export default function AttendanceAdminClient({
  attendances,
  departments,
}: AttendanceAdminClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-CA') // Default to today's date
  );

  // Filter attendance records
  const filteredRecords = attendances.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmployeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || record.departmentName === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const matchesDate = !selectedDate || record.date === selectedDate;

    return matchesSearch && matchesDept && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance Log Manager</h1>
        <p className="text-xs text-slate-500">Track real-time check-ins, working hours, and late details</p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase">Search Employee</label>
          <div className="relative mt-1">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Name or Employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none bg-white focus:border-indigo-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Logs for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'All Dates'} ({filteredRecords.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter criteria attendance summaries</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Late Margin</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-750">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                    No attendance records found for this selection.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-805">{row.userName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{row.designation} • {row.userEmployeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{row.departmentName}</td>
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
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ''}>
                      {row.notes || '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
