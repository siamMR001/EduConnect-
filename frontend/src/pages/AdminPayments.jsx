import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, Clock, Search, 
    Smartphone, Landmark, Eye, ExternalLink, 
    AlertCircle, Loader2, Filter, RefreshCcw,
    Download, Printer, Banknote, Calendar,
    User, ArrowRight, FileText, RotateCcw, Trash2,
    Plus
} from 'lucide-react';

import gradeService from '../services/gradeService';

const AdminPayments = () => {
    const [feeConfigs, setFeeConfigs] = useState([]);
    const [incomeHistory, setIncomeHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('config'); // config, history
    const [grades, setGrades] = useState([]);
    const [feeForm, setFeeForm] = useState({ grade: '', paymentType: '', amount: '', academicYear: new Date().getFullYear().toString(), month: 'All' });
    const [editingConfig, setEditingConfig] = useState(null);
    
    // Filters for Income Report
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterType, setFilterType] = useState(''); // All, Admission Fee, Registration Fee, Monthly Fee

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

    const availableYears = [...new Set(incomeHistory.map(p => new Date(p.date).getFullYear().toString())), new Date().getFullYear().toString()].sort((a, b) => b - a);

    useEffect(() => {
        fetchGrades();
        if (activeTab === 'config') {
            fetchFeeConfigs();
        } else {
            fetchIncomeHistory();
        }
    }, [activeTab]);

    const fetchGrades = async () => {
        try {
            // Fetch all grades without a specific year filter to ensure all configured classes are available
            const data = await gradeService.getAllGrades();
            const sortedGrades = (data.gradeConfigs || []).sort((a, b) => {
                const numA = parseInt(a.grade);
                const numB = parseInt(b.grade);
                return numA - numB;
            });
            setGrades(sortedGrades);
        } catch (error) {
            console.error("Error fetching grades:", error);
        }
    };

    const fetchFeeConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/fee-configs`);
            const data = await res.json();
            if (res.ok) {
                setFeeConfigs(data);
            }
        } catch (error) {
            console.error("Error fetching fee configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomeHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/income-history`);
            const data = await res.json();
            console.log("--- Income History Data Received ---", data);
            if (res.ok) {
                setIncomeHistory(data);
            }
        } catch (error) {
            console.error("Error fetching income history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeeConfig = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingConfig 
                ? `${import.meta.env.VITE_API_URL}/api/payments/fee-configs/${editingConfig._id}`
                : `${import.meta.env.VITE_API_URL}/api/payments/fee-configs`;
            
            const res = await fetch(url, {
                method: editingConfig ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feeForm)
            });

            if (res.ok) {
                fetchFeeConfigs();
                setFeeForm({ grade: '', paymentType: '', amount: '', academicYear: new Date().getFullYear().toString(), month: 'All' });
                setEditingConfig(null);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to save configuration");
            }
        } catch (error) {
            console.error("Error saving fee config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditConfig = (config) => {
        setEditingConfig(config);
        setFeeForm({
            grade: config.grade,
            paymentType: config.paymentType,
            amount: config.amount,
            academicYear: config.academicYear,
            month: config.month
        });
    };

    const handleDeleteConfig = async (id) => {
        if (!window.confirm("Are you sure you want to delete this configuration?")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/fee-configs/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchFeeConfigs();
        } catch (error) {
            console.error("Error deleting fee config:", error);
        }
    };

    const handlePrint = () => {
        const periodLabel = filterMonth
            ? `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`
            : `Full Year ${filterYear}`;

        const rowsHtml = filteredHistory.map((p, i) => `
            <tr>
                <td>${new Date(p.date).toLocaleDateString()}</td>
                <td>
                    <div class="student-name">${p.studentName}</div>
                    <div class="student-id">ID: ${p.studentId}</div>
                </td>
                <td>${p.type}</td>
                <td>${p.method}</td>
                <td class="mono">${p.transactionId || '—'}</td>
                <td class="amount-cell">৳${p.amount.toLocaleString()}</td>
            </tr>
        `).join('');

        const admissionRev = filteredHistory.filter(p => p.type === 'Admission Fee').reduce((s, p) => s + p.amount, 0);
        const registrationRev = filteredHistory.filter(p => p.type === 'Registration Fee').reduce((s, p) => s + p.amount, 0);

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>EduConnect — Income Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #000;
      background: #fff;
      padding: 48px;
      font-size: 13px;
    }

    /* ── HEADER ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 4px solid #000;
      padding-bottom: 28px;
      margin-bottom: 32px;
    }
    .school-name {
      font-size: 32px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .report-subtitle { font-size: 15px; font-weight: 600; color: #444; margin-top: 6px; }
    .report-period { font-size: 11px; color: #888; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
    .badge-wrap { text-align: right; }
    .audit-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 10px 22px;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      border-radius: 8px;
    }
    .generated {
      font-size: 9px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-weight: 700;
      margin-top: 8px;
    }

    /* ── SUMMARY GRID ── */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 36px;
    }
    .summary-box {
      border: 2px solid #000;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .summary-box-title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      color: #aaa;
      margin-bottom: 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 11px;
    }
    .summary-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .summary-row .label { color: #666; font-weight: 600; }
    .summary-row .val { font-weight: 900; color: #000; }
    .total-box {
      background: #000;
      color: #fff;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .total-box-label {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      opacity: 0.5;
      margin-bottom: 10px;
    }
    .total-amount {
      font-size: 44px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      letter-spacing: -0.02em;
    }

    /* ── TABLE ── */
    .section-label {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-left: 6px solid #000;
      padding-left: 12px;
      margin-bottom: 16px;
      color: #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000;
    }
    thead tr { background: #f5f5f5; border-bottom: 2px solid #000; }
    thead th {
      padding: 14px 12px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #444;
      text-align: left;
    }
    tbody tr { border-bottom: 1px solid #ebebeb; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 12px; font-size: 11px; vertical-align: middle; }
    .student-name { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000; }
    .student-id { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .mono { font-family: 'Courier New', monospace; font-size: 10px; color: #777; }
    .amount-cell { font-size: 13px; font-weight: 900; text-align: right; font-family: 'Courier New', monospace; color: #000; }
    tfoot tr { background: #000; color: #fff; }
    tfoot td {
      padding: 18px 12px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
    }
    .tfoot-label {
      text-align: right;
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      opacity: 0.6;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .tfoot-amount { text-align: right; font-size: 20px; }

    /* ── SIGNATURES ── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      margin-top: 80px;
    }
    .sig-block { border-top: 2px solid #000; padding-top: 12px; text-align: center; }
    .sig-name { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; }
    .sig-role { font-size: 9px; color: #aaa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 4px; }

    /* ── FOOTER ── */
    .footer-stamp { margin-top: 60px; text-align: center; }
    .footer-stamp span {
      border: 1px solid #ddd;
      border-radius: 100px;
      padding: 7px 24px;
      font-size: 8px;
      color: #bbb;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.35em;
    }

    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="school-name">EduConnect Academy</div>
      <div class="report-subtitle">Financial Income Audit Report</div>
      <div class="report-period">Report for: ${periodLabel}</div>
    </div>
    <div class="badge-wrap">
      <div class="audit-badge">Audit Document</div>
      <div class="generated">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="summary-box-title">Transaction Summary</div>
      <div class="summary-row"><span class="label">Total Count:</span><span class="val">${filteredHistory.length} Transactions</span></div>
      <div class="summary-row"><span class="label">Admission Revenue:</span><span class="val">৳${admissionRev.toLocaleString()}</span></div>
      <div class="summary-row"><span class="label">Registration Revenue:</span><span class="val">৳${registrationRev.toLocaleString()}</span></div>
      <div class="summary-row"><span class="label">Applied Filter:</span><span class="val">${periodLabel}</span></div>
    </div>
    <div class="total-box">
      <div class="total-box-label">Total Verified Revenue</div>
      <div class="total-amount">৳${totalIncome.toLocaleString()}</div>
    </div>
  </div>

  <div class="section-label">Transaction Ledger</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Source / Student ID</th>
        <th>Type</th>
        <th>Method</th>
        <th>Transaction ID</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" class="tfoot-label">Total Net Revenue for the Period:</td>
        <td class="tfoot-amount">৳${totalIncome.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-name">Finance Director</div>
      <div class="sig-role">Authorized Signature &amp; Seal</div>
    </div>
    <div class="sig-block">
      <div class="sig-name">Head of Academy</div>
      <div class="sig-role">Verification &amp; Audit Stamp</div>
    </div>
  </div>

  <div class="footer-stamp">
    <span>Official Audit Document &bull; EduConnect Institutional Cloud &bull; Encrypted Transaction Log</span>
  </div>

</body>
</html>`;

        const win = window.open('', '_blank', 'width=950,height=750');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 600);
    };


    const resetFilters = () => {
        setSearchTerm('');
        setFilterMonth('');
        setFilterType('');
        setFilterYear(new Date().getFullYear().toString());
    };

    const filteredFeeConfigs = feeConfigs.filter(c => 
        c.grade.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.paymentType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = incomeHistory.filter(p => {
        const paymentDate = new Date(p.date);
        const matchesSearch = p.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesMonth = filterMonth === '' || paymentDate.getMonth().toString() === filterMonth;
        const matchesYear = filterYear === '' || paymentDate.getFullYear().toString() === filterYear;
        const matchesType = filterType === '' || p.type === filterType;

        return matchesSearch && matchesMonth && matchesYear && matchesType;
    });

    const totalIncome = filteredHistory.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Banknote className="text-primary" size={36} />
                        Financial Management
                    </h1>
                    <p className="text-slate-400 mt-1">Track income, verify payments, and generate financial reports</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={activeTab === 'config' ? fetchFeeConfigs : fetchIncomeHistory} className="btn-secondary flex items-center gap-2">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    {activeTab === 'history' && (
                        <button onClick={handlePrint} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                            <Printer size={18} />
                            Print Report
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-white/5 no-print">
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'config' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Fee Configuration
                    {activeTab === 'config' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(59,130,246,0.5)]"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Income History & Reports
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(59,130,246,0.5)]"></div>}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                {activeTab === 'config' ? (
                    <>
                        <KPICard label="Total Configs" value={feeConfigs.length} icon={FileText} color="text-primary" />
                        <KPICard label="Classes" value={[...new Set(feeConfigs.map(c => c.grade))].length} icon={Landmark} color="text-blue-400" />
                        <KPICard label="Academic Year" value={new Date().getFullYear()} icon={Calendar} color="text-indigo-400" />
                        <KPICard label="System Status" value="Active" icon={CheckCircle} color="text-emerald-400" />
                    </>
                ) : (
                    <>
                        <KPICard label="Transactions" value={filteredHistory.length} icon={FileText} color="text-primary" />
                        <KPICard label="Admission Revenue" value={`$${filteredHistory.filter(p => p.type === 'Admission Fee').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}`} icon={Landmark} color="text-emerald-400" />
                        <KPICard label="Registration Revenue" value={`$${filteredHistory.filter(p => p.type === 'Registration Fee').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}`} icon={Smartphone} color="text-blue-400" />
                        <KPICard label="Net Income" value={`$${totalIncome.toLocaleString()}`} icon={Banknote} color="text-green-500" />
                    </>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-3xl border border-white/5 no-print">
                <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl">
                    {activeTab === 'config' ? (
                        <p className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary">Fee Configuration Manager</p>
                    ) : (
                        <>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer hover:text-white px-4"
                            >
                                <option value="" className="bg-slate-900 text-white">All Categories</option>
                                <option value="Admission Fee" className="bg-slate-900 text-white">Admission Fees</option>
                                <option value="Registration Fee" className="bg-slate-900 text-white">Registration Fees</option>
                                <option value="Monthly Fee" className="bg-slate-900 text-white">Monthly Fees</option>
                            </select>
                            <div className="w-px h-6 bg-white/10 self-center"></div>
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer hover:text-white px-4"
                            >
                                {months.map(m => <option key={m.value} value={m.value} className="bg-slate-900 text-white">{m.label}</option>)}
                            </select>
                            <div className="w-px h-6 bg-white/10 self-center"></div>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer hover:text-white px-4"
                            >
                                <option value="" className="bg-slate-900 text-white">All Years</option>
                                {availableYears.map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                            </select>
                        </>
                    )}
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'config' ? "Search Class or Type..." : "Search Name, ID or TxID..."}
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="input-field pl-12 h-12 rounded-2xl text-xs" 
                        />
                    </div>
                    {activeTab === 'history' && (
                        <button
                            onClick={resetFilters}
                            className="p-3 bg-white/5 text-slate-400 border border-white/10 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                            title="Reset Filters"
                        >
                            <RotateCcw size={20} />
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
                    {/* Fee Form */}
                    <div className="glass-panel p-8 h-fit">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-primary" />
                            {editingConfig ? 'Edit Configuration' : 'Add New Fee Config'}
                        </h3>
                        <form onSubmit={handleSaveFeeConfig} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Class/Grade</label>
                                <select 
                                    required
                                    className="input-field h-12 rounded-xl"
                                    value={feeForm.grade}
                                    onChange={e => setFeeForm({...feeForm, grade: e.target.value})}
                                >
                                    <option value="">Select Class</option>
                                    {grades.map(g => (
                                        <option key={g._id} value={g.grade}>
                                            Class {parseInt(g.grade)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Payment Type</label>
                                <select 
                                    required
                                    className="input-field h-12 rounded-xl"
                                    value={feeForm.paymentType}
                                    onChange={e => setFeeForm({...feeForm, paymentType: e.target.value})}
                                >
                                    <option value="">Select Type</option>
                                    {['Tuition Fee', 'Library Fee', 'Transportation Fee', 'Exam Fee', 'Sports Fee', 'Other'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Year</label>
                                    <input 
                                        required
                                        className="input-field h-12 rounded-xl"
                                        value={feeForm.academicYear}
                                        onChange={e => setFeeForm({...feeForm, academicYear: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Month</label>
                                    <select 
                                        required
                                        className="input-field h-12 rounded-xl"
                                        value={feeForm.month}
                                        onChange={e => setFeeForm({...feeForm, month: e.target.value})}
                                    >
                                        <option value="All">All Months</option>
                                        {months.slice(1).map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Amount (USD)</label>
                                <input 
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    className="input-field h-12 rounded-xl"
                                    value={feeForm.amount}
                                    onChange={e => setFeeForm({...feeForm, amount: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 btn-primary py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    {editingConfig ? 'Update Config' : 'Save Config'}
                                </button>
                                {editingConfig && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setEditingConfig(null);
                                            setFeeForm({ grade: '', paymentType: '', amount: '', academicYear: new Date().getFullYear().toString(), month: 'All' });
                                        }}
                                        className="px-4 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Config Table */}
                    <div className="lg:col-span-2 glass-panel border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Class</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Period</th>
                                        <th className="px-6 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="px-6 py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                                    ) : filteredFeeConfigs.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-500">No configurations found.</td></tr>
                                    ) : filteredFeeConfigs.map(config => (
                                        <tr key={config._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 font-black text-white">Class {config.grade}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase">{config.paymentType}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">${config.amount}</td>
                                            <td className="px-6 py-4 text-xs text-slate-400">{config.month} {config.academicYear}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditConfig(config)} className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"><FileText size={16} /></button>
                                                    <button onClick={() => handleDeleteConfig(config._id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Income History Table (Only show when activeTab is history) */}
            {activeTab === 'history' && (
                <div className="glass-panel border-white/5 overflow-hidden no-print">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Student / ID</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Method</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Transaction / Date</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <Loader2 size={40} className="animate-spin mx-auto text-primary mb-4" />
                                            <p className="text-slate-400 animate-pulse font-bold">Synchronizing financial records...</p>
                                        </td>
                                    </tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                                <Search size={40} className="text-primary" />
                                            </div>
                                            <h3 className="text-xl font-black text-white">No Records Found</h3>
                                            <p className="text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                                        </td>
                                    </tr>
                                ) : filteredHistory.map((p) => (
                                    <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-black group-hover:border-primary/50 transition-all">
                                                    {p.studentName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white group-hover:text-primary transition-colors">
                                                        {p.studentName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-black tracking-widest mt-0.5 uppercase">ID: {p.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                p.type === 'Admission Fee' 
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                                {p.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {p.method === 'bank_transfer' ? <Landmark size={14} className="text-slate-500" /> : <Smartphone size={14} className="text-slate-500" />}
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">{p.method}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-emerald-400 font-mono">${(p.amount || 0).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{p.transactionId}</p>
                                                <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">
                                                    {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                                                <CheckCircle size={14} /> Paid
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {filteredHistory.length > 0 && (
                                <tfoot>
                                    <tr className="bg-white/5 border-t-2 border-white/10">
                                        <td colSpan="3" className="px-6 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Grand Total ({filterMonth ? months.find(m => m.value === filterMonth).label : 'Selected Period'}):</td>
                                        <td colSpan="3" className="px-6 py-6 text-2xl font-black text-emerald-400 font-mono">${totalIncome.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Print Section (Hidden by default) */}
            <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[9999]">
                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">EduConnect Academy</h1>
                        <p className="text-lg font-bold">Financial Income Audit Report</p>
                        <p className="text-sm text-gray-600 mt-2 italic font-medium">
                            Report for: {filterMonth ? months.find(m => m.value === filterMonth).label : 'Full Year'} {filterYear}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-black text-white px-6 py-3 rounded-lg inline-block font-black text-xl mb-2 tracking-widest">AUDIT DOCUMENT</div>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="border-2 border-black p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xs font-black uppercase mb-4 text-gray-400 tracking-widest">Transaction Summary</h3>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-600">Total Count:</span>
                                <span className="font-black">{filteredHistory.length} Transactions</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-600">Applied Filter:</span>
                                <span className="font-black uppercase text-xs">{searchTerm || 'No Search Filter'}</span>
                            </div>
                        </div>
                        <Banknote className="absolute -bottom-4 -right-4 opacity-5 text-black" size={80} />
                    </div>
                    <div className="bg-black text-white p-6 rounded-2xl flex flex-col justify-center items-center shadow-xl">
                        <h3 className="text-xs font-black uppercase mb-2 opacity-50 tracking-widest">Total Verified Revenue</h3>
                        <div className="text-5xl font-black font-mono">${totalIncome.toLocaleString()}</div>
                    </div>
                </div>

                <table className="w-full text-left border-collapse border-2 border-black shadow-lg">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-black">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Source / ID</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Type</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Method</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Transaction ID</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistory.map((p, i) => (
                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-[10px] font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <p className="text-sm font-black leading-tight uppercase">{p.studentName}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">ID: {p.studentId}</p>
                                </td>
                                <td className="p-4 text-[10px] font-black uppercase tracking-tighter">{p.type}</td>
                                <td className="p-4 text-[10px] font-black uppercase">{p.method}</td>
                                <td className="p-4 text-[10px] font-mono font-bold text-gray-600">{p.transactionId}</td>
                                <td className="p-4 text-sm font-black text-right font-mono">${(p.amount || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-black text-white font-black">
                            <td colSpan="5" className="p-6 text-right uppercase tracking-[0.3em] text-xs">Total Net Revenue for the Period:</td>
                            <td className="p-6 text-2xl text-right font-mono italic">${totalIncome.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-24 grid grid-cols-2 gap-32">
                    <div className="border-t-2 border-black pt-4 text-center">
                        <p className="text-sm font-black uppercase tracking-widest">Finance Director</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Authorized Signature & Seal</p>
                    </div>
                    <div className="border-t-2 border-black pt-4 text-center">
                        <p className="text-sm font-black uppercase tracking-widest">Head of Academy</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Verification & Audit Stamp</p>
                    </div>
                </div>
                
                <div className="mt-auto pt-20 text-center">
                    <div className="inline-block border border-gray-200 px-6 py-2 rounded-full">
                        <p className="text-[9px] text-gray-400 uppercase tracking-[0.4em] font-black">
                            Official Audit Document • EduConnect Institutional Cloud • Encrypted Transaction Log
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ label, value, icon: Icon, color }) => (
    <div className="glass-panel p-6 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
        <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            <div className={`p-2.5 rounded-2xl bg-white/5 border border-white/5 ${color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <Icon size={20} />
            </div>
        </div>
        <p className={`text-2xl font-black ${color} truncate relative z-10`}>{value}</p>
        
        {/* Background Decorative Element */}
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/[0.02] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text', 'bg')} opacity-20`}></div>
    </div>
);

export default AdminPayments;
