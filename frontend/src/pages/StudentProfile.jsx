import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Droplet, Calendar,
    BookOpen, Award, ArrowLeft, Shield, Briefcase, FileText, Download
} from 'lucide-react';
import StudentRoutine from '../components/StudentRoutine';

const StudentProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [fileUploads, setFileUploads] = useState({ studentPhoto: null, previousResultSheet: null, documentsPdf: [] });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'routine'
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const url = id 
                    ? `${import.meta.env.VITE_API_URL}/api/students/${id}`
                    : `${import.meta.env.VITE_API_URL}/api/students/user/${user._id}`;
                
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setFormData(data);
                } else {
                    console.error("Failed to fetch profile");
                }
            } catch (error) {
                console.error("Network error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate, id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const form = new FormData();
            
            Object.keys(formData).forEach(key => {
                if (['studentPhoto', 'previousResultSheet', 'documentsPdf', 'doctorSignature', 'fatherPhoto', 'motherPhoto', 'guardianPhoto', 'user', '_id', '__v', 'createdAt'].includes(key)) return;

                
                if (typeof formData[key] === 'object' && formData[key] !== null) {
                    form.append(key, JSON.stringify(formData[key]));
                } else if (formData[key] !== undefined && formData[key] !== null) {
                    form.append(key, formData[key]);
                }
            });

            if (fileUploads.studentPhoto) form.append('studentPhoto', fileUploads.studentPhoto);
            if (fileUploads.previousResultSheet) form.append('previousResultSheet', fileUploads.previousResultSheet);
            if (fileUploads.documentsPdf && fileUploads.documentsPdf.length > 0) {
                Array.from(fileUploads.documentsPdf).forEach(file => form.append('documentsPdf', file));
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${profile._id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                },
                body: form
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setIsEditing(false);
                setFileUploads({ studentPhoto: null, previousResultSheet: null, documentsPdf: [] });
            } else {
                console.error("Save failed");
            }
        } catch(err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

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
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                
                {isAdmin && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-primary px-5 py-2 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
                        <User size={16} /> Edit Profile
                    </button>
                )}
                {isAdmin && isEditing && (
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setIsEditing(false); setFormData(profile); setFileUploads({ studentPhoto: null, previousResultSheet: null, documentsPdf: [] }); }} className="px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors glass-panel rounded-xl">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 text-white px-5 py-2 text-sm rounded-xl transition-colors flex items-center gap-2">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FileText size={16} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Header Profile Section */}
            <div className="glass-panel p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-dark to-primary flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0 border-4 border-background overflow-hidden relative group">
                        {profile.studentPhoto ? (
                            <img src={`${import.meta.env.VITE_API_URL}${profile.studentPhoto}`} alt="Student" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <User size={64} className="text-white" />
                        )}
                        {isEditing && (
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <span className="text-white text-xs font-bold text-center px-2">{fileUploads.studentPhoto ? 'Photo Added!' : 'Change Photo'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={e => setFileUploads({...fileUploads, studentPhoto: e.target.files[0]})} />
                            </label>
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between xl:gap-4 gap-2 mb-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <input value={formData?.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xl font-bold max-w-[150px] focus:outline-none focus:border-primary" />
                                    <input value={formData?.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xl font-bold max-w-[150px] focus:outline-none focus:border-primary" />
                                </div>
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{profile.firstName} {profile.lastName}</h1>
                            )}
                            <div className="flex items-center justify-center gap-2 bg-black/30 px-4 py-1.5 rounded-full border border-white/10 w-fit mx-auto md:mx-0">
                                <Shield size={16} className="text-primary-light" />
                                <span className="text-sm font-medium text-slate-200">ID: {profile.studentId}</span>
                            </div>
                        </div>

                        <p className="text-lg text-primary-light font-medium mb-4">
                            {isEditing ? (
                                <div className="flex items-center gap-2 mb-2">
                                    Class <input value={formData?.currentClass || ''} onChange={e => setFormData({...formData, currentClass: e.target.value})} className="bg-black/40 border border-white/10 rounded px-2 w-16 focus:border-primary outline-none" />
                                    Section <input value={formData?.section || ''} onChange={e => setFormData({...formData, section: e.target.value})} className="bg-black/40 border border-white/10 rounded px-2 w-16 focus:border-primary outline-none" />
                                    Roll <input value={formData?.rollNumber || ''} onChange={e => setFormData({...formData, rollNumber: e.target.value})} className="bg-black/40 border border-white/10 rounded px-2 w-16 focus:border-primary outline-none" />
                                </div>
                            ) : (
                                `Class ${profile.currentClass} • Section ${profile.section} • Roll ${profile.rollNumber}`
                            )}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            {isEditing ? (
                                <>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                                        <Droplet size={14} className="text-slate-300"/> 
                                        <input value={formData?.bloodGroup || ''} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="bg-transparent outline-none w-16 text-slate-300 text-xs" placeholder="Blood" />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                                        <BookOpen size={14} className="text-slate-300"/>
                                        <select value={formData?.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value})} className="bg-transparent outline-none w-20 text-slate-300 text-xs">
                                            <option value="active" className="bg-slate-900">Active</option>
                                            <option value="inactive" className="bg-slate-900">Inactive</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Badge icon={<Droplet size={14} />} text={`Blood: ${profile.bloodGroup}`} />
                                    <Badge icon={<Calendar size={14} />} text={`DOB: ${new Date(profile.dateOfBirth).toLocaleDateString()}`} />
                                    <Badge icon={<BookOpen size={14} />} text={`Status: ${profile.status}`} className="capitalize" />
                                </>
                            )}
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
                    <StudentRoutine overriddenUserId={profile.user} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
                    {/* Contact Information */}
                    <div className="space-y-6">

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2">Family Information</h2>
                        <div className="space-y-6">
                            {(profile.fatherName || profile.motherName) ? (
                                <>
                                    <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                        <h3 className="text-primary-light font-medium flex items-center gap-2"><User size={16}/> Father's Details</h3>
                                        <DetailRow icon={<User size={16} />} label="Name" value={profile.fatherName} isEditing={isEditing} editValue={formData?.fatherName} onChange={(val) => setFormData({...formData, fatherName: val})} />
                                        <DetailRow icon={<Phone size={16} />} label="Phone" value={profile.fatherPhone} isEditing={isEditing} editValue={formData?.fatherPhone} onChange={(val) => setFormData({...formData, fatherPhone: val})} />
                                        <DetailRow icon={<Briefcase size={16} />} label="Occupation" value={profile.fatherOccupation} isEditing={isEditing} editValue={formData?.fatherOccupation} onChange={(val) => setFormData({...formData, fatherOccupation: val})} />
                                    </div>
                                    <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                        <h3 className="text-pink-400 font-medium flex items-center gap-2"><User size={16}/> Mother's Details</h3>
                                        <DetailRow icon={<User size={16} />} label="Name" value={profile.motherName} isEditing={isEditing} editValue={formData?.motherName} onChange={(val) => setFormData({...formData, motherName: val})} />
                                        <DetailRow icon={<Phone size={16} />} label="Phone" value={profile.motherPhone} isEditing={isEditing} editValue={formData?.motherPhone} onChange={(val) => setFormData({...formData, motherPhone: val})} />
                                        <DetailRow icon={<Briefcase size={16} />} label="Occupation" value={profile.motherOccupation} isEditing={isEditing} editValue={formData?.motherOccupation} onChange={(val) => setFormData({...formData, motherOccupation: val})} />
                                    </div>
                                </>
                            ) : null}

                            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                <h3 className="text-yellow-400 font-medium flex items-center gap-2"><Shield size={16}/> Official Guardian</h3>
                                <DetailRow icon={<User size={16} />} label="Name" value={profile.guardianName} isEditing={isEditing} editValue={formData?.guardianName} onChange={(val) => setFormData({...formData, guardianName: val})} />
                                <DetailRow icon={<Phone size={16} />} label="Phone" value={profile.guardianPhone} isEditing={isEditing} editValue={formData?.guardianPhone} onChange={(val) => setFormData({...formData, guardianPhone: val})} />
                                <DetailRow icon={<Mail size={16} />} label="Email" value={profile.guardianEmail || 'N/A'} isEditing={isEditing} editValue={formData?.guardianEmail} onChange={(val) => setFormData({...formData, guardianEmail: val})} />
                                <DetailRow icon={<Briefcase size={16} />} label="Relation" value={profile.guardianRelation} isEditing={isEditing} editValue={formData?.guardianRelation} onChange={(val) => setFormData({...formData, guardianRelation: val})} />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2">Location & Addresses</h2>
                        <div className="space-y-4">
                            {profile.presentAddress && typeof profile.presentAddress === 'object' ? (
                                <div className="space-y-2">
                                    <h4 className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Present Address</h4>
                                    <DetailRow icon={<MapPin size={18} />} label="Details" value={`${profile.presentAddress.details || ''}, ${profile.presentAddress.thana || ''}, ${profile.presentAddress.district || ''}`} isEditing={isEditing} editValue={formData?.presentAddress?.details} onChange={(val) => setFormData({...formData, presentAddress: {...formData?.presentAddress, details: val}})} />
                                </div>
                            ) : (
                                <DetailRow icon={<MapPin size={18} />} label="Address" value={profile.address} isEditing={isEditing} editValue={formData?.address} onChange={(val) => setFormData({...formData, address: val})} />
                            )}
                            {profile.permanentAddress && typeof profile.permanentAddress === 'object' && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                                    <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Permanent Address</h4>
                                    <DetailRow icon={<MapPin size={18} />} label="Details" value={`${profile.permanentAddress.details || ''}, ${profile.permanentAddress.thana || ''}, ${profile.permanentAddress.district || ''}`} isEditing={isEditing} editValue={formData?.permanentAddress?.details} onChange={(val) => setFormData({...formData, permanentAddress: {...formData?.permanentAddress, details: val}})} />
                                </div>
                            )}
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
                            {(!profile.academicHistory || profile.academicHistory.length === 0) ? (
                                <div className="text-slate-400 italic text-sm p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                    No academic records available for this student yet.
                                </div>
                            ) : (
                                profile.academicHistory.map((record, index) => (
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
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>Uploaded Documents</span>
                            <Download size={20} className="text-blue-400" />
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {isEditing ? (
                                <>
                                    <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/10 text-center">
                                        <label className="cursor-pointer">
                                            <FileText size={24} className="text-blue-400 mb-2 mx-auto" />
                                            <span className="text-xs font-medium text-slate-300 block mb-2 cursor-pointer">Replace Result Sheet</span>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => setFileUploads({...fileUploads, previousResultSheet: e.target.files[0]})} />
                                            {fileUploads.previousResultSheet && <span className="text-[10px] text-green-400 block truncate w-full px-2">{fileUploads.previousResultSheet.name}</span>}
                                        </label>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/10 text-center col-span-2">
                                        <label className="cursor-pointer w-full">
                                            <Download size={24} className="text-pink-400 mb-2 mx-auto" />
                                            <span className="text-xs font-medium text-slate-300 block mb-2 cursor-pointer">Replace All Docs (Select Multiple)</span>
                                            <input type="file" multiple className="hidden" accept=".pdf,image/*" onChange={e => setFileUploads({...fileUploads, documentsPdf: e.target.files})} />
                                            {fileUploads.documentsPdf?.length > 0 && <span className="text-[10px] text-green-400 block truncate w-full px-2">{fileUploads.documentsPdf.length} files selected</span>}
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {profile.previousResultSheet && (
                                        <a href={`${import.meta.env.VITE_API_URL}${profile.previousResultSheet}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                                            <FileText size={24} className="text-blue-400 mb-2" />
                                            <span className="text-xs font-medium text-slate-300 text-center mt-2">Previous Result</span>
                                        </a>
                                    )}
                                    {profile.documentsPdf && profile.documentsPdf.map((doc, idx) => (
                                        <a key={idx} href={`${import.meta.env.VITE_API_URL}${doc}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                                            <FileText size={24} className="text-pink-400 mb-2" />
                                            <span className="text-xs font-medium text-slate-300 text-center mt-2">Document {idx + 1}</span>
                                        </a>
                                    ))}
                                    {(!profile.previousResultSheet && (!profile.documentsPdf || profile.documentsPdf.length === 0)) && (
                                        <div className="col-span-full text-slate-400 italic text-sm p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                            No documents attached.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

const Badge = ({ icon, text, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300 ${className}`}>
        {icon} {text}
    </span>
);

const DetailRow = ({ icon, label, value, isEditing, editValue, onChange, type = "text" }) => (
    <div className="text-sm flex items-start py-2 border-b border-white/5 last:border-0 last:pb-0">
        <span className="w-32 text-slate-400 shrink-0 flex items-center gap-3 mt-1">
            <div className="p-1.5 bg-white/5 rounded-md">
                {React.cloneElement(icon, { className: 'text-slate-400' })}
            </div>
            {label}
        </span>
        <span className="text-slate-200 font-medium py-1 flex-1">
            {isEditing ? (
                <input 
                    type={type} 
                    value={editValue || ''} 
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
            ) : (
                value || 'Not provided'
            )}
        </span>
    </div>
);

export default StudentProfile;
