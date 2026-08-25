import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import TasksClient from './tasks-client';

export const dynamic = 'force-dynamic';

export default async function ManagerTasksPage() {
  const session = await getSession();
  if (!session || (session.role !== 'MANAGER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const todayStr = new Date().toLocaleDateString('en-CA');

  // 1. Fetch team members reporting to this manager
  const team = await db.user.findMany({
    where: { managerId: session.userId },
    select: { id: true, name: true, designation: true },
  });

  const teamIds = team.map((t) => t.id);

  // 2. Fetch tasks assigned to these team members
  const tasks = await db.task.findMany({
    where: {
      assignedToId: { in: teamIds },
    },
    include: {
      assignedTo: {
        select: { name: true, designation: true },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { name: true, role: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize date values for layout rendering safety
  const serializedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    startDate: t.startDate,
    dueDate: t.dueDate,
    estimatedHours: t.estimatedHours,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    assignedTo: {
      name: t.assignedTo.name,
      designation: t.assignedTo.designation,
    },
    comments: t.comments.map((c) => ({
      id: c.id,
      comment: c.comment,
      createdAt: c.createdAt.toISOString(),
      user: {
        name: c.user.name,
        role: c.user.role,
      },
    })),
  }));

  return (
    <TasksClient
      tasks={serializedTasks}
      team={team}
      todayStr={todayStr}
    />
  );
}
