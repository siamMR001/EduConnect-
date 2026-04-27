import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
    Elements, 
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe, 
    useElements,
    PaymentRequestButtonElement 
} from '@stripe/react-stripe-js';
import { 
    X, CreditCard, Lock, AlertCircle, Loader2, 
    CheckCircle, ChevronRight, Landmark, Copy, Info, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeTab = ({ clientSecret, onSuccess, onCancel, amount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState(null);

    useEffect(() => {
        if (stripe) {
            const pr = stripe.paymentRequest({
                country: 'US', 
                currency: 'usd',
                total: {
                    label: 'Admission Fee',
                    amount: amount,
                },
                requestPayerName: true,
                requestPayerEmail: true,
            });

            pr.canMakePayment().then(result => {
                if (result) {
                    setPaymentRequest(pr);
                }
            });

            pr.on('paymentmethod', async (ev) => {
                const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (confirmError) {
                    ev.complete('fail');
                    setError(confirmError.message);
                } else {
                    ev.complete('success');
                    if (paymentIntent.status === "requires_action") {
                        stripe.confirmCardPayment(clientSecret);
                    } else {
                        onSuccess(paymentIntent.id, 'stripe');
                    }
                }
            });
        }
    }, [stripe, amount, clientSecret, onSuccess]);

    const handleCardSubmit = async (event) => {
        event.preventDefault();
        
        // --- DEVELOPMENT MODE FALLBACK ---
        if (clientSecret && clientSecret.startsWith('pi_mock_secret_')) {
            setProcessing(true);
            setTimeout(() => {
                setProcessing(false);
                onSuccess('mock_intent_' + Date.now(), 'stripe_mock');
            }, 1500);
            return;
        }

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const payload = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardNumberElement),
            },
        });

        if (payload.error) {
            setError(`Payment failed: ${payload.error.message}`);
            setProcessing(false);
        } else {
            onSuccess(payload.paymentIntent.id, 'stripe');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {paymentRequest && (
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Fast Checkout</label>
                    <PaymentRequestButtonElement options={{ paymentRequest }} />
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#121228] px-3 text-slate-500 font-medium">Or pay with card</span></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleCardSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl shadow-2xl space-y-5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={14} className="text-primary" />
                                Secure Card Details
                            </label>
                            <div className="flex items-center gap-1">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-2.5 opacity-40" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-3.5 opacity-40" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Card Number</label>
                                <div className="p-4 bg-black/40 rounded-xl border border-white/5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                    <CardNumberElement options={{ style: { base: { fontSize: '16px', color: '#ffffff', '::placeholder': { color: '#475569' } } } }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Expiry Date</label>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                        <CardExpiryElement options={{ style: { base: { fontSize: '16px', color: '#ffffff', '::placeholder': { color: '#475569' } } } }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">CVC</label>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                        <CardCvcElement options={{ style: { base: { fontSize: '16px', color: '#ffffff', '::placeholder': { color: '#475569' } } } }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <Lock size={10} className="text-green-500/70" />
                                256-bit SSL Encryption
                            </div>
                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">PCI DSS Compliant</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-shake">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{error}</span>
                    </div>
                )}

                <button type="submit" disabled={!stripe || processing} className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold tracking-wider uppercase transition-all active:scale-95">
                    {processing ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <><Lock size={18} /> Pay ৳{(amount / 100).toFixed(2)} & Register</>}
                </button>
            </form>
        </div>
    );
};

const MobileTab = ({ amount, studentId, type, onSuccess, onCancel }) => {
    const [method, setMethod] = useState('bkash');
    const [txnId, setTxnId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const accounts = {
        bkash: '017xx-xxxxxx',
        rocket: '019xx-xxxxxx-x',
        nagad: '018xx-xxxxxx'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!txnId) return setError('Please enter Transaction ID');
        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/submit-manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, paymentMethod: method, transactionId: txnId, type, amount })
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess(null, method);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-3 gap-3">
                {['bkash', 'rocket', 'nagad'].map(m => (
                    <button key={m} onClick={() => setMethod(m)} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === m ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                            <span className="text-[10px] font-bold uppercase">{m.slice(0, 2)}</span>
                        </div>
                        <span className="text-xs font-semibold capitalize text-white">{m}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 capitalize">School {method} Number</span>
                    <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => navigator.clipboard.writeText(accounts[method])}><Copy size={12} /> Copy</button>
                </div>
                <p className="text-xl font-bold text-white tracking-wider text-center py-2 bg-black/20 rounded-lg border border-white/5">{accounts[method]}</p>
                <div className="flex gap-2 text-[10px] text-slate-400">
                    <Info size={12} className="shrink-0 text-primary" />
                    <p>Send <b>৳{(amount / 100).toFixed(2)}</b> via "Send Money" and enter the Transaction ID below.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Transaction ID</label>
                    <input type="text" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="input-field" placeholder="e.g. 8N7X2L9P" required />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle size={18} /> Submit for Verification</>}
                </button>
            </form>
        </div>
    );
};

