import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, RefreshCw, Trash2, Copy, CheckCircle, Clock, XCircle, Search, 
  Filter, User, Eye, Edit3, X, Download, Phone, Mail, MapPin, Calendar, 
  Heart, Bookmark, Users, Briefcase, Shield, Image as ImageIcon, FileText, Upload, ChevronRight, Printer
} from 'lucide-react';
import teacherService from '../services/teacherService';

// --- Helper Components Moved Outside to Prevent Re-render Focus Loss (Blinking) ---

const getStatusBadge = (status) => {
  const config = {
    pending: { color: 'badge-glow-amber', icon: Clock },
    active: { color: 'badge-glow-emerald', icon: CheckCircle },
    inactive: { color: 'badge-glow-rose', icon: XCircle }
  };
  const { color, icon: Icon } = config[status] || config.pending;
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] ${color}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

const DetailRow = ({ label, value, isEdit, onChange, type = "text", options = [] }) => (
  <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">{label}</label>
    {isEdit ? (
      type === "select" ? (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="input-field h-10 text-xs font-bold bg-black/40 border-white/10"
        >
          <option value="">Select...</option>
          {options.map(opt => <option key={opt.val || opt} value={opt.val || opt}>{opt.label || opt}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="input-field h-10 text-xs font-bold bg-black/40 border-white/10"
        />
      )
    ) : (
      <p className="text-white text-sm font-black bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 whitespace-nowrap overflow-hidden text-ellipsis shadow-inner">
        {value || '—'}
      </p>
    )}
  </div>
);

const roleLabels = {
  teacher: 'Teacher',
  admin: 'Administrator',
  staff: 'Office Staff',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  employee: 'General Employee'
};

const departmentsList = [
  'Science', 'Arts', 'Commerce', 'Mathematics', 'English', 'Physical Education', 'ICT'
];

// --- ID Card Modal Helper Components ---

const IDRow = ({ label, value, highlight = false }) => (
  <div className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-slate-800'}`}>{value}</span>
  </div>
);

const IDCardModal = ({ employee, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up print:bg-white print:p-0" onClick={onClose}>
      <style type="text/css" media="print">
          {`
              @page { margin: 0; size: auto; }
              body * { visibility: hidden; }
              #id-card-print-area, #id-card-print-area * { visibility: visible; }
              #id-card-print-area {
                  position: fixed;
                  left: 50%;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  width: 380px;
                  height: 570px;
                  border-radius: 1rem;
                  margin: 0;
                  box-shadow: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
          `}
      </style>
      
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="no-print absolute -top-12 right-0 text-white/50 hover:text-white transition flex items-center gap-2 text-sm uppercase font-black tracking-widest">
              Termination Sequence <X size={20} />
          </button>

          {/* ID Card */}
          <div id="id-card-print-area" className="bg-white rounded-2xl overflow-hidden shadow-2xl relative w-full aspect-[2/3] flex flex-col font-sans">
              {/* Header */}
              <div className="h-32 bg-gradient-to-br from-slate-900 to-primary relative flex flex-col items-center justify-center">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '15px 15px' }}></div>
                  <h2 className="text-white font-black text-2xl tracking-[0.2em] uppercase relative z-10">EDUCONNECT</h2>
                  <p className="text-white/60 text-[9px] font-black tracking-[0.3em] uppercase mt-0.5 relative z-10">Institutional Personnel Division</p>
              </div>

              {/* Body */}
              <div className="flex-1 bg-white relative flex flex-col items-center px-8 pt-16 pb-6">
                  <div className="absolute -top-16 w-32 h-32 rounded-2xl bg-white p-1.5 shadow-2xl">
                      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                          {employee.profilePicture ? (
                              <img src={`${import.meta.env.VITE_API_URL}${employee.profilePicture}`} alt="Personnel" className="w-full h-full object-cover" />
                          ) : (
                              <User size={64} className="text-slate-300" />
                          )}
                      </div>
                  </div>

                  <div className="text-center w-full mt-4 flex-1">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{employee.firstName}</h3>
                      <h3 className="text-2xl font-black text-primary uppercase tracking-tight mb-1">{employee.lastName}</h3>
                      <div className="inline-block px-4 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                          {roleLabels[employee.employeeType] || employee.employeeType}
                      </div>

                      <div className="space-y-3 w-full text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <IDRow label="PERSONNEL ID" value={employee.employeeId} />
                          <IDRow label="DEPARTMENT" value={employee.department || 'INSTITUTIONAL'} />
                          <IDRow label="JOIN DATE" value={new Date(employee.generatedAt || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} />
                          <IDRow label="MOBILE SYNC" value={employee.phone || 'N/A'} highlight />
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="w-full mt-6 flex justify-between items-end border-t border-slate-100 pt-4">
                      <div className="text-[9px] text-slate-400 font-bold leading-tight">
                          <p className="uppercase tracking-tighter">Verified Credentials v2.0</p>
                          <p className="uppercase tracking-tighter">Issuer: Global Admin Office</p>
                      </div>
                      <div className="h-8 w-24 flex gap-px opacity-30">
                          {[...Array(24)].map((_, i) => (
                              <div key={i} className="bg-slate-900 h-full" style={{ width: [1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 1, 2, 3, 2, 1, 3, 2, 1, 2, 1, 3, 1][i] + 'px' }}></div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          <div className="mt-8 flex justify-center no-print">
              <button
                  onClick={() => { window.print(); }}
                  className="btn-primary flex items-center gap-3 py-4 px-10 shadow-2xl shadow-primary/40 rounded-2xl transform hover:scale-105 transition-all duration-300 group"
              >
                  <Download size={20} className="group-hover:translate-y-0.5 transition-transform" /> 
                  <span className="text-xs font-black uppercase tracking-widest pt-0.5">EXFILTRATE DIGITAL PDF</span>
              </button>
          </div>
      </div>
  </div>
);

// --- Main Component ---

export default function AdminTeacherDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', employeeType: 'all', department: 'all' });
  
  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeForID, setSelectedEmployeeForID] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFiles, setEditFiles] = useState({ profilePicture: null, professionalDocs: null });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeType: 'teacher',
    department: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.status !== 'all') filterParams.status = filters.status;
      if (filters.employeeType !== 'all') filterParams.employeeType = filters.employeeType;
      
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
  }, [filters.status, filters.employeeType]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const id = (emp.employeeId || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || id.includes(search);
      const matchesDept = filters.department === 'all' || emp.department === filters.department;
      
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, filters.department]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const result = await teacherService.addTeacher(formData);
      setEmployees([result.employee, ...employees]);
      setShowAddForm(false);
      setFormData({ firstName: '', lastName: '', employeeType: 'teacher', department: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError('');
      
      const submissionData = new FormData();
      
      // Explicitly append important fields to ensure they are captured
      const fieldsToInclude = [
        'firstName', 'lastName', 'employeeType', 'department', 'subject', 
        'email', 'phone', 'gender', 'maritalStatus', 'fatherName', 
        'motherName', 'religion', 'dateOfBirth', 'address', 'city', 'status'
      ];

      fieldsToInclude.forEach(key => {
        const val = selectedEmployee[key];
        submissionData.append(key, val === null || val === undefined ? '' : val);
      });
      
      // Log FormData entries for debugging
      console.log('--- FormData Payload ---');
      for (let pair of submissionData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
      }

      // Add files if present
      if (editFiles.profilePicture) {
        console.log('Appending Profile Picture:', editFiles.profilePicture.name);
        submissionData.append('profilePicture', editFiles.profilePicture);
      }
      if (editFiles.professionalDocs) {
        console.log('Appending Professional Docs:', editFiles.professionalDocs.name);
        submissionData.append('professionalDocs', editFiles.professionalDocs);
      }

      const result = await teacherService.updateEmployee(selectedEmployee._id, submissionData);
      setEmployees(employees.map(emp => emp._id === selectedEmployee._id ? result.employee : emp));
      
      setTimeout(() => {
        setIsSaving(false);
        setEditMode(false);
        setEditFiles({ profilePicture: null, professionalDocs: null });
        setSelectedEmployee(null);
      }, 500);

    } catch (err) {
      console.error('Update failed:', err);
      setError(err.message || 'Failed to update record. Please check all fields.');
      setIsSaving(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await teacherService.deleteEmployee(id);
      setEmployees(employees.filter(emp => emp._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 md:px-6">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
        <div className="font-sis group">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-2.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:h-12 transition-all duration-500"></div>
             <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-2xl">
               Teacher & Employee Management <span className="text-primary-light">(TEM)</span>
             </h1>
          </div>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-70 pl-6 border-l-2 border-white/5 ml-1">Institutional Operations • Personnel Intelligence</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Name or Employee ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 h-12 text-sm bg-black/40 font-bold border-white/10 focus:bg-black/60" 
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="w-full sm:w-auto btn-primary px-8 h-12 flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 transform hover:scale-102 active:scale-98 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> <span className="text-xs font-black uppercase tracking-widest pt-0.5">Initialize Record</span>
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 font-sis">
        <div className="glass-panel p-5 flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.06] transition-all border-white/5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Filter size={20} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block tracking-widest">Global Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-transparent text-white font-black text-sm outline-none w-full cursor-pointer appearance-none"
            >
              <option value="all" className="bg-slate-900">All Records</option>
              <option value="active" className="bg-slate-900">Active Only</option>
              <option value="pending" className="bg-slate-900">Pending Authorization</option>
              <option value="inactive" className="bg-slate-900">Inactive/Archived</option>
            </select>
          </div>
        </div>
        
        <div className="glass-panel p-5 flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.06] transition-all border-white/5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield size={20} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block tracking-widest">Organizational Role</label>
            <select 
              value={filters.employeeType} 
              onChange={(e) => setFilters({...filters, employeeType: e.target.value})}
              className="bg-transparent text-white font-black text-sm outline-none w-full cursor-pointer appearance-none"
            >
              <option value="all" className="bg-slate-900">Unified Roles</option>
              {Object.entries(roleLabels).map(([val, label]) => (
                <option key={val} value={val} className="bg-slate-900">{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.06] transition-all border-white/5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
            <Briefcase size={20} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block tracking-widest">Core Department</label>
            <select 
              value={filters.department} 
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="bg-transparent text-white font-black text-sm outline-none w-full cursor-pointer appearance-none"
            >
              <option value="all" className="bg-slate-900">Institutional All</option>
              {departmentsList.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={fetchEmployees}
          className="glass-panel p-5 flex items-center gap-5 bg-primary/20 hover:bg-primary/30 transition-all border-primary/20 group"
        >
          <div className={`w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>
            <RefreshCw size={20} />
          </div>
          <div className="text-left">
             <label className="text-[10px] font-black uppercase text-white/60 mb-1 block tracking-widest">Live Sync</label>
             <p className="text-white font-black text-sm">{filteredEmployees.length} Units Found</p>
          </div>
        </button>
      </div>

      {/* Content Area */}
      {error && (
        <div className="p-5 mb-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm text-center font-black tracking-tight flex items-center justify-center gap-3 animate-pulse">
          <XCircle size={18} /> {error}
        </div>
      )}
      
      <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl rounded-[2rem] bg-slate-900/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-white/10">Staff Profile</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-white/10">Designation</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-white/10">Standing</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-white/10 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-white/[0.04] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-primary border border-white/10 overflow-hidden shadow-2xl relative group-hover:scale-105 transition-transform duration-300">
                         {emp.profilePicture && emp.employeeType !== 'admin' ? (
                           <img src={`${import.meta.env.VITE_API_URL}${emp.profilePicture}`} className="w-full h-full object-cover" />
                         ) : (
                           <User size={24} />
                         )}
                         <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div>
                        <p className="text-base font-black text-white group-hover:text-primary transition-colors leading-tight">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] font-black text-slate-500 bg-black/40 px-2 py-0.5 rounded-md tracking-widest border border-white/5">
                            {emp.employeeId}
                          </code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-white uppercase tracking-[0.1em]">
                      {roleLabels[emp.employeeType] || emp.employeeType}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                       <Briefcase size={12} className="text-primary" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.department || 'Institutional'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {getStatusBadge(emp.status)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => { setSelectedEmployeeForID(emp); }}
                        className="p-2.5 bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-lg" 
                        title="Generate ID Card"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedEmployee(emp); setEditMode(false); }}
                        className="p-2.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all shadow-lg" 
                        title="Analyze Record"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedEmployee({...emp}); setEditMode(true); setEditFiles({ profilePicture: null, professionalDocs: null }); }}
                        className="p-2.5 bg-white/5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-lg"
                        title="Modify Entry"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp._id)}
                        className="p-2.5 bg-white/5 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all shadow-lg"
                        title="Archive Unit"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredEmployees.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
               <Search size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase">No active records match the criteria</p>
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="w-full max-w-5xl glass-panel border border-white/10 rounded-[3rem] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] my-auto relative overflow-hidden">
            {/* Modal Header Decoration */}
            <div className={`h-3 ${editMode ? 'bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-700'} transition-all`}></div>
            
            <button 
              onClick={() => { setSelectedEmployee(null); setEditMode(false); }}
              className="absolute right-8 top-8 p-3 bg-black/40 hover:bg-white/10 text-white rounded-full z-[110] transition-all border border-white/10 hover:rotate-90"
            >
              <X size={24} />
            </button>
            
            <div className="p-12">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-16 px-4">
                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-8 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden relative group shrink-0">
                  {selectedEmployee.profilePicture && selectedEmployee.employeeType !== 'admin' ? (
                    <img src={`${import.meta.env.VITE_API_URL}${selectedEmployee.profilePicture}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary bg-primary/5">
                      <User size={80} strokeWidth={1} />
                    </div>
                  )}
                  {editMode && selectedEmployee.employeeType !== 'admin' && (
                    <label className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <Upload className="text-white mb-2" size={32} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Change<br/>Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditFiles({...editFiles, profilePicture: e.target.files[0]})} />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                     <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedEmployee.employeeId}</span>
                     {getStatusBadge(selectedEmployee.status)}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-sis uppercase mb-2 leading-none pt-2">
                    {editMode ? 'Personnel Modification' : `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 font-black tracking-widest uppercase text-[11px]">
                    <Shield size={14} className="text-primary" />
                    <span>{roleLabels[selectedEmployee.employeeType] || selectedEmployee.employeeType}</span>
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full mx-1"></span>
                    <Briefcase size={14} className="text-blue-400" />
                    <span>{selectedEmployee.department || 'Unassigned'}</span>
                  </div>
                </div>

                {!editMode && (
                  <button 
                    onClick={() => { setSelectedEmployeeForID(selectedEmployee); }}
                    className="flex items-center gap-3 px-6 py-4 bg-primary text-white font-black text-xs rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all group"
                  >
                    <Printer size={18} className="group-hover:rotate-12 transition-transform" /> 
                    <span className="tracking-widest uppercase">Generate Credentials Card</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateEmployee} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left font-sis">
                  <div className="space-y-8 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <h3 className="text-primary-light text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-3">
                       <User size={16} /> Identity Matrix
                    </h3>
                    <div className="space-y-5">
                       <DetailRow label="Given Name" value={selectedEmployee.firstName} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, firstName: v})} />
                       <DetailRow label="Surname" value={selectedEmployee.lastName} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, lastName: v})} />
                       <DetailRow label="Direct Phone" value={selectedEmployee.phone} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, phone: v})} />
                       <DetailRow label="Genetic Gender" value={selectedEmployee.gender} isEdit={editMode} type="select" options={['Male', 'Female', 'Other']} onChange={(v) => setSelectedEmployee({...selectedEmployee, gender: v})} />
                       {editMode && (
                         <DetailRow label="Lifecycle Status" value={selectedEmployee.status} isEdit={editMode} type="select" options={['active', 'inactive', 'pending']} onChange={(v) => setSelectedEmployee({...selectedEmployee, status: v})} />
                       )}
                    </div>
                  </div>

                  <div className="space-y-8 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                     <h3 className="text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-3">
                       <Briefcase size={16} /> Institutional Core
                    </h3>
                    <div className="space-y-5">
                       <DetailRow label="Primary Department" value={selectedEmployee.department} isEdit={editMode} type="select" options={departmentsList} onChange={(v) => setSelectedEmployee({...selectedEmployee, department: v})} />
                       <DetailRow label="Major Subject" value={selectedEmployee.subject} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, subject: v})} />
                       <DetailRow label="Digital Mail" value={selectedEmployee.email} isEdit={editMode} type="email" onChange={(v) => setSelectedEmployee({...selectedEmployee, email: v})} />
                       <DetailRow label="Security Role" value={selectedEmployee.employeeType} isEdit={editMode} type="select" options={Object.entries(roleLabels).map(([val, label]) => ({ val, label }))} onChange={(v) => setSelectedEmployee({...selectedEmployee, employeeType: v})} />
                    </div>
                  </div>

                  <div className="space-y-8 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                     <h3 className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/5 pb-3">
                       <Users size={16} /> Heritage Matrix
                    </h3>
                    <div className="space-y-5">
                       <DetailRow label="Father Record" value={selectedEmployee.fatherName} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, fatherName: v})} />
                       <DetailRow label="Mother Record" value={selectedEmployee.motherName} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, motherName: v})} />
                       <DetailRow label="Faith / Religion" value={selectedEmployee.religion} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, religion: v})} />
                       <DetailRow label="Chronology (DOB)" value={selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toISOString().split('T')[0] : ''} isEdit={editMode} type="date" onChange={(v) => setSelectedEmployee({...selectedEmployee, dateOfBirth: v})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/10 text-left font-sis">
                   <div className="space-y-8">
                      <h3 className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <MapPin size={18} /> Geographical Sector
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                           <DetailRow label="Detailed Residential Address" value={selectedEmployee.address} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, address: v})} />
                        </div>
                        <DetailRow label="Base City / Hub" value={selectedEmployee.city} isEdit={editMode} onChange={(v) => setSelectedEmployee({...selectedEmployee, city: v})} />
                        <DetailRow label="Marital Status" value={selectedEmployee.maritalStatus} isEdit={editMode} type="select" options={['Single', 'Married', 'Divorced', 'Widowed']} onChange={(v) => setSelectedEmployee({...selectedEmployee, maritalStatus: v})} />
                      </div>
                   </div>
                   
                   <div className="space-y-8">
                      <h3 className="text-amber-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <Shield size={18} /> Verified Vault
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/[0.06] transition-all relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                   <ImageIcon size={20} />
                                </div>
                                <div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Primary Asset</span>
                                   <span className="text-xs font-black text-white uppercase tracking-wider">Self Portrait</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                {editFiles.profilePicture && (
                                   <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded uppercase tracking-widest animate-pulse mr-2">New File Linked</span>
                                )}
                                {selectedEmployee.profilePicture && (
                                    <a href={`${import.meta.env.VITE_API_URL}${selectedEmployee.profilePicture}`} target="_blank" className="p-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-lg"><Download size={18} /></a>
                                )}
                            </div>
                            {editMode && (
                               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-50" onChange={(e) => setEditFiles({...editFiles, profilePicture: e.target.files[0]})} />
                            )}
                        </div>
                        
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/[0.06] transition-all relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                   <FileText size={20} />
                                </div>
                                <div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Credentials Vault</span>
                                   <span className="text-xs font-black text-white uppercase tracking-wider">Institutional Dossier</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                {editFiles.professionalDocs && (
                                   <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded uppercase tracking-widest animate-pulse mr-2">Ready to Sync</span>
                                )}
                                {selectedEmployee.cvDocument && (
                                    <a href={`${import.meta.env.VITE_API_URL}${selectedEmployee.cvDocument}`} target="_blank" className="p-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-lg z-10"><Download size={18} /></a>
                                )}
                            </div>
                            {editMode && (
                               <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-50" onChange={(e) => setEditFiles({...editFiles, professionalDocs: e.target.files[0]})} />
                            )}
                        </div>
                      </div>
                      {editMode && (
                         <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Upload size={14} className="text-blue-400" />
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest leading-relaxed">System Admin: Click any vault item to replace existing verified documents.</p>
                         </div>
                      )}
                   </div>
                </div>

                <div className="flex gap-6 pt-12 border-t border-white/10 font-sis">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedEmployee(null); setEditMode(false); }}
                    className="flex-1 btn-secondary h-16 uppercase text-xs font-black tracking-widest rounded-2xl hover:bg-white/10 flex items-center justify-center gap-2"
                  >
                    Terminate Session <X size={16} />
                  </button>
                  {editMode && (
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex-[2] btn-primary h-16 uppercase text-sm font-black tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/40 transform hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-3 group"
                    >
                        {isSaving ? (
                            <>Synchronizing Lattice...</>
                        ) : (
                            <>Apply System Modifications <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                        )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl glass-panel border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative my-auto font-sis">
            <button onClick={() => setShowAddForm(false)} className="absolute right-8 top-8 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 hover:rotate-90">
                <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                    <Plus size={24} strokeWidth={3} />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight pt-2">Provision Personnel</h2>
                   <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase opacity-80">TEM Network Initialization</p>
                </div>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-8 text-left">
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Entry Given Name</label>
                   <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="input-field h-14 bg-black/40 border-white/10 text-white font-black" required />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Entry Surname</label>
                   <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="input-field h-14 bg-black/40 border-white/10 text-white font-black" required />
                </div>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Structural Unit Role</label>
                 <select value={formData.employeeType} onChange={(e) => setFormData({...formData, employeeType: e.target.value})} className="input-field h-14 bg-black/40 border-white/10 text-white font-black appearance-none">
                    {Object.entries(roleLabels).map(([val, label]) => (
                        <option key={val} value={val} className="bg-slate-900">{label}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Core Departmental Hub</label>
                 <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="input-field h-14 bg-black/40 border-white/10 text-white font-black appearance-none" required>
                    <option value="">Select Primary Unit...</option>
                    {departmentsList.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                 </select>
              </div>
              <button disabled={isSaving} type="submit" className="w-full btn-primary h-16 uppercase text-sm font-black tracking-[0.3em] mt-6 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
                {isSaving ? 'Establishing Unit...' : 'Authorize Personnel Init'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ID Card Modal Generator */}
      {selectedEmployeeForID && (
        <IDCardModal 
          employee={selectedEmployeeForID}
          onClose={() => setSelectedEmployeeForID(null)}
        />
      )}
    </div>
  );
}
