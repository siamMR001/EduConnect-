import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, CheckCircle, Settings,
    BarChart3, LayoutDashboard, Users,
} from 'lucide-react';

const AdminProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Admin profile is lightweight, fetch from local storage for basic details
        const fetchProfile = () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                setProfile(user);
            } catch (error) {
                console.error("Error fetching admin profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl text-slate-400">Profile Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-medium hover:underline">Go Back</button>
            </div>
        );
    }

    const QuickActionCard = ({ icon, title, desc, onClick }) => (
        <div 
            onClick={onClick}
            className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in relative">
            {/* Header / Banner Area */}
            <div className="bg-gradient-to-br from-slate-900 via-[#1a1c2c] to-[#161827] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8 relative">
                <div className="h-32 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
                
                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[#1a1c2c] bg-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary to-primary-dark text-white">
                                <span className="text-6xl font-black">{profile.name?.charAt(0) || 'A'}</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-[#1a1c2c] flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{profile.name || 'System Admin'}</h1>
                                <p className="text-primary-light font-bold text-lg tracking-wide uppercase mt-1">
                                    {profile.role || 'Administrator'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <div className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-xl flex items-center gap-2">
                                    <Shield size={16} className="text-primary" />
                                    <span className="text-sm font-bold text-slate-200">Root Access</span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-[#4ade80] bg-[#4ade80]/10 px-3 py-1 rounded-full border border-[#4ade80]/20">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-fade-in-up">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Basic Info */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Admin Identity
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <User size={16} className="text-primary" />
                                    <span className="text-sm font-medium">Name</span>
                                </div>
                                <span className="text-slate-100 text-sm font-semibold">{profile.name}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Mail size={16} className="text-primary" />
                                    <span className="text-sm font-medium">Email</span>
                                </div>
                                <span className="text-slate-100 text-sm font-semibold">{profile.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-primary/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-primary" size={24} />
                            <h3 className="text-lg font-bold text-white">System Privileges</h3>
                        </div>
                        <p className="text-sm text-slate-400">
                            As a super administrator, you have full control over the institutional ecosystem, including financial oversight, user management, and system configurations.
                        </p>
                    </div>
                </div>

                {/* Right Column: Quick Links */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickActionCard 
                            icon={<LayoutDashboard size={24} />}
                            title="Admin Dashboard"
                            desc="View real-time institutional metrics and data."
                            onClick={() => navigate('/dashboard')}
                        />
                        <QuickActionCard 
                            icon={<Users size={24} />}
                            title="Manage Users"
                            desc="Approve new teachers or manage student accounts."
                            onClick={() => navigate('/admin/teachers')}
                        />
                        <QuickActionCard 
                            icon={<BarChart3 size={24} />}
                            title="Financial Analytics"
                            desc="Review school revenue, expenses, and transaction logs."
                            onClick={() => navigate('/admin/analytics')}
                        />
                        <QuickActionCard 
                            icon={<Settings size={24} />}
                            title="System Settings"
                            desc="Configure global application parameters."
                            onClick={() => navigate('/admin/settings')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
