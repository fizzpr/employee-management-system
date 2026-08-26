'use client';

import { useState } from 'react';
import { Search, Calendar, Filter, Clock, Users, ArrowUpRight, Eye, X, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/time-utils';

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
  role?: string;
  departmentName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  workingHours: number | null;
  status: string;
  lateMinutes: number;
  notes: string | null;
  punchInPhoto?: string | null;
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchInAddress?: string | null;
  punchOutPhoto?: string | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
  punchOutAddress?: string | null;
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
    new Date().toLocaleDateString('en-CA')
  );

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Attendance Log Manager</h1>
        <p className="text-xs text-slate-500">Track real-time check-ins, photo verification, and GPS locations</p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
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
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-base sm:text-xs outline-none focus:border-indigo-500"
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
            className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-base sm:text-xs outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-base sm:text-xs outline-none bg-white focus:border-indigo-500"
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
            className="mt-1 block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-base sm:text-xs outline-none bg-white focus:border-indigo-500"
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
        <div className="border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Logs for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'All Dates'} ({filteredRecords.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live check-in histories & location logs</p>
          </div>
        </div>

        <div className="overflow-x-auto table-wrapper">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Late Margin</th>
                <th className="px-6 py-3 text-right">Details</th>
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
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{row.userName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{row.designation} • {row.userEmployeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{row.departmentName}</td>
                    <td className="px-6 py-4">{formatTimeDisplay(row.clockIn)}</td>
                    <td className="px-6 py-4">{formatTimeDisplay(row.clockOut)}</td>
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(row)}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition touch-target"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6 bg-slate-50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Attendance Details — {selectedRecord.userName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecord.designation} • {selectedRecord.departmentName} • {selectedRecord.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 text-center">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Status</p>
                  <p className="text-sm font-extrabold text-indigo-900 mt-0.5">{selectedRecord.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Hours</p>
                  <p className="text-sm font-extrabold text-indigo-900 mt-0.5">
                    {selectedRecord.workingHours ? `${selectedRecord.workingHours}h` : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Late Margin</p>
                  <p className="text-sm font-extrabold text-indigo-900 mt-0.5">
                    {selectedRecord.lateMinutes > 0 ? `${selectedRecord.lateMinutes} mins` : 'On Time'}
                  </p>
                </div>
              </div>

              {/* Grid: Punch In vs Punch Out Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PUNCH IN SECTION */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-green-600" /> Punch In Log
                    </span>
                    <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      {formatTimeDisplay(selectedRecord.clockIn)}
                    </span>
                  </div>

                  {/* Punch In Photo */}
                  {selectedRecord.punchInPhoto ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 bg-slate-100">
                      <img
                        src={selectedRecord.punchInPhoto}
                        alt="Punch In Photo"
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                        onClick={() => setActiveLightboxImg(selectedRecord.punchInPhoto!)}
                      />
                      <button
                        onClick={() => setActiveLightboxImg(selectedRecord.punchInPhoto!)}
                        className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 p-1.5 text-white hover:bg-slate-900 transition"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                      No verification photo recorded
                    </div>
                  )}

                  {/* Address */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Location Address</span>
                    <p className="font-medium line-clamp-2">{selectedRecord.punchInAddress || 'Location unrecorded'}</p>
                  </div>

                  {/* Map Pin Embed */}
                  {selectedRecord.punchInLat && selectedRecord.punchInLng && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-36">
                      <iframe
                        title="Punch In Map Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedRecord.punchInLng - 0.005},${selectedRecord.punchInLat - 0.005},${selectedRecord.punchInLng + 0.005},${selectedRecord.punchInLat + 0.005}&layer=mapnik&marker=${selectedRecord.punchInLat},${selectedRecord.punchInLng}`}
                      />
                    </div>
                  )}
                </div>

                {/* PUNCH OUT SECTION */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-red-600" /> Punch Out Log
                    </span>
                    <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      {formatTimeDisplay(selectedRecord.clockOut)}
                    </span>
                  </div>

                  {/* Punch Out Photo */}
                  {selectedRecord.punchOutPhoto ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 bg-slate-100">
                      <img
                        src={selectedRecord.punchOutPhoto}
                        alt="Punch Out Photo"
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                        onClick={() => setActiveLightboxImg(selectedRecord.punchOutPhoto!)}
                      />
                      <button
                        onClick={() => setActiveLightboxImg(selectedRecord.punchOutPhoto!)}
                        className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 p-1.5 text-white hover:bg-slate-900 transition"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                      No verification photo recorded
                    </div>
                  )}

                  {/* Address */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Location Address</span>
                    <p className="font-medium line-clamp-2">{selectedRecord.punchOutAddress || 'Location unrecorded'}</p>
                  </div>

                  {/* Map Pin Embed */}
                  {selectedRecord.punchOutLat && selectedRecord.punchOutLng && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-36">
                      <iframe
                        title="Punch Out Map Location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedRecord.punchOutLng - 0.005},${selectedRecord.punchOutLat - 0.005},${selectedRecord.punchOutLng + 0.005},${selectedRecord.punchOutLat + 0.005}&layer=mapnik&marker=${selectedRecord.punchOutLat},${selectedRecord.punchOutLng}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition touch-target"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Overlay */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={activeLightboxImg}
              alt="Enlarged Punch Photo Verification"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-slate-800"
            />
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute -top-12 right-0 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
