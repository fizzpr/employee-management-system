import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import TasksAdminClient from './tasks-admin-client';

export default async function AdminTasksPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const todayStr = new Date().toLocaleDateString('en-CA');

  // 1. Fetch active employees to populate the assignee dropdown
  const employees = await db.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, designation: true },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch all tasks in the company
  const tasks = await db.task.findMany({
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
    <TasksAdminClient
      tasks={serializedTasks}
      employees={employees}
      todayStr={todayStr}
    />
  );
}
