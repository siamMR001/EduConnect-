import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Users, Layout, GraduationCap, ArrowRight, ChevronRight, Activity, Calendar, Clock, Trash2, PlusCircle, Pencil, Settings } from 'lucide-react';
import api from '../services/api';

export default function Classrooms() {
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'details'
  const [gradeSummary, setGradeSummary] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [academicYearFilter, setAcademicYearFilter] = useState(new Date().getFullYear().toString());
  
  // Forms
  const [teachers, setTeachers] = useState([]);
  const [gradeFormData, setGradeFormData] = useState({ grade: '', academicYear: new Date().getFullYear().toString() });
  const [sectionFormData, setSectionFormData] = useState({ 
    section: 'A', 
    teacherId: '', 
    capacity: 30,
    leadSubject: '',
    leadSchedule: [{ day: 'Sunday', startTime: '10:00', endTime: '11:00' }],
    courses: [] 
  });

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem('user'));
    setUser(usr);
    fetchGradeSummary(academicYearFilter);
    if (usr?.role === 'admin') fetchTeachers();
    if (usr?.role === 'student') fetchStudentProfile(usr._id);
  }, [academicYearFilter]);

  const fetchStudentProfile = async (userId) => {
    try {
      const res = await api.get(`/students/user/${userId}`);
      setStudentProfile(res.data);
    } catch (err) {
      console.error("Error fetching student profile:", err);
    }
  };

  // Handle URL changes for deep linking
  useEffect(() => {
    const gradeParam = searchParams.get('grade');
    if (gradeParam && gradeSummary.length > 0) {
      const targetGrade = gradeSummary.find(g => g.grade.toString() === gradeParam);
      if (targetGrade) {
        setSelectedGrade(targetGrade);
        setViewMode('details');
      }
    } else if (!gradeParam) {
      setViewMode('summary');
      setSelectedGrade(null);
    }
  }, [searchParams, gradeSummary]);

  const fetchGradeSummary = async (year) => {
    try {
      setLoading(true);
      const res = await api.get(`/grades/summary?academicYear=${year || academicYearFilter}`);
      // Sort numerically (handles cases like "10" vs "6" correctly)
      const sortedData = res.data.sort((a, b) => {
        const gradeA = parseInt(a.grade) || 0;
        const gradeB = parseInt(b.grade) || 0;
        return gradeA - gradeB;
      });
      setGradeSummary(sortedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/classrooms/helpers/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGrade = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/grades/${editId}`, gradeFormData);
      } else {
        await api.post('/grades/create-grade', {
          ...gradeFormData,
          maxSections: 10
        });
      }
      setShowClassModal(false);
      setIsEditing(false);
      setEditId(null);
      setAcademicYearFilter(gradeFormData.academicYear);
      setGradeFormData({ grade: '', academicYear: academicYearFilter });
      fetchGradeSummary(gradeFormData.academicYear);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving grade');
    }
  };

  const openEditGrade = (gradeObj) => {
    // Find the original config to get the ID (the summary gradeObj has the ID of one of its sections or something, need the actual GradeSection ID)
    // Actually, in getGradeSummary, I should return the GradeSection _id
    setIsEditing(true);
    setEditId(gradeObj.configId); // I need to make sure backend returns this
    setGradeFormData({ 
      grade: gradeObj.grade, 
      academicYear: academicYearFilter 
    });
    setShowClassModal(true);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/classrooms/${editId}`, sectionFormData);
      } else {
        await api.post('/classrooms', {
          classNumber: selectedGrade.grade,
          academicYear: academicYearFilter,
          ...sectionFormData
        });
      }
      setShowSectionModal(false);
      setIsEditing(false);
      setEditId(null);
      // Reset form
      setSectionFormData({ 
        section: 'A', 
        teacherId: '', 
        capacity: 30,
        leadSubject: '',
        leadSchedule: [{ day: 'Sunday', startTime: '10:00', endTime: '11:00' }],
        courses: [] 
      });
      // Refresh
      const res = await api.get(`/grades/summary?academicYear=${academicYearFilter}`);
      const sortedData = res.data.sort((a, b) => (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0));
      setGradeSummary(sortedData);
      if (selectedGrade) {
        const updatedGrade = sortedData.find(g => g.grade === selectedGrade.grade);
        if (updatedGrade) setSelectedGrade(updatedGrade);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving section');
    }
  };

  const openEditSection = (sectionObj) => {
    setIsEditing(true);
    setEditId(sectionObj._id);
    setSectionFormData({
      section: sectionObj.section,
      teacherId: sectionObj.teacherId || '',
      capacity: sectionObj.capacity || 30,
      leadSubject: sectionObj.leadSubject || '',
      leadSchedule: sectionObj.leadSchedule || [{ day: 'Sunday', startTime: '10:00', endTime: '11:00' }],
      courses: sectionObj.courses || []
    });
    setShowSectionModal(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? This action is irreversible.')) return;
    try {
      await api.delete(`/classrooms/${sectionId}`);
      // Refresh
      const res = await api.get(`/grades/summary?academicYear=${academicYearFilter}`);
      const sortedData = res.data.sort((a, b) => (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0));
      setGradeSummary(sortedData);
      if (selectedGrade) {
        const updatedGrade = sortedData.find(g => g.grade === selectedGrade.grade);
        if (updatedGrade) setSelectedGrade(updatedGrade);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting section');
    }
  };

  const addCourseLine = () => {
    setSectionFormData({
      ...sectionFormData,
      courses: [...sectionFormData.courses, { 
        courseName: '', 
        teacherId: '', 
        schedule: [{ day: 'Sunday', startTime: '10:00', endTime: '11:00' }] 
      }]
    });
  };

  const removeCourseLine = (index) => {
    const newCourses = [...sectionFormData.courses];
    newCourses.splice(index, 1);
    setSectionFormData({ ...sectionFormData, courses: newCourses });
  };

  const addScheduleLine = (courseIndex, isLead = false) => {
    const newSlot = { day: 'Sunday', startTime: '10:00', endTime: '11:00' };
    if (isLead) {
      setSectionFormData({
        ...sectionFormData,
        leadSchedule: [...sectionFormData.leadSchedule, newSlot]
      });
    } else {
      const newCourses = [...sectionFormData.courses];
      newCourses[courseIndex].schedule.push(newSlot);
      setSectionFormData({ ...sectionFormData, courses: newCourses });
    }
  };

  const removeScheduleLine = (courseIndex, slotIndex, isLead = false) => {
    if (isLead) {
      const newSched = [...sectionFormData.leadSchedule];
      newSched.splice(slotIndex, 1);
      setSectionFormData({ ...sectionFormData, leadSchedule: newSched });
    } else {
      const newCourses = [...sectionFormData.courses];
      newCourses[courseIndex].schedule.splice(slotIndex, 1);
      setSectionFormData({ ...sectionFormData, courses: newCourses });
    }
  };

  const handleDrillDown = (gradeObj) => {
    setSearchParams({ grade: gradeObj.grade });
  };

  if (loading && viewMode === 'summary') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
            <GraduationCap className="w-5 h-5" />
            <span className="uppercase tracking-[0.2em] text-[10px]">Academic Management</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {viewMode === 'summary' ? 'School Classrooms' : `Class ${selectedGrade.grade} Overview`}
          </h1>
          <p className="text-slate-400 mt-2">
            {viewMode === 'summary' 
              ? `Institutional summary for ${academicYearFilter} session`
              : `Managing ${selectedGrade.sections.length} active sections in Grade ${selectedGrade.grade}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'summary' && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-slate-400 focus-within:border-blue-500 transition-all">
              <Calendar className="w-4 h-4 mr-2" />
              <select 
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="bg-transparent border-none text-white font-bold text-xs outline-none cursor-pointer [&>option]:bg-[#0f0f1a]"
              >
                {[0, 1, 2, 3].map(offset => {
                  const year = (new Date().getFullYear() + offset).toString();
                  return <option key={year} value={year}>{year} Session</option>
                })}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            {viewMode === 'details' && (
            <button 
              onClick={() => setSearchParams({})}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 font-bold text-sm transition-all"
            >
              Back to Summary
            </button>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => viewMode === 'summary' ? setShowClassModal(true) : setShowSectionModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 active:scale-95 text-white rounded-2xl shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {viewMode === 'summary' ? 'Establish New Class' : 'Deploy New Section'}
            </button>
          )}
        </div>
      </div>
    </div>

      {viewMode === 'summary' ? (
        /* GRADE SUMMARY TABLE */
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40 border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6 pl-10">Grade Profile</th>
                <th className="p-6">Assigned students</th>
                <th className="p-6 text-center">Sections in Class</th>
                <th className="p-6 pr-10 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {gradeSummary
                .filter(g => {
                  if (user?.role === 'student' && studentProfile) {
                    return g.grade.toString() === studentProfile.currentClass.toString();
                  }
                  return true;
                })
                .map((g) => (
                <tr 
                  key={g.grade} 
                  onClick={() => handleDrillDown(g)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        {g.grade}
                      </div>
                      <div>
                        <p className="text-white font-bold">Class {g.grade}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Global Session</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold">{g.totalAssigned} / {g.totalSeat}</span>
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black border border-emerald-500/20 uppercase tracking-widest text-center">Seats Filled</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <Layout className="w-4 h-4 text-slate-400" />
                       <span className="text-white font-bold">{g.sectionCount}</span>
                       <span className="text-slate-500 text-xs">Sections</span>
                    </div>
                  </td>
                  <td className="p-6 pr-10 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {user?.role === 'admin' && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); openEditGrade(g); }}
                           className="p-3 bg-white/5 text-slate-500 rounded-2xl border border-white/5 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20 transition-all"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                       )}
                       <button className="p-3 bg-white/5 text-slate-500 rounded-2xl border border-white/5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                         <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {gradeSummary.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-500 italic">No academic grades established yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* SECTION CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedGrade.sections
            .filter(s => {
              if (user?.role === 'student' && studentProfile) {
                return s.section === studentProfile.section;
              }
              return true;
            })
            .map((c) => (
            <div key={c._id} className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white mb-1">{c.name}</h3>
                  <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    <Layout className="w-3 h-3" /> Section {c.section}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-400">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Lead: {c.teacher}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">{c.studentCount} / {c.capacity} Students</span>
                </div>
              </div>

                <div className="flex gap-2">
                  <Link 
                    to={`/classrooms/${c._id}`}
                    className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 group/btn shadow-inner"
                  >
                    Enter Workspace <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => openEditSection(c)}
                        className="p-4 bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 rounded-2xl transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSection(c._id)}
                        className="p-4 bg-white/[0.03] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
            </div>
          ))}
          {selectedGrade.sections.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-white/5 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 font-bold">No active sections found for this grade.</p>
              <button 
                onClick={() => setShowSectionModal(true)}
                className="text-blue-400 text-xs font-black uppercase underline tracking-tighter"
              >
                Create your first section &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-3xl font-black text-white">{isEditing ? 'Update Grade' : 'Establish Grade'}</h2>
              <button 
                onClick={() => { setShowClassModal(false); setIsEditing(false); setEditId(null); }}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-8 font-medium">
              {isEditing ? 'Modify the core academic parameters for this grade level.' : 'Define the core academic parameters for a new grade level.'}
            </p>
            <form onSubmit={handleCreateGrade} className="space-y-6">
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Academic Grade Number</label>
                <input 
                  type="text" 
                  value={gradeFormData.grade} 
                  onChange={e => setGradeFormData({...gradeFormData, grade: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  required 
                  placeholder="e.g. 6 or Nursery"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Academic Session / Year</label>
                <select 
                  value={gradeFormData.academicYear} 
                  onChange={e => setGradeFormData({...gradeFormData, academicYear: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  {[0, 1, 2, 3].map(offset => {
                    const year = (new Date().getFullYear() + offset).toString();
                    return <option key={year} value={year} className="bg-[#0f0f1a]">{year}</option>
                  })}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-colors shadow-xl shadow-blue-500/20"
              >
                {isEditing ? 'Save Changes' : 'Establish Grade'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-[40px] p-8 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{isEditing ? 'Update Section' : 'Deploy Section'}</h2>
                <p className="text-slate-500 text-sm font-medium">Configure subjects and schedules for Grade {selectedGrade.grade}.</p>
              </div>
              <button onClick={() => { setShowSectionModal(false); setIsEditing(false); setEditId(null); }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-slate-500 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              {/* Basic Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Section Identity (e.g. Jupiter, A)</label>
                  <input 
                    type="text"
                    value={sectionFormData.section}
                    onChange={e => setSectionFormData({...sectionFormData, section: e.target.value})}
                    placeholder="Enter section name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Maximum Students</label>
                  <input 
                    type="number"
                    value={sectionFormData.capacity}
                    onChange={e => setSectionFormData({...sectionFormData, capacity: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Lead Section */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 p-2 rounded-lg"><GraduationCap className="w-4 h-4 text-white" /></div>
                  <h3 className="text-white font-bold">Mandatory Lead Teacher & Subject</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Lead Subject Name</label>
                    <input 
                      type="text"
                      value={sectionFormData.leadSubject}
                      onChange={e => setSectionFormData({...sectionFormData, leadSubject: e.target.value})}
                      placeholder="e.g. Mathematics"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Lead Teacher</label>
                    <select 
                      value={sectionFormData.teacherId} 
                      onChange={e => setSectionFormData({...sectionFormData, teacherId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                      required
                    >
                      <option value="" className="bg-[#0f0f1a]">Select Lead Teacher...</option>
                      {teachers.map(t => <option key={t._id} value={t._id} className="bg-[#0f0f1a]">{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Lead Schedule */}
                <div className="space-y-3">
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest">Lead Subject Schedule</label>
                  {sectionFormData.leadSchedule.map((slot, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <select 
                        value={slot.day} 
                        onChange={e => {
                          const newSched = [...sectionFormData.leadSchedule];
                          newSched[sIdx].day = e.target.value;
                          setSectionFormData({...sectionFormData, leadSchedule: newSched});
                        }}
                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                      >
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d} className="bg-[#0f0f1a]">{d}</option>)}
                      </select>
                      <div className="h-4 w-px bg-white/10 mx-2"></div>
                      <input 
                        type="time" 
                        value={slot.startTime} 
                        onChange={e => {
                          const newSched = [...sectionFormData.leadSchedule];
                          newSched[sIdx].startTime = e.target.value;
                          setSectionFormData({...sectionFormData, leadSchedule: newSched});
                        }}
                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer [color-scheme:dark]"
                      />
                      <span className="text-slate-600 text-[10px] font-black">TO</span>
                      <input 
                        type="time" 
                        value={slot.endTime} 
                        onChange={e => {
                          const newSched = [...sectionFormData.leadSchedule];
                          newSched[sIdx].endTime = e.target.value;
                          setSectionFormData({...sectionFormData, leadSchedule: newSched});
                        }}
                        className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer [color-scheme:dark]"
                      />
                      <button type="button" onClick={() => removeScheduleLine(0, sIdx, true)} className="ml-auto p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => addScheduleLine(0, true)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors pl-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Class Slot
                  </button>
                </div>
              </div>

              {/* Other Courses Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg"><Layout className="w-4 h-4 text-purple-400" /></div>
                    <h3 className="text-white font-bold">Other Subjects/Courses</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addCourseLine}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/20 font-bold text-xs transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Subject
                  </button>
                </div>

                {sectionFormData.courses.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[32px]">
                    <p className="text-slate-600 text-sm italic">No additional courses added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {sectionFormData.courses.map((course, cIdx) => (
                      <div key={cIdx} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Subject Row #{cIdx + 1}</span>
                          <button type="button" onClick={() => removeCourseLine(cIdx)} className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Subject Name</label>
                            <input 
                              type="text"
                              value={course.courseName}
                              onChange={e => {
                                const newCourses = [...sectionFormData.courses];
                                newCourses[cIdx].courseName = e.target.value;
                                setSectionFormData({...sectionFormData, courses: newCourses});
                              }}
                              placeholder="e.g. English Literature"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Assigned Teacher (Optional)</label>
                            <select 
                              value={course.teacherId} 
                              onChange={e => {
                                const newCourses = [...sectionFormData.courses];
                                newCourses[cIdx].teacherId = e.target.value;
                                setSectionFormData({...sectionFormData, courses: newCourses});
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                            >
                              <option value="" className="bg-[#0f0f1a]">No teacher yet...</option>
                              {teachers.map(t => <option key={t._id} value={t._id} className="bg-[#0f0f1a]">{t.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Schedule Sub-lines */}
                        <div className="space-y-3 pl-4 border-l-2 border-white/5 ml-2">
                          <label className="block text-slate-500 text-[9px] font-black uppercase tracking-widest ml-2 mb-2">Class Schedule Slots</label>
                          {course.schedule.map((slot, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 max-w-fit">
                              <select 
                                value={slot.day} 
                                onChange={e => {
                                  const newCourses = [...sectionFormData.courses];
                                  newCourses[cIdx].schedule[sIdx].day = e.target.value;
                                  setSectionFormData({...sectionFormData, courses: newCourses});
                                }}
                                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-2"
                              >
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d} className="bg-[#0f0f1a]">{d}</option>)}
                              </select>
                              <div className="h-3 w-px bg-white/10 mx-1"></div>
                              <input 
                                type="time" 
                                value={slot.startTime} 
                                onChange={e => {
                                  const newCourses = [...sectionFormData.courses];
                                  newCourses[cIdx].schedule[sIdx].startTime = e.target.value;
                                  setSectionFormData({...sectionFormData, courses: newCourses});
                                }}
                                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer [color-scheme:dark]"
                              />
                              <span className="text-slate-600 text-[8px] font-black">TO</span>
                              <input 
                                type="time" 
                                value={slot.endTime} 
                                onChange={e => {
                                  const newCourses = [...sectionFormData.courses];
                                  newCourses[cIdx].schedule[sIdx].endTime = e.target.value;
                                  setSectionFormData({...sectionFormData, courses: newCourses});
                                }}
                                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer [color-scheme:dark]"
                              />
                              <button type="button" onClick={() => removeScheduleLine(cIdx, sIdx)} className="ml-2 text-slate-600 hover:text-red-400 transition-colors">
                                <Plus className="w-3.5 h-3.5 rotate-45" />
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => addScheduleLine(cIdx)}
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-colors pl-3 mt-2"
                          >
                            <PlusCircle className="w-3 h-3" /> Add Schedule Slot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/10">
                <button type="button" onClick={() => { setShowSectionModal(false); setIsEditing(false); setEditId(null); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all">Cancel</button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" /> {isEditing ? 'Save Configuration' : 'Deploy Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
