import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Users, CheckCircle2, Home, Calendar, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Fetch team members with their attendances for the current month, and their tasks
  const team = await db.user.findMany({
    where: { managerId: session.userId },
    include: {
      attendances: {
        where: { date: { startsWith: currentMonthPrefix } },
      },
      assignedTasks: true,
    },
  });

  // Calculate statistics for each team member
  const teamStats = team.map((member) => {
    const totalTasks = member.assignedTasks.length;
    const completedTasks = member.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = member.assignedTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length;
    const overdueTasks = member.assignedTasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate < todayStr).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

    const presentDays = member.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const wfhDays = member.attendances.filter((a) => a.status === 'WFH').length;
    const leaveDays = member.attendances.filter((a) => a.status === 'LEAVE').length;
    const lateDays = member.attendances.filter((a) => a.status === 'LATE').length;

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      designation: member.designation,
      employeeId: member.employeeId,
      stats: {
        present: presentDays,
        wfh: wfhDays,
        leave: leaveDays,
        late: lateDays,
        tasks: {
          assigned: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          rate: completionRate,
        },
      },
    };
  });

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Team Roster & Performance</h1>
        <p className="text-xs text-slate-500">Track stats and productivity of your reporting employees for {now.toLocaleString('default', { month: 'long' })}</p>
      </div>

      {/* Grid of Team Members */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamStats.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-350 py-12 text-center text-sm font-medium text-slate-400 bg-white">
            You do not have any reporting team members assigned yet.
          </div>
        ) : (
          teamStats.map((member) => (
            <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Header profile details */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-150 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
                  {member.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{member.name}</h3>
                  <p className="text-[10px] text-slate-400">{member.designation} • {member.employeeId}</p>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attendance Stats</h4>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">PRES</span>
                    <span className="text-green-600 font-extrabold">{member.stats.present}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">WFH</span>
                    <span className="text-teal-600 font-extrabold">{member.stats.wfh}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">LVE</span>
                    <span className="text-blue-600 font-extrabold">{member.stats.leave}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">LATE</span>
                    <span className="text-amber-600 font-extrabold">{member.stats.late}</span>
                  </div>
                </div>
              </div>

              {/* Tasks statistics */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Stats</h4>
                  <span className="text-[10px] font-extrabold text-indigo-600">Rate: {member.stats.tasks.rate}%</span>
                </div>
                
                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">ASGD</span>
                    <span className="text-slate-800 font-extrabold">{member.stats.tasks.assigned}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">DONE</span>
                    <span className="text-green-600 font-extrabold">{member.stats.tasks.completed}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">PEND</span>
                    <span className="text-indigo-600 font-extrabold">{member.stats.tasks.pending}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-0.5 font-bold">OVD</span>
                    <span className="text-red-650 font-extrabold">{member.stats.tasks.overdue}</span>
                  </div>
                </div>
              </div>
            </div>
          )))}
      </div>
    </div>
  );
}
