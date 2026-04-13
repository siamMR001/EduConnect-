import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submittedFiles, setSubmittedFiles] = useState([]);
    const [submissionText, setSubmissionText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSubject, setFilterSubject] = useState('');
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchAssignments();
    }, [page]);

    useEffect(() => {
        filterAssignments();
    }, [filterStatus, filterSubject, assignments]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/assignments?page=${page}&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignments(response.data.assignments);
            setFilteredAssignments(response.data.assignments);
            setError('');
        } catch (err) {
            setError('Failed to fetch assignments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAssignments = () => {
        let filtered = assignments;

        if (filterStatus !== 'all') {
            filtered = filtered.filter(assignment => {
                if (!assignment.submission) return filterStatus === 'pending';
                return assignment.submission.status === filterStatus;
            });
        }

        if (filterSubject) {
            filtered = filtered.filter(a => a.subject.toLowerCase().includes(filterSubject.toLowerCase()));
        }

        setFilteredAssignments(filtered);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSubmittedFiles(files);
    };

    const handleSubmitAssignment = async () => {
        if (!selectedAssignment) return;

        if (!submittedFiles.length && !submissionText) {
            alert('Please select files or enter submission text');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();

            submittedFiles.forEach(file => {
                formData.append('submittedFiles', file);
            });
            formData.append('submissionText', submissionText);

            await axios.post(
                `${API_URL}/api/submissions/${selectedAssignment._id}/submit`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert('Assignment submitted successfully!');
            setShowSubmitModal(false);
            setSubmittedFiles([]);
            setSubmissionText('');
            setSelectedAssignment(null);
            fetchAssignments();
        } catch (err) {
            alert('Failed to submit assignment: ' + err.response?.data?.message || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const downloadAttachment = async (assignmentId, attachmentIndex, filename) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/assignments/${assignmentId}/download/${attachmentIndex}`,
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

    const getDaysUntilDeadline = (deadline) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        return daysLeft;
    };

    const getStatusBadge = (submission) => {
        if (!submission) return <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-sm font-medium border border-blue-500/50">Pending</span>;
        
        switch (submission.status) {
            case 'submitted':
                return <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-sm font-medium border border-green-500/50">Submitted</span>;
            case 'graded':
                return <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm font-medium border border-purple-500/50">Graded</span>;
            case 'resubmitted':
                return <span className="px-3 py-1 bg-yellow-500/30 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/50">Resubmitted</span>;
            default:
                return <span className="px-3 py-1 bg-slate-500/30 text-slate-300 rounded-full text-sm font-medium border border-slate-500/50">{submission.status}</span>;
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-2xl font-bold text-slate-300">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden p-6">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">Assignments</h1>
                    <p className="text-slate-400">View and submit your assignments</p>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur">{error}</div>}

                {/* Filters */}
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                            >
                                <option value="all">All Assignments</option>
                                <option value="pending">Pending Submission</option>
                                <option value="submitted">Submitted</option>
                                <option value="graded">Graded</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Subject</label>
                            <input
                                type="text"
                                placeholder="Search subject..."
                                value={filterSubject}
                                onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
                                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur"
                            />
                        </div>
                    </div>
                </div>

                {/* Assignments Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredAssignments.length === 0 ? (
                        <div className="bg-black/20 backdrop-blur-xl border border-blue-500/30 rounded-lg p-8 text-center">
                            <p className="text-slate-400 text-lg">No assignments found</p>
                        </div>
                    ) : (
                        filteredAssignments.map(assignment => (
                            <div key={assignment._id} className="bg-black/20 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/60 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{assignment.title}</h3>
                                        <p className="text-sm text-slate-400 mt-1">📚 {assignment.subject}</p>
                                    </div>
                                    {getStatusBadge(assignment.submission)}
                                </div>

                                <p className="text-slate-300 mb-4">{assignment.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-3 border-t border-b border-white/10">
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400">Total Marks</p>
                                        <p className="text-lg font-bold text-blue-400">{assignment.totalMarks}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                        <p className="text-xs text-slate-400">Deadline</p>
                                        <p className="text-sm font-semibold text-slate-200">{new Date(assignment.deadline).toLocaleDateString()}</p>
                                    </div>
                                    {assignment.submission && (
                                        <>
                                            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur p-3 rounded border border-blue-500/20">
                                                <p className="text-xs text-slate-400">Submitted On</p>
                                                <p className="text-sm font-semibold text-slate-200">{new Date(assignment.submission.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            {assignment.submission.marksObtained !== null && (
                                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur p-3 rounded border border-green-500/20">
                                                    <p className="text-xs text-slate-400">Marks Obtained</p>
                                                    <p className="text-lg font-bold text-green-400">{assignment.submission.marksObtained}/{assignment.totalMarks}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Attachments */}
                                {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-slate-300 mb-2">Assignment Files:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.attachments.map((attach, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => downloadAttachment(assignment._id, idx, attach.filename)}
                                                    className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-sm hover:bg-blue-500/30 transition-colors"
                                                >
                                                    📥 {attach.filename}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback */}
                                {assignment.submission && assignment.submission.feedback && (
                                    <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-4 mb-4 rounded">
                                        <p className="text-sm font-semibold text-yellow-400">Teacher's Feedback:</p>
                                        <p className="text-slate-300 text-sm mt-1">{assignment.submission.feedback}</p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="flex gap-2">
                                    {!assignment.submission || assignment.submission.status === 'graded' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setShowSubmitModal(true);
                                                setSubmittedFiles([]);
                                                setSubmissionText('');
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            {assignment.submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                                        </button>
                                    ) : null}
                                    {assignment.submission && (
                                        <button
                                            onClick={() => setSelectedAssignment(assignment)}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:shadow-lg hover:shadow-slate-500/50 transition-all"
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl shadow-blue-500/20 max-w-2xl w-full p-6 border border-blue-500/30">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">Submit Assignment: {selectedAssignment.title}</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Upload Files (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:mr-2 hover:border-blue-500/50 transition-colors"
                                />
                                <p className="text-xs text-slate-400 mt-1">Supported: PDF, Images, Word documents (Max 10MB each)</p>
                                {submittedFiles.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-slate-300">Selected Files:</p>
                                        <ul className="mt-1">
                                            {submittedFiles.map((file, idx) => (
                                                <li key={idx} className="text-sm text-slate-400">✓ {file.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Submission Text (Optional)</label>
                                <textarea
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    rows="4"
                                    placeholder="Enter your submission text here..."
                                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmitAssignment}
                                disabled={submitting}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 transition-all"
                            >
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubmitModal(false);
                                    setSelectedAssignment(null);
                                    setSubmittedFiles([]);
                                    setSubmissionText('');
                                }}
                                className="px-6 py-2 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600/70 border border-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
