import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, X, CheckCircle, Clock, Award, 
  MessageSquare, Download, AlertCircle, ChevronRight,
  ClipboardList
} from 'lucide-react';

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

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

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
                `${API_URL}/assignments?page=${page}&limit=10`,
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
                `${API_URL}/submissions/${selectedAssignment._id}/submit`,
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
                `${API_URL}/assignments/${assignmentId}/download/${attachmentIndex}`,
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
                                            {assignment.submission.status === 'graded' && (
                                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur p-3 rounded border border-green-500/20">
                                                    <p className="text-xs text-slate-400">Marks Obtained</p>
                                                    <p className="text-lg font-bold text-green-400">
                                                        {assignment.submission.marksObtained !== null ? assignment.submission.marksObtained : '—'}/{assignment.totalMarks}
                                                    </p>
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
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setShowSubmitModal(false); // Ensure submit modal is closed
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:shadow-lg hover:shadow-slate-500/50 transition-all font-bold"
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

            {/* View Details/Submission Modal */}
            {!showSubmitModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0f0f1a] border border-white/10 rounded-[40px] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                           <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary-light" />
                                </div>
                                <h2 className="text-2xl font-black text-white">Assignment Details</h2>
                           </div>
                           <button onClick={() => setSelectedAssignment(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                           </button>
                        </div>

                        <div className="space-y-8">
                            {/* Assignment Info Section */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2">{selectedAssignment.title}</h3>
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{selectedAssignment.description}</p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                                        <p className="text-sm text-blue-400 font-bold">{selectedAssignment.subject}</p>
                                    </div>
                                    <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Marks</p>
                                        <p className="text-sm text-white font-bold">{selectedAssignment.totalMarks}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submission Section */}
                            {selectedAssignment.submission ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Your Submission</h4>
                                        {getStatusBadge(selectedAssignment.submission)}
                                    </div>

                                    {selectedAssignment.submission.status === 'graded' && (
                                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Grade Awarded</p>
                                                    <p className="text-3xl font-black text-white">
                                                        {selectedAssignment.submission.marksObtained !== null ? selectedAssignment.submission.marksObtained : '—'}
                                                        <span className="text-slate-500 text-lg"> / {selectedAssignment.totalMarks}</span>
                                                    </p>
                                                </div>
                                                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center font-black text-2xl text-green-400 border border-green-500/20">
                                                    {selectedAssignment.submission.marksObtained !== null ? Math.round((selectedAssignment.submission.marksObtained / selectedAssignment.totalMarks) * 100) : '?'}%
                                                </div>
                                            </div>
                                            {selectedAssignment.submission.feedback && (
                                                <div className="mt-4 pt-4 border-t border-green-500/10">
                                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Teacher Feedback</p>
                                                    <p className="text-slate-300 text-sm italic py-2">"{selectedAssignment.submission.feedback}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Submitted At</p>
                                            <p className="text-sm text-slate-300 font-bold">{new Date(selectedAssignment.submission.submittedAt).toLocaleString()}</p>
                                            {selectedAssignment.submission.isLate && (
                                                <span className="mt-2 inline-block px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black uppercase rounded">Late Submission</span>
                                            )}
                                        </div>
                                    </div>

                                    {selectedAssignment.submission.submissionText && (
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Your Answer/Notes</p>
                                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedAssignment.submission.submissionText}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <p className="text-slate-500 font-medium">You haven't submitted this assignment yet.</p>
                                    <button 
                                        onClick={() => setShowSubmitModal(true)}
                                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                                    >
                                        Submit Now
                                    </button>
                                </div>
                            )}

                            <div className="pt-4 flex gap-4">
                                <button 
                                    onClick={() => setSelectedAssignment(null)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-white/10"
                                >
                                    Close
                                </button>
                                {(!selectedAssignment.submission || selectedAssignment.submission.status === 'graded') && (
                                    <button 
                                        onClick={() => setShowSubmitModal(true)}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {selectedAssignment.submission ? 'Resubmit' : 'Prepare Submission'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
