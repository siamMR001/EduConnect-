import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CreditCard, History, Clock, CheckCircle2, 
    AlertCircle, TrendingUp, ArrowLeft, School, Loader2,
    ChevronDown, ChevronUp, DollarSign, Calendar
} from 'lucide-react';

const StudentPayments = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                navigate('/login');
                return;
            }

            // 1. Fetch Profile
            const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/user/${user._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData);

                // 2. Fetch Payments
                const paymentsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/student/${profileData.studentId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (paymentsRes.ok) {
                    const paymentsData = await paymentsRes.json();
                    setPayments(paymentsData);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Stripe Success Verification
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const status = searchParams.get('status');
        if (status === 'success' && sessionId) {
            const verify = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/student/verify-payment`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ sessionId })
                    });
                    if (res.ok) {
                        setSuccessMessage(true);
                        fetchData();
                        // Remove query params
                        window.history.replaceState({}, document.title, window.location.pathname);
                        setTimeout(() => setSuccessMessage(false), 5000);
                    }
                } catch (err) {
                    console.error("Verification failed:", err);
                } finally {
                    setLoading(false);
                }
            };
            verify();
        }
    }, [searchParams, fetchData]);

    const handlePayNow = async (payment) => {
        setIsPaying(payment._id);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/student/create-checkout-session`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    paymentType: payment.paymentType,
                    month: payment.month,
                    year: payment.year,
                    amount: payment.amount,
                    studentId: profile.studentId,
                    email: profile.guardianEmail || profile.fatherEmail
                })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.message || "Failed to initialize payment");
            }
        } catch (err) {
            console.error("Payment error:", err);
            alert("Network error. Please try again.");
        } finally {
            setIsPaying(false);
        }
    };

    const duePayments = payments.filter(p => p.status === 'Due');
    const paidPayments = payments.filter(p => p.status === 'Paid');

    if (loading && !payments.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Synchronizing financial records...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Fees & Payments</h1>
                        <p className="text-slate-400 font-medium">Automatic billing and secure payment portal</p>
                    </div>
                </div>
                
                {profile && (
                    <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl px-6 py-3 rounded-3xl border border-white/5 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                            <School size={24} className="text-primary-light" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Enrollment ID</p>
                            <p className="text-lg font-black text-white tracking-tight">{profile.studentId}</p>
                        </div>
                    </div>
                )}
            </div>

            {successMessage && (
                <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4 text-emerald-400 animate-bounce-in shadow-lg shadow-emerald-500/10">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p className="text-lg font-black tracking-tight">Payment Successful!</p>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Your records have been updated automatically via Stripe Secure.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Due Payments List (Left) */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest">
                            <Clock className="text-amber-400" size={20} />
                            Outstanding Dues
                        </h3>
                        <span className="px-4 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-full border border-amber-500/20 uppercase">
                            {duePayments.length} Pending
                        </span>
                    </div>

                    <div className="space-y-4">
                        {duePayments.length === 0 ? (
                            <div className="glass-panel p-16 text-center border-dashed border-2 border-white/5">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} className="text-emerald-400" />
                                </div>
                                <h4 className="text-2xl font-black text-white mb-2 tracking-tight">All Clear!</h4>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">You have no outstanding payments. Great job staying up to date!</p>
                            </div>
                        ) : (
                            duePayments.map((p) => (
                                <div 
                                    key={p._id}
                                    className={`glass-panel overflow-hidden transition-all duration-500 border-white/5 group ${expandedId === p._id ? 'ring-2 ring-primary/50 bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div 
                                        onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
                                        className="p-6 flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <DollarSign size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-white tracking-tight">{p.paymentType}</h4>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{p.month} {p.year}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 text-right">
                                            <div className="hidden sm:block">
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Due Amount</p>
                                                <p className="text-xl font-black text-emerald-400 font-mono">৳{p.amount}</p>
                                            </div>
                                            {expandedId === p._id ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                                        </div>
                                    </div>

                                    {expandedId === p._id && (
                                        <div className="p-8 bg-black/40 border-t border-white/5 animate-slide-down">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar size={16} className="text-slate-500" />
                                                        <span className="text-xs text-slate-400 font-bold uppercase">Billing Period:</span>
                                                        <span className="text-sm text-white font-black">{p.month} {p.year}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard size={16} className="text-slate-500" />
                                                        <span className="text-xs text-slate-400 font-bold uppercase">Category:</span>
                                                        <span className="text-sm text-white font-black">{p.paymentType}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-center">
                                                    <p className="text-3xl font-black text-white mb-2 font-mono">৳{p.amount}</p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Fixed Institutional Rate</p>
                                                </div>
                                            </div>

                                            <button 
                                                disabled={isPaying === p._id}
                                                onClick={() => handlePayNow(p)}
                                                className="w-full btn-primary py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                            >
                                                {isPaying === p._id ? (
                                                    <Loader2 className="animate-spin" size={24} />
                                                ) : (
                                                    <CreditCard size={24} className="group-hover:rotate-12 transition-transform" />
                                                )}
                                                <span className="text-xl font-black uppercase tracking-widest">
                                                    {isPaying === p._id ? 'Redirecting to Stripe...' : 'Pay Securely Now'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Summary & History */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Summary Card */}
                    <div className="glass-panel p-8 bg-gradient-to-br from-primary/10 to-indigo-500/10 border-primary/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Financial Summary</h3>
                                <TrendingUp className="text-emerald-400" size={20} />
                            </div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-1">Total Paid to Date</p>
                            <p className="text-5xl font-black text-white tracking-tighter font-mono">
                                ৳{payments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    </div>

                    {/* Compact History Table */}
                    <div className="glass-panel overflow-hidden border-white/5">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <History size={16} className="text-primary" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {payments.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 italic text-sm font-medium">No transaction history.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-white/5">
                                        {[...payments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((p, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] font-black text-white group-hover:text-primary transition-colors">{p.paymentType}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{p.month} {p.year}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-xs text-slate-300">
                                                    ৳{p.amount}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${p.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPayments;
