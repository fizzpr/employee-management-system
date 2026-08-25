import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import TasksClient from './tasks-client';

export default async function TasksPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const todayStr = new Date().toLocaleDateString('en-CA');

  // Fetch tasks assigned to the employee
  const tasks = await db.task.findMany({
    where: { assignedToId: session.userId },
    include: {
      assignedBy: {
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

  // Serialize date fields for NextJS Server Component boundary safety
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
    assignedBy: {
      name: t.assignedBy.name,
      designation: t.assignedBy.designation,
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

  return <TasksClient tasks={serializedTasks} todayStr={todayStr} />;
}
