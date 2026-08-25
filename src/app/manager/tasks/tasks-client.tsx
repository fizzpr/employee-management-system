'use client';

import { useState } from 'react';
import { createTaskAction, addTaskCommentAction } from '@/lib/actions/task-actions';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  MessageSquare,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
}

interface CommentItem {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number | null;
  completedAt: string | null;
  assignedTo: {
    name: string;
    designation: string;
  };
  comments: CommentItem[];
}

interface TasksClientProps {
  tasks: TaskItem[];
  team: TeamMember[];
  todayStr: string;
}

export default function TasksClient({ tasks, team, todayStr }: TasksClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  
  // Create task states
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Comment states
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.map(task => {
    const isOverdue = task.status !== 'COMPLETED' && task.dueDate < todayStr;
    const finalStatus = isOverdue ? 'OVERDUE' : task.status;
    return { ...task, displayStatus: finalStatus };
  }).filter((task) => {
    return (
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const assignedToId = formData.get('assignedToId') as string;
    const priority = formData.get('priority') as string;
    const startDate = formData.get('startDate') as string;
    const dueDate = formData.get('dueDate') as string;
    const estimatedHours = formData.get('estimatedHours') as string;

    try {
      const res = await createTaskAction(
        title,
        description,
        assignedToId,
        priority,
        startDate,
        dueDate,
        estimatedHours
      );

      if (res.error) {
        setCreateError(res.error);
      } else {
        setShowCreateModal(false);
        router.refresh();
      }
    } catch (err) {
      setCreateError('Failed to create task.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      const res = await addTaskCommentAction(selectedTask.id, newComment);
      if (!res.error) {
        setNewComment('');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  const activeTaskInModal = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Tasks</h1>
          <p className="text-xs text-slate-500">Monitor, assign, and comment on task progression</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          Assign Task
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm font-medium text-slate-400">
            No team tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between h-48"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                    task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.priority}
                  </span>

                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.displayStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                    task.displayStatus === 'OVERDUE' ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' :
                    task.displayStatus === 'REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-100 animate-pulse' :
                    task.displayStatus === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.displayStatus}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">
                  {task.title}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  Assignee: {task.assignedTo.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {task.dueDate}
                </span>
                <span className="flex items-center gap-1 text-indigo-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {task.comments?.length || 0} comments
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-800">Assign a New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {createError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Task Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Code database migrations"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Write clear instructions..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Grid: Assignee & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Assign To</label>
                  <select
                    name="assignedToId"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">Select Employee</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.designation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Priority</label>
                  <select
                    name="priority"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Grid: Start, Due & Est Hours */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={todayStr}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Est. Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    placeholder="e.g. 10"
                    min="1"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition"
              >
                {createLoading ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal with Comments (identical layout to employee view) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600`}>
                  {selectedTask.priority} Priority
                </span>
                <h2 className="mt-2 text-lg font-bold text-slate-800">{selectedTask.title}</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Assignee: {selectedTask.assignedTo.name} ({selectedTask.assignedTo.designation})</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Start Date</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTask.startDate}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Due Date</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTask.dueDate}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Estimated Hours</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTask.estimatedHours || '--'} hours</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Status</span>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5 capitalize">{activeTaskInModal?.status || selectedTask.status}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {selectedTask.description}
                </p>
              </div>

              {/* Comments Section */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comments ({(activeTaskInModal?.comments || []).length})</h4>
                
                <div className="mt-3 space-y-3 max-h-48 overflow-y-auto pr-1">
                  {(activeTaskInModal?.comments || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet.</p>
                  ) : (
                    (activeTaskInModal?.comments || []).map((c) => (
                      <div key={c.id} className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-150 text-indigo-700 flex items-center justify-center font-bold text-[10px] uppercase mt-0.5">
                          {c.user.name.slice(0,2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{c.user.name} <span className="text-[10px] text-slate-400 capitalize">({c.user.role.toLowerCase()})</span></span>
                            <span className="text-[9px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">{c.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700"
                  >
                    {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
