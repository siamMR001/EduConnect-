import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Bell, Plus, AlertCircle, ChevronRight, Settings, Users, FileText, CheckCircle, XCircle, Trash2, Pencil, X } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'admissions'
    const [notices, setNotices] = useState([]);
    const [events, setEvents] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [admissionFee, setAdmissionFee] = useState(500);
    const [selectedApplication, setSelectedApplication] = useState(null);

    // Modals state
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);

    // Form state
    const [newNotice, setNewNotice] = useState({ title: '', content: '', priority: 'normal', targetRole: 'all' });
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', type: 'academic' });

    // Edit state
    const [editingNotice, setEditingNotice] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);

    // Read More state
    const [readingNotice, setReadingNotice] = useState(null);

    // Delete confirmation state (inline confirm)
    const [confirmDeleteNoticeId, setConfirmDeleteNoticeId] = useState(null);
    const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/login');
        } else {
            setUser(userData);
            // In a real app we'd fetch from APIs here. 
            // For demonstration, we'll populate mock data if empty, or fetch.
            fetchData();
        }
    }, [navigate]);

    const fetchData = async () => {
        try {
            const [noticesRes, eventsRes, settingsRes, admissionsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/notices`),
                fetch(`${import.meta.env.VITE_API_URL}/api/events`),
                fetch(`${import.meta.env.VITE_API_URL}/api/settings`),
                fetch(`${import.meta.env.VITE_API_URL}/api/admissions`) // Fetch admissions
            ]);
            const noticesData = noticesRes.ok ? await noticesRes.json() : [];
            const eventsData = eventsRes.ok ? await eventsRes.json() : [];
            const settingsData = settingsRes.ok ? await settingsRes.json() : { admissionFee: 500 };
            const admissionsData = admissionsRes.ok ? await admissionsRes.json() : [];

            setNotices(noticesData.length ? noticesData : MOCK_NOTICES);
            setEvents(eventsData.length ? eventsData : MOCK_EVENTS);
            setAdmissions(admissionsData);
            setAdmissionFee(settingsData.admissionFee || 500);
        } catch (err) {
            setNotices(MOCK_NOTICES);
            setEvents(MOCK_EVENTS);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admissionFee: Number(admissionFee) })
            });
            setIsSettingsOpen(false);
            alert("Settings Saved successfully! Admission Fee updated.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUpdateAdmissionStatus = async (id, status) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admissions/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                // Update local list
                setAdmissions(prev => prev.map(app => app._id === id ? { ...app, status } : app));
                setSelectedApplication(null); // Close modal

                if (status === 'approved') {
                    alert("Application Approved! Student Profile & User Login automatically created.");
                } else {
                    alert("Application status updated to: " + status);
                }
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network error updating admission status.");
        }
    };

    const handleApproveAllPending = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admissions/approve-all-pending`, {
                method: 'PATCH'
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchData(); // Refresh list to reflect state changes
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network error trying to approve all paid applications.");
        }
    };

    // --- Notice API Methods ---
    const handleAddNotice = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newNotice, author: user._id })
            });
            if (res.ok) {
                const addedNotice = await res.json();
                setNotices([addedNotice, ...notices]);
                setShowNoticeModal(false);
                setNewNotice({ title: '', content: '', priority: 'normal', targetRole: 'all' });
            } else {
                alert("Failed to create notice.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteNotice = async (id) => {
        if (confirmDeleteNoticeId !== id) {
            setConfirmDeleteNoticeId(id);
            setTimeout(() => setConfirmDeleteNoticeId(null), 3000); // reset after 3s
            return;
        }
        setConfirmDeleteNoticeId(null);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/notices/${id}`, { method: 'DELETE' });
            setNotices(notices.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateNotice = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notices/${editingNotice._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingNotice.title,
                    content: editingNotice.content,
                    priority: editingNotice.priority,
                    targetRole: editingNotice.targetRole
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setNotices(notices.map(n => n._id === updated._id ? updated : n));
                setEditingNotice(null);
            } else {
                alert('Failed to update notice.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Event API Methods ---
    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newEvent, organizer: user._id })
            });
            if (res.ok) {
                const addedEvent = await res.json();
                // Sort events by date ascending
                setEvents([...events, addedEvent].sort((a, b) => new Date(a.date) - new Date(b.date)));
                setShowEventModal(false);
                setNewEvent({ title: '', description: '', date: '', type: 'academic' });
            } else {
                alert("Failed to create event.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (confirmDeleteEventId !== id) {
            setConfirmDeleteEventId(id);
            setTimeout(() => setConfirmDeleteEventId(null), 3000);
            return;
        }
        setConfirmDeleteEventId(null);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, { method: 'DELETE' });
            setEvents(events.filter(e => e._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            // Format the date correctly for the API
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${editingEvent._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingEvent.title,
                    description: editingEvent.description,
                    date: editingEvent.date,
                    type: editingEvent.type
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setEvents(events.map(ev => ev._id === updated._id ? updated : ev).sort((a, b) => new Date(a.date) - new Date(b.date)));
                setEditingEvent(null);
            } else {
                alert('Failed to update event.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 animate-fade-in-up">
            <header className="flex justify-between items-center mb-8 glass-panel py-4 px-6 border-b border-white/10">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white tracking-tight">
                    Welcome back, {user.name?.split(' ')[0] || 'User'}
                </h1>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200">{user.name || 'User'}</p>
                        <p className="text-xs text-slate-400 capitalize hover:text-primary transition-colors cursor-pointer">
                            {user.role?.replace('_', '/') || 'Role'} Role
                        </p>
                    </div>
                    {user.role?.toLowerCase() === 'admin' && (
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 ml-2 bg-white/5 hover:bg-white/10 flex items-center gap-2 rounded-lg text-slate-400 hover:text-white transition-all border border-white/5">
                            <Settings size={20} />
                            <span className="text-sm font-medium hidden md:block">Fee Config</span>
                        </button>
                    )}
                    <button onClick={handleLogout} className="p-2 ml-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 duration-200 border border-white/5">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {isSettingsOpen && (
                <div className="mb-8 glass-panel p-6 border-l-4 border-primary animate-fade-in-down flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Settings size={20} className="text-primary-light" />
                            Admission Fee Configuration
                        </h3>
                        <p className="text-sm text-slate-400">Set the payment amount required before a student application is submitted.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center glass-panel px-4 py-2 border-white/10 bg-black/20">
                            <span className="text-slate-400 mr-2 text-lg">৳</span>
                            <input
                                type="number"
                                className="bg-transparent border-none text-white font-bold w-20 text-lg focus:ring-0 focus:outline-none p-0"
                                value={admissionFee}
                                onChange={(e) => setAdmissionFee(e.target.value)}
                            />
                        </div>
                        <button onClick={handleSaveSettings} className="btn-primary py-2 px-6 shrink-0">Save</button>
                        <button onClick={() => setIsSettingsOpen(false)} className="btn-secondary py-2 px-4 shrink-0">Cancel</button>
                    </div>
                </div>
            )}



            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-4 font-semibold transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-primary-light border-b-2 border-primary-light' : 'text-slate-400 hover:text-white'}`}
                >
                    Overview
                </button>
                {user.role?.toLowerCase() === 'admin' && (
                    <button
                        onClick={() => setActiveTab('admissions')}
                        className={`pb-2 px-4 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'admissions' ? 'text-primary-light border-b-2 border-primary-light' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileText size={16} /> Admissions
                        {admissions.filter(a => a.status === 'pending').length > 0 && (
                            <span className="bg-primary/20 text-primary-light text-xs py-0.5 px-2 rounded-full">
                                {admissions.filter(a => a.status === 'pending').length} New
                            </span>
                        )}
                    </button>
                )}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    {/* Notice Board */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Bell className="text-primary-light" size={24} />
                                Digital Notice Board
                            </h2>
                            {(user.role === 'admin' || user.role === 'teacher') && (
                                <button onClick={() => setShowNoticeModal(true)} className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
                                    <Plus size={16} /> New Notice
                                </button>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {notices.map((notice) => (
                                <div key={notice._id || notice.id} className="glass-panel p-5 border-l-4 border-l-primary hover:border-l-primary-light transition-all duration-300 transform hover:-translate-y-1 relative group">
                                    {(user.role === 'admin' || user.role === 'teacher') && notice._id && (
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingNotice({ ...notice }); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary-light transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNotice(notice._id); }}
                                                className={`p-1.5 rounded-lg transition-all text-sm font-bold flex items-center gap-1 ${confirmDeleteNoticeId === notice._id
                                                    ? 'bg-red-500 text-white px-2'
                                                    : 'bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                                                    }`}
                                            >
                                                {confirmDeleteNoticeId === notice._id ? 'Sure?' : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            {notice.priority === 'urgent' && <AlertCircle size={16} className="text-red-400 animate-pulse" />}
                                            {notice.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 bg-black/20 px-2 py-1 rounded">
                                            {new Date(notice.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{notice.content}</p>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span className="capitalize px-2 py-1 bg-white/5 rounded-full border border-white/5">
                                            For: {notice.targetRole === 'all' ? 'Everyone' : notice.targetRole.replace('_', '/')}
                                        </span>
                                        <button onClick={() => setReadingNotice(notice)} className="text-primary hover:text-primary-light flex items-center gap-1 group font-medium transition-colors">
                                            Read more <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calendar / Events */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Calendar className="text-pink-400" size={24} />
                                Upcoming Events
                            </h2>
                            {(user.role === 'admin' || user.role === 'teacher') && (
                                <button onClick={() => setShowEventModal(true)} className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
                                    <Plus size={16} /> New Event
                                </button>
                            )}
                        </div>

                        <div className="glass-panel p-5 h-full min-h-[400px]">
                            <div className="space-y-5">
                                {events.map((evt) => (
                                    <div key={evt._id || evt.id} className="group flex gap-4 items-start p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer relative">
                                        {(user.role === 'admin' || user.role === 'teacher') && evt._id && (
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingEvent({ ...evt, date: new Date(evt.date).toISOString().slice(0, 16) }); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary-light transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt._id); }}
                                                    className={`p-1.5 rounded-lg transition-all text-sm font-bold flex items-center gap-1 ${confirmDeleteEventId === evt._id
                                                            ? 'bg-red-500 text-white px-2'
                                                            : 'bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                                                        }`}
                                                >
                                                    {confirmDeleteEventId === evt._id ? 'Sure?' : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center justify-center min-w-[50px] bg-black/20 rounded-lg p-2 border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                                            <span className="text-xs text-primary-light font-bold uppercase tracking-wider">
                                                {new Date(evt.date).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-xl text-white font-bold">
                                                {new Date(evt.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium mb-1 group-hover:text-primary-light transition-colors">{evt.title}</h4>
                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{evt.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'admissions' && user.role?.toLowerCase() === 'admin' && (
                <div className="animate-fade-in-up space-y-6">
                    <div className="glass-panel p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Users className="text-primary-light" /> Admission Applications
                            </h2>
                            <button onClick={handleApproveAllPending} className="btn-primary py-2 px-4 shadow-lg flex items-center gap-2 text-sm font-bold bg-green-500 hover:bg-green-600 shadow-green-500/20">
                                <CheckCircle size={16} /> Approve All Pending
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-400 text-sm tracking-wider">
                                        <th className="pb-3 px-4 font-semibold uppercase">Date</th>
                                        <th className="pb-3 px-4 font-semibold uppercase">Student ID</th>
                                        <th className="pb-3 px-4 font-semibold uppercase">Name</th>
                                        <th className="pb-3 px-4 font-semibold uppercase">Class</th>
                                        <th className="pb-3 px-4 font-semibold uppercase">Status</th>
                                        <th className="pb-3 px-4 font-semibold uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admissions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-slate-500">No admission applications found.</td>
                                        </tr>
                                    ) : admissions.map(app => (
                                        <tr key={app._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 text-slate-300">{new Date(app.createdAt).toLocaleDateString()}</td>
                                            <td className="py-4 px-4 font-mono text-primary-light">{app.studentId}</td>
                                            <td className="py-4 px-4 text-white font-medium">{app.firstName} {app.lastName}</td>
                                            <td className="py-4 px-4 text-slate-300">Class {app.applyingForClass}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                                                    ${app.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                        app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => setSelectedApplication(app)}
                                                    className="btn-secondary py-1.5 px-4 text-sm font-medium hover:bg-white/10"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Review Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fade-in-down border-white/20 shadow-2xl">

                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-background-dark/90 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Review Application: {selectedApplication.studentId}</h2>
                                <p className="text-slate-400 text-sm">Submitted on {new Date(selectedApplication.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedApplication(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <AlertCircle className="rotate-45" size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-8">

                            {/* Student Base Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/20 p-6 rounded-xl border border-white/5">
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Full Name</p><p className="text-white font-medium">{selectedApplication.firstName} {selectedApplication.lastName}</p></div>
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Applying Class</p><p className="text-primary-light font-bold">Class {selectedApplication.applyingForClass}</p></div>
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Date of Birth</p><p className="text-white">{new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p></div>
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Gender / Blood</p><p className="text-white">{selectedApplication.gender} / {selectedApplication.bloodGroup}</p></div>
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Previous School</p><p className="text-white">{selectedApplication.previousSchool}</p></div>
                            </div>

                            {/* Parents / Guardian */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-lg font-semibold border-b border-white/5 pb-2 text-primary-light">Father Details</h4>
                                    <p className="text-sm"><span className="text-slate-500">Name:</span> <span className="text-white">{selectedApplication.fatherName}</span></p>
                                    <p className="text-sm"><span className="text-slate-500">Phone:</span> <span className="text-white">{selectedApplication.fatherPhone}</span></p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-lg font-semibold border-b border-white/5 pb-2 text-pink-400">Mother Details</h4>
                                    <p className="text-sm"><span className="text-slate-500">Name:</span> <span className="text-white">{selectedApplication.motherName}</span></p>
                                    <p className="text-sm"><span className="text-slate-500">Phone:</span> <span className="text-white">{selectedApplication.motherPhone}</span></p>
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <h4 className="text-lg font-semibold border-b border-white/5 pb-2 text-yellow-400">Official Guardian Info</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <p className="text-sm"><span className="text-slate-500">Name:</span> <span className="text-white">{selectedApplication.guardianName}</span></p>
                                        <p className="text-sm"><span className="text-slate-500">Phone:</span> <span className="text-white">{selectedApplication.guardianPhone}</span></p>
                                        <p className="text-sm"><span className="text-slate-500">Email:</span> <span className="text-white">{selectedApplication.guardianEmail}</span></p>
                                        <p className="text-sm"><span className="text-slate-500">Relation:</span> <span className="text-white">{selectedApplication.guardianRelation}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Uploaded Documents */}
                            <div>
                                <h4 className="text-xl font-bold border-b border-white/10 pb-3 mb-4 text-white">Uploaded Documents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {selectedApplication.studentPhoto && (
                                        <a href={`${import.meta.env.VITE_API_URL}${selectedApplication.studentPhoto}`} target="_blank" rel="noreferrer" className="flex flex-col items-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group">
                                            <div className="w-16 h-16 bg-black/30 rounded-full mb-3 overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors">
                                                <img src={`${import.meta.env.VITE_API_URL}${selectedApplication.studentPhoto}`} alt="Student" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-300">Student Photo</span>
                                        </a>
                                    )}
                                    {selectedApplication.previousResultSheet && (
                                        <a href={`${import.meta.env.VITE_API_URL}${selectedApplication.previousResultSheet}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                                            <FileText size={32} className="text-blue-400 mb-2" />
                                            <span className="text-sm font-medium text-slate-300">Previous Result</span>
                                            <span className="text-xs text-slate-500 mt-1">View File</span>
                                        </a>
                                    )}
                                    {selectedApplication.documentsPdf && selectedApplication.documentsPdf.map((doc, idx) => (
                                        <a key={idx} href={`${import.meta.env.VITE_API_URL}${doc}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                                            <FileText size={32} className="text-pink-400 mb-2" />
                                            <span className="text-sm font-medium text-slate-300">Document {idx + 1}</span>
                                            <span className="text-xs text-slate-500 mt-1">View PDF</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer Actions */}
                        <div className="sticky bottom-0 bg-background-dark/95 backdrop-blur-md border-t border-white/10 p-6 flex justify-between items-center z-10">
                            {selectedApplication.status === 'pending' && (
                                <button
                                    onClick={() => handleUpdateAdmissionStatus(selectedApplication._id, 'rejected')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-medium transition-all"
                                >
                                    <XCircle size={18} /> Reject Application
                                </button>
                            )}

                            {selectedApplication.status !== 'approved' ? (
                                <button
                                    onClick={() => handleUpdateAdmissionStatus(selectedApplication._id, 'approved')}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 active:scale-95 ml-auto"
                                >
                                    <CheckCircle size={20} /> Approve & Auto-Enroll
                                </button>
                            ) : (
                                <div className="w-full text-center p-3 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-slate-400 text-sm">
                                        This application was already <strong className="capitalize text-green-400">approved</strong> and enrolled.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Notice Modal */}
            {showNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg p-6 relative animate-fade-in-down">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Notice</h2>
                        <form onSubmit={handleAddNotice} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Notice Title</label>
                                <input type="text" required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} className="form-input w-full" placeholder="e.g. Annual Sports Day" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Content</label>
                                <textarea required value={newNotice.content} onChange={e => setNewNotice({ ...newNotice, content: e.target.value })} className="form-input w-full h-32" placeholder="Notice details..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Priority</label>
                                    <select value={newNotice.priority} onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Target Audience</label>
                                    <select value={newNotice.targetRole} onChange={e => setNewNotice({ ...newNotice, targetRole: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="all">Everyone</option>
                                        <option value="teacher">Teachers</option>
                                        <option value="student_guardian">Students & Guardians</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setShowNoticeModal(false)} className="btn-secondary py-2 px-6">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6">Post Notice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg p-6 relative animate-fade-in-down">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Event</h2>
                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Event Title</label>
                                <input type="text" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="form-input w-full" placeholder="e.g. Science Fair" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Description</label>
                                <textarea required value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="form-input w-full h-24" placeholder="Event details..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Event Date</label>
                                    <input type="datetime-local" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="form-input w-full" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Event Type</label>
                                    <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="academic">Academic</option>
                                        <option value="sports">Sports</option>
                                        <option value="club">Club</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setShowEventModal(false)} className="btn-secondary py-2 px-6">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6">Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Read More Notice Modal ===== */}
            {readingNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReadingNotice(null)}>
                    <div className="glass-panel w-full max-w-2xl p-8 relative animate-fade-in-down border border-white/20" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setReadingNotice(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        {/* Priority badge */}
                        <div className="flex items-center gap-3 mb-4">
                            {readingNotice.priority === 'urgent' && <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12} className="animate-pulse" /> Urgent</span>}
                            {readingNotice.priority === 'high' && <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">High Priority</span>}
                            {readingNotice.priority === 'normal' && <span className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider">Notice</span>}
                            <span className="text-xs text-slate-500 ml-auto">{new Date(readingNotice.createdAt).toLocaleString()}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6 border-b border-white/10 pb-4">{readingNotice.title}</h2>
                        <p className="text-slate-200 leading-relaxed text-base whitespace-pre-wrap mb-6">{readingNotice.content}</p>
                        <div className="flex items-center justify-between text-sm text-slate-500 border-t border-white/10 pt-4">
                            <span className="capitalize px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                For: {readingNotice.targetRole === 'all' ? 'Everyone' : readingNotice.targetRole.replace('_', ' / ')}
                            </span>
                            {readingNotice.author?.name && <span>Posted by {readingNotice.author.name}</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Notice Modal ===== */}
            {editingNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg p-6 relative animate-fade-in-down">
                        <button onClick={() => setEditingNotice(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Pencil size={20} className="text-primary-light" /> Edit Notice</h2>
                        <form onSubmit={handleUpdateNotice} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Notice Title</label>
                                <input type="text" required value={editingNotice.title} onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })} className="form-input w-full" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Content</label>
                                <textarea required value={editingNotice.content} onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })} className="form-input w-full h-32"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Priority</label>
                                    <select value={editingNotice.priority} onChange={e => setEditingNotice({ ...editingNotice, priority: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Target Audience</label>
                                    <select value={editingNotice.targetRole} onChange={e => setEditingNotice({ ...editingNotice, targetRole: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="all">Everyone</option>
                                        <option value="teacher">Teachers</option>
                                        <option value="student_guardian">Students & Guardians</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setEditingNotice(null)} className="btn-secondary py-2 px-6">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Edit Event Modal ===== */}
            {editingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg p-6 relative animate-fade-in-down">
                        <button onClick={() => setEditingEvent(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Pencil size={20} className="text-pink-400" /> Edit Event</h2>
                        <form onSubmit={handleUpdateEvent} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Event Title</label>
                                <input type="text" required value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} className="form-input w-full" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-semibold mb-2">Description</label>
                                <textarea required value={editingEvent.description} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} className="form-input w-full h-24"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Event Date</label>
                                    <input type="datetime-local" required value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} className="form-input w-full" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-semibold mb-2">Event Type</label>
                                    <select value={editingEvent.type} onChange={e => setEditingEvent({ ...editingEvent, type: e.target.value })} className="form-input w-full text-white bg-background-dark">
                                        <option value="academic">Academic</option>
                                        <option value="sports">Sports</option>
                                        <option value="club">Club</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setEditingEvent(null)} className="btn-secondary py-2 px-6">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

// Mock data for initial visual wow factor before real data is populated
const MOCK_NOTICES = [
    { id: 1, title: 'Annual Sports Day 2026', content: 'We are excited to announce our upcoming sports day. Please ensure students come in their respective house colors. Registration for events closes next Friday.', priority: 'high', targetRole: 'all', createdAt: new Date().toISOString() },
    { id: 2, title: 'Parent-Teacher Meeting', content: 'Mid-term PTM will be held this Saturday. Guardians are requested to book their slots via the portal early.', priority: 'urgent', targetRole: 'student_guardian', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, title: 'New Library Books Added', content: 'Our library has been updated with 500 new titles across science fiction, biographies, and academic references. Check them out!', priority: 'normal', targetRole: 'all', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const MOCK_EVENTS = [
    { id: 1, title: 'Science Fair Selection', description: 'Screening of projects for the national science fair entries.', date: new Date(Date.now() + 86400000 * 3).toISOString() },
    { id: 2, title: 'Spring Festival', description: 'Cultural show and food stalls arranged by the senior classes.', date: new Date(Date.now() + 86400000 * 7).toISOString() },
    { id: 3, title: 'Mid-Term Exams Begin', description: 'Theoretical exams for all classes will commence on this date.', date: new Date(Date.now() + 86400000 * 15).toISOString() },
];

export default Dashboard;
