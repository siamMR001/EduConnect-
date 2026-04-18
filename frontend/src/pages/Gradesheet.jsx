import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Download, Trash2, Filter } from 'lucide-react';

export default function Gradesheet() {
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');

  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem('user'));
    setUser(usr);
    fetchGradesheet(search, examFilter);
  }, []);

  const fetchGradesheet = async (searchQuery = '', examName = '') => {
    try {
      let query = `?`;
      if (searchQuery) query += `search=${searchQuery}&`;
      if (examName) query += `examName=${examName}`;
      
      const res = await api.get(`/classrooms/gradesheet${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGradesheet(search, examFilter);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/classrooms/gradesheet/${id}`);
      fetchGradesheet(search, examFilter);
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting result');
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 print:m-0 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Global Gradesheet</h1>
          <p className="text-slate-400 mt-2 text-lg">Academic History & Official Records</p>
        </div>
        
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all"
        >
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {user?.role !== 'student' && (
        <form onSubmit={handleSearch} className="flex gap-4 p-4 glass-panel rounded-xl print:hidden">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {user?.role === 'admin' && (
            <div className="w-48 relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Exam Name..."
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-blue-500/25 transition-all">
            Search
          </button>
        </form>
      )}

      {/* Printable Header for PDF */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold text-black">EduConnect Academy</h1>
        <h2 className="text-xl text-gray-700 mt-2">Official Academic Gradesheet</h2>
        {user?.role === 'student' && <p className="text-gray-600 mt-1">Student: {user.name} | UID: {user._id}</p>}
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl print:border-none print:shadow-none print:bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 print:bg-gray-100 border-b border-white/10 print:border-gray-300">
                <th className="p-4 text-slate-300 font-semibold print:text-black">Exam Name</th>
                <th className="p-4 text-slate-300 font-semibold print:text-black">Class & Term</th>
                {user?.role !== 'student' && <th className="p-4 text-slate-300 font-semibold print:text-black">Student</th>}
                <th className="p-4 text-slate-300 font-semibold print:text-black w-2/5">Subjects Breakdown</th>
                <th className="p-4 text-slate-300 font-semibold print:text-black">GPA / Grade</th>
                {user?.role === 'admin' && <th className="p-4 text-slate-300 font-semibold text-right print:hidden">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">No records found.</td>
                </tr>
              ) : (
                results.map(res => {
                  let overallGrade = 'F';
                  if (res.gpa >= 4.0) overallGrade = 'A+';
                  else if (res.gpa >= 3.7) overallGrade = 'A';
                  else if (res.gpa >= 3.3) overallGrade = 'A-';
                  else if (res.gpa >= 3.0) overallGrade = 'B';
                  else if (res.gpa >= 2.0) overallGrade = 'C';
                  
                  return (
                    <tr key={res._id} className="hover:bg-white/5 transition-colors print:text-black">
                      <td className="p-4 font-medium text-white print:text-black">{res.examName}</td>
                      <td className="p-4 text-slate-300 print:text-gray-700">
                        {res.classroomId ? `${res.classroomId.name}` : 'N/A'}
                      </td>
                      {user?.role !== 'student' && (
                        <td className="p-4 text-slate-300 print:text-gray-700">{res.studentId?.name || 'Unknown'}</td>
                      )}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {res.subjects.map((sub, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/30 border border-white/5 text-xs text-slate-300 print:border-gray-300 print:bg-white">
                              <span className="text-white print:text-black font-medium">{sub.name}:</span>
                              {sub.marksObtained}/{sub.totalMarks} <span className={`font-bold ${sub.grade.includes('A') ? 'text-green-400' : 'text-blue-400'}`}>{sub.grade}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-white print:text-black">{res.gpa.toFixed(2)}</span>
                          <span className={`text-sm font-bold ${overallGrade.includes('A') ? 'text-green-400' : overallGrade === 'F' ? 'text-red-400' : 'text-blue-400'}`}>
                            {overallGrade}
                          </span>
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="p-4 text-right print:hidden">
                          <button 
                            onClick={() => handleDelete(res._id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
