import React, { useState, useEffect } from 'react';
import {
    Plus,
    Printer,
    Trash2,
    Download,
    Search,
    FileText,
    Banknote,
    User,
    Calendar,
    Tag,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    X,
    RotateCcw
} from 'lucide-react';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

    // Get unique years from expenses for the filter
    const availableYears = [...new Set(expenses.map(e => new Date(e.date).getFullYear().toString())), new Date().getFullYear().toString()].sort((a, b) => b - a);

    const months = [
        { value: '', label: 'All Months' },
        { value: '0', label: 'January' },
        { value: '1', label: 'February' },
        { value: '2', label: 'March' },
        { value: '3', label: 'April' },
        { value: '4', label: 'May' },
        { value: '5', label: 'June' },
        { value: '6', label: 'July' },
        { value: '7', label: 'August' },
        { value: '8', label: 'September' },
        { value: '9', label: 'October' },
        { value: '10', label: 'November' },
        { value: '11', label: 'December' },
    ];

    // Form State - ALL MANUAL as requested
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientId: '',
        amount: '',
        purpose: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash'
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                setExpenses([data.expense, ...expenses]);
                setSelectedExpense(data.expense);
                setShowVoucherModal(true); // Automatically show voucher for printing
                setFormData({
                    recipientName: '',
                    recipientId: '',
                    amount: '',
                    purpose: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Cash'
                });
            } else {
                alert('Failed to save expense');
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setExpenses(expenses.filter(e => e._id !== id));
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterMonth('');
        setFilterYear(new Date().getFullYear().toString());
    };

    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const matchesQuery = e.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.purpose.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMonth = filterMonth === '' || expenseDate.getMonth().toString() === filterMonth;
        const matchesYear = filterYear === '' || expenseDate.getFullYear().toString() === filterYear;

        return matchesQuery && matchesMonth && matchesYear;
    });

    const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Helper to convert number to words (simple version)
    const amountToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if (n < 20) return a[n];
            const s = n.toString();
            return b[s[0]] + (s[1] !== '0' ? '-' + a[s[1]] : '');
        };

        if (num === 0) return 'Zero';
        let n = parseInt(num);
        if (n > 99999) return num.toString(); // Fallback for large numbers

        let words = '';
        if (n >= 1000) {
            words += inWords(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }
        if (n >= 100) {
            words += inWords(Math.floor(n / 100)) + ' Hundred ';
            n %= 100;
        }
        if (n > 0) {
            if (words !== '') words += 'and ';
            words += inWords(n);
        }
        return words + ' Only';
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 glass-panel py-6 px-8 border-b border-white/10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white tracking-tight">
                        Expense Management
                    </h1>
                    <p className="text-slate-400 mt-1">Generate official vouchers and track school spending.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Month Filter */}
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="input-field w-36 bg-white/5 text-xs font-bold"
                    >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    {/* Year Filter */}
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="input-field w-28 bg-white/5 text-xs font-bold"
                    >
                        <option value="">All Years</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-9 w-48 bg-white/5 text-xs font-bold"
                        />
                    </div>

                    <button
                        onClick={resetFilters}
                        className="p-2.5 bg-white/5 text-slate-400 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all shadow-lg"
                        title="Reset Filters"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="p-2.5 bg-primary/20 text-primary-light border border-primary/30 rounded-xl hover:bg-primary/30 transition-all shadow-lg shadow-primary/10"
                        title="Export Report"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </header>


            {/* Total Summary Bar */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-5 border-l-4 border-primary shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Filtered Total Expense</p>
                    <p className="text-3xl font-black text-white flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-500">৳</span>
                        {totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass-panel p-5 border-l-4 border-emerald-500/50 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Transaction Count</p>
                    <p className="text-3xl font-black text-white">
                        {filteredExpenses.length} <span className="text-sm font-bold text-slate-500 italic">records</span>
                    </p>
                </div>
                <div className="glass-panel p-5 border-l-4 border-amber-500/50 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Period</p>
                    <p className="text-xl font-black text-white">
                        {filterMonth ? months.find(m => m.value === filterMonth).label : 'Full Year'} {filterYear || 'All'}
                    </p>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Expense Entry Form */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 sticky top-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-primary-light" size={24} />
                            New Expense Entry
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Recipient Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        name="recipientName"
                                        required
                                        value={formData.recipientName}
                                        onChange={handleInputChange}
                                        className="input-field pl-10"
                                        placeholder="Full Name of staff/teacher"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Staff/ID</label>
                                    <input
                                        type="text"
                                        name="recipientId"
                                        required
                                        value={formData.recipientId}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        placeholder="EMP-101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">৳</div>
                                        <input
                                            type="number"
                                            name="amount"
                                            required
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            className="input-field pl-8"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Spending Purpose</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        name="purpose"
                                        required
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        className="input-field pl-10"
                                        placeholder="e.g. Monthly Salary, Stationery"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Payment Method</label>
                                    <input
                                        type="text"
                                        name="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        placeholder="Cash / Bank"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-semibold uppercase mb-1.5 ml-1">Additional Notes</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="input-field pl-10 h-24 pt-2"
                                        placeholder="Short description..."
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <FileText size={18} />
                                        Generate Official Voucher
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Expense Records List */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Expense Transactions</h2>
                            <span className="text-sm text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                Total: {filteredExpenses.length} Records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                        <th className="pb-4 px-4">Voucher No</th>
                                        <th className="pb-4 px-4">Date</th>
                                        <th className="pb-4 px-4">Recipient</th>
                                        <th className="pb-4 px-4">Purpose</th>
                                        <th className="pb-4 px-4">Amount</th>
                                        <th className="pb-4 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-slate-500 italic">No expense records found.</td>
                                        </tr>
                                    ) : filteredExpenses.map(exp => (
                                        <tr key={exp._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-4 px-4 font-mono text-primary-light text-sm">{exp.voucherNo}</td>
                                            <td className="py-4 px-4 text-slate-400 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-4">
                                                <div className="text-white font-medium text-sm">{exp.recipientName}</div>
                                                <div className="text-xs text-slate-500">{exp.recipientId}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[11px] text-slate-300">
                                                    {exp.purpose}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-white font-bold">৳{exp.amount.toFixed(2)}</td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setSelectedExpense(exp); setShowVoucherModal(true); }}
                                                        className="p-1.5 bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary-light rounded transition-colors"
                                                        title="Print Voucher"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp._id)}
                                                        className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voucher Print Modal */}
            {showVoucherModal && selectedExpense && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
                    <div className="bg-slate-900 border border-white/20 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-down">
                        {/* Modal Header */}
                        <div className="bg-background-paper p-4 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText className="text-primary-light" size={20} />
                                <h3 className="text-lg font-bold text-white">Official Payment Voucher</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="btn-primary py-1.5 px-4 flex items-center gap-2 text-sm"
                                >
                                    <Printer size={16} /> Print Slip
                                </button>
                                <button
                                    onClick={() => setShowVoucherModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable Preview) */}
                        <div className="p-8 bg-white overflow-y-auto max-h-[70vh]">
                            {/* THIS SECTION IS DESIGNED TO LOOK LIKE A PHYSICAL SLIP */}
                            <div className="voucher-slip text-slate-900 font-sans border-2 border-slate-900 p-8 rounded-sm relative">
                                {/* School Header */}
                                <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">EduConnect Academy</h2>
                                    <p className="text-sm font-medium text-slate-600">Official Payment Voucher & Receipt</p>
                                    <div className="mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Professional School Management System</div>
                                </div>

                                {/* Voucher Info Row */}
                                <div className="flex justify-between mb-8 text-sm">
                                    <div className="space-y-1">
                                        <p><span className="font-bold uppercase text-[10px] text-slate-500">Voucher No:</span> <span className="font-mono font-black">{selectedExpense.voucherNo}</span></p>
                                        <p><span className="font-bold uppercase text-[10px] text-slate-500">Date:</span> <span className="font-bold">{new Date(selectedExpense.date).toLocaleDateString()}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p><span className="font-bold uppercase text-[10px] text-slate-500">Payment Method:</span> <span className="font-bold">{selectedExpense.paymentMethod}</span></p>
                                    </div>
                                </div>

                                {/* Recipient Box */}
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded mb-8">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="col-span-2">
                                            <p className="font-bold uppercase text-[10px] text-slate-500 mb-1">Paid To (Recipient Name)</p>
                                            <p className="text-lg font-black">{selectedExpense.recipientName}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase text-[10px] text-slate-500 mb-1">Recipient ID</p>
                                            <p className="text-lg font-black">{selectedExpense.recipientId}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Box */}
                                <div className="mb-10">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900">
                                                <th className="text-left py-2 font-bold uppercase text-[10px] text-slate-500">Description of Payment</th>
                                                <th className="text-right py-2 font-bold uppercase text-[10px] text-slate-500">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <td className="py-4">
                                                    <p className="font-black text-lg">{selectedExpense.purpose}</p>
                                                    <p className="text-sm text-slate-600 mt-1">{selectedExpense.description || 'No additional notes provided.'}</p>
                                                </td>
                                                <td className="py-4 text-right font-black text-xl">
                                                    ৳{selectedExpense.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 text-right font-bold uppercase text-[10px] text-slate-500 pr-4">Total Amount</td>
                                                <td className="py-4 text-right font-black text-2xl text-slate-900">
                                                    ৳{selectedExpense.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Amount in Words */}
                                <div className="mb-12 p-3 border-l-4 border-slate-900 bg-slate-50">
                                    <p className="font-bold uppercase text-[10px] text-slate-500 mb-1">Amount in words</p>
                                    <p className="text-sm italic font-bold">"{amountToWords(selectedExpense.amount)}"</p>
                                </div>

                                {/* Signatures */}
                                <div className="grid grid-cols-3 gap-12 mt-20 text-center">
                                    <div className="border-t border-slate-900 pt-2">
                                        <p className="text-[10px] font-bold uppercase text-slate-500">Recipient's Signature</p>
                                        <p className="text-[9px] text-slate-400 mt-1">(Sign upon receiving payment)</p>
                                    </div>
                                    <div className="border-t border-slate-900 pt-2">
                                        <p className="text-[10px] font-bold uppercase text-slate-500">Accountant/Admin</p>
                                    </div>
                                    <div className="border-t border-slate-900 pt-2">
                                        <p className="text-[10px] font-bold uppercase text-slate-500">Authorized Official</p>
                                    </div>
                                </div>

                                {/* Watermark/Footer */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none">
                                    <h1 className="text-8xl font-black uppercase whitespace-nowrap">PAID</h1>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-4 text-center">
                            <p className="text-xs text-slate-500">Tip: Press 'Print Slip' and set Destination to 'Save as PDF' or select your printer.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT-ONLY COMPONENT (Financial Report) */}
            <div className="hidden print:block fixed inset-0 bg-white z-[999] p-10 text-black">
                {!selectedExpense && (
                    <div className="w-full">
                        <div className="text-center border-b-2 border-black pb-6 mb-8">
                            <h1 className="text-3xl font-black uppercase">EduConnect Academy</h1>
                            <h2 className="text-xl font-bold text-gray-700 uppercase tracking-widest mt-1">Expense Audit Report</h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Period: {filterMonth ? months.find(m => m.value === filterMonth).label : 'Full Year'} {filterYear || 'All'}
                            </p>
                        </div>

                        <table className="w-full border-collapse border-2 border-black">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-3 text-left text-xs font-black uppercase">Voucher No</th>
                                    <th className="border border-black p-3 text-left text-xs font-black uppercase">Date</th>
                                    <th className="border border-black p-3 text-left text-xs font-black uppercase">Recipient</th>
                                    <th className="border border-black p-3 text-left text-xs font-black uppercase">Purpose</th>
                                    <th className="border border-black p-3 text-right text-xs font-black uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp._id}>
                                        <td className="border border-black p-3 font-mono text-sm">{exp.voucherNo}</td>
                                        <td className="border border-black p-3 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="border border-black p-3 text-sm">
                                            <div className="font-bold">{exp.recipientName}</div>
                                            <div className="text-xs text-gray-600">{exp.recipientId}</div>
                                        </td>
                                        <td className="border border-black p-3 text-sm">{exp.purpose}</td>
                                        <td className="border border-black p-3 text-right font-bold">৳{exp.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-200">
                                    <td colSpan="4" className="border border-black p-4 text-right font-black uppercase text-base">Grand Total</td>
                                    <td className="border border-black p-4 text-right font-black text-2xl">৳{totalFilteredAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-12 p-4 border-l-4 border-black bg-gray-50 italic text-sm">
                            <p className="font-bold">Summary:</p>
                            <p>This report contains a total of {filteredExpenses.length} transactions recorded for the selected period. All vouchers have been verified against the institutional ledger.</p>
                        </div>

                        <div className="mt-32 flex justify-between px-10">
                            <div className="border-t border-black w-48 text-center pt-2">
                                <p className="text-[10px] font-bold uppercase">Accountant Signature</p>
                            </div>
                            <div className="border-t border-black w-48 text-center pt-2">
                                <p className="text-[10px] font-bold uppercase">Principal Signature</p>
                            </div>
                        </div>
                        
                        <div className="mt-12 text-center text-[10px] text-gray-400">
                            Report Generated on: {new Date().toLocaleString()} | EduConnect Institutional System
                        </div>
                    </div>
                )}

                {/* Voucher Print Component (Legacy) */}
                {selectedExpense && (
                    <div className="voucher-slip text-black font-sans border-2 border-black p-10 m-4 rounded-sm relative h-[95vh] flex flex-col">
                        <div className="text-center border-b-2 border-black pb-8 mb-10">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">EduConnect Academy</h2>
                            <p className="text-base font-bold text-gray-700">Official Payment Voucher & Receipt</p>
                        </div>

                        <div className="flex justify-between mb-10 text-base">
                            <div className="space-y-2">
                                <p><span className="font-bold uppercase text-xs text-gray-600">Voucher No:</span> <span className="font-mono font-black border-b border-black">{selectedExpense.voucherNo}</span></p>
                                <p><span className="font-bold uppercase text-xs text-gray-600">Date:</span> <span className="font-bold border-b border-black">{new Date(selectedExpense.date).toLocaleDateString()}</span></p>
                            </div>
                            <div className="text-right">
                                <p><span className="font-bold uppercase text-xs text-gray-600">Payment Method:</span> <span className="font-bold border-b border-black">{selectedExpense.paymentMethod}</span></p>
                            </div>
                        </div>

                        <div className="border-2 border-black p-6 rounded mb-10">
                            <div className="grid grid-cols-3 gap-6 text-base">
                                <div className="col-span-2">
                                    <p className="font-bold uppercase text-xs text-gray-600 mb-1">Paid To (Recipient Name)</p>
                                    <p className="text-2xl font-black">{selectedExpense.recipientName}</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase text-xs text-gray-600 mb-1">Recipient ID</p>
                                    <p className="text-2xl font-black">{selectedExpense.recipientId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-12 flex-grow">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-4 border-black">
                                        <th className="text-left py-3 font-black uppercase text-sm">Description of Payment</th>
                                        <th className="text-right py-3 font-black uppercase text-sm">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b-2 border-black">
                                        <td className="py-6">
                                            <p className="font-black text-2xl uppercase">{selectedExpense.purpose}</p>
                                            <p className="text-lg text-gray-800 mt-2">{selectedExpense.description || 'Official disbursement for school operations.'}</p>
                                        </td>
                                        <td className="py-6 text-right font-black text-3xl">
                                            ৳{selectedExpense.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-6 text-right font-black uppercase text-base pr-6">Total Payable Amount</td>
                                        <td className="py-6 text-right font-black text-4xl">
                                            ৳{selectedExpense.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-16 p-6 border-l-8 border-black bg-gray-100">
                            <p className="font-bold uppercase text-xs text-gray-600 mb-2">Amount in words (Official)</p>
                            <p className="text-xl italic font-black">"{amountToWords(selectedExpense.amount)}"</p>
                        </div>

                        <div className="grid grid-cols-3 gap-16 mt-auto pb-10 text-center">
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-sm font-black uppercase">Recipient's Signature</p>
                                <p className="text-xs text-gray-500 mt-2">(Confirms receipt of funds)</p>
                            </div>
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-sm font-black uppercase">Accountant/Admin</p>
                                <p className="text-xs text-gray-500 mt-2">(Authorized Disbursement)</p>
                            </div>
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-sm font-black uppercase">Principal / Director</p>
                                <p className="text-xs text-gray-500 mt-2">(Final Approval)</p>
                            </div>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] rotate-[-35deg] pointer-events-none">
                            <h1 className="text-[180px] font-black border-8 border-black p-10">PAID</h1>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminExpenses;

