import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    classNumber: '',
    section: 'Sunrise',
    teacherId: ''
  });
  
  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem('user'));
    setUser(usr);
    
    fetchClassrooms();
    
    if (usr?.role === 'admin') {
      fetchTeachers();
    }
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data);
    } catch (err) {
      console.error(err);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms', formData);
      setShowModal(false);
      fetchClassrooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating classroom');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/classrooms/${id}/activate`);
      fetchClassrooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Error activating section');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Classrooms</h1>
          <p className="text-slate-400 mt-2 text-lg">
            {user?.role === 'admin' ? 'Manage global school classrooms' : 'Your academic spaces'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-semibold"
          >
            Create Classroom
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((c) => (
          <div key={c._id} className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-white/10 to-transparent">
            <div className="bg-[#111] h-full rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>
              
              <div className="flex justify-between items-start mb-4">
                <Link to={`/classrooms/${c._id}`}>
                  <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 transition-all">
                    {c.name}
                  </h3>
                </Link>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <p className="text-slate-400 text-sm mb-4">
                Teacher: <span className="text-slate-200">{c.teacherId?.name || 'Unassigned'}</span>
              </p>
              
              <div className="flex justify-between items-end">
                <div className="text-slate-300 text-sm font-medium">
                  {c.studentIds?.length || 0} / 30 Student{c.studentIds?.length === 1 ? '' : 's'}
                </div>
                
                <div className="flex items-center gap-2">
                  {user?.role === 'admin' && !c.isActive && (
                    <button 
                      onClick={() => handleActivate(c._id)}
                      className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/30"
                    >
                      Activate
                    </button>
                  )}
                  <Link 
                    to={`/classrooms/${c._id}`}
                    className="text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                  >
                    Enter <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 glass-panel rounded-xl">
            No classrooms available.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Setup New Classroom</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Class Number</label>
                <input 
                  type="number" min="1" max="12" 
                  value={formData.classNumber} 
                  onChange={e => setFormData({...formData, classNumber: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required 
                  placeholder="e.g. 6"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Section Name</label>
                <select 
                  value={formData.section} 
                  onChange={e => setFormData({...formData, section: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [&>option]:bg-[#1a1a2e]"
                >
                  <option value="Sunrise">Sunrise</option>
                  <option value="Horizon">Horizon</option>
                  <option value="Nova">Nova</option>
                  <option value="Ember">Ember</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Assign Teacher</label>
                <select 
                  value={formData.teacherId} 
                  onChange={e => setFormData({...formData, teacherId: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [&>option]:bg-[#1a1a2e]"
                  required
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
