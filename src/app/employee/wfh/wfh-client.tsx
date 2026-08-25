'use client';

import { useState } from 'react';
import { applyWfhAction } from '@/lib/actions/wfh-actions';
import { Home, Calendar, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WfhRequestItem {
  id: string;
  date: string;
  duration: string;
  reason: string;
  status: string;
  managerComment: string | null;
}

interface WfhClientProps {
  history: WfhRequestItem[];
  totalApprovedDays: number;
}

export default function WfhClient({ history, totalApprovedDays }: WfhClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const date = formData.get('date') as string;
    const duration = formData.get('duration') as string;
    const reason = formData.get('reason') as string;

    try {
      const res = await applyWfhAction(date, duration, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('WFH request submitted successfully!');
        form.reset();
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Work From Home (WFH)</h1>
        <p className="text-xs text-slate-500">Apply for remote work and track approval status</p>
      </div>

      {/* Overview Cards & Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Info and form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approved WFH Stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Approved WFH Days</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
                {totalApprovedDays} {totalApprovedDays === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800">Apply for WFH</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submit request for verification</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-600 border border-green-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Date Picker */}
                <div>
                  <label htmlFor="date" className="block text-xs font-bold text-slate-600 uppercase">
                    Select Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    min={new Date().toLocaleDateString('en-CA')}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Duration select */}
                <div>
                  <label htmlFor="duration" className="block text-xs font-bold text-slate-600 uppercase">
                    Duration
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="FULL">Full Day</option>
                    <option value="HALF">Half Day</option>
                  </select>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label htmlFor="reason" className="block text-xs font-bold text-slate-600 uppercase">
                  Reason for WFH
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  required
                  placeholder="Describe your reason..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:bg-teal-400 transition"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Request History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-[540px] flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">WFH History</h3>
            <p className="text-xs text-slate-400">Previous and pending applications</p>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 py-12">
                No WFH requests recorded.
              </div>
            ) : (
              history.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{req.date}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' :
                        req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Duration:</span>{req.duration === 'FULL' ? 'Full Day' : 'Half Day'}</p>
                    <p className="mt-1"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Reason:</span>{req.reason}</p>
                  </div>

                  {req.managerComment && (
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-[11px] text-slate-600 font-medium">
                      <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Manager Comment:</span>
                      {req.managerComment}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
