import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Paperclip, FileText, XCircle, AlertTriangle } from 'lucide-react';

const SocraticTutor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! I am your AI study guide. You can ask me questions or upload a PDF/DOCX assignment file for me to help guide you through it!' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [documentContext, setDocumentContext] = useState(null); // { filename, text, truncated }
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError('');
        setUploadLoading(true);

        const formData = new FormData();
        formData.append('document', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/extract-document`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setDocumentContext(data);
                // Add a system-style info message to the chat
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `📄 I've read **${data.filename}**${data.truncated ? ' (first portion, file was large)' : ''}. I now have context from this document. Ask me anything about it and I'll guide you through it!`
                }]);
            } else {
                setUploadError(data.message || 'Failed to process file');
            }
        } catch (err) {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploadLoading(false);
            // Reset file input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearDocument = () => {
        setDocumentContext(null);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Document removed. I no longer have access to the previous file. Feel free to upload a new one or ask me any study question!'
        }]);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // If a document is loaded, prepend its context as a hidden user turn 
            const chatMessages = documentContext
                ? [
                    {
                        role: 'user',
                        content: `[DOCUMENT CONTEXT - "${documentContext.filename}"]\n\n${documentContext.text}\n\n[END OF DOCUMENT]\n\nUsing this document as context, please help me understand the following:`
                    },
                    ...newMessages.map(m => ({ role: m.role, content: m.content }))
                ]
                : newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: chatMessages })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages([...newMessages, { role: 'assistant', content: '⚠️ ' + (data.message || 'Unknown error occurred') }]);
            }
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Render markdown-style bold text
    const renderContent = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : part
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 transition-transform hover:scale-110 group"
                    title="AI Study Guide"
                >
                    <MessageCircle size={28} className="group-hover:animate-pulse" />
                </button>
            ) : (
                <div className="w-80 sm:w-96 h-[540px] max-h-[85vh] flex flex-col bg-[#121228]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="p-4 bg-indigo-600/20 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                <Bot size={18} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">AI Socratic Tutor</h3>
                                <p className="text-[10px] text-indigo-300 font-medium">Guiding your learning</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Document context banner */}
                    {documentContext && (
                        <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-xs text-indigo-300 overflow-hidden">
                                <FileText size={13} className="shrink-0" />
                                <span className="truncate font-medium">{documentContext.filename}</span>
                                {documentContext.truncated && (
                                    <AlertTriangle size={12} className="text-yellow-400 shrink-0" title="File was truncated" />
                                )}
                            </div>
                            <button onClick={clearDocument} className="text-slate-500 hover:text-red-400 transition-colors ml-2 shrink-0">
                                <XCircle size={15} />
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                                        <Bot size={12} />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-sm'
                                }`}>
                                    {renderContent(msg.content)}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-slate-600/50 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                                        <User size={12} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                                    <Bot size={12} />
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 rounded-tl-sm flex items-center gap-2 text-slate-400 text-sm">
                                    <Loader2 size={14} className="animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Upload error */}
                    {uploadError && (
                        <div className="mx-3 mb-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                            <AlertTriangle size={12} /> {uploadError}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 bg-black/20 border-t border-white/5 shrink-0">
                        <form onSubmit={handleSend} className="flex gap-2 items-center">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            {/* Attach button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadLoading}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-white/5 transition-colors disabled:opacity-50 shrink-0"
                                title="Upload PDF or DOCX"
                            >
                                {uploadLoading ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={documentContext ? `Ask about ${documentContext.filename}...` : "Ask a question..."}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-colors shrink-0"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                        <p className="text-[9px] text-slate-600 text-center mt-1.5">PDF & DOCX supported • 10MB max</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocraticTutor;
