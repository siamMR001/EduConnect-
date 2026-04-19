import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TeacherAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        class: '',
        deadline: '',
        totalMarks: 100,
        instructions: ''
    });
    const [files, setFiles] = useState([]);

    const [gradingData, setGradingData] = useState({
        submissionId: '',
        marksObtained: '',
        feedback: ''
    });

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

    useEffect(() => {
        fetchAssignments();
    }, [page]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/assignments/teacher/all?page=${page}&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignments(response.data.assignments);
            setError('');
        } catch (err) {
            setError('Failed to fetch assignments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!formData.title || !formData.description || !formData.subject || !formData.class || !formData.deadline) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('subject', formData.subject);
            data.append('class', formData.class);
            data.append('deadline', formData.deadline);
            data.append('totalMarks', formData.totalMarks);
            data.append('instructions', formData.instructions);

            files.forEach(file => {
                data.append('attachments', file);
            });

            await axios.post(
                `${API_URL}/assignments`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert('Assignment created successfully!');
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                subject: '',
                class: '',
                deadline: '',
                totalMarks: 100,
                instructions: ''
            });
            setFiles([]);
            fetchAssignments();
        } catch (err) {
            alert('Failed to create assignment: ' + err.response?.data?.message || err.message);
        }
    };

    const handleViewSubmissions = async (assignment) => {
        try {
            setSelectedAssignment(assignment);
            const token = localStorage.getItem('token');

            const [submissionsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/assignments/${assignment._id}/submissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/assignments/${assignment._id}/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setSubmissions(submissionsRes.data.submissions);
            setStats(statsRes.data);
            setShowSubmissionsModal(true);
        } catch (err) {
            alert('Failed to fetch submissions: ' + err.response?.data?.message);
        }
    };

    const handleGradeSubmission = async (submission) => {
        try {
            const token = localStorage.getItem('token');
            const marks = prompt(`Enter marks (out of ${selectedAssignment.totalMarks}):`);
            if (marks === null) return;

            const feedback = prompt('Enter feedback (optional):');

            await axios.put(
                `${API_URL}/submissions/${submission._id}/grade`,
                {
                    marksObtained: parseInt(marks),
                    feedback: feedback || ''
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert('Submission graded successfully!');
            handleViewSubmissions(selectedAssignment);
        } catch (err) {
            alert('Failed to grade submission: ' + err.response?.data?.message || err.message);
        }
    };

    const downloadSubmissionFile = async (submissionId, fileIndex, filename) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/submissions/${submissionId}/download/${fileIndex}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert('Failed to download file');
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/assignments/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Assignment deleted successfully!');
                fetchAssignments();
            } catch (err) {
                alert('Failed to delete assignment: ' + err.response?.data?.message);
            }
        }
    };

    if (loading && assignments.length === 0) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-2xl font-bold text-slate-300">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden p-6">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">Assignments Manager</h1>
                        <p className="text-slate-400">Create and manage student assignments</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 font-medium transition-all"
                    >
                        + Create Assignment
                    </button>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur">{error}</div>}

                {/* Assignments List */}
                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg p-8 text-center">
                            <p className="text-slate-400 text-lg">No assignments created yet</p>
                        </div>
                    ) : (
                        assignments.map(assignment => (
                            <div key={assignment._id} className="bg-black/20 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/60 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{assignment.title}</h3>
                                        <div className="flex gap-4 mt-2 text-sm text-slate-400">
                                            <span>📚 {assignment.subject}</span>
                                            <span>👥 Class: {assignment.class}</span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-sm font-medium border border-green-500/50">
                                        Active
                                    </span>
                                </div>

                                <p className="text-slate-300 mb-4">{assignment.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-3 border-t border-b border-white/10">
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400">Total Marks</p>
                                        <p className="text-lg font-bold text-blue-400">{assignment.totalMarks}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400">Deadline</p>
                                        <p className="text-sm font-semibold text-slate-200">{new Date(assignment.deadline).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400\">Submissions</p>
                                        <p className="text-lg font-bold text-blue-400">{assignment.submissionCount}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400\">Created</p>
                                        <p className="text-sm font-semibold text-slate-200">{new Date(assignment.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Attachments */}
                                {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-slate-300 mb-2">Attachments:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.attachments.map((attach, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs border border-slate-600/50">
                                                    📄 {attach.filename}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleViewSubmissions(assignment)}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
                                    >
                                        View Submissions ({assignment.submissionCount})
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAssignment(assignment._id)}
                                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg border border-red-500/50 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl shadow-blue-500/20 max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border border-blue-500/30">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">Create New Assignment</h2>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Assignment title"
                                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="e.g., Mathematics"
                                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Class *</label>
                                    <input
                                        type="text"
                                        value={formData.class}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                        placeholder="e.g., 10-A"
                                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Total Marks</label>
                                    <input
                                        type="number"
                                        value={formData.totalMarks}
                                        onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Deadline *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="4"
                                    placeholder="Describe the assignment..."
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Instructions</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows="3"
                                    placeholder="Additional instructions..."
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Attachments</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setFiles(Array.from(e.target.files))}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:mr-2"
                                />
                                {files.length > 0 && (
                                    <ul className="mt-2">
                                        {files.map((f, idx) => (
                                            <li key={idx} className="text-sm text-slate-400">✓ {f.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateAssignment}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 font-medium transition-all"
                            >
                                Create Assignment
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({
                                        title: '',
                                        description: '',
                                        subject: '',
                                        class: '',
                                        deadline: '',
                                        totalMarks: 100,
                                        instructions: ''
                                    });
                                    setFiles([]);
                                }}
                                className="px-6 py-2 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600/70 border border-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {showSubmissionsModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-blue-500/30 max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">Submissions: {selectedAssignment.title}</h2>

                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-3">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <p className="text-xs text-slate-400">Total Submissions</p>
                                    <p className="text-2xl font-bold text-blue-400">{stats.totalSubmissions}</p>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <p className="text-xs text-slate-400">Graded</p>
                                    <p className="text-2xl font-bold text-green-400">{stats.graded}</p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-xs text-slate-400">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-xs text-slate-400">Late</p>
                                    <p className="text-2xl font-bold text-red-400">{stats.lateSubmissions}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {submissions.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No submissions yet</p>
                            ) : (
                                submissions.map(submission => (
                                    <div key={submission._id} className="border border-blue-500/30 rounded-lg p-4 bg-black/20 backdrop-blur hover:bg-black/30 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-lg font-semibold text-white">{submission.student.name}</h4>
                                                <p className="text-sm text-slate-400">{submission.student.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">
                                                    {submission.status === 'graded' ? (
                                                        <span className="text-green-400">✓ Graded: {submission.marksObtained}/{selectedAssignment.totalMarks}</span>
                                                    ) : (
                                                        <span className="text-yellow-400">⏱ {submission.status}</span>
                                                    )}
                                                </p>
                                                {submission.isLate && <p className="text-red-400 text-xs font-semibold">Late Submission</p>}
                                            </div>
                                        </div>

                                        {submission.submittedFiles && submission.submittedFiles.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-slate-300 mb-2">Submitted Files:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {submission.submittedFiles.map((file, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => downloadSubmissionFile(submission._id, idx, file.filename)}
                                                            className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-sm hover:bg-blue-500/30 transition-colors"
                                                        >
                                                            📥 {file.filename}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {submission.submissionText && (
                                            <div className="mb-3 bg-black/30 border border-blue-500/20 p-3 rounded">
                                                <p className="text-sm text-slate-300">{submission.submissionText}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleGradeSubmission(submission)}
                                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded text-sm hover:shadow-lg hover:shadow-green-500/50 transition-all"
                                            >
                                                {submission.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setShowSubmissionsModal(false);
                                setSelectedAssignment(null);
                                setSubmissions([]);
                            }}
                            className="mt-6 px-6 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:shadow-lg hover:shadow-slate-500/50 transition-all w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
