import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, Clock, Search, 
    Smartphone, Landmark, Eye, ExternalLink, 
    AlertCircle, Loader2, Filter, RefreshCcw
} from 'lucide-react';

const AdminPayments = () => {
    const [pendingPayments, setPendingPayments] = useState({ admissions: [], profiles: [] });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/pending`);
            const data = await res.json();
            if (res.ok) {
                setPendingPayments(data);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, type, status) => {
        setProcessingId(id);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type, status })
            });
            if (res.ok) {
                fetchPendingPayments();
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const allPayments = [
        ...pendingPayments.admissions.map(p => ({ ...p, type: 'admission' })),
        ...pendingPayments.profiles.map(p => ({ ...p, type: 'registration' }))
    ];

    const filteredPayments = allPayments.filter(p => {
        const matchesSearch = 
            p.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === 'admission') return matchesSearch && p.type === 'admission';
        if (activeTab === 'registration') return matchesSearch && p.type === 'registration';
        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Pending Payments</h1>
                    <p className="text-slate-400 mt-1">Verify manual submissions for admissions and registrations</p>
                </div>
                <button onClick={fetchPendingPayments} className="btn-secondary flex items-center gap-2 self-start md:self-auto">
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Pending', value: allPayments.length, icon: Clock, color: 'text-primary' },
                    { label: 'Admissions', value: pendingPayments.admissions.length, icon: Landmark, color: 'text-blue-400' },
                    { label: 'Registrations', value: pendingPayments.profiles.length, icon: Smartphone, color: 'text-indigo-400' }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 flex items-center justify-between border-white/5">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex p-1 bg-white/5 rounded-xl self-stretch md:self-auto">
                    {['all', 'admission', 'registration'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input type="text" placeholder="Search ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-12 h-11" />
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-panel border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student / ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Method</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction / Proof</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <Loader2 size={40} className="animate-spin mx-auto text-primary mb-4" />
                                        <p className="text-slate-400 animate-pulse">Scanning database for pending payments...</p>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                            <CheckCircle size={40} className="text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
                                        <p className="text-slate-400 mt-1">No pending payments found requiring verification.</p>
                                    </td>
                                </tr>
                            ) : filteredPayments.map((p) => (
                                <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                                                {p.firstName?.[0]}{p.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{p.firstName} {p.lastName}</p>
                                                <p className="text-[10px] text-slate-500 font-mono tracking-tighter mt-0.5">{p.studentId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${p.type === 'admission' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {p.paymentMethod === 'bank_transfer' ? <Landmark size={14} className="text-slate-400" /> : <Smartphone size={14} className="text-slate-400" />}
                                            <span className="text-xs text-white capitalize">{p.paymentMethod}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.paymentMethod === 'bank_transfer' ? (
                                            <a href={`${import.meta.env.VITE_API_URL}${p.paymentProof}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline group/link">
                                                <Eye size={14} /> View Receipt <ExternalLink size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                            </a>
                                        ) : (
                                            <span className="text-xs font-mono text-slate-300 bg-white/5 px-2 py-1 rounded">{p.transactionId}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleVerify(p._id, p.type, 'paid')}
                                                disabled={processingId === p._id}
                                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-lg hover:shadow-green-500/20"
                                                title="Approve Payment"
                                            >
                                                {processingId === p._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleVerify(p._id, p.type, 'failed')}
                                                disabled={processingId === p._id}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                                                title="Reject Payment"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-white">Manual Verification Notice</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Approving a payment will permanently mark it as "Paid" and activate the associated student record. 
                        Please ensure the Transaction ID matches your banking records before confirming.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;
