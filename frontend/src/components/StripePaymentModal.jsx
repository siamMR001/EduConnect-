import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, onSuccess, onCancel, amount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const payload = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        });

        if (payload.error) {
            setError(`Payment failed: ${payload.error.message}`);
            setProcessing(false);
        } else {
            setError(null);
            setProcessing(false);
            onSuccess(payload.paymentIntent.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    Card Details
                </label>
                <div className="p-3 bg-black/20 rounded-lg border border-white/5 focus-within:border-primary/50 transition-colors">
                    <CardElement 
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#ef4444',
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Processing Payment...
                        </>
                    ) : (
                        <>
                            <Lock size={18} />
                            Pay ${(amount / 100).toFixed(2)} & Register
                        </>
                    )}
                </button>
                
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="w-full py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Cancel & Return
                </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                <Lock size={10} />
                Secure Payment Powered by Stripe
            </p>
        </form>
    );
};

const StripePaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            
            // Create PaymentIntent as soon as the modal opens
            fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, currency: 'usd' }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (res.ok) {
                        setClientSecret(data.clientSecret);
                    } else {
                        setError(data.message || 'Failed to initialize payment. Please try again.');
                    }
                })
                .catch((err) => {
                    console.error('Payment intent error:', err);
                    setError('Network error. Could not connect to payment server.');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, amount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#0a0a1a]/80 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-md glass-panel p-8 animate-fade-in-up border-primary/20 bg-[#121228]/95 overflow-hidden">
                {/* Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Finalize Registration</h2>
                        <p className="text-slate-400 text-sm mt-1">Pay the registration fee to create your account</p>
                    </div>
                    {!loading && (
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-slate-300 font-medium animate-pulse">Initializing Secure Payment...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-6">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Error Occurred</h3>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <button onClick={onClose} className="btn-primary w-full">Try Again</button>
                    </div>
                ) : (
                    <Elements stripe={stripePromise}>
                        <CheckoutForm 
                            clientSecret={clientSecret} 
                            onSuccess={onSuccess} 
                            onCancel={onClose} 
                            amount={amount}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
};

export default StripePaymentModal;
