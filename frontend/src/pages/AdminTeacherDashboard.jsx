import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import teacherService from '../services/teacherService';

export default function AdminTeacherDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', employeeType: 'teacher' });
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeType: 'teacher',
    department: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.status !== 'all') filterParams.status = filters.status;
      if (filters.employeeType) filterParams.employeeType = filters.employeeType;
      
      const data = await teacherService.getAllEmployees(filterParams);
      setEmployees(data.employees || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await teacherService.addTeacher(formData);
      setEmployees([result.employee, ...employees]);
      setShowAddForm(false);
      setFormData({ firstName: '', lastName: '', email: '', employeeType: 'teacher', department: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegenerateCode = async (id) => {
    try {
      const result = await teacherService.regenerateRegistrationCode(id);
      setEmployees(employees.map(emp => emp._id === id ? result.employee : emp));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await teacherService.deleteEmployee(id);
      setEmployees(employees.filter(emp => emp._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const result = await teacherService.updateEmployeeStatus(id, newStatus);
      setEmployees(employees.map(emp => emp._id === id ? result.employee : emp));
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>;
      case 'active':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'inactive':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium"><XCircle className="w-3 h-3" /> Inactive</span>;
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Teacher Management</h1>
        <p className="text-slate-400">Manage teachers and employee registrations</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="text-slate-400 text-sm">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 text-sm">Employee Type</label>
          <select
            value={filters.employeeType}
            onChange={(e) => setFilters({ ...filters, employeeType: e.target.value })}
            className="mt-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
          >
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
            <option value="principal">Principal</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="mb-6 p-6 glass-panel border border-white/10 rounded-lg">
          <h3 className="text-white font-bold mb-4">Add New Teacher</h3>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="input-field"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">
                Add Teacher
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No employees found</div>
      ) : (
        <div className="overflow-x-auto glass-panel border border-white/10 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Employee ID</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Registration Code</th>
                <th className="px-6 py-4 text-right text-slate-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-mono text-sm">{emp.employeeId}</td>
                  <td className="px-6 py-4 text-white">
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{emp.email}</td>
                  <td className="px-6 py-4 text-slate-400 capitalize text-sm">{emp.employeeType}</td>
                  <td className="px-6 py-4">{getStatusBadge(emp.status)}</td>
                  <td className="px-6 py-4">
                    {emp.registrationCode ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-800/50 px-2 py-1 rounded text-yellow-400">
                          {emp.registrationCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(emp.registrationCode)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm">Registered</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {emp.registrationCode && (
                      <button
                        onClick={() => handleRegenerateCode(emp._id)}
                        className="p-2 hover:bg-blue-500/20 rounded transition-colors text-blue-400"
                        title="Regenerate code"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <select
                      value={emp.status}
                      onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                      className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button
                      onClick={() => handleDeleteEmployee(emp._id)}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {copiedId && (
        <div className="fixed bottom-4 right-4 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
