'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

interface EmployeeItem {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
}

interface AttendanceItem {
  userId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: string;
  workingHours: number | null;
  lateMinutes: number;
  notes: string | null;
}

interface CompletedTaskItem {
  id: string;
  userId: string;
  title: string;
  completedAt: string;
}

interface CalendarAdminClientProps {
  employees: EmployeeItem[];
  attendances: AttendanceItem[];
  completedTasks: CompletedTaskItem[];
}

export default function CalendarAdminClient({
  employees,
  attendances,
  completedTasks,
}: CalendarAdminClientProps) {
  const [selectedUserId, setSelectedUserId] = useState(employees[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    attendance: AttendanceItem | null;
    tasks: CompletedTaskItem[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayInfo(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayInfo(null);
  };

  // Filter logs based on selected user
  const userAttendances = attendances.filter((a) => a.userId === selectedUserId);
  const userCompletedTasks = completedTasks.filter((t) => t.userId === selectedUserId);

  const getAttendanceForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return userAttendances.find((a) => a.date === dateStr) || null;
  };

  const getCompletedTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return userCompletedTasks.filter((t) => t.completedAt.startsWith(dateStr));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const attendance = getAttendanceForDay(day);
    const tasks = getCompletedTasksForDay(day);

    setSelectedDayInfo({
      dateStr,
      attendance,
      tasks,
    });
  };

  const handleUserChange = (id: string) => {
    setSelectedUserId(id);
    setSelectedDayInfo(null);
  };

  // Render cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24 border border-slate-100 bg-slate-50/50"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const attendance = getAttendanceForDay(day);
    const completedForDay = getCompletedTasksForDay(day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = new Date(year, month, day) > new Date();

    let indicatorColor = '';
    let statusText = '';

    if (attendance) {
      if (attendance.status === 'PRESENT') {
        indicatorColor = 'bg-green-500';
        statusText = 'Present';
      } else if (attendance.status === 'LATE') {
        indicatorColor = 'bg-amber-500';
        statusText = 'Late';
      } else if (attendance.status === 'WFH') {
        indicatorColor = 'bg-teal-500';
        statusText = 'WFH';
      } else if (attendance.status === 'LEAVE') {
        indicatorColor = 'bg-blue-500';
        statusText = 'Leave';
      }
    } else if (!isWeekend && !isFuture && selectedUserId) {
      indicatorColor = 'bg-red-500';
      statusText = 'Absent';
    }

    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleDayClick(day)}
        className={`h-24 border border-slate-150 bg-white p-2 hover:bg-indigo-50/20 cursor-pointer transition flex flex-col justify-between ${
          selectedDayInfo?.dateStr === dateStr ? 'ring-2 ring-indigo-500 ring-inset' : ''
        }`}
      >
        <span className={`text-xs font-bold ${isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>
          {day}
        </span>

        <div className="space-y-1">
          {statusText && (
            <div className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${indicatorColor}`}></span>
              <span className="text-[9px] font-bold text-slate-550 capitalize">{statusText}</span>
            </div>
          )}

          {completedForDay.length > 0 && (
            <div className="flex items-center gap-1 text-indigo-600">
              <Briefcase className="h-3 w-3" />
              <span className="text-[9px] font-extrabold">{completedForDay.length} completed</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeEmployee = employees.find((e) => e.id === selectedUserId);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-805">Company Calendars</h1>
          <p className="text-xs text-slate-500">Inspect attendance calendars and tasks logs employee-wise</p>
        </div>
        
        {/* Dropdown employee list selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Employee</span>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="rounded-lg border border-slate-200 py-2.5 px-4 text-xs font-bold bg-white outline-none shadow-xs"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {activeEmployee ? `${activeEmployee.name}'s Calendar — ` : ''}
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-slate-150">
            {cells}
          </div>
        </div>

        {/* Right Side: Day details panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Day details</h3>
          <p className="text-xs text-slate-400">Click any date to inspect logs</p>

          <div className="mt-6 flex-1">
            {!selectedDayInfo ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 italic py-12">
                No date selected.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4.5 w-4.5 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {new Date(selectedDayInfo.dateStr).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDayInfo.attendance ? (
                    <>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Status</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              selectedDayInfo.attendance.status === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-100' :
                              selectedDayInfo.attendance.status === 'LATE' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' :
                              selectedDayInfo.attendance.status === 'WFH' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {selectedDayInfo.attendance.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Clock In</span>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {new Date(selectedDayInfo.attendance.clockIn).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Clock Out</span>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {selectedDayInfo.attendance.clockOut
                              ? new Date(selectedDayInfo.attendance.clockOut).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '--:--'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Working Hours</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          {selectedDayInfo.attendance.workingHours
                            ? `${selectedDayInfo.attendance.workingHours} hours`
                            : 'Active / None'}
                        </p>
                      </div>

                      {selectedDayInfo.attendance.status === 'LATE' && (
                        <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-100 text-xs text-amber-700 font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Late by {selectedDayInfo.attendance.lateMinutes} minutes
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center rounded-xl bg-red-50 p-4 border border-red-100">
                      <p className="text-xs font-bold text-red-700 uppercase">Absent</p>
                      <p className="text-[10px] text-red-500 mt-1">No attendance logs found.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2">
                    Tasks Completed ({selectedDayInfo.tasks.length})
                  </span>
                  
                  {selectedDayInfo.tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks completed on this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayInfo.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-slate-100 p-3 hover:border-slate-200 transition flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <p className="text-xs font-bold text-slate-705 truncate">{t.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
