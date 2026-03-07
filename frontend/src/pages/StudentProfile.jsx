import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Droplet, Calendar,
    BookOpen, Award, ArrowLeft, Shield
} from 'lucide-react';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }

        // In a real app we'd fetch real profile by user._id
        // fetch(`http://localhost:5000/api/students/user/${user._id}`)
        // For Module 1 demonstration, we use rich mock data
        setTimeout(() => {
            setProfile(MOCK_PROFILE);
            setLoading(false);
        }, 800);
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!profile) return <div className="text-center mt-20 text-white">Profile not found.</div>;

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-up">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {/* Header Profile Section */}
            <div className="glass-panel p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-dark to-primary flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0 border-4 border-background">
                        <User size={64} className="text-white" />
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between xl:gap-4 gap-2 mb-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-white">{profile.firstName} {profile.lastName}</h1>
                            <div className="flex items-center justify-center gap-2 bg-black/30 px-4 py-1.5 rounded-full border border-white/10 w-fit mx-auto md:mx-0">
                                <Shield size={16} className="text-primary-light" />
                                <span className="text-sm font-medium text-slate-200">ID: {profile.studentId}</span>
                            </div>
                        </div>

                        <p className="text-lg text-primary-light font-medium mb-4">
                            Class {profile.currentClass} • Section {profile.section} • Roll {profile.rollNumber}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <Badge icon={<Droplet size={14} />} text={`Blood: ${profile.bloodGroup}`} />
                            <Badge icon={<Calendar size={14} />} text={`DOB: ${new Date(profile.dateOfBirth).toLocaleDateString()}`} />
                            <Badge icon={<BookOpen size={14} />} text={`Status: ${profile.status}`} className="capitalize" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2">Contact Details</h2>
                        <div className="space-y-4">
                            <DetailRow icon={<MapPin size={18} />} label="Address" value={profile.address} />
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2">Guardian Information</h2>
                        <div className="space-y-4">
                            <DetailRow icon={<User size={18} />} label="Name" value={profile.guardianName} />
                            <DetailRow icon={<Phone size={18} />} label="Phone" value={profile.guardianPhone} />
                            <DetailRow icon={<Mail size={18} />} label="Email" value={profile.guardianEmail || 'N/A'} />
                        </div>
                    </div>
                </div>

                {/* Academic History */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>Academic Records</span>
                            <Award size={20} className="text-yellow-400" />
                        </h2>

                        <div className="space-y-4">
                            {profile.academicHistory.map((record, index) => (
                                <div key={index} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-white font-medium text-lg">Class {record.class}</h3>
                                        <div className="text-primary-light font-bold text-xl">{record.grade}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-400">
                                        <span>Year: {record.year}</span>
                                        <span className="italic">{record.remarks}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white border-b border-white/10 pb-2">Emergency Contact</h2>
                        <div className="space-y-4">
                            <DetailRow icon={<User size={18} />} label="Name" value={profile.emergencyContact?.name} />
                            <DetailRow icon={<Phone size={18} />} label="Phone" value={profile.emergencyContact?.phone} />
                            <div className="text-sm flex py-2 border-b border-white/5 items-center">
                                <span className="w-32 text-slate-400 shrink-0 flex items-center gap-3">
                                    <div className="p-1.5 bg-white/5 rounded-md"><Shield size={18} className="text-slate-400" /></div>Relation
                                </span>
                                <span className="text-slate-200 font-medium">{profile.emergencyContact?.relation}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ icon, text, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300 ${className}`}>
        {icon} {text}
    </span>
);

const DetailRow = ({ icon, label, value }) => (
    <div className="text-sm flex items-start py-2 border-b border-white/5 last:border-0 last:pb-0">
        <span className="w-32 text-slate-400 shrink-0 flex items-center gap-3">
            <div className="p-1.5 bg-white/5 rounded-md">
                {React.cloneElement(icon, { className: 'text-slate-400' })}
            </div>
            {label}
        </span>
        <span className="text-slate-200 font-medium py-1">{value || 'Not provided'}</span>
    </div>
);

const MOCK_PROFILE = {
    studentId: '26070042',
    firstName: 'Alexander',
    lastName: 'Wright',
    dateOfBirth: '2010-05-14T00:00:00.000Z',
    gender: 'Male',
    bloodGroup: 'O+',
    currentClass: '07',
    section: 'A',
    rollNumber: 14,
    guardianName: 'Robert Wright',
    guardianPhone: '+880 1234-567890',
    guardianEmail: 'robert.wright@example.com',
    address: '123 Avenue Road, Downtown, Metropolis City',
    emergencyContact: {
        name: 'Sarah Wright',
        phone: '+880 9876-543210',
        relation: 'Mother'
    },
    status: 'active',
    academicHistory: [
        {
            year: '2025',
            class: '06',
            grade: 'A+',
            remarks: 'Excellent performance in Sciences.'
        },
        {
            year: '2024',
            class: '05',
            grade: 'A',
            remarks: 'Consistent improvement.'
        }
    ]
};

export default StudentProfile;
