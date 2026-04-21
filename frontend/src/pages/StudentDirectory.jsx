import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Download, Upload, Plus, User, Shield, Printer,
    X, LayoutGrid, List, ChevronRight, Phone, Mail,
    Droplet, MapPin, Eye, BookOpen, Users as UsersIcon,
    Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/students`;

// ─── Avatar Color Generator ─────────────────────────────────────────
const AVATAR_COLORS = [
    'from-indigo-600 to-indigo-400',
    'from-emerald-600 to-emerald-400',
    'from-amber-600 to-amber-400',
    'from-rose-600 to-rose-400',
    'from-cyan-600 to-cyan-400',
    'from-violet-600 to-violet-400',
];

const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

// ═══════════════════════════════════════════════════════════════════
// ─── Main Component ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const StudentDirectory = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [sectionFilter, setSectionFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [genderFilter, setGenderFilter] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [selectedStudentForID, setSelectedStudentForID] = useState(null);

    // ─── Fetch Students from API ────────────────────────────────
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setError(err.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // ─── Map API data to component-friendly format ──────────────
    const mappedStudents = useMemo(() => {
        return students.map(s => ({
            _id: s._id,
            id: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            studentPhoto: s.studentPhoto,
            gender: s.gender,
            class: s.currentClass,
            section: s.section,
            roll: s.rollNumber,
            status: s.status,
            bloodGroup: s.bloodGroup,
            gpa: s.gpa || 0,
            attendance: s.attendance || 0,
            guardianName: s.guardianName,
            guardianPhone: s.guardianPhone,
            guardianEmail: s.guardianEmail,
            address: s.address,
            dateOfBirth: s.dateOfBirth
        }));
    }, [students]);

    // ─── Filter Logic ────────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        return mappedStudents.filter(s => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                s.firstName.toLowerCase().includes(term) ||
                s.lastName.toLowerCase().includes(term) ||
                s.id.toLowerCase().includes(term) ||
                s.guardianName.toLowerCase().includes(term);
            const matchesClass = classFilter === 'All' || s.class === classFilter;
            const matchesSection = sectionFilter === 'All' || s.section === sectionFilter;
            const matchesStatus = statusFilter === 'All' || s.status === statusFilter.toLowerCase();
            const matchesGender = genderFilter === 'All' || s.gender === genderFilter;
            return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesGender;
        });
    }, [searchTerm, classFilter, sectionFilter, statusFilter, genderFilter, mappedStudents]);

    // ─── Stats ───────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = mappedStudents.length;
        const active = mappedStudents.filter(s => s.status === 'active').length;
        const inactive = total - active;
        const classes = [...new Set(mappedStudents.map(s => s.class))].length;
        const avgGpa = total > 0 ? (mappedStudents.reduce((a, s) => a + s.gpa, 0) / total).toFixed(2) : '0.00';
        const avgAtt = total > 0 ? Math.round(mappedStudents.reduce((a, s) => a + s.attendance, 0) / total) : 0;
        return { total, active, inactive, classes, avgGpa, avgAtt };
    }, [mappedStudents]);

    // ─── Unique values for filters ───────────────────────────────
    const uniqueClasses = [...new Set(mappedStudents.map(s => s.class))].sort();
    const uniqueSections = [...new Set(mappedStudents.map(s => s.section))].sort();

    // ─── Loading State ───────────────────────────────────────────
    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto py-6 px-4 animate-fade-in-up">
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <Loader2 size={48} className="text-primary-light animate-spin" />
                    <p className="text-slate-400 text-lg font-medium">Loading students...</p>
                </div>
            </div>
        );
    }

    // ─── Error State ─────────────────────────────────────────────
    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto py-6 px-4 animate-fade-in-up">
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="glass-panel border border-red-500/30 p-8 text-center max-w-md">
                        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
                        <p className="text-slate-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={fetchStudents}
                            className="btn-primary flex items-center gap-2 px-6 py-2.5 mx-auto rounded-xl"
                        >
                            <RefreshCw size={16} /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-6 px-4 animate-fade-in-up">

            {/* ── Breadcrumb ───────────────────────────────────── */}
            <div className="flex items-center gap-2 text-xs mb-1">
                <button onClick={() => navigate('/dashboard')} className="text-primary-light hover:text-white transition-colors font-medium uppercase tracking-wider">EduConnect</button>
                <ChevronRight size={12} className="text-slate-500" />
                <span className="text-white font-bold uppercase tracking-wider">Student Information System (SIS)</span>
            </div>

            {/* ── Page Header ──────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 mt-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">
                        Student Information System <span className="text-primary-light">(SIS)</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Digital profiles · Parent records · Academic history · ID cards</p>
                </div>

            </header>

            {/* ── Stats Dashboard ──────────────────────────────── */}
            <div className="glass-panel border border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 divide-x divide-white/10 mb-6">
                <StatBox label="TOTAL STUDENTS" value={stats.total} color="text-white" />
                <StatBox label="ACTIVE" value={stats.active} color="text-green-400" />
                <StatBox label="INACTIVE" value={stats.inactive} color="text-red-400" />
                <StatBox label="TOTAL CLASSES" value="12" color="text-white" />
            </div>

            {/* ── Search & Filters ─────────────────────────────── */}
            <div className="glass-panel p-4 mb-4 border border-white/10">
                <div className="flex flex-col lg:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or parent name..."
                            className="input-field pl-10 w-full text-sm py-2.5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
                        <FilterSelect 
                            label="All Classes" 
                            value={classFilter} 
                            onChange={setClassFilter} 
                            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))} 
                        />
                        <FilterSelect label="All Sections" value={sectionFilter} onChange={setSectionFilter} options={['A', 'B', 'C'].map(s => ({ value: s, label: `Section ${s}` }))} />
                        <FilterSelect label="All Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
                        <FilterSelect label="All Gender" value={genderFilter} onChange={setGenderFilter} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                    </div>
                </div>
            </div>

            {/* ── View Toggle & Count ──────────────────────────── */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex bg-background-paper border border-white/10 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <span className="text-sm text-slate-400">
                        Showing <span className="text-primary-light font-semibold">{filteredStudents.length}</span> of {mappedStudents.length} students
                    </span>
                </div>
                <button className="text-sm text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">Select All</button>
            </div>

            {/* ── Student Cards (Grid View) ────────────────────── */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredStudents.length === 0 ? (
                        <EmptyState />
                    ) : (
                        filteredStudents.map((student, idx) => (
                            <StudentCard
                                key={student._id || student.id}
                                student={student}
                                colorClass={getAvatarColor(idx)}
                                onViewProfile={() => navigate(`/profile/${student._id}`)}
                                onGenerateID={() => setSelectedStudentForID(student)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* ── Student Cards (List View) ────────────────────── */}
            {viewMode === 'list' && (
                <div className="space-y-3">
                    {filteredStudents.length === 0 ? (
                        <EmptyState />
                    ) : (
                        filteredStudents.map((student, idx) => (
                            <StudentListRow
                                key={student._id || student.id}
                                student={student}
                                colorClass={getAvatarColor(idx)}
                                onViewProfile={() => navigate(`/profile/${student._id}`)}
                                onGenerateID={() => setSelectedStudentForID(student)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* ── ID Card Modal ────────────────────────────────── */}
            {selectedStudentForID && (
                <IDCardModal
                    student={selectedStudentForID}
                    onClose={() => setSelectedStudentForID(null)}
                />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// ─── Sub-Components ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

const StatBox = ({ label, value, color }) => (
    <div className="p-4 text-center sm:text-left">
        <div className={`text-2xl md:text-3xl font-bold ${color} leading-none mb-1`}>{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
    </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
    <select
        className="input-field text-sm py-2.5 bg-black/30 appearance-none cursor-pointer w-full lg:w-36 rounded-xl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
    >
        <option value="All">{label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
);

const EmptyState = () => (
    <div className="col-span-full py-16 text-center glass-panel border border-white/10">
        <UsersIcon size={48} className="mx-auto text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg font-medium">No students found</p>
        <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
    </div>
);

// ─── Grid Card ─────────────────────────────────────────────────────
const StudentCard = ({ student, colorClass, onViewProfile, onGenerateID }) => (
    <div className="glass-panel border border-white/5 hover:border-primary/40 transition-all duration-300 group overflow-hidden">
        {/* Card Header */}
        <div className="flex items-start gap-3 p-5 pb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0 shadow-lg overflow-hidden`}>
                {student.studentPhoto ? (
                    <img src={`${import.meta.env.VITE_API_URL}${student.studentPhoto}`} alt="Student" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white text-sm font-bold">{student.firstName[0]}{student.lastName[0]}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-bold text-base truncate">{student.firstName} {student.lastName}</h3>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${student.status === 'active' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></span>
                </div>
                <p className="text-slate-500 text-xs font-medium mt-0.5">{student.id}</p>
            </div>
        </div>

        {/* Card Body */}
        <div className="px-5 pb-4 space-y-2.5 border-t border-white/5 pt-4">
            <InfoRow label="CLASS" value={`Grade ${student.class} – ${student.section} (Roll: ${student.roll})`} />
            <InfoRow label="GUARDIAN" value={student.guardianName} />
            <InfoRow label="CONTACT" value={student.guardianPhone} />
            <InfoRow label="BLOOD" value={student.bloodGroup} />
            <InfoRow label="GENDER" value={student.gender} />
        </div>

        {/* Card Footer */}
        <div className="grid grid-cols-2 border-t border-white/5">
            <button
                onClick={onViewProfile}
                className="py-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5 border-r border-white/5"
            >
                <Eye size={14} /> View Profile
            </button>
            <button
                onClick={onGenerateID}
                className="py-3 text-xs font-semibold text-primary-light hover:text-white hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            >
                <Printer size={14} /> Generate ID
            </button>
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 w-20 shrink-0">{label}</span>
        <span className="text-slate-300 font-medium text-right text-xs">{value}</span>
    </div>
);

// ─── List Row ──────────────────────────────────────────────────────
const StudentListRow = ({ student, colorClass, onViewProfile, onGenerateID }) => (
    <div className="glass-panel border border-white/5 hover:border-primary/40 transition-all duration-300 p-4 flex items-center gap-4 group">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0 overflow-hidden`}>
            {student.studentPhoto ? (
                <img src={`${import.meta.env.VITE_API_URL}${student.studentPhoto}`} alt="Student" className="w-full h-full object-cover" />
            ) : (
                <span className="text-white text-xs font-bold">{student.firstName[0]}{student.lastName[0]}</span>
            )}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-1 items-center text-sm min-w-0">
            <div>
                <div className="text-white font-semibold truncate">{student.firstName} {student.lastName}</div>
                <div className="text-slate-500 text-xs">{student.id}</div>
            </div>
            <div className="hidden md:block">
                <div className="text-slate-300 text-xs">Grade {student.class} – {student.section}</div>
                <div className="text-slate-500 text-xs">Roll: {student.roll}</div>
            </div>
            <div className="hidden md:block">
                <div className="text-slate-300 text-xs">{student.guardianName}</div>
                <div className="text-slate-500 text-xs">{student.guardianPhone}</div>
            </div>
            <div className="hidden md:block">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="capitalize">{student.status}</span>
                </span>
            </div>
            <div className="flex items-center gap-2 justify-end col-span-2 md:col-span-1">
                <button onClick={onViewProfile} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="View Profile">
                    <Eye size={15} />
                </button>
                <button onClick={onGenerateID} className="p-1.5 text-primary-light hover:text-white hover:bg-primary/20 rounded-md transition-colors" title="Generate ID">
                    <Printer size={15} />
                </button>
            </div>
        </div>
    </div>
);

// ─── ID Card Modal ─────────────────────────────────────────────────
const IDCardModal = ({ student, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up print:bg-white print:p-0" onClick={onClose}>
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
                    height: 570px; /* Force consistent aspect ratio */
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
            <button onClick={onClose} className="no-print absolute -top-12 right-0 text-white/50 hover:text-white transition flex items-center gap-2 text-sm">
                Close <X size={20} />
            </button>

            {/* ID Card */}
            <div id="id-card-print-area" className="bg-white rounded-2xl overflow-hidden shadow-2xl relative w-full aspect-[2/3] flex flex-col">
                {/* Header */}
                <div className="h-28 bg-gradient-to-br from-primary-dark via-primary to-primary-light relative flex flex-col items-center justify-center">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    <h2 className="text-white font-black text-xl tracking-[0.3em] uppercase relative z-10">EDUCONNECT</h2>
                    <p className="text-white/70 text-[10px] font-medium tracking-[0.25em] uppercase mt-0.5 relative z-10">International School</p>
                </div>

                {/* Body */}
                <div className="flex-1 bg-white relative flex flex-col items-center px-6 pt-14 pb-5">
                    <div className="absolute -top-14 w-28 h-28 rounded-2xl bg-white p-1.5 shadow-xl">
                        <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {student.studentPhoto ? (
                                <img src={`${import.meta.env.VITE_API_URL}${student.studentPhoto}`} alt="ID" className="w-full h-full object-cover" />
                            ) : (
                                <User size={56} className="text-slate-300" />
                            )}
                        </div>
                    </div>

                    <div className="text-center w-full mt-3 flex-1">
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{student.firstName}</h3>
                        <h3 className="text-xl font-bold text-primary uppercase tracking-wide">{student.lastName}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.2em] mb-5">Student</p>

                        <div className="space-y-2.5 w-full text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <IDRow label="ID Number" value={student.id} />
                            <IDRow label="Class / Sec" value={`${student.class} – ${student.section}`} />
                            <IDRow label="DOB" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                            <IDRow label="Blood Group" value={student.bloodGroup} highlight />
                        </div>
                    </div>

                    <div className="w-full mt-5 flex justify-between items-end border-t-2 border-slate-100 pt-3">
                        <div className="text-[10px] text-slate-400 leading-tight">
                            <p>Valid until: Dec 2027</p>
                            <p>Issuer: Admin Office</p>
                        </div>
                        <div className="h-7 w-20 flex gap-px opacity-40">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="bg-slate-800 h-full" style={{ width: [1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 1, 2, 3, 2, 1, 3, 2, 1][i] + 'px' }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex justify-center no-print">
                <button
                    onClick={() => { window.print(); }}
                    className="btn-primary flex items-center gap-2 py-3 px-8 shadow-xl shadow-primary/30 rounded-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                    <Download size={18} /> Save as PDF
                </button>
            </div>
        </div>
    </div>
);

const IDRow = ({ label, value, highlight = false }) => (
    <div className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-bold ${highlight ? 'text-red-500' : 'text-slate-800'}`}>{value}</span>
    </div>
);

export default StudentDirectory;
