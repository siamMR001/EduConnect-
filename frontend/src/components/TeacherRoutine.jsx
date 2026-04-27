import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Loader2, BookOpen, Layers, Download } from 'lucide-react';

const TeacherRoutine = ({ teacherId }) => {
    const [routine, setRoutine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '01:00', '02:00', '03:00'];

    useEffect(() => {
        if (teacherId) {
            fetchTeacherSchedule();
        }
    }, [teacherId]);

    const getId = (id) => {
        if (!id) return '';
        if (typeof id === 'string') return id;
        if (typeof id === 'object') return id._id || id.id || '';
        return String(id);
    };

    const fetchTeacherSchedule = async () => {
        const tid = getId(teacherId);
        if (!tid) {
            setLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/classrooms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classrooms = await res.json();

            if (Array.isArray(classrooms)) {
                const masterSchedule = [];
                classrooms.forEach(classroom => {
                    const classTeacherId = getId(classroom.teacherId);
                    if (classTeacherId === tid) {
                        if (Array.isArray(classroom.leadSchedule)) {
                            classroom.leadSchedule.forEach(slot => {
                                masterSchedule.push({
                                    _id: `lead-${classroom._id}-${slot._id}`,
                                    day: slot.day,
                                    startTime: slot.startTime,
                                    subject: classroom.leadSubject,
                                    classInfo: `Class ${classroom.classNumber} - ${classroom.section}`,
                                    roomNumber: slot.roomNumber || 'TBA',
                                    isLead: true
                                });
                            });
                        }
                    }

                    if (Array.isArray(classroom.courses)) {
                        classroom.courses.forEach(course => {
                            const courseTeacherId = getId(course.teacherId);
                            if (courseTeacherId === tid) {
                                if (Array.isArray(course.schedule)) {
                                    course.schedule.forEach(slot => {
                                        masterSchedule.push({
                                            _id: `course-${classroom._id}-${course._id}-${slot._id}`,
                                            day: slot.day,
                                            startTime: slot.startTime,
                                            subject: course.courseName,
                                            classInfo: `Class ${classroom.classNumber} - ${classroom.section}`,
                                            roomNumber: slot.roomNumber || 'TBA',
                                            isLead: false
                                        });
                                    });
                                }
                            }
                        });
                    }
                });
                setRoutine(masterSchedule);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getSlotAt = (day, time) => {
        const gridHour = parseInt(time.split(':')[0]);
        return routine.find(s => {
            if (s.day !== day || !s.startTime) return false;
            const slotHour = parseInt(s.startTime.split(':')[0]);
            return slotHour === gridHour;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Layers size={18} className="text-primary-light" />
                    Class Routine Grid
                </h3>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all active:scale-95"
                >
                    <Download size={12} className="text-primary" /> Download PDF
                </button>
            </div>
            <div className="hidden print:block">
                <h2 className="text-2xl font-bold text-black mb-4">Teacher Teaching Schedule</h2>
            </div>
            <div className="rounded-2xl border border-white/10 shadow-2xl">
                <table className="w-full border-collapse bg-black/20">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-3 text-[10px] font-black uppercase text-slate-500 w-20 border-r border-white/5">Time</th>
                            {days.map(day => (
                                <th key={day} className="p-3 text-[10px] font-black uppercase text-slate-400 border-r border-white/5">{day.substring(0, 3)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(time => (
                            <tr key={time} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 text-[10px] font-bold text-slate-500 border-r border-white/5 bg-white/[0.02]">{time}</td>
                                {days.map(day => {
                                    const slot = getSlotAt(day, time);
                                    return (
                                        <td key={day} className="p-1.5 border-r border-white/5 min-w-[100px] h-24 align-top">
                                            {slot ? (
                                                <div className={`h-full border p-2 rounded-lg space-y-1 relative group overflow-hidden ${slot.isLead ? 'bg-primary/20 border-primary/30' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${slot.isLead ? 'bg-primary' : 'bg-indigo-400'}`} />
                                                    <div className="text-[11px] font-black text-white truncate uppercase tracking-tight leading-tight">{slot.subject}</div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-300 font-bold truncate">
                                                        <BookOpen size={20} className="text-primary-light/70 shrink-0" />
                                                        {slot.classInfo}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-1 font-medium">
                                                        <MapPin size={20} /> RM: {slot.roomNumber}
                                                    </div>
                                                    {slot.isLead && <div className="absolute top-1 right-1 px-1 bg-primary/20 text-primary-light text-[6px] font-black rounded italic">LEAD</div>}
                                                </div>
                                            ) : (
                                                <div className="h-full w-full opacity-5 flex items-center justify-center">
                                                    <div className="w-4 h-0.5 bg-slate-500 rounded-full" />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center gap-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lead Class</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50"></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Subject Class</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherRoutine;
