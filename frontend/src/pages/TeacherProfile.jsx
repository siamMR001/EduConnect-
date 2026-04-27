import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Calendar, Heart, Bookmark,
    Users, Briefcase, FileText, Download, Shield, ArrowLeft, CheckCircle
} from 'lucide-react';
import teacherService from '../services/teacherService';
import TeacherRoutine from '../components/TeacherRoutine';

const TeacherProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'routine'
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // If ID is provided, it's an admin viewing a specific record, 
                // else it's the teacher viewing their own profile
                const data = id 
                    ? await teacherService.getEmployeeById(id)
                    : await teacherService.getProfile();
                
                setProfile(data);
            } catch (error) {
                console.error("Error fetching teacher profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

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

    const DetailRow = ({ icon, label, value }) => (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3 text-slate-300">
                <span className="text-primary-light">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-slate-100 text-sm font-semibold">{value || 'Not provided'}</span>
        </div>
    );

    const DocumentCard = ({ label, type, path }) => (
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 group hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <FileText size={20} />
                </div>
                <div>
                    <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">{type}</p>
                </div>
            </div>
            {path ? (
                <a href={`${import.meta.env.VITE_API_URL}${path}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-primary/20 rounded-full text-slate-400 hover:text-primary transition-colors">
                    <Download size={18} />
                </a>
            ) : (
                <span className="text-[10px] text-slate-600 italic px-2">Not Uploaded</span>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in relative">
            {/* Header / Banner Area */}
            <div className="bg-gradient-to-br from-slate-900 via-[#1a1c2c] to-[#161827] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8 relative">
                <div className="h-32 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
                
                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[#1a1c2c] bg-slate-800 overflow-hidden shadow-2xl">
                            {profile.profilePicture && currentUser?.role !== 'admin' && profile.employeeType !== 'admin' ? (
                                <img src={`${import.meta.env.VITE_API_URL}${profile.profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                    <User size={64} />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-[#1a1c2c] flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{profile.firstName} {profile.lastName}</h1>
                                <p className="text-primary-light font-bold text-lg tracking-wide uppercase mt-1">
                                    {profile.employeeType === 'teacher' ? (profile.subject || 'Faculty Member') : profile.employeeType}
                                </p>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <div className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-xl flex items-center gap-2">
                                    <Shield size={16} className="text-primary" />
                                    <span className="text-sm font-bold text-slate-200">{profile.employeeId}</span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-[#4ade80] bg-[#4ade80]/10 px-3 py-1 rounded-full border border-[#4ade80]/20">
                                    {profile.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl border border-white/10 w-fit">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <User size={16} /> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('routine')}
                    className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'routine' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Calendar size={16} /> Class Routine
                </button>
            </div>

            {activeTab === 'routine' ? (
                <div className="glass-panel p-8 animate-fade-in-up">
                    <TeacherRoutine teacherId={profile.user} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-fade-in-up">
                    {/* Left Column: Personal Info */}
                    <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <DetailRow icon={<Phone size={16} />} label="Mobile Phone" value={profile.phone} />
                            <DetailRow icon={<Mail size={16} />} label="Professional Email" value={profile.email} />
                            <DetailRow icon={<Calendar size={16} />} label="Birthday" value={new Date(profile.dateOfBirth).toLocaleDateString()} />
                            <DetailRow icon={<User size={16} />} label="Gender Identity" value={profile.gender} />
                            <DetailRow icon={<Bookmark size={16} />} label="Religious Affiliation" value={profile.religion} />
                            <DetailRow icon={<Heart size={16} />} label="Marital Status" value={profile.maritalStatus} />
                        </div>
                    </div>

                    {/* Family Details */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-blue-400 rounded-full"></span>
                            Family Heritage
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <DetailRow icon={<Users size={16} />} label="Father's Name" value={profile.fatherName} />
                            <DetailRow icon={<Users size={16} />} label="Mother's Name" value={profile.motherName} />
                        </div>
                    </div>

                    {/* Address Detail */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-indigo-400 rounded-full"></span>
                            Residential Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start bg-black/20 p-4 rounded-2xl border border-white/5">
                                <MapPin className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Permanent Residence</p>
                                    <p className="text-slate-100 text-sm leading-relaxed">{profile.address}, {profile.city}, {profile.state}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Professional Info */}
                <div className="space-y-8">
                    {/* Career Summary */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Professional Summary
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Briefcase className="text-primary" size={18} />
                                    <span className="text-xs font-black uppercase text-primary/80 tracking-widest">Department</span>
                                </div>
                                <p className="text-white font-bold text-lg">{profile.department || 'General Faculty'}</p>
                                <p className="text-slate-400 text-xs mt-1">Specialization: {profile.subject || 'Not Assigned'}</p>
                            </div>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="text-slate-400" size={18} />
                                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Joined School</span>
                                </div>
                                <p className="text-white font-bold">{new Date(profile.registeredAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Verified Documents */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-green-400 rounded-full"></span>
                            Digital Documents
                        </h2>
                        <div className="space-y-4">
                            <DocumentCard label="Professional Dossier" type="PDF Document" path={profile.cvDocument} />
                            <DocumentCard label="Identification (NID)" type="Verified Identity" path={profile.nidDocument} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-6 leading-relaxed italic">
                            * These documents are verified by the institutional administration. Contact HR to update any records.
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default TeacherProfile;
