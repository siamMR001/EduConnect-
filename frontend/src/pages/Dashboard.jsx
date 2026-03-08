import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Bell, Plus, AlertCircle, ChevronRight } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [notices, setNotices] = useState([]);
    const [events, setEvents] = useState([]);

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
            const [noticesRes, eventsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/notices`),
                fetch(`${import.meta.env.VITE_API_URL}/api/events`)
            ]);
            const noticesData = noticesRes.ok ? await noticesRes.json() : [];
            const eventsData = eventsRes.ok ? await eventsRes.json() : [];

            setNotices(noticesData.length ? noticesData : MOCK_NOTICES);
            setEvents(eventsData.length ? eventsData : MOCK_EVENTS);
        } catch (err) {
            setNotices(MOCK_NOTICES);
            setEvents(MOCK_EVENTS);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
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
                    <button onClick={handleLogout} className="p-2 ml-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 duration-200 border border-white/5">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Notice Board */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Bell className="text-primary-light" size={24} />
                            Digital Notice Board
                        </h2>
                        {(user.role === 'admin' || user.role === 'teacher') && (
                            <button className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
                                <Plus size={16} /> New Notice
                            </button>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {notices.map((notice) => (
                            <div key={notice._id || notice.id} className="glass-panel p-5 border-l-4 border-l-primary hover:border-l-primary-light transition-all duration-300 transform hover:-translate-y-1">
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
                                    <button className="text-primary hover:text-primary-light flex items-center gap-1 group font-medium transition-colors">
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
                    </div>

                    <div className="glass-panel p-5 h-full min-h-[400px]">
                        <div className="space-y-5">
                            {events.map((evt) => (
                                <div key={evt._id || evt.id} className="group flex gap-4 items-start p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
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
