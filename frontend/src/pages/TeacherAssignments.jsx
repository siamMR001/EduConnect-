import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen, Users, Clock, Award, MessageSquare, ExternalLink,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Send, X,
  CheckCircle, AlertTriangle, FileText, Search
} from 'lucide-react';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001');
const API  = BASE.endsWith('/api') ? BASE : `${BASE}/api`;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ── tiny helpers ─────────────────────────────────── */
const dueOf  = a => a.dueDate || a.deadline;
const overdue = a => dueOf(a) && new Date() > new Date(dueOf(a));
const badge  = (status, isLate) => {
  if (status === 'graded')               return { label:'GRADED',      cls:'bg-green-500/20 text-green-400 border-green-500/30' };
  if (isLate || status === 'late')       return { label:'LATE',        cls:'bg-red-500/20   text-red-400   border-red-500/30'   };
  if (status === 'resubmitted')          return { label:'RESUBMITTED', cls:'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  return                                        { label:'PENDING',     cls:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
};

export default function TeacherAssignments() {
  const [searchParams] = useSearchParams();
  const autoId = searchParams.get('assignmentId');

  /* data */
  const [all,        setAll]        = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  /* filters */
  const [fSubject, setFSubject] = useState('');
  const [fClass,   setFClass]   = useState('');
  const [fStatus,  setFStatus]  = useState('');   // 'pending' | 'graded' | ''
  const [fSearch,  setFSearch]  = useState('');

  /* submissions panel */
  const [openId,    setOpenId]    = useState(null);
  const [subMap,    setSubMap]    = useState({});
  const [statMap,   setStatMap]   = useState({});
  const [loadSub,   setLoadSub]   = useState(false);
  const [subErrMap, setSubErrMap] = useState({});  // per-assignment error

  /* grading */
  const [gradeMap,  setGradeMap]  = useState({});   // {subId:{marks,feedback}}
  const [panelMap,  setPanelMap]  = useState({});   // {subId:bool}
  const [savingMap, setSavingMap] = useState({});

  /* ── fetch ─────────────────────────────────────── */
  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const r = await axios.get(`${API}/assignments/teacher/all?limit=100`, { headers: auth() });
      setAll(r.data.assignments || []);
      setSubjects(r.data.subjects  || []);
      setClasses(r.data.classLabels || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /* auto-open from classroom "View Work" link */
  useEffect(() => {
    if (autoId && all.length > 0 && all.find(a => a._id === autoId)) {
      openSubs(autoId);
    }
  }, [autoId, all]);

  /* ── open submissions ───────────────────────────── */
  const openSubs = async (id, forceReload = false) => {
    if (openId === id && !forceReload) { setOpenId(null); return; }
    setOpenId(id);
    if (subMap[id] && !forceReload) return;  // already loaded successfully
    setSubErrMap(p => ({ ...p, [id]: null }));  // clear previous error
    try {
      setLoadSub(true);
      const [s, st] = await Promise.all([
        axios.get(`${API}/assignments/${id}/submissions`, { headers: auth() }),
        axios.get(`${API}/assignments/${id}/stats`,       { headers: auth() }),
      ]);
      setSubMap(p  => ({ ...p, [id]: s.data.submissions || [] }));
      setStatMap(p => ({ ...p, [id]: st.data }));
    } catch(e) {
      const msg = e.response?.data?.message || 'Failed to load submissions';
      setSubErrMap(p => ({ ...p, [id]: msg }));
      // Don't cache — allow retry
      setSubMap(p => { const n = { ...p }; delete n[id]; return n; });
      console.error('Submissions error:', e.response?.data || e.message);
    }
    finally { setLoadSub(false); }
  };

  /* ── grading ────────────────────────────────────── */
  const togglePanel = (sub) => {
    setPanelMap(p => ({ ...p, [sub._id]: !p[sub._id] }));
    if (!gradeMap[sub._id])
      setGradeMap(p => ({ ...p, [sub._id]: { marks: sub.marksObtained??'', feedback: sub.feedback??'' } }));
  };

  const saveGrade = async (sub, assignId) => {
    const sid = sub._id;
    const g   = gradeMap[sid] || {};
    const asgn = all.find(a => a._id === assignId);
    const max  = asgn?.totalMarks ?? 100;
    const m    = parseFloat(g.marks);
    if (isNaN(m) || m < 0 || m > max) { alert(`Marks must be 0–${max}`); return; }
    try {
      setSavingMap(p => ({ ...p, [sid]: true }));
      await axios.put(`${API}/submissions/${sid}/grade`,
        { marksObtained: m, feedback: g.feedback || '' },
        { headers: auth() });
      setSubMap(p => ({
        ...p,
        [assignId]: (p[assignId]||[]).map(s =>
          s._id === sid ? { ...s, status:'graded', marksObtained:m, feedback:g.feedback||'', gradedAt:new Date().toISOString() } : s
        )
      }));
      const st = await axios.get(`${API}/assignments/${assignId}/stats`, { headers: auth() });
      setStatMap(p => ({ ...p, [assignId]: st.data }));
      setPanelMap(p => ({ ...p, [sid]: false }));
    } catch(e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSavingMap(p => ({ ...p, [sid]: false })); }
  };

  /* ── filter ─────────────────────────────────────── */
  const filtered = all.filter(a => {
    if (fSubject && a.subject !== fSubject) return false;
    if (fClass   && a.classroomId?.name !== fClass) return false;
    if (fStatus === 'overdue'  && !overdue(a)) return false;
    if (fSubject || fClass || fStatus || !fSearch) {
      if (fSearch && ![a.title, a.subject, a.classroomId?.name].some(v => v?.toLowerCase().includes(fSearch.toLowerCase()))) return false;
    }
    return true;
  });

  const Chip = ({ label, active, color='blue', onClick }) => {
    const colors = {
      blue:   active ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'   : 'bg-black/30 text-slate-400 border-white/10 hover:border-blue-500/40 hover:text-blue-300',
      indigo: active ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-black/30 text-slate-400 border-white/10 hover:border-indigo-500/40 hover:text-indigo-300',
      red:    active ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20'     : 'bg-black/30 text-slate-400 border-white/10 hover:border-red-500/40 hover:text-red-300',
    };
    return (
      <button onClick={onClick} className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${colors[color]}`}>
        {label}
      </button>
    );
  };

  /* ── render ─────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2">

      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Assignments Hub</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {all.length} assignment{all.length !== 1 ? 's' : ''} across your classes
              </p>
            </div>
          </div>
          <button onClick={fetch} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 text-xs font-bold transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* ── Filter toolbar ── */}
        <div className="mt-6 space-y-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text" placeholder="Search assignments…"
              value={fSearch} onChange={e => setFSearch(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
            />
            {fSearch && (
              <button onClick={() => setFSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subject chips */}
          {subjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Subject</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="All" active={!fSubject} color="blue" onClick={() => setFSubject('')} />
                {subjects.map(s => (
                  <Chip key={s} label={s} active={fSubject === s} color="blue" onClick={() => setFSubject(fSubject === s ? '' : s)} />
                ))}
              </div>
            </div>
          )}

          {/* Class chips */}
          {classes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Class</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="All Classes" active={!fClass} color="indigo" onClick={() => setFClass('')} />
                {classes.map(c => (
                  <Chip key={c} label={c} active={fClass === c} color="indigo" onClick={() => setFClass(fClass === c ? '' : c)} />
                ))}
              </div>
            </div>
          )}

          {/* Status chips */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Status</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="All" active={!fStatus} color="blue" onClick={() => setFStatus('')} />
              <Chip label="🕐 Open" active={fStatus === 'open'} color="blue"
                onClick={() => setFStatus(fStatus === 'open' ? '' : 'open')} />
              <Chip label="⚠️ Overdue" active={fStatus === 'overdue'} color="red"
                onClick={() => setFStatus(fStatus === 'overdue' ? '' : 'overdue')} />
            </div>
          </div>

          {/* Active filter count */}
          {(fSubject || fClass || fStatus || fSearch) && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-500">
                Showing <span className="text-white font-bold">{filtered.length}</span> of {all.length}
              </p>
              <button onClick={() => { setFSubject(''); setFClass(''); setFStatus(''); setFSearch(''); }}
                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse border border-white/5">
              <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="glass-panel rounded-2xl p-16 text-center border border-white/5">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No assignments match your filters</p>
        </div>
      )}

      {/* Assignment cards */}
      {!loading && filtered.map(asgn => {
        const isOpen  = openId === asgn._id;
        const subs    = subMap[asgn._id]  || [];
        const stats   = statMap[asgn._id];
        const due     = dueOf(asgn);
        const od      = overdue(asgn);
        const room    = asgn.classroomId;

        return (
          <div key={asgn._id}
            className={`glass-panel rounded-2xl border transition-all duration-200 ${
              isOpen           ? 'border-blue-500/40 shadow-lg shadow-blue-500/10'
              : autoId === asgn._id ? 'border-blue-400/50 ring-2 ring-blue-500/20'
              : 'border-white/10 hover:border-white/20'
            }`}>

            {/* Card header */}
            <button onClick={() => openSubs(asgn._id)}
              className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-white font-bold truncate">{asgn.title}</span>
                  {room && (
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                      {room.name}
                    </span>
                  )}
                  {od && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-lg text-[9px] font-black border border-red-500/20">CLOSED</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-slate-500 text-xs">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/>{asgn.subject}</span>
                  {due && (
                    <span className={`flex items-center gap-1 ${od ? 'text-red-400' : ''}`}>
                      <Clock className="w-3 h-3"/>
                      {od ? 'Was due' : 'Due'} {new Date(due).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Award className="w-3 h-3 text-yellow-500/70"/>{asgn.totalMarks} marks</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Submission pill */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-white font-bold text-sm">{asgn.submissionCount ?? 0}</span>
                  <span className="text-slate-600 text-[10px]">submissions</span>
                </div>
                <div className={`p-2 rounded-xl ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                  {isOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </div>
              </div>
            </button>

            {/* Submissions panel */}
            {isOpen && (
              <div className="border-t border-white/10">

                {/* Stats bar */}
                {stats && (
                  <div className="grid grid-cols-4 gap-px bg-white/5">
                    {[
                      { label:'Total',   val: stats.totalSubmissions, color:'text-blue-400'   },
                      { label:'Graded',  val: stats.graded,           color:'text-green-400'  },
                      { label:'Pending', val: stats.pending,           color:'text-yellow-400' },
                      { label:'Late',    val: stats.lateSubmissions,   color:'text-red-400'   },
                    ].map(s => (
                      <div key={s.label} className="bg-black/30 py-3 flex flex-col items-center">
                        <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
                        <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Error state with retry */}
                  {subErrMap[asgn._id] && (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-red-400 text-sm font-medium">{subErrMap[asgn._id]}</p>
                      <button
                        onClick={() => openSubs(asgn._id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold transition-all">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                    </div>
                  )}

                  {loadSub && !subs.length && !subErrMap[asgn._id] && (
                    <div className="flex justify-center py-10 text-slate-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}

                  {!loadSub && !subErrMap[asgn._id] && subs.length === 0 && (
                    <p className="text-center py-8 text-slate-600 italic text-sm">No submissions yet.</p>
                  )}

                  {subs.map(sub => {
                    const b          = badge(sub.status, sub.isLate);
                    const isGradeOpen = panelMap[sub._id];
                    const isSaving   = savingMap[sub._id];
                    const g          = gradeMap[sub._id] || { marks: sub.marksObtained??'', feedback: sub.feedback??'' };
                    const rawUrl     = sub.fileUrl || sub.submittedFiles?.[0]?.path || sub.submissionText;
                    const resolveUrl = (raw) => {
                      if (!raw) return null;
                      if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
                      if (raw.startsWith('/uploads/')) return `${BASE}${raw}`;
                      if (raw.includes('.') && !raw.includes(' ') && raw.length < 200) return `https://${raw}`;
                      return null;
                    };
                    const resolvedUrl = resolveUrl(rawUrl);
                    const pct        = g.marks !== '' && !isNaN(g.marks) ? Math.round((g.marks / asgn.totalMarks) * 100) : null;

                    return (
                      <div key={sub._id} className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">

                        {/* Submission row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-300 font-bold text-sm border border-white/5 shrink-0">
                              {sub.student?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{sub.student?.name}</p>
                              <p className="text-slate-600 text-xs">{sub.student?.email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${b.cls}`}>{b.label}</span>
                            <span className="text-slate-700 text-xs">
                              {new Date(sub.submittedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                            </span>
                            {sub.status === 'graded' && sub.marksObtained !== null && (
                              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-black border border-green-500/20">
                                {sub.marksObtained}/{asgn.totalMarks}
                              </span>
                            )}
                            {resolvedUrl ? (
                              <a href={resolvedUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 transition-all">
                                <ExternalLink className="w-3 h-3"/> View Work
                              </a>
                            ) : rawUrl ? (
                              <span className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs border border-white/10 max-w-[180px] truncate" title={rawUrl}>
                                📄 {rawUrl}
                              </span>
                            ) : null}
                            <button onClick={() => togglePanel(sub)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                isGradeOpen
                                  ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                              }`}>
                              {isGradeOpen ? <><X className="w-3 h-3"/>Cancel</> : <><Award className="w-3 h-3"/>{sub.status==='graded'?'Edit Grade':'Grade'}</>}
                            </button>
                          </div>
                        </div>

                        {/* Feedback preview */}
                        {!isGradeOpen && sub.status === 'graded' && sub.feedback && (
                          <div className="mx-4 mb-4 px-4 py-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                            <p className="text-[9px] font-black text-green-500/50 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3"/> Feedback
                            </p>
                            <p className="text-slate-300 text-sm italic">"{sub.feedback}"</p>
                          </div>
                        )}

                        {/* Inline grade form */}
                        {isGradeOpen && (
                          <div className="mx-4 mb-4 p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                              <Award className="w-3.5 h-3.5"/> Grading Panel
                            </p>

                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                  Marks <span className="text-slate-700 normal-case font-normal">/ {asgn.totalMarks}</span>
                                </label>
                                <input type="number" min="0" max={asgn.totalMarks}
                                  placeholder={`0–${asgn.totalMarks}`}
                                  value={g.marks}
                                  onChange={e => setGradeMap(p => ({ ...p, [sub._id]: { ...p[sub._id], marks: e.target.value }}))}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xl outline-none focus:border-indigo-500 transition-all"
                                />
                                {pct !== null && (
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${pct>=80?'bg-green-500':pct>=50?'bg-yellow-500':'bg-red-500'}`}
                                      style={{ width:`${Math.min(100,pct)}%` }} />
                                  </div>
                                )}
                              </div>
                              {pct !== null && (
                                <div className={`mt-6 px-4 py-3 rounded-xl font-black text-lg ${pct>=80?'bg-green-500/20 text-green-400':pct>=50?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>
                                  {pct}%
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3"/> Feedback <span className="text-slate-700 font-normal normal-case">(optional)</span>
                              </label>
                              <textarea rows={3} placeholder="Write feedback for the student…"
                                value={g.feedback}
                                onChange={e => setGradeMap(p => ({ ...p, [sub._id]: { ...p[sub._id], feedback: e.target.value }}))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 resize-none transition-all placeholder-slate-700"
                              />
                            </div>

                            <button onClick={() => saveGrade(sub, asgn._id)}
                              disabled={isSaving || g.marks === ''}
                              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                              {isSaving
                                ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving…</>
                                : <><Send className="w-4 h-4"/>Save Grade & Notify Student</>}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
