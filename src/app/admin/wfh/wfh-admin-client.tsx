'use client';

import { useState } from 'react';
import { approveRejectWfhAction } from '@/lib/actions/wfh-actions';
import { Home, Calendar, AlertCircle, CheckCircle, Clock, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WfhItem {
  id: string;
  date: string;
  duration: string;
  reason: string;
  status: string;
  managerComment: string | null;
  user: {
    name: string;
    designation: string;
    employeeId: string;
  };
}

interface WfhAdminClientProps {
  wfhRequests: WfhItem[];
}

export default function WfhAdminClient({ wfhRequests }: WfhAdminClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [id: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
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

  const handleCommentChange = (id: string, val: string) => {
    setComment((prev) => ({ ...prev, [id]: val }));
  };

  // Filter requests
  const filteredRequests = wfhRequests.filter((req) => {
    return statusFilter === 'ALL' || req.status === statusFilter;
  });

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">WFH Requests Manager</h1>
          <p className="text-xs text-slate-500">Track and authorize company-wide remote work applications</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold bg-white outline-none shadow-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {/* Grid of WFH Requests */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-350 py-12 text-center text-sm font-medium text-slate-400 bg-white">
            No WFH requests found.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Employee details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs uppercase">
                      {req.user.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.user.name}</p>
                      <p className="text-[10px] text-slate-450">{req.user.designation} • {req.user.employeeId}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' :
                      req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Details */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-650 font-semibold space-y-1.5">
                  <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Date:</span>{req.date} ({req.duration === 'FULL' ? 'Full Day' : 'Half Day'})</p>
                  <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Reason:</span>{req.reason}</p>
                </div>
              </div>

              {/* Actions / Remarks */}
              <div className="pt-2 space-y-3">
                {req.status === 'PENDING' ? (
                  <>
                    <input
                      type="text"
                      placeholder="Add comment (optional)..."
                      value={comment[req.id] || ''}
                      onChange={(e) => handleCommentChange(req.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(req.id, 'REJECTED')}
                        disabled={loadingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-705 transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(req.id, 'APPROVED')}
                        disabled={loadingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-teal-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
                      >
                        {loadingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                    </div>
                  </>
                ) : (
                  req.managerComment && (
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-[11px] text-slate-500 font-semibold">
                      <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Admin Comment:</span>
                      {req.managerComment}
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
