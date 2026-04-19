import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { baseUrl } from '../services/api';
import { 
  MessageSquare, FileText, CheckCircle, Clock, Send, Paperclip, 
  Upload, Download, Trash2, Edit3, User, ChevronLeft,
  Video, Image as ImageIcon, Award, Activity, Pin, BookOpen, ExternalLink, Settings, Plus, X
} from 'lucide-react';

export default function ClassroomView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Feed');
  const [classroom, setClassroom] = useState(null);
  const [user, setUser] = useState(null);
  
  // Feed
  const [posts, setPosts] = useState([]);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postAttachment, setPostAttachment] = useState('');
  
  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ title: '', description: '', subject: '', dueDate: '', totalMarks: 100, attachmentUrl: '' });
  
  // Results
  const [results, setResults] = useState([]);
  const [examName, setExamName] = useState('');
  const [resultFile, setResultFile] = useState(null);
   // Attendance
   const [attendanceRecords, setAttendanceRecords] = useState([]);
   const [studentStats, setStudentStats] = useState(null);
   const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
   const [isMarking, setIsMarking] = useState(false);

   // Subjects Hub
   const [selectedSubject, setSelectedSubject] = useState(null);
   const [subjectTab, setSubjectTab] = useState('Resources'); // 'Resources', 'Gradebook'
   const [materials, setMaterials] = useState([]);
   const [gradeConfig, setGradeConfig] = useState({ categories: [] });
   const [subjectGrades, setSubjectGrades] = useState([]);
   const [isConfiguring, setIsConfiguring] = useState(false);
   const [isAddingMaterial, setIsAddingMaterial] = useState(false);
   const [materialFile, setMaterialFile] = useState(null);
   const [newMaterial, setNewMaterial] = useState({ title: '', type: 'pdf', url: '', description: '' });
   const [isSavingGrades, setIsSavingGrades] = useState(false);
  useEffect(() => {
    const usr = JSON.parse(localStorage.getItem('user'));
    setUser(usr);
    fetchData();
  }, [id, activeTab]);

  const fetchData = async () => {
    try {
      const cr = await api.get(`/classrooms/${id}`);
      setClassroom(cr.data);

      if (activeTab === 'Feed') fetchPosts();
      else if (activeTab === 'Assignments') fetchAssignments();
      else if (activeTab === 'Results') fetchResults();
      else if (activeTab === 'Attendance') fetchAttendanceData();
      else if (activeTab === 'Subjects' && selectedSubject) fetchSubjectData(selectedSubject._id);
      // 'Members' data is already part of the classroom object from the initial fetch
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSubject = (course) => {
    setSelectedSubject(course);
    setSubjectTab('Resources');
    fetchSubjectData(course._id);
  };

  const fetchSubjectData = async (courseId) => {
    try {
      const [matRes, configRes, gradeRes] = await Promise.all([
        api.get(`/subjects/materials?classroomId=${id}&courseId=${courseId}`),
        api.get(`/subjects/config?classroomId=${id}&courseId=${courseId}`),
        api.get(`/subjects/grades?classroomId=${id}&courseId=${courseId}`)
      ]);
      setMaterials(matRes.data);
      setGradeConfig(configRes.data?._id ? configRes.data : { categories: [] });
      setSubjectGrades(gradeRes.data);
    } catch (err) {
      console.error('Error fetching subject data:', err);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('type', newMaterial.type);
      formData.append('description', newMaterial.description);
      formData.append('classroomId', id);
      formData.append('courseId', selectedSubject._id);
      
      if (materialFile) {
        formData.append('file', materialFile);
      } else {
        formData.append('url', newMaterial.url);
      }

      await api.post('/subjects/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsAddingMaterial(false);
      setMaterialFile(null);
      setNewMaterial({ title: '', type: 'pdf', url: '', description: '' });
      fetchSubjectData(selectedSubject._id);
    } catch (err) { 
      const errorMsg = err.response?.data?.message || err.message || 'Error adding material';
      alert(errorMsg); 
    }
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/subjects/materials/${matId}`);
      fetchSubjectData(selectedSubject._id);
    } catch (err) { alert('Error deleting material'); }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects/config', { classroomId: id, courseId: selectedSubject._id, categories: gradeConfig.categories });
      setIsConfiguring(false);
      fetchSubjectData(selectedSubject._id);
    } catch (err) { alert('Error updating configuration'); }
  };

  const handleGradeChange = (studentId, category, value) => {
    setSubjectGrades(prev => prev.map(sg => sg.studentId === studentId ? { ...sg, scores: { ...sg.scores, [category]: value } } : sg));
  };

  const saveGrades = async () => {
    try {
      setIsSavingGrades(true);
      await api.post('/subjects/grades', { classroomId: id, courseId: selectedSubject._id, grades: subjectGrades });
      alert('Grades saved!');
      fetchSubjectData(selectedSubject._id);
    } catch (err) { alert('Error saving grades'); }
    finally { setIsSavingGrades(false); }
  };

  // --- Feed Logic ---
  const fetchPosts = async () => {
    const res = await api.get(`/classrooms/${id}/posts`);
    setPosts(res.data);
  };
  const handlePost = async (e) => {
    e.preventDefault();
    await api.post(`/classrooms/${id}/posts`, { title: postTitle, body: postBody, attachmentUrl: postAttachment });
    setPostTitle(''); setPostBody(''); setPostAttachment('');
    fetchPosts();
  };
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete post?")) return;
    await api.delete(`/classrooms/posts/${postId}`);
    fetchPosts();
  };
  const handleComment = async (postId, text) => {
    if (!text.trim()) return;
    await api.post(`/classrooms/posts/${postId}/comments`, { text });
    fetchPosts();
  };
  const handleDeleteComment = async (commentId) => {
    await api.delete(`/classrooms/comments/${commentId}`);
    fetchPosts();
  };

  // --- Assignments Logic ---
  const fetchAssignments = async () => {
    const res = await api.get(`/classrooms/${id}/assignments`);
    setAssignments(res.data);
  };
  const handleCreateAssign = async (e) => {
    e.preventDefault();
    await api.post(`/classrooms/${id}/assignments`, assignForm);
    setAssignForm({ title: '', description: '', subject: '', dueDate: '', totalMarks: 100, attachmentUrl: '' });
    fetchAssignments();
  };
  const handleSubmitAssign = async (assignmentId, fileUrl) => {
    try {
      await api.post(`/classrooms/assignments/${assignmentId}/submit`, { fileUrl });
      fetchAssignments();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  // --- Results Logic ---
  const fetchResults = async () => {
    const res = await api.get(`/classrooms/${id}/results`);
    setResults(res.data);
  };
  const handleDownloadTemplate = async () => {
    const res = await api.get(`/classrooms/${id}/results/template`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template.xlsx');
    document.body.appendChild(link);
    link.click();
  };
  const handleUploadResults = async (e) => {
    e.preventDefault();
    if (!examName || !resultFile) return alert('Enter exam name and select file');
    const formData = new FormData();
    formData.append('examName', examName);
    formData.append('file', resultFile);
    try {
      await api.post(`/classrooms/${id}/results/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setExamName(''); setResultFile(null);
      fetchResults();
      alert('Success!');
    } catch (err) { alert('Upload failed'); }
  };

  // --- Attendance Logic ---
  const fetchAttendanceData = async () => {
    try {
      if (user.role === 'teacher' || user.role === 'admin') {
         // Fetch today's records for marking
         const res = await api.get(`/attendance/classroom/${id}?date=${attendanceDate}`);
         setAttendanceRecords(res.data);
      }
      
      if (user.role === 'student') {
         const res = await api.get(`/attendance/stats/${id}/${user._id}`);
         setStudentStats(res.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleMarkAttendance = async (studentId, status) => {
    // Optimistic UI update
    setAttendanceRecords(prev => {
       const existingIndex = prev.findIndex(r => (r.studentId?._id || r.studentId) === studentId);
       if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], status };
          return updated;
       }
       return [...prev, { studentId, status }];
    });
  };

  const submitAttendance = async () => {
     try {
       setIsMarking(true);
       const recordsToSubmit = classroom.studentIds.map(s => {
          const record = attendanceRecords.find(r => (r.studentId?._id || r.studentId) === s._id);
          return { studentId: s._id, status: record ? record.status : 'present' };
       });
       await api.post(`/attendance/mark/${id}`, { records: recordsToSubmit, date: attendanceDate });
       alert('Attendance marked and alerts sent!');
       fetchAttendanceData();
     } catch (err) { alert('Failed to save attendance'); }
     finally { setIsMarking(false); }
  };

  if (!classroom) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm"></div>
        <div className="flex items-center gap-4 mb-2">
          <Link to={`/classrooms?grade=${classroom.classNumber}`} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">{classroom.name}</h1>
        </div>
        <p className="text-slate-400 ml-10">Teacher: {classroom.teacherId?.name || 'Assigned'}</p>
      </div>

      <div className="flex border-b border-white/10 space-x-8 mb-6 overflow-x-auto">
        {['Feed', 'Routine', 'Attendance', 'Subjects', 'Assignments', 'Results', 'Members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-2 font-medium text-lg border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {activeTab === 'Feed' && (
        <div className="space-y-6">
          {user?.role === 'teacher' && classroom.teacherId?._id === user._id && (
            <form onSubmit={handlePost} className="glass-panel p-5 rounded-2xl space-y-4">
              <input 
                type="text" placeholder="Announcement Title" required value={postTitle} onChange={e => setPostTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
              <textarea 
                placeholder="Write your announcement..." required value={postBody} onChange={e => setPostBody(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
              />
              <div className="flex gap-4">
                <input 
                  type="text" placeholder="Attachment URL (optional)" value={postAttachment} onChange={e => setPostAttachment(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-white outline-none text-sm"
                />
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors">
                  Post
                </button>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {posts.map(post => (
              <div key={post._id} className="glass-panel rounded-2xl p-6 relative group">
                {user?.role === 'teacher' && user._id === post.teacherId?._id && (
                  <button onClick={() => handleDeletePost(post._id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                <p className="text-sm text-blue-400 mb-4">{post.teacherId?.name} &bull; {new Date(post.createdAt).toLocaleDateString()}</p>
                <div className="text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.body}</div>
                {post.attachmentUrl && (
                  <a href={post.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-blue-400 hover:bg-white/10 transition-colors text-sm mb-6">
                    <Paperclip className="w-4 h-4" /> View Attachment
                  </a>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                  {post.comments?.map(c => (
                    <div key={c._id} className="flex gap-3 text-sm group/comment">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold uppercase">
                        {c.authorId?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 bg-black/20 rounded-xl p-3 relative">
                        <span className="font-semibold text-slate-200 block mb-1">{c.authorId?.name}</span>
                        <span className="text-slate-400">{c.text}</span>
                        {c.authorId?._id === user._id && (
                          <button onClick={() => handleDeleteComment(c._id)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {user?.role === 'student' && (
                    <form 
                      onSubmit={e => {
                        e.preventDefault();
                        const text = e.target.comment.value;
                        handleComment(post._id, text);
                        e.target.reset();
                      }}
                      className="flex gap-3 relative mt-2 text-sm"
                    >
                      <input 
                        name="comment" type="text" placeholder="Add a class comment..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-full pl-5 pr-12 py-2.5 text-white outline-none focus:border-blue-500/50 transition-all"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-slate-500 text-center py-10">No announcements yet.</p>}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === 'Assignments' && (
        <div className="space-y-6">
          {user?.role === 'teacher' && classroom.teacherId?._id === user._id && (
            <form onSubmit={handleCreateAssign} className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-bold text-white mb-2">Create New Assignment</h3>
              <input type="text" placeholder="Title" required value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} className="input-field col-span-full bg-black/40" />
              <textarea placeholder="Description" required value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} className="input-field col-span-full h-24 bg-black/40" />
              <input type="text" placeholder="Subject" required value={assignForm.subject} onChange={e => setAssignForm({...assignForm, subject: e.target.value})} className="input-field bg-black/40" />
              <input type="datetime-local" placeholder="Due Date" required value={assignForm.dueDate} onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} className="input-field bg-black/40" />
              <input type="number" placeholder="Total Marks" required value={assignForm.totalMarks} onChange={e => setAssignForm({...assignForm, totalMarks: e.target.value})} className="input-field bg-black/40" />
              <input type="text" placeholder="Attachment URL" value={assignForm.attachmentUrl} onChange={e => setAssignForm({...assignForm, attachmentUrl: e.target.value})} className="input-field bg-black/40" />
              <button type="submit" className="col-span-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-colors">
                Publish Assignment
              </button>
            </form>
          )}

          <div className="space-y-4">
            {assignments.map(a => {
              const isLateNodeCronSimulation = new Date() > new Date(a.dueDate);
              return (
                <div key={a._id} className="glass-panel p-6 rounded-2xl border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white content-center flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" /> {a.title}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">{a.subject} • Due: {new Date(a.dueDate).toLocaleString()}</p>
                    </div>
                    {user?.role === 'student' && a.userSubmission ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${a.userSubmission.status === 'late' || a.userSubmission.isLate ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        {a.userSubmission.status.toUpperCase()}
                      </span>
                    ) : user?.role === 'student' && isLateNodeCronSimulation ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-500">
                        LATE (FAILED TO SUBMIT)
                      </span>
                    ) : user?.role === 'student' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-500">
                        PENDING
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">{a.allSubmissions?.length} Submissions</span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-4 mb-4">{a.description}</p>
                  
                  {a.attachmentUrl && (
                    <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline mb-4 inline-block">Attached Resource</a>
                  )}

                  {user?.role === 'student' && !a.userSubmission && !isLateNodeCronSimulation && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitAssign(a._id, e.target.fileUrl.value);
                      }}
                      className="mt-4 pt-4 border-t border-white/10 flex gap-3"
                    >
                      <input name="fileUrl" type="url" placeholder="Paste your submission link/URL here..." required className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 text-white p-2 text-sm outline-none focus:border-blue-500" />
                      <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors">Turn In</button>
                    </form>
                  )}
                  {user?.role === 'teacher' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <details className="text-sm">
                        <summary className="text-slate-400 cursor-pointer hover:text-white">View Submissions ({a.allSubmissions?.length})</summary>
                        <div className="mt-3 space-y-2">
                          {a.allSubmissions?.map(sub => (
                            <div key={sub._id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                              <span className="text-white">{sub.student?.name}</span>
                              <div className="flex items-center gap-4">
                                <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View Work</a>
                                <span className={`px-2 py-0.5 rounded text-xs ${sub.status === 'late' || sub.isLate ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                  {sub.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
            {assignments.length === 0 && <p className="text-slate-500 text-center py-10">No assignments yet.</p>}
          </div>
        </div>
      )}

      {/* ROUTINE TAB */}
      {activeTab === 'Routine' && (
        <div className="space-y-6 animate-fade-in-up">
           <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                // Collect all slots for this day
                const slots = [];
                // Lead subject slots
                if (classroom.leadSchedule) {
                  classroom.leadSchedule.forEach(s => {
                    if (s.day === day) slots.push({ subject: classroom.leadSubject, startTime: s.startTime, endTime: s.endTime, teacher: classroom.teacherId?.name, type: 'lead' });
                  });
                }
                // Course slots
                if (classroom.courses) {
                  classroom.courses.forEach(c => {
                    if (c.schedule) {
                      c.schedule.forEach(s => {
                        if (s.day === day) slots.push({ subject: c.courseName, startTime: s.startTime, endTime: s.endTime, teacher: c.teacherId?.name, type: 'course' });
                      });
                    }
                  });
                }

                // Sort slots by time
                slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={day} className={`flex flex-col gap-3 p-4 rounded-3xl border ${slots.length > 0 ? 'bg-white/[0.02] border-white/10' : 'bg-black/20 border-white/5 opacity-40'}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{day.substring(0, 3)}</h3>
                    {slots.map((slot, i) => (
                      <div key={i} className={`p-3 rounded-2xl border ${slot.type === 'lead' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                         <p className="text-white font-black text-xs mb-1">{slot.subject}</p>
                         <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-tighter mb-2">
                           <Clock className="w-3 h-3 text-slate-500" /> {slot.startTime} - {slot.endTime}
                         </div>
                         <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                           <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black text-white capitalize">
                             {slot.teacher?.charAt(0)}
                           </div>
                           <span className="text-[9px] text-slate-500 font-bold truncate">{slot.teacher}</span>
                         </div>
                      </div>
                    ))}
                    {slots.length === 0 && <div className="h-10"></div>}
                  </div>
                );
              })}
           </div>
           
           <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Core Subject</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auxiliary Courses</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'Results' && (
        <div className="space-y-6">
          {user?.role === 'teacher' && classroom.teacherId?._id === user._id && (
            <div className="glass-panel p-6 rounded-2xl grid md:grid-cols-2 gap-8 items-start border border-blue-500/30 bg-blue-500/5">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" /> 1. Generate Template
                </h3>
                <p className="text-slate-400 text-sm mb-4">Download a pre-filled Excel template containing all enrolled student details.</p>
                <button onClick={handleDownloadTemplate} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors text-sm font-medium">
                  Download XLSX Template
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" /> 2. Upload Marks
                </h3>
                <p className="text-slate-400 text-sm mb-4">Upload the completed template to instantly publish calculated results.</p>
                <form onSubmit={handleUploadResults} className="space-y-3">
                  <input type="text" placeholder="Exam Label (e.g. Mid-Term 2025)" value={examName} onChange={e => setExamName(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  <input type="file" accept=".xlsx, .csv" onChange={e => setResultFile(e.target.files[0])} required className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30" />
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors text-sm">
                    Process Results
                  </button>
                </form>
              </div>
            </div>
          )}

          {user?.role === 'student' && results.length > 0 && (
            <div className="space-y-6">
              {results.map(res => {
                let overallGrade = 'F';
                if (res.gpa >= 4.0) overallGrade = 'A+';
                else if (res.gpa >= 3.7) overallGrade = 'A';
                else if (res.gpa >= 3.3) overallGrade = 'A-';
                else if (res.gpa >= 3.0) overallGrade = 'B';
                else if (res.gpa >= 2.0) overallGrade = 'C';

                return (
                  <div key={res._id} className="glass-panel p-6 rounded-2xl overflow-hidden relative">
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full mr-[-40px] mt-[-40px] ${overallGrade === 'A+' || overallGrade === 'A' ? 'bg-green-500/30' : overallGrade === 'C' || overallGrade === 'F' ? 'bg-red-500/30' : 'bg-blue-500/30'}`}></div>
                    
                    <div className="flex justify-between items-end mb-6 relative z-10">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{res.examName}</h3>
                        <p className="text-slate-400">Published: {new Date(res.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-white">{res.gpa.toFixed(2)}</div>
                        <div className={`text-lg font-bold ${overallGrade === 'A+' || overallGrade === 'A' ? 'text-green-400' : overallGrade === 'C' || overallGrade === 'F' ? 'text-red-400' : 'text-blue-400'}`}>
                          Grade {overallGrade}
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-left bg-black/20 rounded-xl overflow-hidden relative z-10">
                      <thead>
                        <tr className="border-b border-white/5 bg-black/40">
                          <th className="p-3 text-slate-300 font-medium font-sm">Subject</th>
                          <th className="p-3 text-slate-300 font-medium font-sm">Marks Extracted</th>
                          <th className="p-3 text-slate-300 font-medium font-sm">Letter Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {res.subjects.map((sub, i) => (
                          <tr key={i}>
                            <td className="p-3 font-medium text-white">{sub.name}</td>
                            <td className="p-3 text-slate-300">{sub.marksObtained} / {sub.totalMarks}</td>
                            <td className={`p-3 font-bold ${sub.grade.includes('A') ? 'text-green-400' : 'text-blue-400'}`}>{sub.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
          {user?.role === 'student' && results.length === 0 && (
            <p className="text-slate-500 text-center py-10">No results have been published for you yet.</p>
          )}

          {user?.role === 'teacher' && results.length > 0 && (
             <div className="text-slate-400 text-center py-6 glass-panel rounded-xl">
               Results are uploaded successfully. Use the <Link to="/gradesheet" className="text-blue-400 hover:underline">Global Gradesheet</Link> to search and view individual student histories.
             </div>
          )}
        </div>
      )}
      {/* ATTENDANCE TAB */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6">
           {(user?.role === 'teacher' || user?.role === 'admin') && (
              <div className="glass-panel p-6 rounded-2xl animate-fade-in border border-white/5">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                       <h3 className="text-xl font-bold text-white tracking-tight">Daily Roll Call</h3>
                       <p className="text-slate-400 text-sm">Automated parent alerts trigger for <span className="text-red-400 font-bold italic">ABSENCES</span></p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                       <input 
                         type="date" 
                         value={attendanceDate}
                         onChange={(e) => setAttendanceDate(e.target.value)}
                         className="bg-transparent border-none rounded-xl px-4 py-2 text-white outline-none focus:ring-0 text-sm font-bold"
                       />
                       <button 
                         onClick={submitAttendance}
                         disabled={isMarking}
                         className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                       >
                         {isMarking ? 'Processing...' : 'Save & Notify'}
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-black/40 border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                             <th className="p-4 px-6 text-center">Roll</th>
                             <th className="p-4">Student ID</th>
                             <th className="p-4">Name</th>
                             <th className="p-4 text-center">Status Toggle</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {classroom.studentIds?.map(student => {
                             const record = attendanceRecords.find(r => (r.studentId?._id || r.studentId) === student._id);
                             const status = record?.status || 'present';
                             const roll = student.studentProfile?.rollNumber || student.profile?.rollNumber || '—';
                             const sId = student.studentProfile?.studentId || student.profile?.studentId || '—';
                             
                             return (
                                <tr key={student._id} className={`transition-colors ${status === 'present' ? 'hover:bg-green-500/[0.02]' : 'hover:bg-red-500/[0.02]'}`}>
                                   <td className="p-4 px-6 text-center">
                                      <span className="text-slate-400 font-black text-xs">{roll}</span>
                                   </td>
                                   <td className="p-4">
                                      <span className="text-blue-400/80 font-mono text-xs font-bold">{sId}</span>
                                   </td>
                                   <td className="p-4">
                                      <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {student.name.charAt(0)}
                                         </div>
                                         <div>
                                            <p className="text-white font-bold text-sm">{student.name}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-tighter ${status === 'present' ? 'text-green-500/50' : 'text-red-500/50'}`}>{status}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="p-4 text-center">
                                      <div className="inline-flex items-center bg-black/40 rounded-xl p-1 border border-white/5 shadow-inner">
                                         <button 
                                            onClick={() => handleMarkAttendance(student._id, 'present')}
                                            className={`w-10 h-8 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center ${status === 'present' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'text-slate-500 hover:text-white'}`}
                                         >
                                            PR
                                         </button>
                                         <button 
                                            onClick={() => handleMarkAttendance(student._id, 'absent')}
                                            className={`w-10 h-8 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center ${status === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-500 hover:text-white'}`}
                                         >
                                            AB
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })}
                          {(!classroom.studentIds || classroom.studentIds.length === 0) && (
                             <tr>
                                <td colSpan="4" className="p-12 text-center text-slate-500 italic">No students assigned to this section.</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {user?.role === 'student' && studentStats && (
              <div className="space-y-6 animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="text-5xl font-black text-white mb-2 relative z-10">{studentStats.percentage}%</div>
                       <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] relative z-10">Total Reach</p>
                    </div>
                    <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="text-5xl font-black text-green-400 mb-2 relative z-10">{studentStats.present}</div>
                       <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] relative z-10">Days Present</p>
                    </div>
                    <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="text-5xl font-black text-red-400 mb-2 relative z-10">{studentStats.absent}</div>
                       <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] relative z-10">Days Absent</p>
                    </div>
                 </div>

                 <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                       <h3 className="text-white font-bold tracking-tight text-lg">Activity History</h3>
                       <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Verified History</span>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="p-6 px-8">Calendar Date</th>
                                <th className="p-6">Status Record</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {studentStats.history?.length > 0 ? studentStats.history.map(r => (
                                <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                                   <td className="p-5 px-8 text-white font-semibold">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                   <td className="p-5">
                                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${r.status === 'present' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                         {r.status}
                                      </span>
                                   </td>
                                </tr>
                             )) : (
                                <tr>
                                   <td colSpan="2" className="p-10 text-center text-slate-500 italic font-medium">No activity records established yet.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}
      {/* SUBJECTS HUB TAB */}
      {activeTab === 'Subjects' && (
        <div className="space-y-6 animate-fade-in">
          {!selectedSubject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Lead Subject Card */}
              <div 
                onClick={() => handleSelectSubject({ _id: 'lead', courseName: classroom.leadSubject, teacher: classroom.teacherId })}
                className="glass-panel p-8 rounded-[32px] border border-blue-500/20 bg-blue-500/5 cursor-pointer group hover:scale-[1.02] transition-all"
              >
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all text-blue-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{classroom.leadSubject}</h3>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">Lead Curriculum</p>
                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white uppercase">{classroom.teacherId?.name?.charAt(0)}</div>
                  <span className="text-xs text-slate-400 font-bold">{classroom.teacherId?.name}</span>
                </div>
              </div>

              {/* Other Courses */}
              {classroom.courses?.map((course) => (
                <div 
                  key={course._id}
                  onClick={() => handleSelectSubject(course)}
                  className="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.02] cursor-pointer group hover:scale-[1.02] transition-all"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-400">
                    <Activity className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{course.courseName}</h3>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">Elective / Core</p>
                  <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white uppercase">{course.teacherId?.name?.charAt(0) || '?'}</div>
                    <span className="text-xs text-slate-400 font-bold">{course.teacherId?.name || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subject Breadcrumb Header */}
              <div className="flex items-center justify-between glass-panel p-4 px-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedSubject(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedSubject.courseName}</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Workspace</p>
                  </div>
                </div>
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                  {['Resources', 'Gradebook'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setSubjectTab(t)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${subjectTab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* RESOURCE VIEW */}
              {subjectTab === 'Resources' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setIsAddingMaterial(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        <Upload className="w-4 h-4" /> Share New Resource
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map(mat => (
                      <div key={mat._id} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-4 rounded-2xl ${
                            mat.type === 'video' ? 'bg-red-500/10 text-red-400' :
                            mat.type === 'pdf' ? 'bg-orange-500/10 text-orange-400' :
                            mat.type === 'image' ? 'bg-green-500/10 text-green-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {mat.type === 'video' ? <Video className="w-5 h-5" /> : 
                             mat.type === 'image' ? <ImageIcon className="w-5 h-5" /> : 
                             mat.type === 'link' ? <ExternalLink className="w-5 h-5" /> : 
                             <FileText className="w-5 h-5" />}
                          </div>
                          {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <button onClick={() => handleDeleteMaterial(mat._id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{mat.title}</h4>
                        <p className="text-slate-500 text-xs mb-6 line-clamp-2">{mat.description || 'No description provided.'}</p>
                        <a 
                          href={mat.url?.startsWith('/uploads') ? `${baseUrl}${mat.url}` : mat.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-black uppercase tracking-widest text-[9px] rounded-xl border border-white/5 transition-all"
                        >
                           {mat.type === 'video' ? 'Play Video' : mat.type === 'image' ? 'View Image' : 'Access Resource'} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                    {materials.length === 0 && (
                      <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-white/5 opacity-50 italic text-slate-500">
                        No materials shared yet for this subject.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GRADEBOOK VIEW */}
              {subjectTab === 'Gradebook' && (
                <div className="space-y-6">
                  {/* Setup & Actions */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Subject Gradebook</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Category-Based Assessments</p>
                    </div>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsConfiguring(true)}
                          className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" /> Configure Grading
                        </button>
                        <button 
                          onClick={saveGrades}
                          disabled={isSavingGrades}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isSavingGrades ? 'Writing Data...' : 'Save Changes'} <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="glass-panel overflow-hidden rounded-[32px] border border-white/5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/40 border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-6">Student Identity</th>
                            {gradeConfig.categories.map(cat => (
                              <th key={cat.label} className="p-6 text-center">
                                <div className="flex flex-col items-center">
                                  <span>{cat.label}</span>
                                  <span className="text-[8px] text-blue-500/50 mt-1">{cat.weight}% Weight</span>
                                </div>
                              </th>
                            ))}
                            <th className="p-6 text-right">Weighted Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {subjectGrades.map(sg => {
                            // Calculate weighted total for display
                            let total = 0;
                            gradeConfig.categories.forEach(cat => {
                              const score = parseFloat(sg.scores[cat.label]) || 0;
                              total += (score * cat.weight) / 100;
                            });

                            return (
                              <tr key={sg.studentId} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500">{sg.name.charAt(0)}</div>
                                    <span className="text-white font-bold text-sm">{sg.name}</span>
                                  </div>
                                </td>
                                {gradeConfig.categories.map(cat => (
                                  <td key={cat.label} className="p-6">
                                    <input 
                                      type="number"
                                      disabled={user?.role === 'student'}
                                      value={sg.scores[cat.label] ?? ''}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => handleGradeChange(sg.studentId, cat.label, e.target.value)}
                                      className="w-20 mx-auto block bg-black/40 border border-white/5 rounded-xl px-2 py-3 text-center text-white font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                    />
                                  </td>
                                ))}
                                <td className="p-6 text-right">
                                  <span className={`text-lg font-black ${total >= 80 ? 'text-green-400' : total >= 40 ? 'text-blue-400' : 'text-red-400'}`}>
                                    {total.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD MATERIAL MODAL */}
          {isAddingMaterial && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
              <div className="bg-[#0f0f1a] border border-white/10 rounded-[40px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-3xl font-black text-white">Share Resource</h2>
                   <button onClick={() => setIsAddingMaterial(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleAddMaterial} className="space-y-6">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Resource Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['pdf', 'link', 'video', 'image'].map(t => (
                        <button 
                          key={t} type="button"
                          onClick={() => {
                            setNewMaterial({...newMaterial, type: t});
                            setMaterialFile(null); // Reset file if type changes
                          }}
                          className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${newMaterial.type === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input type="text" placeholder="Title (e.g. Week 4 Notes)" required value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500" />
                  
                  {(newMaterial.type === 'pdf' || newMaterial.type === 'image') ? (
                    <div className="space-y-3">
                      <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest">Select File</label>
                      <input 
                        type="file" 
                        accept={newMaterial.type === 'pdf' ? '.pdf' : 'image/*'}
                        onChange={e => setMaterialFile(e.target.files[0])}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                      <p className="text-[10px] text-slate-500 italic">Recommended: Max 10MB</p>
                    </div>
                  ) : (
                    <input type="url" placeholder="Resource URL / Embed Link" required value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500" />
                  )}

                  <textarea placeholder="Description (Optional)" value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 h-24" />
                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20">Distribute Resource</button>
                </form>
              </div>
            </div>
          )}

          {/* GRAD CONFIG MODAL */}
          {isConfiguring && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
              <div className="bg-[#0f0f1a] border border-white/10 rounded-[40px] p-8 max-w-xl w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                   <div>
                     <h2 className="text-3xl font-black text-white">Grading Setup</h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configure weights for {selectedSubject.courseName}</p>
                   </div>
                   <button onClick={() => setIsConfiguring(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleUpdateConfig} className="space-y-6">
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {gradeConfig.categories.map((cat, idx) => (
                      <div key={idx} className="flex gap-4 items-end bg-white/5 p-4 rounded-[24px] border border-white/10">
                        <div className="flex-1">
                          <label className="block text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Category</label>
                          <input type="text" value={cat.label} onChange={e => {
                            const newCats = [...gradeConfig.categories];
                            newCats[idx].label = e.target.value;
                            setGradeConfig({...gradeConfig, categories: newCats});
                          }} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold outline-none" placeholder="Quiz, Mid..." />
                        </div>
                        <div className="w-24">
                          <label className="block text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Weight %</label>
                          <input type="number" 
                            value={cat.weight || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => {
                              const newCats = [...gradeConfig.categories];
                              newCats[idx].weight = parseInt(e.target.value) || 0;
                              setGradeConfig({...gradeConfig, categories: newCats});
                            }} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-center outline-none" />
                        </div>
                        <button type="button" onClick={() => {
                          const newCats = gradeConfig.categories.filter((_, i) => i !== idx);
                          setGradeConfig({...gradeConfig, categories: newCats});
                        }} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setGradeConfig({...gradeConfig, categories: [...gradeConfig.categories, { label: '', weight: 0 }]})}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 hover:text-blue-400 hover:border-blue-500/30 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Assessment Category
                    </button>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center text-slate-400 font-bold">
                    <span>Total Weight: <span className={gradeConfig.categories.reduce((acc, c) => acc + c.weight, 0) === 100 ? 'text-green-400' : 'text-red-400'}>{gradeConfig.categories.reduce((acc, c) => acc + c.weight, 0)}%</span></span>
                    <button type="submit" disabled={gradeConfig.categories.reduce((acc, c) => acc + c.weight, 0) !== 100} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">Commit Config</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* MEMBERS TAB */}
      {activeTab === 'Members' && (
        <div className="animate-fade-in-up">
           <div className="glass-panel overflow-hidden rounded-3xl border border-white/10">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Class Community</h2>
                    <p className="text-sm text-slate-400 mt-1">
                       {classroom.studentIds?.length + (classroom.teacherId ? 1 : 0)} Enrolled Members
                    </p>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-black/40 border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="p-4 px-6 text-center">Roll</th>
                          <th className="p-4">Member Name</th>
                          <th className="p-4">Student ID / Email</th>
                          <th className="p-4 text-center">Designation</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {/* Lead Teacher */}
                       {classroom.teacherId && (
                          <tr className="bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                             <td className="p-4 text-center text-slate-500 font-bold">—</td>
                             <td className="p-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                      {classroom.teacherId.name.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-white font-bold tracking-tight">{classroom.teacherId.name}</span>
                                      <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{classroom.leadSubject}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 text-slate-300 font-medium font-mono text-xs">
                                {classroom.teacherId.email}
                             </td>
                             <td className="p-4 text-center">
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                                   Lead Teacher
                                </span>
                             </td>
                          </tr>
                       )}

                       {/* Course Teachers */}
                       {classroom.courses?.map((course, idx) => (
                          <tr key={`course-${idx}`} className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                             <td className="p-4 text-center text-slate-500 font-bold">—</td>
                             <td className="p-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-white/5 text-slate-400 flex items-center justify-center font-bold border border-white/10">
                                      {course.teacherId?.name?.charAt(0) || '?'}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-slate-200 font-bold text-sm tracking-tight">{course.teacherId?.name || 'Unassigned'}</span>
                                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{course.courseName}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 text-slate-500 font-medium font-mono text-[10px]">
                                {course.teacherId?.email || 'N/A'}
                             </td>
                             <td className="p-4 text-center">
                                <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tight bg-white/5 text-slate-500 border border-white/5">
                                   Subject Teacher
                                </span>
                             </td>
                          </tr>
                       ))}

                       {/* Students */}
                       {classroom.studentIds?.map(student => (
                          <tr key={student._id} className="hover:bg-white/5 transition-colors">
                             <td className="p-4 text-center text-slate-400 font-black text-sm">
                                {student.studentProfile?.rollNumber || student.profile?.rollNumber || '—'}
                             </td>
                             <td className="p-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center font-medium border border-white/5">
                                      {student.name.charAt(0)}
                                   </div>
                                   <span className="text-slate-200 font-medium">{student.name}</span>
                                </div>
                             </td>
                             <td className="p-4">
                                <div className="flex flex-col">
                                   <span className="text-blue-400 font-mono text-xs font-bold">{student.studentProfile?.studentId || student.profile?.studentId || '—'}</span>
                                   <span className="text-slate-500 text-[10px]">{student.email}</span>
                                </div>
                             </td>
                             <td className="p-4 text-center">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight bg-white/5 text-slate-400 border border-white/10">
                                   Student
                                </span>
                             </td>
                          </tr>
                       ))}

                       {(!classroom.teacherId && (!classroom.studentIds || classroom.studentIds.length === 0)) && (
                          <tr>
                             <td colSpan="4" className="p-12 text-center text-slate-500 italic">
                                No members found in this section.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
