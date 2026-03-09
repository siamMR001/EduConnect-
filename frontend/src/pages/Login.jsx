import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ChevronRight, School } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [activeTab, setActiveTab] = useState('student_guardian');

    // Remember me initiation
    const savedEmail = localStorage.getItem('rememberedEmail') || '';
    const [formData, setFormData] = useState({ name: '', email: savedEmail, password: '' });
    const [rememberMe, setRememberMe] = useState(!!savedEmail);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const endpoint = isLoginMode ? 'login' : 'register';
        const payload = isLoginMode
            ? { email: formData.email, password: formData.password, role: activeTab }
            : { ...formData, role: activeTab };

        try {
            const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));

                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', formData.email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                navigate('/dashboard');
            } else {
                setError(data.message || `${isLoginMode ? 'Login' : 'Registration'} failed`);
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col pt-8 px-4">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl mx-auto flex justify-end mb-8 animate-fade-in-down">
                <button
                    onClick={() => navigate('/apply')}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-primary/20 hover:border-primary/50 transition-all shadow-lg flex items-center space-x-2 backdrop-blur-md"
                >
                    <School size={18} />
                    <span>Admission Portal</span>
                </button>
            </div>

            <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center pb-20">
                <div className="text-center mb-8 animate-fade-in-down">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <School size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Edu-Connect
                    </h1>
                    <p className="text-slate-400 mt-2">Welcome to your digital campus</p>
                </div>

                <div className="glass-panel p-8 animate-fade-in-up">
                    {/* Role Tabs */}
                    <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                        {['student_guardian', 'teacher', 'admin'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveTab(role)}
                                className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 capitalize ${activeTab === role
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {role.replace('_', '/')}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLoginMode && (
                            <div className="relative group animate-fade-in-down">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    required={!isLoginMode}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field pl-10"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Password"
                            />
                        </div>

                        {isLoginMode && (
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-white/10 bg-black/20 text-primary focus:ring-primary focus:ring-offset-background"
                                    />
                                    <span className="text-slate-400">Remember me</span>
                                </label>
                                <a href="#" className="text-primary hover:text-primary-light transition-colors">Forgot password?</a>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary flex justify-center items-center space-x-2 group mt-2"
                        >
                            <span>{isLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}</span>
                            {!isLoading && <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                        </button>

                        <div className="text-center mt-4 text-sm text-slate-400">
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLoginMode(!isLoginMode);
                                    setError(null);
                                }}
                                className="text-primary hover:text-primary-light font-medium"
                            >
                                {isLoginMode ? 'Register here' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-sm mt-8">
                    &copy; {new Date().getFullYear()} Edu-Connect. Empowering Education.
                </p>
            </div>
        </div>
    );
};

export default Login;
