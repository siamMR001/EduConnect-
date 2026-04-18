import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  MessageSquare, FileText, CheckCircle, Clock, Send, Paperclip, 
  Upload, Download, Trash2, Edit3, User, ChevronLeft
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
    } catch (err) {
      console.error(err);
    }
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

  if (!classroom) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm"></div>
        <div className="flex items-center gap-4 mb-2">
          <Link to="/classrooms" className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">{classroom.name}</h1>
        </div>
        <p className="text-slate-400 ml-10">Teacher: {classroom.teacherId?.name || 'Assigned'}</p>
      </div>

      <div className="flex border-b border-white/10 space-x-8 mb-6 overflow-x-auto">
        {['Feed', 'Assignments', 'Results'].map(tab => (
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
    </div>
  );
}
