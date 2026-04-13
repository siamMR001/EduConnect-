import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import teacherService from '../services/teacherService';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('identify'); // identify, verify, register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    registrationCode: '',
    password: '',
    confirmPassword: '',
  });

  const [employeeInfo, setEmployeeInfo] = useState(null);

  const handleIdentifyEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const data = await teacherService.getEmployeeByEmployeeId(formData.employeeId);
      setEmployeeInfo(data.employee);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Employee ID not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const result = await teacherService.verifyRegistrationCode(
        formData.employeeId,
        formData.registrationCode
      );
      if (result.valid) {
        setSuccess('Registration code verified! Please create your password.');
        setStep('register');
        setSuccess('');
      } else {
        setError('Invalid registration code');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify registration code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const result = await teacherService.registerTeacher({
        employeeId: formData.employeeId,
        registrationCode: formData.registrationCode,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
            EduConnect
          </h1>
          <p className="text-slate-400">Teacher Registration Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Step 1: Identify Employee */}
        {step === 'identify' && (
          <form onSubmit={handleIdentifyEmployee} className="glass-panel border border-white/10 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Step 1: Find Your Employee ID</h2>
            <p className="text-slate-400 mb-4 text-sm">
              Enter your Employee ID (e.g., TCH-2026-0001) provided by the administrator.
            </p>
            <input
              type="text"
              placeholder="Employee ID (e.g., TCH-2026-0001)"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
              className="input-field mb-6"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="glass-panel border border-white/10 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Step 2: Verify Registration Code</h2>
            
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold text-white">{employeeInfo?.firstName} {employeeInfo?.lastName}</span>
              </p>
              <p className="text-slate-400 text-sm">{employeeInfo?.email}</p>
            </div>

            <p className="text-slate-400 mb-4 text-sm">
              Enter the 12-character registration code provided by the administrator.
            </p>
            
            <input
              type="text"
              placeholder="Registration Code (12 characters)"
              value={formData.registrationCode}
              onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value.toUpperCase() })}
              className="input-field mb-4"
              maxLength="12"
              required
            />

            <p className="text-slate-500 text-xs mb-6">
              Code expires 30 days from generation. Contact admin if expired.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('identify')}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Register */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="glass-panel border border-white/10 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Step 3: Create Your Account</h2>

            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-medium">Email verified</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 mb-4"
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>

            <p className="text-slate-400 text-xs text-center">
              Already registered? <a href="/login" className="text-blue-400 hover:text-blue-300">Login here</a>
            </p>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>EduConnect © 2026</p>
        </div>
      </div>
    </div>
  );
}