const BankTab = ({ amount, studentData, studentId, type, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const downloadPayslip = () => {
        const doc = new jsPDF();
        doc.setFillColor(18, 18, 40);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("EDU-CONNECT REGISTRATION PAYSLIP", 20, 25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Student ID: ${studentId}`, 20, 60);
        doc.text(`Student Name: ${studentData?.name || 'N/A'}`, 20, 70);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
        doc.text(`Amount to Pay: ৳${(amount / 100).toFixed(2)}`, 20, 90);

        doc.setFontSize(14);
        doc.text("BANK DETAILS", 20, 110);
        doc.setFontSize(11);
        doc.text("Bank Name: EduConnect International Bank", 20, 120);
        doc.text("Account Name: EduConnect Educational Services Ltd.", 20, 130);
        doc.text("Account Number: 1234 5678 9012 3456", 20, 140);
        doc.text("Branch: Dhaka Main Branch", 20, 150);
        doc.text("Routing Number: 010203040", 20, 160);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Note: Please upload the bank deposit receipt after manual payment.", 20, 180);
        
        doc.save(`EduConnect_Payslip_${studentId}.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please upload bank receipt');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('studentId', studentId);
            formData.append('paymentMethod', 'bank_transfer');
            formData.append('type', type);
            formData.append('paymentProof', file);
            formData.append('amount', amount);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/submit-manual`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess(null, 'bank_transfer');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to upload receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><Landmark size={20} /></div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Bank Transfer Instructions</h4>
                        <p className="text-[10px] text-slate-400">Download payslip, pay at bank, upload receipt.</p>
                    </div>
                </div>
                <button onClick={downloadPayslip} className="w-full flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-lg text-slate-300 hover:text-white hover:bg-black/50 transition-all group">
                    <div className="flex items-center gap-2 text-xs font-medium"><Download size={14} className="text-primary" /> Download Payslip (PDF)</div>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Upload Deposit Receipt</label>
                    <div className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5 hover:border-primary/50'}`}>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.pdf" />
                        {file ? (
                            <><CheckCircle size={20} className="text-green-500 mb-1" /><span className="text-[10px] text-green-400 truncate px-4">{file.name}</span></>
                        ) : (
                            <><Download size={20} className="text-slate-500 mb-1" /><span className="text-[10px] text-slate-500">Click or drag receipt here</span></>
                        )}
                    </div>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle size={18} /> Submit Receipt</>}
                </button>
            </form>
        </div>
    );
};

const PaymentModal = ({ isOpen, onClose, amount, studentId, studentData, type = 'registration', onSuccess }) => {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successState, setSuccessState] = useState(false);
    const [paymentMethodUsed, setPaymentMethodUsed] = useState('');
    const [activeTab, setActiveTab] = useState('stripe');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            setSuccessState(false);
            
            fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, currency: 'usd', studentId, type }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.clientSecret) setClientSecret(data.clientSecret);
                else setError('Failed to initialize Stripe');
            })
            .catch(() => setError('Server Connection Failed'))
            .finally(() => setLoading(false));
        }
    }, [isOpen, amount, studentId, type]);

    const handleSuccess = (intentId, method) => {
        setPaymentMethodUsed(method);
        setSuccessState(true);
        setTimeout(() => {
            onSuccess(intentId, method);
            onClose();
        }, 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0a1a]/90 backdrop-blur-md" onClick={!loading ? onClose : undefined} />
            
            <div className="relative w-full max-w-lg glass-panel overflow-hidden animate-fade-in-up bg-[#121228]/95 border-white/5">
                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
                
                {successState ? (
                    <div className="p-12 text-center space-y-6 animate-fade-in">
                        <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Payment Successful!</h3>
                        <p className="text-slate-400">
                            {['stripe', 'apple_pay', 'google_pay', 'stripe_mock'].includes(paymentMethodUsed) 
                                ? 'Your payment was successful and your account has been updated.' 
                                : 'Our admin will verify your payment and activate your account shortly.'}
                        </p>
                    </div>
                ) : (
                    <div className="p-0">
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Professional Payment Portal</h2>
                                <p className="text-xs text-slate-400">Secure encrypted payment gateway</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        {/* Method Tabs */}
                        <div className="flex p-1 bg-black/20 mx-6 mt-4 rounded-xl">
                            {[
                                { id: 'stripe', label: 'Card' },
                                { id: 'mobile', label: 'MFS' },
                                { id: 'bank', label: 'Bank' }
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Amount Bar */}
                        <div className="px-6 py-3 bg-black/20 mt-4 border-y border-white/5 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Registration Fees</span>
                            <span className="text-sm font-bold text-primary-light">৳{(amount / 100).toFixed(2)}</span>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Initializing Secure Gateway...</p>
                                </div>
                            ) : error ? (
                                <div className="py-8 text-center">
                                    <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
                                    <p className="text-slate-400">{error}</p>
                                    <button onClick={() => window.location.reload()} className="mt-4 text-xs text-primary hover:underline">Retry Connection</button>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'stripe' && (
                                        <Elements stripe={stripePromise}>
                                            <StripeTab clientSecret={clientSecret} amount={amount} onSuccess={handleSuccess} onCancel={onClose} />
                                        </Elements>
                                    )}
                                    {activeTab === 'mobile' && (
                                        <MobileTab amount={amount} studentId={studentId} type={type} onSuccess={handleSuccess} onCancel={onClose} />
                                    )}
                                    {activeTab === 'bank' && (
                                        <BankTab amount={amount} studentId={studentId} studentData={studentData} type={type} onSuccess={handleSuccess} />
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-black/30 text-center border-t border-white/5">
                            <div className="flex flex-col gap-2 items-center">
                                <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-1">
                                    <Lock size={10} /> PCI DSS Level 1 Compliant & Secure
                                </p>
                                <div className="flex items-center gap-3 opacity-20 grayscale brightness-200">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-2.5" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
