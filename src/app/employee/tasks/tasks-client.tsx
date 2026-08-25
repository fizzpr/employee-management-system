'use client';

import { useState } from 'react';
import { updateTaskStatusAction, addTaskCommentAction } from '@/lib/actions/task-actions';
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MessageSquare,
  X,
  Play,
  CheckSquare,
  ChevronRight,
  Send,
  Loader2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  assignedBy: {
    name: string;
    designation: string;
  };
  comments: CommentItem[];
}

interface TasksClientProps {
  tasks: TaskItem[];
  todayStr: string;
}

export default function TasksClient({ tasks, todayStr }: TasksClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.map(task => {
    // Dynamically evaluate overdue
    const isOverdue = task.status !== 'COMPLETED' && task.dueDate < todayStr;
    const finalStatus = isOverdue ? 'OVERDUE' : task.status;
    return { ...task, displayStatus: finalStatus };
  }).filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || task.displayStatus === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setLoadingAction(true);
    try {
      const res = await updateTaskStatusAction(taskId, newStatus);
      if (!res.error) {
        // Update local state or refresh
        router.refresh();
        // Close modal or update open state
        if (selectedTask) {
          const updated = { ...selectedTask, status: newStatus, displayStatus: newStatus };
          setSelectedTask(updated as any);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
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
        // Append comment locally for instant update in modal
        if (selectedTask) {
          const freshComments = [...(selectedTask.comments || [])];
          // We can fetch updated task from server or wait for refresh, 
          // let's just trigger router.refresh() and let it propagate.
          // To make it instant in UI:
          router.refresh();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  // Re-fetch active selected task to show new comments if router.refresh occurred
  const activeTaskInModal = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
        <p className="text-xs text-slate-500">Track task progress, update status, and communicate with manager</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold bg-white outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold bg-white outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm font-medium text-slate-400">
            No tasks found matching your filters.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition duration-150 flex flex-col justify-between h-48"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  {/* Priority Badge */}
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                    task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    task.priority === 'MEDIUM' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.priority}
                  </span>

                  {/* Status Badge */}
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.displayStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                    task.displayStatus === 'OVERDUE' ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' :
                    task.displayStatus === 'REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                    task.displayStatus === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.displayStatus}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">
                  {task.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Card Footer info */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {task.dueDate}
                </span>
                <span className="flex items-center gap-1 text-indigo-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {task.comments?.length || 0} Comments
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  selectedTask.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-100' :
                  selectedTask.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {selectedTask.priority} Priority
                </span>
                <h2 className="mt-2 text-lg font-bold text-slate-800">{selectedTask.title}</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Assigned by: {selectedTask.assignedBy.name} ({selectedTask.assignedBy.designation})</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Dates & Details */}
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

              {/* Task Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {selectedTask.description}
                </p>
              </div>

              {/* Workflow Actions */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</h4>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(activeTaskInModal?.status || selectedTask.status) === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusChange(selectedTask.id, 'IN_PROGRESS')}
                      disabled={loadingAction}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                      {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Start Work
                    </button>
                  )}

                  {['IN_PROGRESS', 'REVIEW'].includes(activeTaskInModal?.status || selectedTask.status) && (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedTask.id, 'REVIEW')}
                        disabled={loadingAction}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:bg-slate-100"
                      >
                        Submit for Review
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedTask.id, 'COMPLETED')}
                        disabled={loadingAction}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-green-700 disabled:bg-green-400"
                      >
                        {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                        Mark as Complete
                      </button>
                    </>
                  )}

                  {(activeTaskInModal?.status || selectedTask.status) === 'COMPLETED' && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700 border border-green-150">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      Task completed on {new Date(activeTaskInModal?.completedAt || '').toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Task Comments Section */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comments ({activeTaskInModal?.comments?.length || 0})</h4>
                
                {/* List Comments */}
                <div className="mt-3 space-y-3 max-h-48 overflow-y-auto pr-1">
                  {(activeTaskInModal?.comments || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
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

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
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
