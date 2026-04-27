import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Banknote,
    ArrowUpRight, 
    ArrowDownRight, 
    Calendar,
    Filter,
    Download,
    RefreshCw,
    AlertCircle,
    FileText,
    RotateCcw,
    ArrowRight,
    Printer,
    ExternalLink
} from 'lucide-react';

import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell,
    PieChart, 
    Pie, 
    Legend
} from 'recharts';

const AdminAnalytics = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState('all');

    const months = [
        { value: 'all', label: 'Full Year' },
        { value: 'Jan', label: 'January' },
        { value: 'Feb', label: 'February' },
        { value: 'Mar', label: 'March' },
        { value: 'Apr', label: 'April' },
        { value: 'May', label: 'May' },
        { value: 'Jun', label: 'June' },
        { value: 'Jul', label: 'July' },
        { value: 'Aug', label: 'August' },
        { value: 'Sep', label: 'September' },
        { value: 'Oct', label: 'October' },
        { value: 'Nov', label: 'November' },
        { value: 'Dec', label: 'December' },
    ];

    useEffect(() => {
        fetchAnalytics();
    }, [filterYear]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/stats?year=${filterYear}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                setError('Failed to load analytics data');
            }
        } catch (err) {
            setError('Network error connecting to analytics API');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!data) return;
        const { summary, chartData } = data;
        const cs = currentSummary;
        const periodLabel = selectedMonth === 'all' ? `Full Year ${filterYear}` : `${selectedMonth} ${filterYear}`;

        const monthRowsHtml = selectedMonth === 'all' ? chartData.map((m, i) => `
            <tr style="border-bottom:1px solid #f0f0f0;background:${i%2===0?'#fff':'#fafafa'}">
                <td style="padding:10px 12px;font-size:11px;font-weight:900;text-transform:uppercase;color:#333">${m.month}</td>
                <td style="padding:10px 12px;font-size:11px;font-weight:700;font-family:monospace;color:#16a34a">৳${m.income.toLocaleString()}</td>
                <td style="padding:10px 12px;font-size:11px;font-weight:700;font-family:monospace;color:#dc2626">৳${m.expense.toLocaleString()}</td>
                <td style="padding:10px 12px;font-size:11px;font-weight:900;font-family:monospace;color:${(m.income-m.expense)>=0?'#111':'#dc2626'}">৳${(m.income-m.expense).toLocaleString()}</td>
            </tr>
        `).join('') : '';

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>EduConnect — Financial Audit (${periodLabel})</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #111;padding-bottom:24px;margin-bottom:32px}
    .school-name{font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-0.03em}
    .report-title{font-size:14px;font-weight:600;color:#555;margin-top:4px}
    .period{font-size:11px;color:#888;margin-top:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em}
    .badge{background:#111;color:#fff;padding:8px 18px;font-weight:900;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;border-radius:6px}
    .meta{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;margin-top:6px;text-align:right}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
    .kpi{border:2px solid #eee;border-radius:10px;padding:16px}
    .kpi-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#aaa;margin-bottom:8px}
    .kpi-val{font-size:20px;font-weight:900;font-family:monospace;color:#111}
    .total-box{background:#111;color:#fff;border-radius:10px;padding:20px;display:flex;flex-direction:column;justify-content:center;align-items:center;grid-column:span 2}
    .total-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;opacity:0.5;margin-bottom:6px}
    .total-amount{font-size:32px;font-weight:900;font-family:monospace}
    .breakdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px}
    .breakdown-box{border:2px solid #eee;border-radius:10px;padding:20px}
    .section-title{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;border-left:5px solid #111;padding-left:12px;margin-bottom:16px;color:#111}
    table{width:100%;border-collapse:collapse;border:2px solid #111;overflow:hidden}
    thead tr{background:#f5f5f5;border-bottom:2px solid #111}
    thead th{padding:12px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#444;text-align:left}
    tfoot tr{background:#111;color:#fff}
    tfoot td{padding:16px 12px;font-weight:900;font-family:monospace}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:80px}
    .sig-block{border-top:2px solid #111;padding-top:12px;text-align:center}
    .sig-name{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em}
    .sig-role{font-size:9px;color:#aaa;font-weight:700;text-transform:uppercase;margin-top:4px}
    .footer-stamp{margin-top:60px;text-align:center}
    .footer-stamp span{border:1px solid #ddd;border-radius:100px;padding:6px 20px;font-size:8px;color:#bbb;font-weight:900;text-transform:uppercase;letter-spacing:0.3em}
    @media print{body{padding:20px}@page{margin:1.5cm}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school-name">EduConnect Academy</div>
      <div class="report-title">Comprehensive Financial Audit Report</div>
      <div class="period">Fiscal Period: ${periodLabel}</div>
    </div>
    <div style="text-align:right">
      <div class="badge">Internal Audit</div>
      <div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Active Students</div><div class="kpi-val">${summary.totalStudents}</div></div>
    <div class="kpi"><div class="kpi-label">Total Income</div><div class="kpi-val" style="color:#16a34a">৳${cs.income.toLocaleString()}</div></div>
    <div class="kpi"><div class="kpi-label">Total Expenses</div><div class="kpi-val" style="color:#dc2626">৳${cs.expense.toLocaleString()}</div></div>
    <div class="kpi" style="background:#111;color:#fff;border-color:#111"><div class="kpi-label" style="color:rgba(255,255,255,0.4)">Net Profit</div><div class="kpi-val" style="color:#fff">৳${cs.profit.toLocaleString()}</div></div>
  </div>

  <div class="section-title">Financial Breakdown</div>
  <table style="margin-bottom:32px">
    <thead><tr><th>Category</th><th>Details</th><th style="text-align:right">Amount (BDT)</th></tr></thead>
    <tbody>
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:12px;font-size:11px;font-weight:900;text-transform:uppercase">Gross Income</td>
        <td style="padding:12px;font-size:11px;color:#666;font-style:italic">Revenue from admissions and registration fees.</td>
        <td style="padding:12px;font-size:13px;font-weight:900;text-align:right;font-family:monospace;color:#16a34a">৳${cs.income.toLocaleString()}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:12px;font-size:11px;font-weight:900;text-transform:uppercase">Total Expenditures</td>
        <td style="padding:12px;font-size:11px;color:#666;font-style:italic">Disbursements for salaries, maintenance, and supplies.</td>
        <td style="padding:12px;font-size:13px;font-weight:900;text-align:right;font-family:monospace;color:#dc2626">৳${cs.expense.toLocaleString()}</td>
      </tr>
    </tbody>
    <tfoot><tr>
      <td colspan="2" style="text-align:right;font-size:10px;letter-spacing:0.2em;opacity:0.7">FINAL NET PROFIT:</td>
      <td style="text-align:right;font-size:18px">৳${cs.profit.toLocaleString()}</td>
    </tr></tfoot>
  </table>

  ${selectedMonth === 'all' ? `
  <div class="section-title">Monthly Trends (${filterYear})</div>
  <table>
    <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net Profit/Loss</th></tr></thead>
    <tbody>${monthRowsHtml}</tbody>
  </table>` : ''}

  <div class="signatures">
    <div class="sig-block"><div class="sig-name">Finance Officer</div><div class="sig-role">Institutional Signature</div></div>
    <div class="sig-block"><div class="sig-name">Board Secretary</div><div class="sig-role">Verification Stamp</div></div>
  </div>
  <div class="footer-stamp"><span>Official Audit Document • EduConnect Institutional Cloud</span></div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    };

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw className="text-primary animate-spin mb-4" size={48} />
            <p className="text-slate-500 font-bold animate-pulse">Analyzing Financial Patterns...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
            <AlertCircle className="text-rose-500 mb-4" size={48} />
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="mt-4 btn-secondary">Try Again</button>
        </div>
    );

    const { summary, chartData } = data;

    // Local filtering for KPI cards based on selected month
    const getFilteredSummary = () => {
        if (selectedMonth === 'all') {
            const totalIncome = chartData.reduce((s, m) => s + m.income, 0);
            const totalExpense = chartData.reduce((s, m) => s + m.expense, 0);
            return {
                income: totalIncome,
                expense: totalExpense,
                profit: totalIncome - totalExpense
            };
        } else {
            const monthData = chartData.find(m => m.month === selectedMonth);
            return {
                income: monthData?.income || 0,
                expense: monthData?.expense || 0,
                profit: (monthData?.income || 0) - (monthData?.expense || 0)
            };
        }
    };

    const currentSummary = getFilteredSummary();
    
    // Prepare data for Net Cash Flow (Profit/Loss per month)
    const netCashFlowData = chartData.map(d => ({
        ...d,
        net: d.income - d.expense
    }));

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 animate-fade-in relative">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 glass-panel py-6 px-8 gap-6 no-print">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white tracking-tight">
                        Financial Intelligence
                    </h1>
                    <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-widest">Real-time visualization of school economics</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Multi-Filter Bar */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer hover:text-white px-4"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value} className="bg-slate-900 text-white">{m.label}</option>
                            ))}
                        </select>
                        <div className="w-px h-6 bg-white/10"></div>
                        <select 
                            value={filterYear} 
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 cursor-pointer px-4"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} className="bg-slate-900">{y}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={fetchAnalytics} className="p-3 bg-white/5 text-slate-400 border border-white/10 rounded-2xl hover:bg-white/10 hover:text-white transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-primary/20">
                        <Printer size={18} /> Print Audit
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print">
                <KPICard 
                    title="Total Enrollment" 
                    value={summary.totalStudents} 
                    icon={<Users size={24} />} 
                    subtitle="Active Students"
                    color="primary"
                />
                <KPICard 
                    title={selectedMonth === 'all' ? "Annual Income" : "Monthly Income"} 
                    value={`৳${currentSummary.income.toLocaleString()}`} 
                    icon={<Banknote size={24} />} 
                    subtitle={selectedMonth === 'all' ? `Year ${filterYear}` : selectedMonth}
                    color="emerald"
                />
                <KPICard 
                    title={selectedMonth === 'all' ? "Annual Expenses" : "Monthly Expenses"} 
                    value={`৳${currentSummary.expense.toLocaleString()}`} 
                    icon={<TrendingDown size={24} />} 
                    subtitle={selectedMonth === 'all' ? `Year ${filterYear}` : selectedMonth}
                    color="rose"
                />
                <KPICard 
                    title="Institutional Profit" 
                    value={`৳${currentSummary.profit.toLocaleString()}`} 
                    icon={<TrendingUp size={24} />} 
                    subtitle={selectedMonth === 'all' ? "Net Yearly" : "Net Monthly"}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 no-print">
                {/* Income vs Expense Chart */}
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
                                <TrendingUp className="text-primary-light" size={24} />
                                Revenue vs Disbursement Trend
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Financial Comparison for {filterYear}</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{fontWeight: '900', fill: '#64748b'}}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{fontWeight: '900', fill: '#64748b'}}
                                    tickFormatter={(val) => `৳${val > 999 ? (val/1000).toFixed(0)+'k' : val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" animationDuration={1500} />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Net Profit/Loss Analysis (Differentiated) */}
                <div className="glass-panel p-8">
                    <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
                        <Calendar className="text-primary-light" size={24} />
                        Monthly Net Profit
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={netCashFlowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{fontWeight: '900', fill: '#64748b'}}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{fontWeight: '900', fill: '#64748b'}}
                                />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    formatter={(value) => [`৳${value.toLocaleString()}`, 'Net Profit/Loss']}
                                />
                                <Bar dataKey="net" radius={[6, 6, 0, 0]} barSize={25}>
                                    {netCashFlowData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 uppercase font-black tracking-widest text-center">Green: Profit | Red: Loss</p>
                </div>
            </div>
            
            {/* Action Card */}
            <div className="glass-panel p-10 text-center border-dashed border-2 border-white/5 relative overflow-hidden group no-print">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <FileText className="mx-auto text-primary/40 mb-6 relative z-10 group-hover:scale-110 group-hover:text-primary transition-all duration-500" size={64} />
                <h4 className="text-2xl font-black text-white mb-3 relative z-10 uppercase tracking-tighter">Financial Audit Protocol</h4>
                <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 relative z-10 leading-relaxed font-medium">
                    Analyze, verify, and document the institutional financial state for {filterYear}. Prepare formal documents for the board of directors.
                </p>
                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                    <button onClick={handlePrint} className="btn-primary py-3 px-10 flex items-center gap-2 group shadow-xl shadow-primary/20">
                        <Printer size={18} />
                        Prepare {filterYear} Audit
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate('/admin/payments')} className="btn-secondary py-3 px-10 border-white/10 hover:border-white/20 flex items-center gap-2">
                        View Detailed Ledger
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>

            {/* Print Section (Formal Audit Report) */}
            <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[9999]">
                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">EduConnect Academy</h1>
                        <p className="text-lg font-bold">Comprehensive Financial Audit Report</p>
                        <p className="text-sm text-gray-600 mt-2 font-black uppercase tracking-widest">
                            Fiscal Period: {selectedMonth === 'all' ? `Yearly (${filterYear})` : `${selectedMonth} ${filterYear}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-black text-white px-6 py-3 rounded-lg inline-block font-black text-xl mb-2 tracking-widest">INTERNAL AUDIT</div>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="border-2 border-black p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-xs font-black uppercase mb-4 text-gray-400 tracking-widest">Institutional Summary</h3>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-600 uppercase text-[10px]">Total Enrollment:</span>
                                <span className="font-black">{summary.totalStudents} Active Students</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-600 uppercase text-[10px]">Report Scope:</span>
                                <span className="font-black uppercase">{selectedMonth === 'all' ? 'Annual Consolidated' : 'Monthly Interval'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black text-white p-6 rounded-2xl flex flex-col justify-center items-center shadow-xl">
                        <h3 className="text-xs font-black uppercase mb-2 opacity-50 tracking-widest">Calculated Net Profit</h3>
                        <div className="text-5xl font-black font-mono">৳{currentSummary.profit.toLocaleString()}</div>
                    </div>
                </div>

                <h3 className="text-lg font-black uppercase mb-4 border-l-8 border-black pl-4">Financial Breakdown</h3>
                <table className="w-full text-left border-collapse border-2 border-black mb-12">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-black">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Category</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Details</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Amount (BDT)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="p-4 text-xs font-black uppercase">Gross Income</td>
                            <td className="p-4 text-xs font-bold text-gray-600 italic">Consolidated revenue from admissions and registration fees.</td>
                            <td className="p-4 text-sm font-black text-right font-mono">৳{currentSummary.income.toLocaleString()}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4 text-xs font-black uppercase">Total Expenditures</td>
                            <td className="p-4 text-xs font-bold text-gray-600 italic">Disbursements for salaries, maintenance, and supplies.</td>
                            <td className="p-4 text-sm font-black text-right font-mono">৳{currentSummary.expense.toLocaleString()}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="bg-black text-white font-black">
                            <td colSpan="2" className="p-6 text-right uppercase tracking-[0.3em] text-xs">Final Institutional Cash Flow:</td>
                            <td className="p-6 text-2xl text-right font-mono italic">৳{currentSummary.profit.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                {selectedMonth === 'all' && (
                    <>
                        <h3 className="text-lg font-black uppercase mb-4 border-l-8 border-black pl-4">Monthly Trends ({filterYear})</h3>
                        <table className="w-full text-left border-collapse border-2 border-black">
                            <thead>
                                <tr className="bg-gray-100 border-b border-black text-[9px] font-black uppercase tracking-widest">
                                    <th className="p-2 border-r border-black">Month</th>
                                    <th className="p-2 border-r border-black text-right">Income</th>
                                    <th className="p-2 border-r border-black text-right">Expense</th>
                                    <th className="p-2 text-right">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.map(m => (
                                    <tr key={m.month} className="border-b border-gray-200 text-[10px]">
                                        <td className="p-2 border-r border-black font-black uppercase">{m.month}</td>
                                        <td className="p-2 border-r border-black text-right font-mono font-bold text-emerald-600">৳{m.income.toLocaleString()}</td>
                                        <td className="p-2 border-r border-black text-right font-mono font-bold text-rose-600">৳{m.expense.toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono font-black">৳{(m.income - m.expense).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                <div className="mt-24 grid grid-cols-2 gap-32">
                    <div className="border-t-2 border-black pt-4 text-center">
                        <p className="text-sm font-black uppercase tracking-widest">Finance Officer</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Institutional Signature</p>
                    </div>
                    <div className="border-t-2 border-black pt-4 text-center">
                        <p className="text-sm font-black uppercase tracking-widest">Board Secretary</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Verification Stamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, subtitle, color }) => {
    const colors = {
        primary: 'from-blue-500/20 to-indigo-500/5 border-blue-500/20 text-blue-400',
        emerald: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/20 text-emerald-400',
        rose: 'from-rose-500/20 to-pink-500/5 border-rose-500/20 text-rose-400',
        amber: 'from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-400'
    };

    return (
        <div className={`glass-panel p-8 bg-gradient-to-br ${colors[color]} border relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-black/30 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                    {icon}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {subtitle}
                </div>
            </div>
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
            <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform duration-500 origin-left">{value}</div>
            
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        </div>
    );
};

export default AdminAnalytics;
