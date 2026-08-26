'use client';

import { useState } from 'react';
import { clockInAction, clockOutAction } from '@/lib/actions/attendance-actions';
import { Clock, CheckCircle2, Play, Square, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ClockPanelProps {
  todayAttendance: {
    clockIn: Date;
    clockOut: Date | null;
    status: string;
    workingHours: number | null;
  } | null;
  hasWfhToday: boolean;
  hasLeaveToday: boolean;
}

export default function ClockPanel({ todayAttendance, hasWfhToday, hasLeaveToday }: ClockPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clockInAction();
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Failed to clock in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clockOutAction();
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Failed to clock out. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateObj: Date | null) => {
    if (!dateObj) return '--:--';
    return new Date(dateObj).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  let currentStatus = 'Not Started';
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let canClockIn = true;
  let canClockOut = false;

  if (hasLeaveToday) {
    currentStatus = 'On Leave';
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-150';
    canClockIn = false;
  } else if (hasWfhToday) {
    currentStatus = 'WFH';
    badgeColor = 'bg-teal-50 text-teal-700 border-teal-150';
    canClockIn = false;
  } else if (todayAttendance) {
    if (todayAttendance.clockOut) {
      currentStatus = 'Completed';
      badgeColor = 'bg-green-50 text-green-700 border-green-150';
      canClockIn = false;
    } else {
      currentStatus = todayAttendance.status === 'LATE' ? 'Working (Late)' : 'Working';
      badgeColor = todayAttendance.status === 'LATE' 
        ? 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse' 
        : 'bg-indigo-50 text-indigo-700 border-indigo-150 animate-pulse';
      canClockIn = false;
      canClockOut = true;
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">{"Today's Attendance"}</h2>
          <p className="text-xs text-slate-500">Log your daily work hours</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeColor}`}>
          {currentStatus}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {/* Clock Details Grid */}
      <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
        <div className="rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Clock In</p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700">
            {todayAttendance ? formatTime(todayAttendance.clockIn) : '--:--'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Clock Out</p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700">
            {todayAttendance && todayAttendance.clockOut ? formatTime(todayAttendance.clockOut) : '--:--'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Hours</p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700">
            {todayAttendance
              ? todayAttendance.workingHours 
                ? `${todayAttendance.workingHours}h` 
                : 'Active'
              : '--:--'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 sm:mt-6 flex gap-3 sm:gap-4">
        {canClockIn && (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-green-700 disabled:bg-green-400 transition touch-target"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Play className="h-4.5 w-4.5 fill-current" />
                Clock In
              </>
            )}
          </button>
        )}

        {canClockOut && (
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:bg-red-400 transition touch-target"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Square className="h-4.5 w-4.5 fill-current" />
                Clock Out
              </>
            )}
          </button>
        )}

        {!canClockIn && !canClockOut && (
          <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-400 border border-slate-200">
            <CheckCircle2 className="h-4.5 w-4.5" />
            Logs Complete
          </div>
        )}
      </div>
    </div>
  );
}
