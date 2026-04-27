import React, { useState, useEffect } from 'react';
import { Bus, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BusFare = () => {
    const [settings, setSettings] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthsToPay, setMonthsToPay] = useState(1);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [settingsRes, profileRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/settings`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/students/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setSettings(settingsRes.data);
                setProfile(profileRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateDue = () => {
        if (!settings || !profile) return { dueMonths: 0, fareAmount: 0, fine: 0, totalDue: 0, isLate: false };
        
        const paidUntil = new Date(profile.busFarePaidUntil || profile.createdAt);
        const today = new Date();
        
        // Calculate months difference
        let monthsDiff = (today.getFullYear() - paidUntil.getFullYear()) * 12;
        monthsDiff -= paidUntil.getMonth();
        monthsDiff += today.getMonth();
        
        if (monthsDiff < 0) monthsDiff = 0; // Paid in advance
        
        const fareAmount = monthsDiff * (settings.monthlyBusFare || 100);
        
        let fine = 0;
        let isLate = false;
        
        // If unpaid for over 6 months
        if (monthsDiff >= 6) {
            isLate = true;
            // Calculate days delayed after 6 months from paidUntil
            const sixMonthsAfterPaid = new Date(paidUntil);
            sixMonthsAfterPaid.setMonth(sixMonthsAfterPaid.getMonth() + 6);
            
            const diffTime = Math.abs(today - sixMonthsAfterPaid);
            const delayedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (delayedDays > 0) {
                fine = delayedDays * (settings.busFinePerDay || 10);
            }
        }
        
        return { 
            dueMonths: monthsDiff, 
            fareAmount, 
            fine, 
            totalDue: fareAmount + fine,
            isLate 
        };
    };

    const handlePayment = () => {
        alert("Payment gateway not integrated yet. This option will be linked with the payment procedure later.");
    };

    if (loading) {
        return <div className="text-white text-center py-20">Loading Bus Fare...</div>;
    }

    const dueInfo = calculateDue();
    const currentFareSelectionTotal = monthsToPay * (settings?.monthlyBusFare || 100);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in-up">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Bus className="text-blue-400" size={32} /> Bus Fare & Payments
                </h1>
                <p className="text-slate-400 mt-2">Manage your transportation fees</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Due Status Card */}
                <div className="glass-panel p-6 border-t-4 border-t-blue-500">
                    <h2 className="text-lg font-bold text-white mb-4">Current Due Status</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-slate-400">Unpaid Months</span>
                            <span className="text-xl font-bold text-white">{dueInfo.dueMonths} Months</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-slate-400">Pending Fare</span>
                            <span className="text-xl font-bold text-white">{dueInfo.fareAmount} BDT</span>
                        </div>
                        
                        {dueInfo.isLate && (
                            <div className="flex justify-between items-center pb-3 border-b border-white/5 text-red-400">
                                <span className="flex items-center gap-2"><AlertCircle size={16} /> Late Fine ( {'>'} 6 months)</span>
                                <span className="text-xl font-bold">{dueInfo.fine} BDT</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-300 font-bold">Total Due</span>
                            <span className="text-2xl font-black text-blue-400">{dueInfo.totalDue} BDT</span>
                        </div>
                    </div>
                </div>

                {/* Make Payment Card */}
                <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
                    <h2 className="text-lg font-bold text-white mb-4">Make Payment</h2>
                    
                    <div className="mb-6">
                        <label className="block text-slate-400 text-sm font-bold mb-2">Select Months to Pay</label>
                        <select 
                            className="input-field w-full text-base"
                            value={monthsToPay}
                            onChange={(e) => setMonthsToPay(Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6, 12].map(num => (
                                <option key={num} value={num}>{num} Month{num > 1 ? 's' : ''} ({num * (settings?.monthlyBusFare || 100)} BDT)</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Monthly Fare: {settings?.monthlyBusFare || 100} BDT
                        </p>
                    </div>

                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-slate-400">Selected Fare ({monthsToPay} months)</span>
                            <span className="text-white">{currentFareSelectionTotal} BDT</span>
                        </div>
                        {dueInfo.fine > 0 && (
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-slate-400">Pending Fines</span>
                                <span className="text-red-400">{dueInfo.fine} BDT</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                            <span className="text-white font-bold">Total Payable</span>
                            <span className="text-xl font-black text-emerald-400">
                                {currentFareSelectionTotal + (dueInfo.fine > 0 ? dueInfo.fine : 0)} BDT
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={handlePayment}
                        className="btn-primary w-full py-4 flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20 text-lg font-bold"
                    >
                        <CreditCard size={20} /> Pay Now
                    </button>
                </div>
            </div>
            
            <div className="glass-panel p-6 border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                    <div>
                        <h4 className="text-amber-500 font-bold mb-1">Bus Fare Policy</h4>
                        <p className="text-slate-300 text-sm">
                            Students must pay their bus fare regularly. If the fare remains unpaid for more than <strong>6 months</strong>, an additional late fine of <strong>{settings?.busFinePerDay || 10} BDT</strong> will be added for every day delayed. You can pay multiple months in advance to avoid fines.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusFare;
