'use client';

import { useState } from 'react';
import { updateCompanySettingsAction, updateAdminCredentialsAction } from '@/lib/actions/settings-actions';
import { Save, Building, Clock, Calendar, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsData {
  companyName: string;
  officeStartTime: string;
  officeEndTime: string;
  gracePeriod: number;
  workingDays: string;
  carryForwardRules: string;
}

interface SettingsClientProps {
  settings: SettingsData;
  adminName: string;
  adminEmail: string;
}

export default function SettingsClient({ settings, adminName, adminEmail }: SettingsClientProps) {
  const router = useRouter();
  
  // Settings loader/alert states
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Credentials loader/alert states
  const [credLoading, setCredLoading] = useState(false);

  // Common alert states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSettingsLoading(true);

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get('companyName') as string;
    const officeStartTime = formData.get('officeStartTime') as string;
    const officeEndTime = formData.get('officeEndTime') as string;
    const gracePeriod = formData.get('gracePeriod') as string;
    const carryForwardRules = formData.get('carryForwardRules') as string;

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const checkedDays = days.filter((day) => formData.get(`day_${day}`) === 'on');
    const workingDays = checkedDays.join(',');

    try {
      const res = await updateCompanySettingsAction(
        companyName,
        officeStartTime,
        officeEndTime,
        gracePeriod,
        workingDays,
        carryForwardRules
      );

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Company settings updated successfully!');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCredLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('adminName') as string;
    const email = formData.get('adminEmail') as string;
    const password = formData.get('adminPassword') as string;
    const confirmPassword = formData.get('adminConfirmPassword') as string;

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      setCredLoading(false);
      return;
    }

    try {
      const res = await updateAdminCredentialsAction(email, name, password || undefined);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Admin credentials updated successfully! Session updated.');
        form.reset();
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setCredLoading(false);
    }
  };

  const initialDays = settings.workingDays.split(',');

  return (
    <div className="space-y-8 p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Console Configurations</h1>
        <p className="text-xs text-slate-500">Configure company operating rules and update personal security credentials</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-650 border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-xs font-semibold text-green-600 border border-green-100 flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Form 1: Company configs */}
      <form onSubmit={handleSettingsSubmit} className="space-y-6">
        {/* Company profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Company Identity</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase">Company Name</label>
            <input
              type="text"
              name="companyName"
              required
              defaultValue={settings.companyName}
              placeholder="e.g. Fizz PR Agency"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Attendance Parameters Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Attendance Configuration</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Office Start Time</label>
              <input
                type="text"
                name="officeStartTime"
                required
                defaultValue={settings.officeStartTime}
                placeholder="e.g. 09:30 AM"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Office End Time</label>
              <input
                type="text"
                name="officeEndTime"
                required
                defaultValue={settings.officeEndTime}
                placeholder="e.g. 06:30 PM"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Grace Period (Minutes)</label>
              <input
                type="number"
                name="gracePeriod"
                required
                defaultValue={settings.gracePeriod}
                placeholder="e.g. 15"
                min="0"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Operations calendar Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Working Days & Leaves</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Company Working Days</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <label key={day} className="inline-flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`day_${day}`}
                    defaultChecked={initialDays.includes(day)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <label className="block text-xs font-bold text-slate-600 uppercase">Carry Forward Rules Description</label>
            <textarea
              name="carryForwardRules"
              rows={2}
              defaultValue={settings.carryForwardRules}
              placeholder="e.g. Up to 5 unused leaves can be carried forward to next year."
              className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={settingsLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition"
        >
          {settingsLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              Save Company Configurations
            </>
          )}
        </button>
      </form>

      <hr className="border-slate-200 my-8" />

      {/* Form 2: Admin profile credentials edit */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">My Security Credentials</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Display Name</label>
              <input
                type="text"
                name="adminName"
                required
                defaultValue={adminName}
                placeholder="Super Admin"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Email Address</label>
              <input
                type="email"
                name="adminEmail"
                required
                defaultValue={adminEmail}
                placeholder="superadmin@vspark.com"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">New Password (Leave empty to keep current)</label>
              <input
                type="password"
                name="adminPassword"
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase">Confirm Password</label>
              <input
                type="password"
                name="adminConfirmPassword"
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={credLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition"
        >
          {credLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              Update My Credentials
            </>
          )}
        </button>
      </form>
    </div>
  );
}
