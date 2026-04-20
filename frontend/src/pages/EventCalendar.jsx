import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock, Plus, X } from 'lucide-react';
import { eventAPI, noticeAPI } from '../services/api';

export default function EventCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [notices, setNotices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemType, setItemType] = useState(null); // 'event' or 'notice'
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        endDate: '',
        time: '',
        location: '',
        category: 'academic',
        targetRole: 'all',
        capacity: ''
    });

    const categories = ['academic', 'sports', 'club', 'holiday', 'cultural', 'other'];
    const targetRoles = ['all', 'teacher', 'student', 'admin'];

    // Fetch events and notices for current month
    const fetchCalendarData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching calendar data for:', currentDate.getMonth() + 1, currentDate.getFullYear());
            
            const [eventsResponse, noticesResponse] = await Promise.all([
                eventAPI.getEventsForMonth(
                    currentDate.getMonth() + 1,
                    currentDate.getFullYear()
                ),
                noticeAPI.getNoticesForMonth(
                    currentDate.getMonth() + 1,
                    currentDate.getFullYear()
                )
            ]);
            
            console.log('Events response:', eventsResponse.data);
            console.log('Notices response:', noticesResponse.data);
            
            setEvents(eventsResponse.data || []);
            setNotices(noticesResponse.data || []);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            setError(error.message || 'Failed to fetch calendar data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
    }, []);

    // Helper function to get just the date part (YYYY-MM-DD) for comparison
    const getDateOnly = (date) => {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Get first day of month (0-6, where 0 is Sunday)
    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Get days in month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Pre-compute items for each day using useMemo (memoized cache)
    const calendarItemsCache = useMemo(() => {
        const cache = {};
        const daysInMonth = getDaysInMonth(currentDate);
        
        // Pre-compute for all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            const targetDate = getDateOnly(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            
            const dayEvents = events.filter(event => {
                const eventStart = getDateOnly(event.date);
                const eventEnd = event.endDate ? getDateOnly(event.endDate) : eventStart;
                return targetDate >= eventStart && targetDate <= eventEnd;
            });

            const dayNotices = notices.filter(notice => {
                if (!notice.date) return false;
                const noticeStart = getDateOnly(notice.date);
                const noticeEnd = notice.expiryDate ? getDateOnly(notice.expiryDate) : noticeStart;
                return targetDate >= noticeStart && targetDate <= noticeEnd;
            });
            
            cache[day] = { events: dayEvents, notices: dayNotices };
        }
        return cache;
    }, [events, notices, currentDate, getDateOnly]);

    // Get events and notices for a specific date (now uses cache)
    const getItemsForDate = (day) => {
        return calendarItemsCache[day] || { events: [], notices: [] };
    };

    // Handle previous month
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        setSelectedDate(null);
        setSelectedItem(null);
    };

    // Handle next month
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        setSelectedDate(null);
        setSelectedItem(null);
    };

    // Handle create event
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await eventAPI.createEvent({
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            });
            setShowCreateForm(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                endDate: '',
                time: '',
                location: '',
                category: 'academic',
                targetRole: 'all',
                capacity: ''
            });
            fetchCalendarData();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        }
    };

    // Get color for category
    const getCategoryColor = (category) => {
        const colors = {
            academic: 'bg-blue-500',
            sports: 'bg-green-500',
            club: 'bg-purple-500',
            holiday: 'bg-red-500',
            cultural: 'bg-yellow-500',
            other: 'bg-gray-500'
        };
        return colors[category] || colors.other;
    };

    // Calendar grid
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendarDays = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    // Filter events by category
    const filteredEvents = categoryFilter
        ? events.filter(event => event.category === categoryFilter)
        : events;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-8 h-8 text-primary-light" />
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white">Academic Calendar</h1>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="lg:col-span-2 glass-panel p-6">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">{monthName}</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <ChevronLeft className="w-6 h-6 text-slate-300" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-4 py-2 bg-primary/30 text-primary-light rounded-lg font-semibold hover:bg-primary/50 transition"
                            >
                                Today
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <ChevronRight className="w-6 h-6 text-slate-300" />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4 text-red-200">
                            <p>Error: {error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
                            <p className="text-slate-400 mt-2">Loading calendar...</p>
                        </div>
                    ) : (
                        <>
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center font-semibold text-slate-300 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, idx) => {
                                    if (!day) {
                                        return <div key={`empty-${idx}`} className="h-24 bg-white/5 rounded-lg"></div>;
                                    }

                                    const dayItems = getItemsForDate(day);
                                    const combinedItems = [
                                        ...dayItems.events.map(e => ({ ...e, _type: 'event' })),
                                        ...dayItems.notices.map(n => ({ ...n, _type: 'notice' }))
                                    ];
                                    const isToday =
                                        day === new Date().getDate() &&
                                        currentDate.getMonth() === new Date().getMonth() &&
                                        currentDate.getFullYear() === new Date().getFullYear();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => setSelectedDate(day)}
                                            className={`h-24 p-2 rounded-lg cursor-pointer transition border-2 ${
                                                selectedDate === day
                                                    ? 'border-primary-light bg-primary/20'
                                                    : isToday
                                                    ? 'border-primary bg-primary/10'
                                                    : combinedItems.length > 0
                                                    ? 'border-white/10 bg-white/5'
                                                    : 'border-white/5 bg-transparent hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-primary-light' : 'text-white'}`}>
                                                {day}
                                            </div>
                                            <div className="space-y-1 overflow-y-auto max-h-16">
                                                {combinedItems.slice(0, 3).map((item, idx) => {
                                                    const isEvent = item._type === 'event';
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem(item);
                                                                setItemType(isEvent ? 'event' : 'notice');
                                                            }}
                                                            className={`text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition ${
                                                                isEvent
                                                                    ? getCategoryColor(item.category)
                                                                    : 'bg-amber-600'
                                                            }`}
                                                        >
                                                            {isEvent ? '📅' : '📢'} {item.title}
                                                        </div>
                                                    );
                                                })}
                                                {combinedItems.length > 3 && (
                                                    <div className="text-xs text-slate-400 px-2">
                                                        +{combinedItems.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Events & Notices Sidebar */}
                <div className="glass-panel p-6 h-fit">
                    <h3 className="text-xl font-bold text-white mb-4">📅 Events & 📢 Notices</h3>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field mb-4 text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {events.length === 0 && notices.length === 0 ? (
                            <p className="text-slate-400 text-sm">No events or notices scheduled</p>
                        ) : (
                            <>
                                {events.map(event => (
                                    <div
                                        key={event._id}
                                        onClick={() => {
                                            setSelectedItem(event);
                                            setItemType('event');
                                        }}
                                        className="p-3 border border-white/10 rounded-lg hover:border-primary-light hover:bg-primary/20 cursor-pointer transition"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getCategoryColor(event.category)}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate text-sm">📅 {event.title}</p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </p>
                                                {event.time && (
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {event.time}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notices.map(notice => (
                                    <div
                                        key={notice._id}
                                        onClick={() => {
                                            setSelectedItem(notice);
                                            setItemType('notice');
                                        }}
                                        className="p-3 border border-white/10 rounded-lg hover:border-amber-400 hover:bg-amber-600/20 cursor-pointer transition"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-amber-600"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate text-sm">📢 {notice.title}</p>
                                                {notice.date && (
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(notice.date).toLocaleDateString()}
                                                    </p>
                                                )}
                                                <p className={`text-xs font-semibold ${
                                                    notice.priority === 'urgent' ? 'text-red-400' :
                                                    notice.priority === 'high' ? 'text-orange-400' :
                                                    'text-slate-400'
                                                }`}>
                                                    {notice.priority.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal - Event or Notice */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel max-w-lg w-full">
                        <div className={`bg-gradient-to-r p-6 text-white rounded-t-2xl ${
                            itemType === 'event'
                                ? 'from-primary to-primary-dark'
                                : 'from-amber-700 to-amber-900'
                        }`}>
                            <div className="flex items-start justify-between">
                                <h2 className="text-2xl font-bold">
                                    {itemType === 'event' ? '📅' : '📢'} {selectedItem.title}
                                </h2>
                                <button
                                    onClick={() => {
                                        setSelectedItem(null);
                                        setItemType(null);
                                    }}
                                    className="hover:bg-white/20 p-1 rounded transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-400">
                                <span className="font-semibold text-slate-300">
                                    {itemType === 'event'
                                        ? selectedItem.category?.toUpperCase()
                                        : `${selectedItem.priority?.toUpperCase()} - ${selectedItem.category?.toUpperCase()}`
                                    }
                                </span>
                            </div>

                            {itemType === 'event' && selectedItem.description && (
                                <div>
                                    <p className="text-slate-200">{selectedItem.description}</p>
                                </div>
                            )}

                            {itemType === 'notice' && selectedItem.content && (
                                <div>
                                    <p className="text-slate-200">{selectedItem.content}</p>
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(itemType === 'event' ? selectedItem.date : (selectedItem.date || selectedItem.createdAt)).toLocaleDateString()}</span>
                                    {itemType === 'event' && selectedItem.endDate && (
                                        <>
                                            <span>to</span>
                                            <span>{new Date(selectedItem.endDate).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>

                                {itemType === 'event' && selectedItem.time && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Clock className="w-4 h-4" />
                                        <span>{selectedItem.time}</span>
                                    </div>
                                )}

                                {itemType === 'event' && selectedItem.location && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <MapPin className="w-4 h-4" />
                                        <span>{selectedItem.location}</span>
                                    </div>
                                )}

                                {itemType === 'event' && selectedItem.capacity && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Users className="w-4 h-4" />
                                        <span>{selectedItem.registeredUsers?.length || 0} / {selectedItem.capacity} registered</span>
                                    </div>
                                )}

                                {itemType === 'notice' && selectedItem.expiryDate && (
                                    <div className="text-xs text-slate-400">
                                        Expires: {new Date(selectedItem.expiryDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        setSelectedItem(null);
                                        setItemType(null);
                                    }}
                                    className="btn-secondary w-full"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
