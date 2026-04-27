import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Loader2, BookOpen, Download } from 'lucide-react';

const StudentRoutine = ({ overriddenUserId }) => {
    const [routine, setRoutine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '01:00', '02:00'];

    useEffect(() => {
        fetchMyRoutine();
    }, [overriddenUserId]);

    const fetchMyRoutine = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) {
                setLoading(false);
                return;
            }

            const currentUser = JSON.parse(userStr);
            const userId = overriddenUserId || currentUser._id || currentUser.id;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/classrooms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classrooms = await res.json();
            
            if (Array.isArray(classrooms)) {
                const myClass = classrooms.find(c => 
                    Array.isArray(c.studentIds) && 
                    c.studentIds.some(id => id?.toString() === userId?.toString())
                );

                if (myClass && myClass._id) {
                    const routineRes = await fetch(`${import.meta.env.VITE_API_URL}/api/timetable/classroom/${myClass._id}?academicYear=${myClass.academicYear || ""}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (routineRes.ok) {
                        const routineData = await routineRes.json();
                        setRoutine(Array.isArray(routineData) ? routineData : []);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getSlotAt = (day, time) => {
        // Find if any class starts at or during this hour
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
                    <Calendar size={18} className="text-primary-light" />
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
                <h2 className="text-2xl font-bold text-black mb-4">Student Class Routine</h2>
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
                                        <td key={day} className="p-1.5 border-r border-white/5 min-w-[100px] h-20 align-top">
                                            {slot ? (
                                                <div className="h-full bg-primary/20 border border-primary/30 p-2 rounded-lg space-y-1 relative group overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                    <div className="text-[9px] font-black text-white truncate leading-tight uppercase tracking-tighter">{slot.subject}</div>
                                                    <div className="text-[8px] text-primary-light font-bold truncate opacity-80">{slot.teacher?.name}</div>
                                                    <div className="text-[7px] text-slate-500 flex items-center gap-0.5 mt-1">
                                                        <Clock size={8} /> {slot.startTime}
                                                    </div>
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
        </div>
    );
};

export default StudentRoutine;
