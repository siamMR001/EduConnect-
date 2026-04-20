import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, X, FileDown, AlertCircle, Eye } from 'lucide-react';
import { noticeAPI } from '../services/api';

export default function NoticeBoard() {
    const [notices, setNotices] = useState([]);
    const [filteredNotices, setFilteredNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [user, setUser] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        category: '',
        priority: '',
        search: ''
    });

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'announcement',
        priority: 'normal',
        targetRole: 'all',
        date: '',
        expiryDate: ''
    });
    const [attachedFiles, setAttachedFiles] = useState([]);

    const categories = ['academic', 'event', 'announcement', 'holiday', 'emergency', 'other'];
    const priorities = ['normal', 'high', 'urgent'];
    const targetRoles = ['all', 'teacher', 'student'];

    // Fetch notices
    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await noticeAPI.getAllNotices(
                currentPage,
                10,
                filters.category,
                filters.priority
            );
            setNotices(response.data.notices);
            setTotalPages(response.data.pages);
            filterAndSort(response.data.notices);
            setError('');
        } catch (err) {
            setError('Failed to load notices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSort = (noticesToFilter) => {
        let filtered = noticesToFilter;

        if (filters.search) {
            filtered = filtered.filter(notice =>
                notice.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                notice.content.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredNotices(filtered);
    };

    // Memoized filtered notices to avoid re-filtering on every render
    const memoizedFilteredNotices = useMemo(() => {
        let filtered = notices;

        if (filters.search) {
            filtered = filtered.filter(notice =>
                notice.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                notice.content.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        return filtered;
    }, [notices, filters.search]);

    useEffect(() => {
        fetchNotices();
    }, [currentPage, filters.category, filters.priority]);

    useEffect(() => {
        filterAndSort(notices);
    }, [filters.search]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
    }, []);

    // Handle form submission
    const handleCreateNotice = async (e) => {
        e.preventDefault();
        try {
            await noticeAPI.createNotice(formData, attachedFiles);
            setShowCreateForm(false);
            setFormData({
                title: '',
                content: '',
                category: 'announcement',
                priority: 'normal',
                targetRole: 'all',
                date: '',
                expiryDate: ''
            });
            setAttachedFiles([]);
            fetchNotices();
        } catch (err) {
            setError('Failed to create notice');
            console.error(err);
        }
    };

    // Priority badge color
    const getPriorityColor = (priority) => {
        const colors = {
            normal: 'bg-blue-900/30 text-blue-200',
            high: 'bg-orange-900/30 text-orange-200',
            urgent: 'bg-red-900/30 text-red-200'
        };
        return colors[priority] || colors.normal;
    };

    // Category icon
    const getCategoryIcon = (category) => {
        const icons = {
            academic: '📚',
            event: '📅',
            announcement: '📢',
            holiday: '🎉',
            emergency: '⚠️',
            other: '📝'
        };
        return icons[category] || icons.other;
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary-light" />
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white">Notice Board</h1>
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Notice
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="glass-panel bg-red-500/10 border-red-500/30 text-red-200 px-4 py-3 flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {/* Create Notice Form */}
            {showCreateForm && (
                <div className="glass-panel p-8 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Create New Notice</h2>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateNotice} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input-field"
                                placeholder="Enter notice title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">Content</label>
                            <textarea
                                required
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="input-field h-32"
                                placeholder="Enter notice content"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="input-field"
                                >
                                    {priorities.map(p => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Target Role</label>
                                <select
                                    value={formData.targetRole}
                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                    className="input-field"
                                >
                                    {targetRoles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Notice Date (For Calendar)</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">Attachments</label>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachedFiles(Array.from(e.target.files))}
                                className="input-field"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            {attachedFiles.length > 0 && (
                                <p className="text-sm text-slate-400 mt-2">{attachedFiles.length} file(s) selected</p>
                            )}
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                Post Notice
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="glass-panel p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search notices..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="input-field"
                    />

                    <select
                        value={filters.category}
                        onChange={(e) => {
                            setFilters({ ...filters, category: e.target.value });
                            setCurrentPage(1);
                        }}
                        className="input-field"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => {
                            setFilters({ ...filters, priority: e.target.value });
                            setCurrentPage(1);
                        }}
                        className="input-field"
                    >
                        <option value="">All Priorities</option>
                        {priorities.map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setFilters({ category: '', priority: '', search: '' });
                            setCurrentPage(1);
                        }}
                        className="btn-secondary"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light"></div>
                    <p className="text-slate-400 mt-4">Loading notices...</p>
                </div>
            ) : (
                <>
                    {/* Notices List */}
                    <div className="space-y-4 mb-8">
                        {filteredNotices.length === 0 ? (
                            <div className="text-center py-12 glass-panel rounded-xl">
                                <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">No notices found</p>
                            </div>
                        ) : (
                            memoizedFilteredNotices.map(notice => (
                                <div
                                    key={notice._id}
                                    className="glass-panel p-6 hover:border-primary-light/50 transition cursor-pointer"
                                    onClick={() => setSelectedNotice(notice)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-1">{getCategoryIcon(notice.category)}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-xl font-bold text-white">{notice.title}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notice.priority)}`}>
                                                            {notice.priority.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-300 line-clamp-2">{notice.content}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                                                        <span>Posted by {notice.author?.name || 'Admin'}</span>
                                                        <span>{notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            {notice.views} views
                                                        </span>
                                                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {notice.attachments && notice.attachments.length > 0 && (
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <p className="text-sm font-semibold text-slate-300 mb-2">Attachments ({notice.attachments.length})</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {notice.attachments.map((attachment, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`${import.meta.env.VITE_API_URL}/${attachment.filepath}`}
                                                        download
                                                        className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-light rounded-lg hover:bg-primary/30 transition text-sm font-medium"
                                                    >
                                                        <FileDown className="w-4 h-4" />
                                                        {attachment.filename}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mb-8">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                                        currentPage === page
                                            ? 'btn-primary'
                                            : 'btn-secondary'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Notice Detail Modal */}
            {selectedNotice && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark p-6 flex items-center justify-between text-white rounded-t-2xl">
                            <h2 className="text-2xl font-bold">{selectedNotice.title}</h2>
                            <button
                                onClick={() => setSelectedNotice(null)}
                                className="hover:bg-white/20 p-1 rounded transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedNotice.priority)}`}>
                                    {selectedNotice.priority.toUpperCase()}
                                </span>
                                <span className="text-sm text-slate-400">
                                    By {selectedNotice.author?.name || 'Admin'} • {new Date(selectedNotice.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-slate-200 leading-relaxed mb-6">{selectedNotice.content}</p>

                            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                                <div className="border-t border-white/10 pt-6">
                                    <p className="text-sm font-semibold text-slate-300 mb-3">Attachments</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedNotice.attachments.map((attachment, idx) => (
                                            <a
                                                key={idx}
                                                href={`${import.meta.env.VITE_API_URL}/${attachment.filepath}`}
                                                download
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-medium"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                {attachment.filename}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
