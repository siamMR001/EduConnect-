import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Upload, FileText, Image as ImageIcon, Briefcase, User, Mail, Lock, ArrowRight, Phone, Home, Calendar, Users, Heart, Bookmark } from 'lucide-react';
import teacherService from '../services/teacherService';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('account'); // account, details, upload, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1: Account
    employeeId: location.state?.prefillEmployeeId || '',
    email: location.state?.prefillEmail || '',
    password: location.state?.prefillPassword || '',
    confirmPassword: location.state?.prefillPassword || '',
    showPassword: false,
    showConfirmPassword: false,
    
    // Step 2: Details
    phone: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'Male',
    religion: '',
    maritalStatus: 'Single',
    address: '',
    city: '',
    state: ''
  });

  // File objects
  const [files, setFiles] = useState({
    profilePicture: null,
    professionalDocs: null // Consolidated PDF (NID + Degree + CV)
  });

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [fieldName]: e.target.files[0] });
    }
  };

  const fillDemoData = () => {
    setFormData({
      ...formData,
      phone: '01712345678',
      fatherName: 'MD. Abdur Rahman',
      motherName: 'MST. Fatema Begum',
      dateOfBirth: '1992-05-15',
      gender: 'Male',
      religion: 'Islam',
      maritalStatus: 'Married',
      address: 'House 12, Road 5, Block B, Mirpur-12',
      city: 'Dhaka',
      state: 'Dhaka'
    });
  };

  const handleAccountNext = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Employee ID, Email, and Passwords are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Verify ID first
      await teacherService.getEmployeeByEmployeeId(formData.employeeId);
      setStep('details');
    } catch (err) {
      setError(err.message || 'Invalid Employee ID. Please ask your administrator to create your record first.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsNext = (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.fatherName || !formData.motherName || !formData.dateOfBirth || !formData.address) {
      setError('Please fill in all mandatory profile details.');
      return;
    }
    setError('');
    setStep('upload');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      const submissionData = new FormData();
      // Step 1 & 2 Data
      Object.keys(formData).forEach(key => {
        if (!key.startsWith('show')) { // Don't send UI state
           submissionData.append(key, formData[key]);
        }
      });
      
      // Step 3 Files
      if (files.profilePicture) submissionData.append('profilePicture', files.profilePicture);
      if (files.professionalDocs) submissionData.append('professionalDocs', files.professionalDocs);

      const result = await teacherService.registerTeacher(submissionData);

      localStorage.setItem('token', result.user.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setStep('success');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadInput = ({ label, fieldName, icon: Icon, description, accept = ".pdf,.jpg,.jpeg,.png", required = false }) => (
    <div className="mb-4 p-4 border border-white/10 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
      <label className="text-slate-300 text-sm font-medium mb-1 flex justify-between items-center">
        <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-blue-400" /> {label} {required && <span className="text-red-400">*</span>}</span>
        {files[fieldName] && <CheckCircle className="w-4 h-4 text-green-400" />}
      </label>
      {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}
      <input
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e, fieldName)}
        className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 w-full"
        required={required && !files[fieldName]}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center mt-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
            EduConnect
          </h1>
          <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Professional Gatehouse • Teacher Registration</p>
        </div>

        {/* Multi-step indicator */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {['account', 'details', 'upload'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 
                (i < ['account', 'details', 'upload'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500')
              }`}>
                {i < ['account', 'details', 'upload'].indexOf(step) ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 mx-1 ${i < ['account', 'details', 'upload'].indexOf(step) ? 'bg-green-500' : 'bg-slate-800'}`}></div>}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Step 1: Account Definition */}
        {step === 'account' && (
          <form onSubmit={handleAccountNext} className="glass-panel border border-white/10 p-8 rounded-2xl max-w-md mx-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Account Setup</h2>
            <p className="text-slate-400 mb-8 text-sm">Verify your identity and create your space.</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-slate-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Employee ID</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="TCH-2026-0001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                    className="input-field pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="teacher@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-slate-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type={formData.showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {formData.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Confirm</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type={formData.showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-field pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {formData.showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-12 mt-8 flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Verifying...' : 'Next Step'}</span>
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        )}

        {/* Step 2: Personal & Professional Details */}
        {step === 'details' && (
          <form onSubmit={handleDetailsNext} className="glass-panel border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                <div className="text-right flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={fillDemoData}
                        className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-all font-mono"
                    >
                        Fill Demo Data
                    </button>
                    <p className="text-primary font-bold text-sm">{formData.employeeId}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Family */}
                <div className="space-y-4">
                    <h3 className="text-blue-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                        <Users size={16} /> Family Details
                    </h3>
                    <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block">Father's Name</label>
                        <input
                            type="text"
                            value={formData.fatherName}
                            onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                            placeholder="Enter father's name"
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block">Mother's Name</label>
                        <input
                            type="text"
                            value={formData.motherName}
                            onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                            placeholder="Enter mother's name"
                            className="input-field"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Gender</label>
                            <select 
                                value={formData.gender} 
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className="input-field"
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Marital Status</label>
                            <select 
                                value={formData.maritalStatus} 
                                onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                className="input-field"
                            >
                                <option>Single</option>
                                <option>Married</option>
                                <option>Divorced</option>
                                <option>Widowed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Personal & Contact */}
                <div className="space-y-4">
                    <h3 className="text-blue-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                        <Heart size={16} /> Contact & Personal
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block flex items-center gap-1"><Phone size={12}/> Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="11-digit number"
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block flex items-center gap-1"><Calendar size={12}/> Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block flex items-center gap-1"><Bookmark size={12}/> Religion</label>
                        <input
                            type="text"
                            value={formData.religion}
                            onChange={(e) => setFormData({...formData, religion: e.target.value})}
                            placeholder="e.g. Islam, Hindu"
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block flex items-center gap-1"><Home size={12}/> Address / State</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                placeholder="Address"
                                className="input-field"
                                required
                            />
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                placeholder="City"
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
              <button type="button" onClick={() => setStep('account')} className="flex-1 btn-secondary h-12 transition-all hover:bg-white/5 uppercase text-xs font-bold tracking-widest">
                Back
              </button>
              <button type="submit" className="flex-[2] btn-primary h-12 shadow-lg shadow-primary/30 uppercase text-xs font-bold tracking-widest">
                Save & Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Professional Uploads */}
        {step === 'upload' && (
          <form onSubmit={handleRegister} className="glass-panel border border-white/10 p-8 rounded-2xl shadow-2xl max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white">Document Verification</h2>
                <div className="text-right flex items-center gap-3">
                    <p className="text-primary font-bold text-xs tracking-wider border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">{formData.employeeId}</p>
                </div>
            </div>
            
            <p className="text-slate-400 mb-8 text-sm">
              Upload your professional credentials to finalize your registration.
            </p>

            <div className="space-y-6">
                <FileUploadInput 
                    label="Self Photo" 
                    fieldName="profilePicture" 
                    icon={ImageIcon} 
                    description="Professional passport size photo (JPG/PNG)"
                    accept="image/*" 
                    required={false} 
                />
                
                <FileUploadInput 
                    label="Consolidated Professional PDF" 
                    fieldName="professionalDocs" 
                    icon={FileText} 
                    description="Combine NID, Degrees, and CV into a single PDF file."
                    accept=".pdf" 
                    required={false} 
                />
            </div>

            <div className="mt-10 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-8">
                <p className="text-[10px] text-blue-400/80 leading-relaxed text-center uppercase tracking-wider">
                    Certificate of Authenticity Required
                </p>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('details')} className="flex-1 btn-secondary h-12 uppercase text-xs font-bold tracking-widest transition-all">
                Previous
              </button>
              <button type="submit" disabled={loading} className="flex-[2] btn-primary h-12 shadow-xl shadow-primary/40 uppercase text-xs font-bold tracking-widest">
                 {loading ? 'Submitting...' : 'Finish Registration'}
              </button>
            </div>
          </form>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="glass-panel border border-green-500/30 p-10 rounded-2xl max-w-lg mx-auto text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0"></div>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Verified!</h2>
            <p className="text-slate-400 mb-10 leading-relaxed text-sm">
              Profile successfully instantiated. Administrative protocols are currently being processed.
            </p>
            
            <button 
              onClick={() => navigate('/dashboard')} 
              className="w-full btn-primary h-12 uppercase text-xs font-bold tracking-widest"
            >
              Enter Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-slate-600 text-[10px] pb-10 tracking-[0.2em] uppercase">
          <p>© 2026 EduConnect Digital Core</p>
        </div>
      </div>
    </div>
  );
}
