import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronRight, CheckCircle, School, AlertCircle, Upload, CreditCard, Lock, Loader2 } from 'lucide-react';

// Helper for rendering inputs
const Input = ({ label, name, type = "text", req = false, isFile = false, multi = false, acc, formData, handleChange, handleFileChange, fileValue }) => {
    // Helper to generate preview URL for an image file
    const getPreviewUrl = (file) => {
        if (file && file.type && file.type.startsWith('image/')) {
            try {
                return URL.createObjectURL(file);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            {isFile ? (
                <div className="relative group">
                    <input type="file" name={name} onChange={handleFileChange} multiple={multi} accept={acc}
                        className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                    {!multi && fileValue && getPreviewUrl(fileValue) && (
                        <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 group-hover:border-primary/40 transition-colors">
                            <img src={getPreviewUrl(fileValue)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {!multi && fileValue && !getPreviewUrl(fileValue) && (
                        <p className="mt-2 text-xs text-green-400 font-medium">✓ File selected: {fileValue.name}</p>
                    )}
                    {multi && fileValue && fileValue.length > 0 && (
                        <p className="mt-2 text-xs text-green-400 font-medium">✓ {fileValue.length} file(s) selected</p>
                    )}
                </div>
            ) : (
                <input type={type} name={name} value={name.includes('.') ? formData[name.split('.')[0]][name.split('.')[1]] : formData[name]} onChange={handleChange} className={`input-field ${type === 'date' ? '[color-scheme:dark]' : ''}`} />
            )}
        </div>
    );
};

const AdmissionForm = () => {
    const navigate = useNavigate();

    // Text Data State
    const [formData, setFormData] = useState({
        // Student Info
        firstName: 'Test', lastName: 'Student', dateOfBirth: '2010-01-01', gender: 'Male', applyingForClass: '07',
        religion: 'Islam', bloodGroup: 'O+', identificationMarks: 'None', medicalRecords: 'None',

        // Parents Info
        fatherName: 'Test Father', fatherPhone: '01234567890', fatherEmail: 'father@test.com', fatherOccupation: 'Business',
        motherName: 'Test Mother', motherPhone: '01987654321', motherEmail: 'mother@test.com', motherOccupation: 'Housewife',

        // Guardian Info
        guardianName: 'Test Guardian', guardianPhone: '01112223334', guardianRelation: 'Uncle', guardianOccupation: 'Teacher', guardianEmail: 'guardian@test.com',

        // Address Info
        presentAddress: { district: 'Dhaka', division: 'Dhaka', thana: 'Mirpur', postOffice: 'Mirpur-10', details: 'House 1, Road 2' },
        permanentAddress: { district: 'Comilla', division: 'Chittagong', thana: 'Sadar', postOffice: 'Sadar', details: 'Village Home' },

        // Academic Info
        previousSchool: 'Test School'
    });

    // File Data State
    const [files, setFiles] = useState({
        studentPhoto: null, fatherPhoto: null, motherPhoto: null, guardianPhoto: null,
        previousResultSheet: null, documentsPdf: null
    });

    const [guardianIs, setGuardianIs] = useState('other');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [error, setError] = useState(null);
    const [admissionFee, setAdmissionFee] = useState(500);
    const [isGeneratingId, setIsGeneratingId] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (data && data.admissionFee) {
                    setAdmissionFee(data.admissionFee);
                }
            })
            .catch(console.error);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (name === 'documentsPdf') {
            setFiles(prev => ({ ...prev, [name]: selectedFiles }));
        } else {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
        }
    };

    const handleProceedToPayment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setIsGeneratingId(true);

        try {
            // 1. Fetch preview ID from backend
            const idRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admissions/generate-id?classCode=${formData.applyingForClass}`);
            const idData = await idRes.json();
            
            if (!idRes.ok || !idData.studentId) {
                throw new Error('Failed to generate preview Student ID');
            }

            const currentStudentId = idData.studentId;

            // 2. Prepare Form Data for submission
            let submitData = { ...formData, studentId: currentStudentId };
            let submitFiles = { ...files };

            if (guardianIs === 'father') {
                submitData.guardianName = submitData.fatherName;
                submitData.guardianPhone = submitData.fatherPhone;
                submitData.guardianEmail = submitData.fatherEmail;
                submitData.guardianRelation = 'Father';
                submitData.guardianOccupation = submitData.fatherOccupation;
                submitFiles.guardianPhoto = submitFiles.fatherPhoto;
            } else if (guardianIs === 'mother') {
                submitData.guardianName = submitData.motherName;
                submitData.guardianPhone = submitData.motherPhone;
                submitData.guardianEmail = submitData.motherEmail;
                submitData.guardianRelation = 'Mother';
                submitData.guardianOccupation = submitData.motherOccupation;
                submitFiles.guardianPhoto = submitFiles.motherPhoto;
            }

            const submissionData = new FormData();
            Object.keys(submitData).forEach(key => {
                if (key === 'presentAddress' || key === 'permanentAddress') {
                    submissionData.append(key, JSON.stringify(submitData[key]));
                } else {
                    submissionData.append(key, submitData[key] || '');
                }
            });

            submissionData.append('paymentMethod', 'stripe_checkout');
            submissionData.append('amount', admissionFee);
            submissionData.append('paymentStatus', 'pending');

            Object.keys(submitFiles).forEach(key => {
                if (submitFiles[key]) {
                    if (key === 'documentsPdf') {
                        Array.from(submitFiles[key]).forEach(file => {
                            submissionData.append(key, file);
                        });
                    } else {
                        submissionData.append(key, submitFiles[key]);
                    }
                }
            });

            // 3. Submit to backend to create record
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admissions`, {
                method: 'POST',
                body: submissionData
            });
            const data = await response.json();

            if (response.ok) {
                // 4. Create Stripe Checkout Session
                const paymentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: data.studentId,
                        email: data.email,
                        amount: admissionFee * 100 // Convert to cents
                    })
                });
                const paymentData = await paymentRes.json();

                if (paymentRes.ok && paymentData.url) {
                    // 5. Redirect to Stripe Checkout
                    window.location.href = paymentData.url;
                } else {
                    setError(paymentData.message || 'Failed to initialize payment gateway');
                }
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
            setIsGeneratingId(false);
        }
    };

    if (successData) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-12 animate-fade-in-up">
                <div className="glass-panel p-10 text-center space-y-6">
                    <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                        <CheckCircle size={48} className="text-green-400" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight">Application Submitted!</h2>
                    <p className="text-slate-300 text-lg">Thank you for applying to Edu-Connect.</p>
                    <div className="bg-black/30 p-6 rounded-xl inline-block border border-white/5">
                        <p className="text-slate-400 mb-2">Your Application/Student ID</p>
                        <p className="text-3xl font-bold tracking-widest text-primary-light">{successData.studentId}</p>
                    </div>
                    <p className="text-sm text-slate-500 mt-4 max-w-md mx-auto leading-relaxed">
                        Please save this ID. We have sent a confirmation email to the guardian's address.
                    </p>
                    <button onClick={() => navigate('/login')} className="btn-primary mt-8 py-3 px-8 text-lg">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-10 animate-fade-in-down">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-light to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                    <School size={32} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Student Admission Portal
                </h1>
                <p className="text-slate-400 mt-3 text-lg">Comprehensive Application Form for 2026/2027</p>
            </div>
            <div className="glass-panel p-8 md:p-12 animate-fade-in-up">
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-center font-medium flex items-center justify-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleProceedToPayment} className="space-y-12">
                        {/* Section 1: Student Details */}
                        <div>
                            <h3 className="text-xl font-semibold border-b border-white/10 pb-2 mb-6 text-white text-primary-light">1. Student Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="First Name" name="firstName" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Last Name" name="lastName" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Date of Birth" name="dateOfBirth" type="date" req />

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Gender *</label>
                                    <select name="gender" className="input-field [&>option]:bg-background-paper" value={formData.gender} onChange={handleChange}>
                                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Applying For Class *</label>
                                    <select name="applyingForClass" className="input-field [&>option]:bg-background-paper" value={formData.applyingForClass} onChange={handleChange}>
                                        {[...Array(12).keys()].map(i => {
                                            const c = (i + 1).toString().padStart(2, '0');
                                            return <option key={c} value={c}>Class {c}</option>
                                        })}
                                    </select>
                                </div>
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Religion" name="religion" />
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Blood Group</label>
                                    <select name="bloodGroup" className="input-field [&>option]:bg-background-paper" value={formData.bloodGroup} onChange={handleChange}>
                                        <option value="">Select Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Identification Marks" name="identificationMarks" />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} fileValue={files.studentPhoto} label="Student Photo" name="studentPhoto" isFile acc="image/*" />
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Any Medical Records</label>
                                    <textarea name="medicalRecords" rows="2" className="input-field resize-none" value={formData.medicalRecords} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Parents & Guardian */}
                        <div>
                            <h3 className="text-xl font-semibold border-b border-white/10 pb-2 mb-6 text-white text-primary-light">2. Parents & Guardian</h3>

                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Father's Details</h4>
                                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer pt-1 hover:text-white transition-colors">
                                    <input type="checkbox" checked={guardianIs === 'father'} onChange={() => setGuardianIs(guardianIs === 'father' ? 'other' : 'father')} className="rounded border-white/10 bg-black/20 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                    <span className="font-medium">Mark as Guardian</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Father's Name" name="fatherName" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Phone Number" name="fatherPhone" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Email Address" name="fatherEmail" type="email" />
                                <div className="md:col-span-1">
                                    <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Occupation" name="fatherOccupation" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} fileValue={files.fatherPhoto} label="Father's Photo" name="fatherPhoto" isFile acc="image/*" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Mother's Details</h4>
                                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer pt-1 hover:text-white transition-colors">
                                    <input type="checkbox" checked={guardianIs === 'mother'} onChange={() => setGuardianIs(guardianIs === 'mother' ? 'other' : 'mother')} className="rounded border-white/10 bg-black/20 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                    <span className="font-medium">Mark as Guardian</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Mother's Name" name="motherName" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Phone Number" name="motherPhone" req />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Email Address" name="motherEmail" type="email" />
                                <div className="md:col-span-1">
                                    <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Occupation" name="motherOccupation" />
                                </div>
                                <div className="md:col-span-2">
                                    <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} fileValue={files.motherPhoto} label="Mother's Photo" name="motherPhoto" isFile acc="image/*" />
                                </div>
                            </div>

                            {guardianIs === 'other' && (
                                <>
                                    <h4 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Guardian Details (If different)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Guardian Name" name="guardianName" req />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Phone Number" name="guardianPhone" req />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Email Address" name="guardianEmail" type="email" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Relation" name="guardianRelation" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Occupation" name="guardianOccupation" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} fileValue={files.guardianPhoto} label="Guardian's Photo" name="guardianPhoto" isFile acc="image/*" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Section 3: Address */}
                        <div>
                            <h3 className="text-xl font-semibold border-b border-white/10 pb-2 mb-6 text-white text-primary-light">3. Address Information</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Present Address</h4>
                                    <div className="space-y-4">
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Division" name="presentAddress.division" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="District" name="presentAddress.district" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Thana/Upazila" name="presentAddress.thana" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Post Office" name="presentAddress.postOffice" />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Detailed Address</label>
                                            <textarea name="presentAddress.details" rows="2" className="input-field resize-none" value={formData.presentAddress.details} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Permanent Address</h4>
                                    <div className="space-y-4">
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Division" name="permanentAddress.division" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="District" name="permanentAddress.district" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Thana/Upazila" name="permanentAddress.thana" />
                                        <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Post Office" name="permanentAddress.postOffice" />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Detailed Address</label>
                                            <textarea name="permanentAddress.details" rows="2" className="input-field resize-none" value={formData.permanentAddress.details} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Academic & Documents */}
                        <div>
                            <h3 className="text-xl font-semibold border-b border-white/10 pb-2 mb-6 text-white text-primary-light">4. Academic & Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Previous School Name" name="previousSchool" />
                                <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Previous Result Sheet" name="previousResultSheet" isFile acc=".pdf,image/*" />
                                <div className="md:col-span-2 p-6 rounded-xl bg-primary/10 border border-primary/20">
                                    <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2"><Upload size={16} /> Upload All Accompanying Documents</h4>
                                    <p className="text-xs text-slate-400 mb-4">Please upload Student's Birth Certificate, Father/Mother's NID, and Guardian's NID merged or as individual PDFs (Max 10 files).</p>
                                    <Input formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} label="Select PDF Files" name="documentsPdf" isFile multi acc=".pdf" />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6 border-t border-white/5 flex justify-between items-center gap-4">
                            <button type="button" onClick={() => navigate('/login')} className="btn-secondary whitespace-nowrap">Back to Login</button>
                            <button type="submit" disabled={isSubmitting || isGeneratingId} className="btn-primary py-3 px-12 flex items-center gap-3 group w-full md:w-auto justify-center min-w-[240px]">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay & Register
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

        </div>
    );
};

export default AdmissionForm;
