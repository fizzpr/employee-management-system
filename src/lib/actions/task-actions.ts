'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createTaskAction(
  title: string,
  description: string,
  assignedToId: string,
  priority: string,
  startDate: string,
  dueDate: string,
  estimatedHoursStr?: string
) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
    return { error: 'Unauthorized.' };
  }

  if (!title || !description || !assignedToId || !priority || !startDate || !dueDate) {
    return { error: 'All fields are required.' };
  }

  try {
    // Get department of the assigned employee
    const employee = await db.user.findUnique({
      where: { id: assignedToId },
      include: { department: true },
    });

    if (!employee) {
      return { error: 'Employee not found.' };
    }

    const estimatedHours = estimatedHoursStr ? parseFloat(estimatedHoursStr) : null;

    // Create task
    const task = await db.task.create({
      data: {
        title,
        description,
        assignedToId,
        assignedById: session.userId,
        department: employee.department?.name || 'General',
        priority,
        status: 'ASSIGNED',
        startDate,
        dueDate,
        estimatedHours,
      },
    });

    // Notify employee
    await db.notification.create({
      data: {
        userId: assignedToId,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}". Due date: ${dueDate}.`,
        type: 'TASK_ASSIGNED',
      },
    });

    revalidatePath('/manager/tasks');
    revalidatePath('/employee/tasks');
    return { success: true, task };
  } catch (error) {
    console.error('Create task error:', error);
    return { error: 'Failed to create task.' };
  }
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated.' };
  }

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { assignedBy: true, assignedTo: true },
    });

    if (!task) {
      return { error: 'Task not found.' };
    }

    // Ensure authorization (either assigned employee, manager, or admin)
    const isAssignedUser = task.assignedToId === session.userId;
    const isManager = session.role === 'MANAGER' || session.role === 'ADMIN';

    if (!isAssignedUser && !isManager) {
      return { error: 'Unauthorized to modify this task.' };
    }

    const isCompleted = status === 'COMPLETED';
    
    // Update task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Notify Manager when employee completes a task
    if (isCompleted && isAssignedUser) {
      await db.notification.create({
        data: {
          userId: task.assignedById,
          title: 'Task Completed',
          message: `${session.name} has completed the task: "${task.title}".`,
          type: 'TASK_ASSIGNED', // maps to managers checking tasks
        },
      });
    }

    revalidatePath('/employee/tasks');
    revalidatePath('/manager/tasks');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Update task status error:', error);
    return { error: 'Failed to update task status.' };
  }
}

export async function addTaskCommentAction(taskId: string, comment: string) {
  const session = await getSession();
  if (!session) {
    return { error: 'Not authenticated.' };
  }

  if (!comment || comment.trim() === '') {
    return { error: 'Comment text cannot be empty.' };
  }

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { error: 'Task not found.' };
    }

    // Create comment
    const taskComment = await db.taskComment.create({
      data: {
        taskId,
        userId: session.userId,
        comment,
      },
    });

    // Notify the other party
    const notifyUserId = session.userId === task.assignedToId ? task.assignedById : task.assignedToId;

    await db.notification.create({
      data: {
        userId: notifyUserId,
        title: 'New Comment on Task',
        message: `${session.name} commented: "${comment.length > 50 ? comment.slice(0, 50) + '...' : comment}"`,
        type: 'COMMENT_ADDED',
      },
    });

    revalidatePath(`/employee/tasks`);
    revalidatePath(`/manager/tasks`);
    return { success: true, comment: taskComment };
  } catch (error) {
    console.error('Add task comment error:', error);
    return { error: 'Failed to add comment.' };
  }
}
