import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, School } from 'lucide-react';

const RegistrationSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (sessionId) {
            verifyPayment();
        } else {
            setStatus('error');
            setError('Missing session ID');
        }
    }, [sessionId]);

    const verifyPayment = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admissions/finalize-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setData(result);
                setStatus('success');
            } else {
                setData(result);
                setStatus('error');
                setError(result.message || 'Payment verification failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setStatus('error');
            setError('Network error during verification');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-20 px-4 text-center">
            <div className="glass-panel p-12 space-y-8 animate-fade-in-up">
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="mx-auto w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <h2 className="text-2xl font-bold text-white">Verifying Payment...</h2>
                        <p className="text-slate-400">Please wait while we confirm your transaction with Stripe.</p>
                    </div>
                )}

                 {status === 'success' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <CheckCircle size={48} className="text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Payment Received!</h2>
                        <p className="text-slate-300 text-lg">Your admission fee has been successfully paid.</p>
                        
                        <div className="bg-black/30 p-6 rounded-xl inline-block border border-white/5">
                            <p className="text-slate-400 mb-1">Your Application ID</p>
                            <p className="text-3xl font-bold tracking-widest text-primary-light">{data.studentId}</p>
                        </div>
                        
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm text-primary-light font-medium leading-relaxed">
                                IMPORTANT: Your account is currently <strong>Awaiting Admin Approval</strong>. 
                                You will be able to register and log in once the school administrator reviews and approves your application.
                            </p>
                        </div>
                        
                        <button onClick={() => navigate('/')} className="btn-secondary w-full py-4 text-lg font-bold">
                            Return to Homepage
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-shake">
                        <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                            <AlertCircle size={40} className="text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Payment Error</h2>
                        <p className="text-red-400 font-medium">{error}</p>
                        {data?.details && (
                             <div className="p-4 bg-red-950/40 rounded border border-red-500/20 text-xs text-red-300 text-left overflow-auto max-h-32">
                                 <p className="font-semibold mb-1">Technical Details:</p>
                                 <pre className="whitespace-pre-wrap">{data.details}</pre>
                             </div>
                        )}
                        <p className="text-slate-400 text-sm">
                            If your payment was deducted, please contact support with your session ID: <br/>
                            <span className="text-xs font-mono text-slate-500">{sessionId}</span>
                        </p>
                        <button onClick={() => navigate('/apply')} className="btn-secondary w-full py-3">
                            Back to Registration
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
                <School size={16} />
                <span className="text-xs font-bold tracking-widest uppercase">EduConnect Admissions</span>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
