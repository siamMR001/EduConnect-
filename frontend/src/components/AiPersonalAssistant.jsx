import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';

const AiPersonalAssistant = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Dashboard User Parse Error", e);
    }
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token && user?.role === 'student') {
            fetchSummary(false);
        }
    }, [token]);

    const fetchSummary = async (forceRefresh = false) => {
        setLoading(true);
        setError('');
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/ai/summary${forceRefresh ? '?refresh=true' : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSummary(data.summary);
            } else {
                // Check for quota error specifically
                const errorText = (data.error || data.message || '').toLowerCase();
                if (errorText.includes('429') || errorText.includes('quota') || errorText.includes('limit')) {
                    setError('Daily/Minute limit reached. Please wait a moment and try again.');
                } else {
                    setError(data.message || 'Unable to generate suggestion at this moment.');
                }
                console.error('AI Error:', data.error);
            }
        } catch (error) {
            console.error('Error fetching AI summary:', error);
            setError('Connection issue. Please check your internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-8 animate-fade-in">
            <div className="glass-panel overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <Sparkles size={20} className="text-primary-light animate-pulse" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">AI Personal Suggestion</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchSummary(true);
                            }}
                            disabled={loading}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50"
                            title="Reload Suggestion"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="px-6 pb-6 pt-2 animate-fade-in-down">
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                                <Loader2 size={16} className="animate-spin text-primary-light" />
                                Analyzing your profile...
                            </div>
                        ) : error ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-300 flex items-start gap-3">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">Notice</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        ) : summary ? (
                            <div className="relative">
                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-light/50 to-transparent rounded-full"></div>
                                <p className="text-slate-200 leading-relaxed text-sm md:text-base pl-4 py-1 italic font-medium">
                                    "{summary}"
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic py-2">
                                No suggestions available yet. Click reload to refresh.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiPersonalAssistant;
