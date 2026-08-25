'use client';

import { useState } from 'react';
import {
  addEmployeeAction,
  editEmployeeAction,
  toggleEmployeeStatusAction,
  deleteEmployeeAction,
  createDepartmentAction,
} from '@/lib/actions/employee-actions';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DepartmentItem {
  id: string;
  name: string;
}

interface ManagerItem {
  id: string;
  name: string;
  role: string;
}

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  designation: string;
  joiningDate: string;
  status: string;
  annualLeaveAllowance: number;
  departmentId: string | null;
  managerId: string | null;
  department: { name: string } | null;
  manager: { name: string } | null;
}

interface EmployeesClientProps {
  employees: EmployeeItem[];
  departments: DepartmentItem[];
  managers: ManagerItem[];
}

export default function EmployeesClient({ employees, departments, managers }: EmployeesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('deptName') as string;
    const managerId = formData.get('deptManagerId') as string;

    try {
      const res = await createDepartmentAction(name, managerId || undefined);

      if (res.error) {
        setError(res.error);
      } else {
        setShowDeptModal(false);
        form.reset();
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const employeeId = formData.get('employeeId') as string;
    const designation = formData.get('designation') as string;
    const departmentId = formData.get('departmentId') as string;
    const managerId = formData.get('managerId') as string;
    const joiningDate = formData.get('joiningDate') as string;
    const allowance = parseInt(formData.get('annualLeaveAllowance') as string, 10);
    const password = formData.get('password') as string;

    try {
      const res = await addEmployeeAction(
        name,
        email,
        role,
        employeeId,
        designation,
        departmentId,
        managerId || undefined,
        joiningDate || undefined,
        allowance,
        password || undefined
      );

      if (res.error) {
        setError(res.error);
      } else {
        setShowAddModal(false);
        form.reset();
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const employeeId = formData.get('employeeId') as string;
    const designation = formData.get('designation') as string;
    const departmentId = formData.get('departmentId') as string;
    const managerId = formData.get('managerId') as string;
    const allowance = parseInt(formData.get('annualLeaveAllowance') as string, 10);
    const password = formData.get('password') as string;

    try {
      const res = await editEmployeeAction(
        editingEmployee.id,
        name,
        email,
        role,
        employeeId,
        designation,
        departmentId,
        managerId || undefined,
        allowance,
        password || undefined
      );

      if (res.error) {
        setError(res.error);
      } else {
        setEditingEmployee(null);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!confirm('Are you sure you want to change the status of this employee?')) return;
    try {
      await toggleEmployeeStatusAction(id, currentStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: Deleting this employee will cascade delete all associated attendance, tasks, leaves, and WFH requests. Proceed?')) return;
    try {
      const res = await deleteEmployeeAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-xs text-slate-500">Add, edit, deactivate, or remove employee accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeptModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow hover:bg-slate-50 transition"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Manager</th>
                <th className="px-6 py-3">Leave Bal.</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-750">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{emp.designation} • {emp.employeeId} • {emp.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold uppercase">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{emp.department?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-slate-500">{emp.manager?.name || 'Direct CEO Report'}</td>
                  <td className="px-6 py-4 text-slate-500">{emp.annualLeaveAllowance} Days</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.status)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-100 hover:bg-red-50 hover:text-red-700 hover:border-red-100'
                          : 'bg-red-50 text-red-700 border-red-100 hover:bg-green-50 hover:text-green-700 hover:border-green-100'
                      }`}
                      title="Click to toggle status"
                    >
                      {emp.status === 'ACTIVE' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {emp.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="rounded-lg p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 shadow-sm"
                        title="Edit profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="rounded-lg p-1.5 border border-red-100 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 shadow-sm"
                        title="Delete employee record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-800">Add New Employee</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Riya Sen"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="riya@company.com"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    required
                    placeholder="e.g. EMP-006"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    required
                    placeholder="e.g. Backend Lead"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Role</label>
                  <select
                    name="role"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Department</label>
                  <select
                    name="departmentId"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Reporting Manager</label>
                  <select
                    name="managerId"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">None (CEO/Direct)</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Annual Leaves</label>
                  <input
                    type="number"
                    name="annualLeaveAllowance"
                    required
                    defaultValue="12"
                    min="0"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    defaultValue={new Date().toLocaleDateString('en-CA')}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Set Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Enter login password for user"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow hover:bg-indigo-755 disabled:bg-indigo-400 transition"
              >
                {loading ? 'Adding...' : 'Create Employee Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-800">Edit Employee Profile</h2>
              <button
                onClick={() => setEditingEmployee(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingEmployee.name}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingEmployee.email}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    required
                    defaultValue={editingEmployee.employeeId}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    required
                    defaultValue={editingEmployee.designation}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Role</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingEmployee.role}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Department</label>
                  <select
                    name="departmentId"
                    required
                    defaultValue={editingEmployee.departmentId || ''}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Reporting Manager</label>
                  <select
                    name="managerId"
                    defaultValue={editingEmployee.managerId || ''}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                  >
                    <option value="">None (CEO/Direct)</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Annual Leaves</label>
                  <input
                    type="number"
                    name="annualLeaveAllowance"
                    required
                    defaultValue={editingEmployee.annualLeaveAllowance}
                    min="0"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Reset Password (Optional)</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Leave blank to keep current password"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-800">Add New Department</h2>
              <button
                onClick={() => setShowDeptModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-650 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Department Name</label>
                <input
                  type="text"
                  name="deptName"
                  required
                  placeholder="e.g. Creative Design"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Department Head (Manager)</label>
                <select
                  name="deptManagerId"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 py-3 px-4 text-sm outline-none bg-white focus:border-indigo-500"
                >
                  <option value="">None (Assign Later)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition"
              >
                {loading ? 'Creating...' : 'Create Department'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
