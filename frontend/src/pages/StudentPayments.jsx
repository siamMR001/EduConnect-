import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CreditCard, History, Clock, CheckCircle2, 
    AlertCircle, TrendingUp, ArrowLeft, School, Loader2
} from 'lucide-react';

const StudentPayments = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [form, setForm] = useState({ paymentType: '', month: 'January', year: new Date().getFullYear().toString(), amount: '' });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const feeConfig = {
        'Tuition Fee': 500,
        'Exam Fee': 100,
        'Library Fee': 50,
        'Sports Fee': 50,
        'Transport Fee': 200,
        'Other': 0
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        const amount = feeConfig[type] || '';
        setForm({ ...form, paymentType: type, amount: amount || '' });
    };

    const fetchData = useCallback(async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                navigate('/login');
                return;
            }

            // 1. Fetch Profile to get studentId
            const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/user/${user._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData);

                // 2. Fetch Payments for this student
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

    // Handle Payment Success Verification
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const status = searchParams.get('status');
        if (status === 'success' && sessionId) {
            const verify = async () => {
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
                        fetchData();
                    }
                } catch (err) {
                    console.error("Verification failed:", err);
                }
            };
            verify();
        }
    }, [searchParams, fetchData]);

    const handlePayNow = async (e) => {
        e.preventDefault();
        if (!form.paymentType || !form.amount) return;
        
        setIsPaying(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/student/create-checkout-session`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...form,
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Fees & Payments</h1>
                        <p className="text-slate-400 text-sm">Manage your tuition and school fees</p>
                    </div>
                </div>
                
                {profile && (
                    <div className="hidden md:flex items-center gap-3 bg-black/30 px-4 py-2 rounded-2xl border border-white/10">
                        <School size={20} className="text-primary-light" />
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Student ID</p>
                            <p className="text-sm font-bold text-white">{profile.studentId}</p>
                        </div>
                    </div>
                )}
            </div>

            {searchParams.get('status') === 'success' && (
                <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3 text-green-400 animate-fade-in">
                    <CheckCircle2 size={24} />
                    <div>
                        <p className="font-bold">Payment Successful!</p>
                        <p className="text-sm opacity-80">Your transaction has been processed and updated in your history.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Payment Form */}
                <div className="glass-panel p-8 h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <CreditCard size={20} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white">New Payment</h3>
                    </div>

                    <form onSubmit={handlePayNow} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">Payment Type</label>
                            <select 
                                required
                                className="input-field py-3 bg-slate-900"
                                value={form.paymentType}
                                onChange={handleTypeChange}
                            >
                                <option value="">Select Type</option>
                                {Object.keys(feeConfig).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">Month</label>
                                <select 
                                    className="input-field py-3 bg-slate-900"
                                    value={form.month}
                                    onChange={e => setForm({...form, month: e.target.value})}
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">Year</label>
                                <input 
                                    required
                                    className="input-field py-3"
                                    value={form.year}
                                    onChange={e => setForm({...form, year: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">Amount ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <input 
                                    type="number"
                                    required
                                    readOnly={form.paymentType && form.paymentType !== 'Other'}
                                    placeholder="0.00"
                                    className={`input-field py-3 pl-8 ${form.paymentType && form.paymentType !== 'Other' ? 'bg-white/5 text-slate-400 cursor-not-allowed' : ''}`}
                                    value={form.amount}
                                    onChange={e => setForm({...form, amount: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={isPaying}
                            className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isPaying ? <LoaderIcon className="animate-spin" size={20} /> : <CreditCard size={20} />}
                            <span className="font-bold text-lg">{isPaying ? 'Processing...' : 'Pay Now'}</span>
                        </button>
                    </form>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <History size={20} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Payment History</h3>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                            <TrendingUp size={18} className="text-green-400" />
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Paid</p>
                                <p className="text-lg font-black text-white">
                                    ${payments.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] bg-white/5">
                                <tr>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Billing Period</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <History size={48} />
                                                <p className="text-lg font-medium italic">No transactions found yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-all group">
                                            <td className="px-6 py-5 font-bold text-white">{p.paymentType}</td>
                                            <td className="px-6 py-5 text-slate-400">{p.month} {p.year}</td>
                                            <td className="px-6 py-5">
                                                <span className="text-lg font-black text-white group-hover:text-primary-light transition-colors">
                                                    ${p.amount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${p.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right text-xs text-slate-500 font-medium">
                                                {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Pending'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoaderIcon = ({ className, size }) => (
    <div className={`w-${size} h-${size} rounded-full border-2 border-white/20 border-t-white animate-spin ${className}`}></div>
);

export default StudentPayments;
