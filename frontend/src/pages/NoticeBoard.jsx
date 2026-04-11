import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchNotices();
    }, [currentPage, filters.category, filters.priority]);

    useEffect(() => {
        filterAndSort(notices);
    }, [filters.search]);

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
            normal: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
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
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Notice Board</h1>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <Plus className="w-5 h-5" />
                        New Notice
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {/* Create Notice Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Notice</h2>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateNotice} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter notice title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                            <textarea
                                required
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                placeholder="Enter notice content"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {priorities.map(p => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role</label>
                                <select
                                    value={formData.targetRole}
                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {targetRoles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachedFiles(Array.from(e.target.files))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            {attachedFiles.length > 0 && (
                                <p className="text-sm text-gray-600 mt-2">{attachedFiles.length} file(s) selected</p>
                            )}
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                            >
                                Post Notice
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search notices..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={filters.category}
                        onChange={(e) => {
                            setFilters({ ...filters, category: e.target.value });
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-4">Loading notices...</p>
                </div>
            ) : (
                <>
                    {/* Notices List */}
                    <div className="space-y-4 mb-8">
                        {filteredNotices.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No notices found</p>
                            </div>
                        ) : (
                            filteredNotices.map(notice => (
                                <div
                                    key={notice._id}
                                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition cursor-pointer"
                                    onClick={() => setSelectedNotice(notice)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-1">{getCategoryIcon(notice.category)}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notice.priority)}`}>
                                                            {notice.priority.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 line-clamp-2">{notice.content}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
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
                                        <div className="mt-4 border-t pt-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Attachments ({notice.attachments.length})</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {notice.attachments.map((attachment, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`${import.meta.env.VITE_API_URL}/${attachment.filepath}`}
                                                        download
                                                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
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
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between text-white">
                            <h2 className="text-2xl font-bold">{selectedNotice.title}</h2>
                            <button
                                onClick={() => setSelectedNotice(null)}
                                className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedNotice.priority)}`}>
                                    {selectedNotice.priority.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-600">
                                    By {selectedNotice.author?.name || 'Admin'} • {new Date(selectedNotice.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-gray-700 leading-relaxed mb-6">{selectedNotice.content}</p>

                            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                                <div className="border-t pt-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Attachments</p>
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
