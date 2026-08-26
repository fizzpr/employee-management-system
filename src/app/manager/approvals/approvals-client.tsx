'use client';

import { useState } from 'react';
import { approveRejectWfhAction } from '@/lib/actions/wfh-actions';
import { approveRejectLeaveAction } from '@/lib/actions/leave-actions';
import { Check, X, Calendar, User, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingWfh {
  id: string;
  date: string;
  duration: string;
  reason: string;
  user: {
    name: string;
    designation: string;
  };
}

interface PendingLeave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  user: {
    name: string;
    designation: string;
  };
}

interface ApprovalsClientProps {
  wfhRequests: PendingWfh[];
  leaveRequests: PendingLeave[];
}

export default function ApprovalsClient({ wfhRequests, leaveRequests }: ApprovalsClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [id: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  const handleWfhDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await approveRejectWfhAction(id, decision, comment[id]);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleLeaveDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await approveRejectLeaveAction(id, decision, comment[id]);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCommentChange = (id: string, val: string) => {
    setComment((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-8 p-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
        <p className="text-xs text-slate-500">Review and authorize WFH and leave requests from your team</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {/* Main layout splitting WFH and Leaves */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: WFH Requests */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">WFH Requests ({wfhRequests.length})</h2>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">WFH</span>
          </div>

          <div className="space-y-4">
            {wfhRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-350 py-12 text-center text-sm font-medium text-slate-400 bg-white">
                No pending WFH requests.
              </div>
            ) : (
              wfhRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  {/* Header info */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs uppercase">
                      {req.user.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.user.name}</p>
                      <p className="text-[10px] text-slate-400">{req.user.designation}</p>
                    </div>
                  </div>

                  {/* Request details */}
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600 font-medium space-y-1.5">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Date:</span>{req.date} ({req.duration === 'FULL' ? 'Full Day' : 'Half Day'})</p>
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Reason:</span>{req.reason}</p>
                  </div>

                  {/* Comment box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add an optional comment..."
                      value={comment[req.id] || ''}
                      onChange={(e) => handleCommentChange(req.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWfhDecision(req.id, 'REJECTED')}
                      disabled={loadingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-150 transition touch-target"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleWfhDecision(req.id, 'APPROVED')}
                      disabled={loadingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition touch-target"
                    >
                      {loadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Leave Requests */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Leave Applications ({leaveRequests.length})</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">Leave</span>
          </div>

          <div className="space-y-4">
            {leaveRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-350 py-12 text-center text-sm font-medium text-slate-400 bg-white">
                No pending leave applications.
              </div>
            ) : (
              leaveRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  {/* Header info */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                      {req.user.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.user.name}</p>
                      <p className="text-[10px] text-slate-400">{req.user.designation}</p>
                    </div>
                  </div>

                  {/* Request details */}
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600 font-medium space-y-1.5">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Type:</span>{req.leaveType} Leave</p>
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Dates:</span>{req.startDate} to {req.endDate}</p>
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Reason:</span>{req.reason}</p>
                  </div>

                  {/* Comment box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add an optional comment..."
                      value={comment[req.id] || ''}
                      onChange={(e) => handleCommentChange(req.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'REJECTED')}
                      disabled={loadingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-150 transition touch-target"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'APPROVED')}
                      disabled={loadingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition touch-target"
                    >
                      {loadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
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
