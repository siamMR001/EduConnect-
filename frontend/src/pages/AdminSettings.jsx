import React, { useState, useEffect } from 'react';
import { Save, Settings, Mail, Clock, DollarSign, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        admissionFee: 500,
        attendanceEmailTemplate: '',
        geminiApiKey: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await api.put('/settings', settings);
            setMessage('Settings updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading system configurations...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">System Settings</h1>
                    <p className="text-slate-400 mt-1">Configure global parameters and communication templates</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Settings className="w-8 h-8 text-blue-400" />
                </div>
            </div>

            {message && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3 animate-bounce-subtle">
                    <CheckCircle className="w-5 h-5" /> {message}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Financial Settings */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-xl font-bold text-white">Financial Configuration</h2>
                    </div>
                    <div className="max-w-xs">
                        <label className="block text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Default Admission Fee</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input 
                                type="number" 
                                value={settings.admissionFee}
                                onChange={e => setSettings({...settings, admissionFee: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold outline-none focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Communication Settings */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Attendance Alerts Template</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Email Body Layout</label>
                            <textarea 
                                value={settings.attendanceEmailTemplate}
                                onChange={e => setSettings({...settings, attendanceEmailTemplate: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-slate-200 font-medium outline-none focus:border-blue-500/50 transition-all min-h-[180px] leading-relaxed"
                                placeholder="Write your template here..."
                            />
                        </div>
                        <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-500" /> Dynamic Placeholders
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {['{{studentName}}', '{{date}}'].map(tag => (
                                    <code key={tag} className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-[10px] text-blue-400 font-black">{tag}</code>
                                ))}
                            </div>
                            <p className="text-slate-500 text-[10px] mt-3 font-medium">These tags will be replaced with real data when the email is sent.</p>
                        </div>
                    </div>
                </div>

                {/* AI Configuration Settings */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">AI Personal Assistant Configuration</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Google Gemini API Key</label>
                            <input 
                                type="password" 
                                value={settings.geminiApiKey || ''}
                                onChange={e => setSettings({...settings, geminiApiKey: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-purple-500/50 transition-all font-medium"
                                placeholder="Enter your Gemini API Key..."
                            />
                            <p className="text-slate-500 text-[10px] mt-2 font-medium">
                                This key is required for the "AI Personal Assistant" and "Dashboard Summary" features.
                                Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Save Global Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
